'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { mapColumns, applyMapping } from '@/lib/column-mapping';
import { findMatchesInDB, normalizeCompanyName } from '@/lib/dedup';
import { executeImport } from '@/lib/import-logic';
import { supabase } from '@/lib/supabase';

const STEPS = ['upload', 'preview', 'importing', 'done'];

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
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

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
    <div>
      <h1 className="text-2xl font-bold mb-6">Importer un fichier</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
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
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
      <p className="text-gray-500 mb-4">
        Sélectionnez un fichier Excel (.xlsx, .xls) ou CSV à importer.
      </p>
      <label className="inline-block cursor-pointer bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors">
        Choisir un fichier
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFile}
          className="hidden"
        />
      </label>
    </div>
  );
}

function PreviewStep({ fileName, stats, matchResults, onDecision, onConfirm, onCancel }) {
  const ambiguous = matchResults
    .map((r, i) => ({ ...r, index: i }))
    .filter((r) => r.matchType === 'ambiguous');

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">
          Résumé de l&apos;import — {fileName}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <StatCard label="Lignes totales" value={stats.totalRows} />
          <StatCard label="Nouveaux fournisseurs" value={stats.newSuppliers} color="green" />
          <StatCard label="Fournisseurs existants" value={stats.existingSuppliers} color="blue" />
          <StatCard label="Fournisseurs ambigus" value={stats.ambiguousSuppliers} color="yellow" />
          <StatCard label="Produits détectés" value={stats.products} />
          <StatCard label="Catégories détectées" value={stats.categories} />
        </div>
        {stats.unmappedColumns.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            Colonnes ignorées : {stats.unmappedColumns.join(', ')}
          </p>
        )}
      </div>

      {ambiguous.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-3">
            Fournisseurs ambigus — décision requise ({ambiguous.length})
          </h3>
          <div className="space-y-3">
            {ambiguous.map((item) => (
              <AmbiguousRow
                key={item.index}
                item={item}
                onDecision={(decision) => onDecision(item.index, decision)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Confirmer l&apos;import
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function AmbiguousRow({ item, onDecision }) {
  const importName = item.row.company_name;
  const existingName = item.existingSupplier?.company_name;

  return (
    <div className="bg-white border border-yellow-300 rounded p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
        <span className="text-sm">
          <strong>Import :</strong> {importName}
        </span>
        <span className="text-gray-400 hidden sm:inline">→</span>
        <span className="text-sm">
          <strong>Existant :</strong> {existingName}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onDecision('existing')}
          className={`text-xs px-3 py-1 rounded border transition-colors ${
            item.userDecision === 'existing'
              ? 'bg-blue-100 border-blue-400 text-blue-700'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          C&apos;est le même fournisseur
        </button>
        <button
          onClick={() => onDecision('new')}
          className={`text-xs px-3 py-1 rounded border transition-colors ${
            item.userDecision === 'new'
              ? 'bg-green-100 border-green-400 text-green-700'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          Nouveau fournisseur
        </button>
        <button
          onClick={() => onDecision('skip')}
          className={`text-xs px-3 py-1 rounded border transition-colors ${
            item.userDecision === 'skip'
              ? 'bg-gray-100 border-gray-400 text-gray-700'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          Ignorer
        </button>
      </div>
    </div>
  );
}

function ImportingStep() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
      <p className="text-gray-600">Import en cours...</p>
    </div>
  );
}

function DoneStep({ summary, onReset }) {
  return (
    <div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-green-800 text-lg mb-4">Import terminé</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <StatCard label="Fournisseurs créés" value={summary.suppliersCreated} color="green" />
          <StatCard label="Fournisseurs réutilisés" value={summary.suppliersReused} color="blue" />
          <StatCard label="Offres créées" value={summary.offersCreated} color="green" />
          <StatCard label="Offres mises à jour" value={summary.offersUpdated} color="yellow" />
          <StatCard label="Catégories" value={summary.categoriesCreated} />
          <StatCard label="Produits" value={summary.productsCreated} />
        </div>
      </div>
      {summary.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-700 mb-2">Erreurs ({summary.errors.length})</h3>
          <ul className="text-sm text-red-600 list-disc pl-5 space-y-1">
            {summary.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={onReset}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
      >
        Nouvel import
      </button>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colorMap = {
    green: 'text-green-700',
    blue: 'text-blue-700',
    yellow: 'text-yellow-700',
  };
  return (
    <div className="bg-gray-50 rounded p-3">
      <div className={`text-2xl font-bold ${colorMap[color] || 'text-gray-900'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
