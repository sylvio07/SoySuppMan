'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { mapColumns, applyMapping } from '@/lib/column-mapping';
import { findMatchesInDB } from '@/lib/dedup';
import { executeImport } from '@/lib/import-logic';
import { supabase } from '@/lib/supabase';

const STEPS = [
  { key: 'upload', label: 'Fichier', index: 1 },
  { key: 'preview', label: 'Vérification', index: 2 },
  { key: 'importing', label: 'Terminé', index: 3 },
  { key: 'done', label: 'Terminé', index: 3 },
];

function getStepIndex(step) {
  return STEPS.find((s) => s.key === step)?.index ?? 1;
}

function StepIndicator({ step }) {
  const current = getStepIndex(step);
  const steps = [
    { index: 1, label: 'Fichier' },
    { index: 2, label: 'Vérification' },
    { index: 3, label: 'Terminé' },
  ];

  return (
    <div className="flex items-center justify-center mb-8 select-none">
      {steps.map((s, i) => {
        const done = current > s.index;
        const active = current === s.index;
        return (
          <div key={s.index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200 ${
                  done
                    ? 'bg-green-600 border-green-600 text-white'
                    : active
                    ? 'bg-white border-green-600 text-green-700'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {done ? '✓' : s.index}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  active ? 'text-green-700' : done ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-16 sm:w-24 mx-1 mb-4 rounded transition-all duration-200 ${
                  current > s.index ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ImportPage() {
  const [step, setStep] = useState('upload');
  const [fileName, setFileName] = useState('');
  const [matchResults, setMatchResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const isCSV = file.name.toLowerCase().endsWith('.csv');
      let workbook;
      if (isCSV) {
        const bytes = new Uint8Array(data);
        // Detect UTF-8 BOM (EF BB BF)
        const hasUTF8BOM = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
        // Detect UTF-16 LE BOM (FF FE)
        const hasUTF16BOM = bytes[0] === 0xFF && bytes[1] === 0xFE;
        let text;
        if (hasUTF16BOM) {
          text = new TextDecoder('utf-16le').decode(data);
        } else if (hasUTF8BOM) {
          text = new TextDecoder('utf-8').decode(data.slice(3));
        } else {
          // Try UTF-8 first; if replacement character appears, fall back to Windows-1252
          const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(data);
          text = utf8.includes('�')
            ? new TextDecoder('windows-1252').decode(data)
            : utf8;
        }
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        workbook = XLSX.read(data, { type: 'array' });
      }
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

      if (rows.length === 0) {
        setError('Le fichier est vide ou ne contient aucune donnée.');
        return;
      }

      const headers = Object.keys(rows[0]);
      const { mapping, unmapped } = mapColumns(headers);
      const mappedRows = applyMapping(rows, mapping);

      if (mappedRows.length === 0) {
        setError('Aucune ligne valide trouvée après le mapping des colonnes.');
        return;
      }

      const results = await findMatchesInDB(supabase, mappedRows);

      const newCount = results.filter((r) => r.matchType === 'none').length;
      const existingCount = results.filter((r) => r.matchType === 'strong' || r.matchType === 'batch_duplicate').length;
      const ambiguousCount = results.filter((r) => r.matchType === 'ambiguous').length;

      const uniqueProducts = new Set(mappedRows.map((r) => r.product_name).filter(Boolean));
      const uniqueCategories = new Set(mappedRows.map((r) => r.category).filter(Boolean));

      setStats({
        totalRows: mappedRows.length,
        newSuppliers: newCount,
        existingSuppliers: existingCount,
        ambiguousSuppliers: ambiguousCount,
        products: uniqueProducts.size,
        categories: uniqueCategories.size,
        unmappedColumns: unmapped,
      });

      setMatchResults(results.map((r) => ({ ...r, userDecision: null })));
      setStep('preview');
    } catch (err) {
      setError(`Erreur lors du parsing : ${err.message}`);
    }
  }, []);

  const handleDecision = (index, decision) => {
    setMatchResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, userDecision: decision } : r))
    );
  };

  const handleConfirm = async () => {
    const unresolved = matchResults.filter(
      (r) => r.matchType === 'ambiguous' && !r.userDecision
    );
    if (unresolved.length > 0) {
      setError(`${unresolved.length} ligne(s) ambiguë(s) non résolue(s). Veuillez faire un choix pour chacune.`);
      return;
    }

    setStep('importing');
    setError(null);

    try {
      const result = await executeImport(matchResults);
      setSummary(result);
      setStep('done');
    } catch (err) {
      setError(`Erreur lors de l'import : ${err.message}`);
      setStep('preview');
    }
  };

  const reset = () => {
    setStep('upload');
    setFileName('');
    setMatchResults([]);
    setSummary(null);
    setError(null);
    setStats(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Importer un fichier</h1>
      <p className="text-sm text-gray-500 mb-6">
        Importez un fichier Excel (.xlsx, .xls) ou CSV contenant vos données fournisseurs.
      </p>

      <StepIndicator step={step} />

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
          <span className="text-lg leading-none mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {step === 'upload' && <UploadStep onFile={handleFile} />}
      {step === 'preview' && (
        <PreviewStep
          fileName={fileName}
          stats={stats}
          matchResults={matchResults}
          onDecision={handleDecision}
          onConfirm={handleConfirm}
          onCancel={reset}
        />
      )}
      {step === 'importing' && <ImportingStep />}
      {step === 'done' && <DoneStep summary={summary} onReset={reset} />}
    </div>
  );
}

function UploadStep({ onFile }) {
  const [dragging, setDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    // Reuse the onFile handler by constructing a synthetic event
    const syntheticEvent = { target: { files: [file] } };
    onFile(syntheticEvent);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 sm:p-14 text-center transition-all duration-200 cursor-default ${
        dragging
          ? 'border-green-400 bg-green-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-white'
      }`}
    >
      <div className="text-5xl mb-4">{dragging ? '📂' : '📁'}</div>
      {dragging ? (
        <p className="text-green-700 font-medium text-base mb-4">
          Déposez le fichier ici pour l&apos;importer
        </p>
      ) : (
        <>
          <p className="text-gray-600 font-medium mb-1">
            Glissez-déposez votre fichier ici
          </p>
          <p className="text-gray-400 text-sm mb-5">
            Formats acceptés : .xlsx, .xls, .csv
          </p>
        </>
      )}
      {!dragging && (
        <label className="inline-flex items-center gap-2 cursor-pointer bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm font-medium shadow-sm">
          <span>Choisir un fichier</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFile}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

function PreviewStep({ fileName, stats, matchResults, onDecision, onConfirm, onCancel }) {
  const ambiguous = matchResults
    .map((r, i) => ({ ...r, index: i }))
    .filter((r) => r.matchType === 'ambiguous');

  const allResolved = ambiguous.every((r) => r.userDecision !== null);

  return (
    <div className="space-y-5">
      {/* File name header */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>📄</span>
        <span className="font-medium text-gray-700 truncate">{fileName}</span>
        <span className="ml-auto text-gray-400">{stats.totalRows} lignes</span>
      </div>

      {/* Summary cards */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Résumé de l&apos;analyse</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <SummaryCard
            emoji="🆕"
            label="Nouveaux fournisseurs"
            value={stats.newSuppliers}
            color="green"
          />
          <SummaryCard
            emoji="✅"
            label="Fournisseurs existants"
            value={stats.existingSuppliers}
            color="blue"
          />
          <SummaryCard
            emoji="⚠️"
            label="Fournisseurs ambigus"
            value={stats.ambiguousSuppliers}
            color="yellow"
          />
          <SummaryCard emoji="📦" label="Produits détectés" value={stats.products} color="gray" />
          <SummaryCard
            emoji="🗂️"
            label="Catégories détectées"
            value={stats.categories}
            color="gray"
          />
          <SummaryCard emoji="📋" label="Total lignes" value={stats.totalRows} color="gray" />
        </div>
        {stats.unmappedColumns.length > 0 && (
          <p className="text-xs text-gray-400 mt-4 border-t pt-3">
            <span className="font-medium">Colonnes ignorées :</span>{' '}
            {stats.unmappedColumns.join(', ')}
          </p>
        )}
      </div>

      {/* Ambiguous section */}
      {ambiguous.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⚠️</span>
            <h3 className="font-semibold text-amber-800">
              Décision requise — {ambiguous.length} fournisseur
              {ambiguous.length > 1 ? 's' : ''} ambigu{ambiguous.length > 1 ? 's' : ''}
            </h3>
          </div>
          <p className="text-xs text-amber-700 mb-4 ml-7">
            Ces noms ressemblent à des fournisseurs déjà en base. Indiquez votre choix pour chacun.
          </p>
          <div className="space-y-3">
            {ambiguous.map((item) => (
              <AmbiguousRow
                key={item.index}
                item={item}
                onDecision={(decision) => onDecision(item.index, decision)}
              />
            ))}
          </div>
          {!allResolved && (
            <p className="text-xs text-amber-600 mt-3 font-medium">
              Résolvez tous les cas ci-dessus avant de confirmer l&apos;import.
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 pt-1">
        <button
          onClick={onConfirm}
          disabled={!allResolved}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all duration-150 ${
            allResolved
              ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>✓</span>
          Confirmer l&apos;import
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ emoji, label, value, color }) {
  const colorMap = {
    green: 'text-green-700 bg-green-50 border-green-100',
    blue: 'text-blue-700 bg-blue-50 border-blue-100',
    yellow: 'text-amber-700 bg-amber-50 border-amber-100',
    gray: 'text-gray-700 bg-gray-50 border-gray-200',
  };
  const textColor = {
    green: 'text-green-800',
    blue: 'text-blue-800',
    yellow: 'text-amber-800',
    gray: 'text-gray-900',
  };
  return (
    <div className={`border rounded-lg p-3 ${colorMap[color] || colorMap.gray}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{emoji}</span>
        <span className={`text-2xl font-bold ${textColor[color] || 'text-gray-900'}`}>
          {value}
        </span>
      </div>
      <div className="text-xs text-gray-500 leading-tight">{label}</div>
    </div>
  );
}

function AmbiguousRow({ item, onDecision }) {
  const importName = item.row.company_name;
  const existingName = item.existingSupplier?.company_name;
  const similarity = item.similarity ?? null;

  return (
    <div className="bg-white border border-amber-200 rounded-lg p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
            Importé
          </div>
          <div className="text-sm font-medium text-gray-900 truncate">{importName}</div>
        </div>
        <div className="flex flex-col items-center justify-center px-2 py-1 shrink-0">
          {similarity !== null ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-4 rounded-sm ${
                      i <= Math.round(similarity * 5)
                        ? 'bg-amber-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-amber-600 font-medium">
                {Math.round(similarity * 100)}%
              </span>
            </div>
          ) : (
            <span className="text-gray-400 text-lg">↔</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
            En base
          </div>
          <div className="text-sm font-medium text-gray-700 truncate">{existingName}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onDecision('existing')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
            item.userDecision === 'existing'
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          <span>🔗</span>
          C&apos;est le même fournisseur
        </button>
        <button
          onClick={() => onDecision('new')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
            item.userDecision === 'new'
              ? 'bg-green-600 border-green-600 text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50'
          }`}
        >
          <span>🆕</span>
          Nouveau fournisseur
        </button>
        <button
          onClick={() => onDecision('skip')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
            item.userDecision === 'skip'
              ? 'bg-gray-500 border-gray-500 text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <span>⏭</span>
          Ignorer
        </button>
      </div>
    </div>
  );
}

function ImportingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-green-600 text-xl">
          📥
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-800 font-semibold text-base mb-1">Import en cours…</p>
        <p className="text-gray-400 text-sm">
          Création des fournisseurs, produits et offres en base de données.
        </p>
      </div>
    </div>
  );
}

function DoneStep({ summary, onReset }) {
  const [errorsOpen, setErrorsOpen] = useState(false);
  const hasErrors = summary.errors.length > 0;

  return (
    <div className="space-y-5">
      {/* Success hero */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-6xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-green-800 mb-1">Import terminé avec succès</h2>
        <p className="text-sm text-green-700">
          Les données ont été enregistrées dans la base de données.
        </p>
      </div>

      {/* Stats grid */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">
          Résumé de l&apos;opération
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <SummaryCard
            emoji="🏢"
            label="Fournisseurs créés"
            value={summary.suppliersCreated}
            color="green"
          />
          <SummaryCard
            emoji="♻️"
            label="Fournisseurs réutilisés"
            value={summary.suppliersReused}
            color="blue"
          />
          <SummaryCard
            emoji="🆕"
            label="Offres créées"
            value={summary.offersCreated}
            color="green"
          />
          <SummaryCard
            emoji="🔄"
            label="Offres mises à jour"
            value={summary.offersUpdated}
            color="yellow"
          />
          <SummaryCard
            emoji="🗂️"
            label="Catégories"
            value={summary.categoriesResolved}
            color="gray"
          />
          <SummaryCard
            emoji="📦"
            label="Produits"
            value={summary.productsResolved}
            color="gray"
          />
        </div>
      </div>

      {/* Errors collapsible */}
      {hasErrors && (
        <div className="border border-red-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setErrorsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 bg-red-50 hover:bg-red-100 transition-colors text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-red-700">
              <span>❌</span>
              {summary.errors.length} erreur{summary.errors.length > 1 ? 's' : ''} lors de
              l&apos;import
            </span>
            <span className="text-red-400 text-xs font-medium">
              {errorsOpen ? '▲ Masquer' : '▼ Afficher'}
            </span>
          </button>
          {errorsOpen && (
            <div className="bg-white px-5 py-4">
              <ul className="text-sm text-red-600 space-y-1.5 list-none">
                {summary.errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">•</span>
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onReset}
        className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm font-medium shadow-sm"
      >
        <span>↩</span>
        Nouvel import
      </button>
    </div>
  );
}
