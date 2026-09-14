#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Loop Claude Code pour le projet soycain-Supply-Management
# Fait tourner claude -p (mode headless) en boucle sur le même
# prompt jusqu'à ce que Claude déclare le travail terminé, ou
# jusqu'au plafond d'itérations de sécurité.
# ============================================================

SPEC_FILE="soycain-codex-spec.md"      # adapte le nom si différent
MAX_ITERATIONS=40                       # plafond de sécurité, ajuste si besoin
DONE_MARKER="SOYCAIN_ALL_STEPS_DONE"
LOG_DIR="./claude-loop-logs"
SLEEP_BETWEEN_RUNS=5                    # secondes, laisse respirer le système de fichiers

mkdir -p "$LOG_DIR"

if [ ! -f "$SPEC_FILE" ]; then
  echo "❌ Fichier $SPEC_FILE introuvable à la racine du projet. Corrige SPEC_FILE dans ce script."
  exit 1
fi

PROMPT=$(cat <<EOF
Tu travailles sur le projet soycain-Supply-Management.

Ta feuille de route complète est dans le fichier ${SPEC_FILE}. Un fichier DECISIONS.md
doit exister ou être créé à la racine pour tracer ton avancement et tes choix.

Instructions pour cette itération :
1. Lis ${SPEC_FILE} et DECISIONS.md (s'il existe) pour savoir où tu en es.
2. Identifie la PROCHAINE étape non terminée dans ${SPEC_FILE} (dans l'ordre du document).
3. Réalise cette étape complètement : écris/modifie le code nécessaire, teste que ça
   fonctionne (build, lint, ou exécution manuelle selon le cas).
4. Mets à jour DECISIONS.md avec ce que tu viens de faire et tout choix pris de manière
   autonome.
5. Commit tes changements avec un message clair (git add -A && git commit -m "...").
6. Si une étape nécessite une action humaine (marquée [ACTION HUMAINE REQUISE] dans le
   spec) et qu'elle n'est pas encore faite, note-le clairement dans DECISIONS.md, saute
   cette étape et passe à la suivante qui ne dépend pas d'elle.
7. Si TOUTES les étapes du fichier ${SPEC_FILE} sont maintenant terminées (y compris
   celles qui ne nécessitaient pas d'action humaine), écris exactement ce marqueur seul
   sur la dernière ligne de ta réponse : ${DONE_MARKER}
   Sinon, ne l'écris pas.

Ne redemande jamais confirmation, prends les décisions toi-même et documente-les.
EOF
)

echo "🚀 Démarrage du loop Claude Code sur $SPEC_FILE (max $MAX_ITERATIONS itérations)"

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo "=== Itération $i/$MAX_ITERATIONS ==="
  LOG_FILE="$LOG_DIR/iteration-$(printf '%03d' "$i").log"

  OUTPUT=$(claude -p "$PROMPT" \
    --allowedTools "Bash,Read,Write,Edit,Glob,Grep" \
    --permission-mode acceptEdits \
    2>&1 | tee "$LOG_FILE")

  if echo "$OUTPUT" | grep -q "$DONE_MARKER"; then
    echo ""
    echo "✅ Claude Code a signalé que toutes les étapes sont terminées (itération $i)."
    echo "Consulte DECISIONS.md et le dernier commit pour le résumé final."
    exit 0
  fi

  sleep "$SLEEP_BETWEEN_RUNS"
done

echo ""
echo "⏹️  Plafond de $MAX_ITERATIONS itérations atteint sans marqueur de fin."
echo "Vérifie DECISIONS.md et les logs dans $LOG_DIR pour voir où ça bloque"
echo "(probablement une étape [ACTION HUMAINE REQUISE] en attente)."
exit 1
