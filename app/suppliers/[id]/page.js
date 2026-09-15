'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const STATUS_OPTIONS = ['À vérifier', 'Qualifié', 'En attente', 'Rejeté'];
const DOC_TYPES = ['Certificat', 'Fiche technique', 'Bon de commande', 'Facture', 'Contrat', 'Autre'];
const STORAGE_BUCKET = 'documents';

export default function SupplierDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState(null);
  const [offers, setOffers] = useState([]);
  const [supplierDocs, setSupplierDocs] = useState([]);
  const [offerDocs, setOfferDocs] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDocuments = useCallback(async () => {
    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .eq('supplier_id', id);

    if (docs) {
      setSupplierDocs(docs.filter((d) => !d.offer_id));
      const grouped = {};
      docs.filter((d) => d.offer_id).forEach((d) => {
        if (!grouped[d.offer_id]) grouped[d.offer_id] = [];
        grouped[d.offer_id].push(d);
      });
      setOfferDocs(grouped);
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      const { data: sup } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      const { data: off } = await supabase
        .from('offers')
        .select('*, products(name, category_id, categories:category_id(name))')
        .eq('supplier_id', id);

      if (sup) setSupplier(sup);
      if (off) setOffers(off);
      setLoading(false);
    }
    load();
    loadDocuments();
  }, [id, loadDocuments]);

  const handleStatusChange = async (newStatus) => {
    const { error } = await supabase.from('suppliers').update({ status: newStatus }).eq('id', id);
    if (!error) setSupplier((prev) => ({ ...prev, status: newStatus }));
  };

  const startEdit = () => {
    setEditForm({
      company_name: supplier.company_name || '',
      supplier_type: supplier.supplier_type || '',
      country: supplier.country || '',
      city: supplier.city || '',
      address: supplier.address || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      website: supplier.website || '',
      contact_person: supplier.contact_person || '',
      contact_role: supplier.contact_role || '',
      specialties: supplier.specialties || '',
      comments: supplier.comments || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = Object.fromEntries(
      Object.entries(editForm).map(([k, v]) => [k, v.trim() || null])
    );
    const { error } = await supabase.from('suppliers').update(payload).eq('id', id);
    if (!error) {
      setSupplier((prev) => ({ ...prev, ...payload }));
      setEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer le fournisseur "${supplier.company_name}" et toutes ses offres ?`)) return;
    setDeleting(true);
    await supabase.from('suppliers').delete().eq('id', id);
    router.push('/suppliers');
  };

  if (loading) return <p className="text-gray-500">Chargement...</p>;
  if (!supplier) return <p className="text-red-500">Fournisseur introuvable.</p>;

  return (
    <div>
      <Link href="/suppliers" className="text-sm text-green-700 hover:underline mb-4 inline-block">
        &larr; Retour aux fournisseurs
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">{supplier.company_name}</h1>
          <div className="flex items-center gap-2">
            <select
              value={supplier.status || 'À vérifier'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={startEdit}
              className="border border-gray-300 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-50 transition-colors">
              Modifier
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="border border-red-300 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-50 transition-colors disabled:opacity-50">
              {deleting ? '...' : 'Supprimer'}
            </button>
          </div>
        </div>

        {editing ? (
          <EditSupplierForm form={editForm} setForm={setEditForm} onSave={handleSave} onCancel={() => setEditing(false)} saving={saving} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <InfoRow label="Type" value={supplier.supplier_type} />
            <InfoRow label="Pays" value={supplier.country} />
            <InfoRow label="Ville" value={supplier.city} />
            <InfoRow label="Adresse" value={supplier.address} />
            <InfoRow label="Contact" value={supplier.contact_person} />
            <InfoRow label="Fonction" value={supplier.contact_role} />
            <InfoRow label="Email" value={supplier.email} />
            <InfoRow label="Téléphone" value={supplier.phone} />
            <InfoRow label="Site web" value={supplier.website} link />
            <InfoRow label="Spécialités" value={supplier.specialties} />
            <InfoRow label="Commentaires" value={supplier.comments} />
          </div>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">
        Documents du fournisseur ({supplierDocs.length})
      </h2>

      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <DocumentList docs={supplierDocs} onDelete={loadDocuments} />
        <DocumentUpload
          supplierId={id}
          onUploaded={loadDocuments}
        />
      </div>

      <h2 className="text-xl font-semibold mb-4">
        Produits proposés ({offers.length})
      </h2>

      {offers.length === 0 ? (
        <p className="text-gray-400">Aucun produit lié à ce fournisseur.</p>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">
                    {offer.products?.name || 'Produit inconnu'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {offer.products?.categories?.name || '—'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  offer.status === 'Qualifié'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {offer.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <InfoRow label="MOQ" value={offer.moq} />
                <InfoRow label="Quantité dispo." value={offer.available_quantity} />
                <InfoRow label="Prix" value={offer.price ? `${offer.price} ${offer.currency || ''}` : null} />
                <InfoRow label="Incoterm" value={offer.incoterm} />
                <InfoRow label="Origine" value={offer.origin} />
                <InfoRow label="Conditionnement" value={offer.packaging} />
                <InfoRow label="Certifications" value={offer.certifications} />
                <InfoRow label="Spécifications" value={offer.technical_specs} />
                <InfoRow label="Commentaires" value={offer.comments} />
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Documents de l&apos;offre ({(offerDocs[offer.id] || []).length})
                </p>
                <DocumentList docs={offerDocs[offer.id] || []} onDelete={loadDocuments} />
                <DocumentUpload
                  supplierId={id}
                  offerId={offer.id}
                  onUploaded={loadDocuments}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentUpload({ supplierId, offerId, onUploaded }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${supplierId}/${timestamp}_${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file);

    if (uploadErr) {
      setError(`Erreur d'upload : ${uploadErr.message}`);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const { error: dbErr } = await supabase.from('documents').insert({
      supplier_id: supplierId,
      offer_id: offerId || null,
      doc_type: docType,
      file_url: urlData.publicUrl,
      file_name: file.name,
    });

    if (dbErr) {
      setError(`Erreur d'enregistrement : ${dbErr.message}`);
    } else {
      fileRef.current.value = '';
      onUploaded();
    }
    setUploading(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 text-xs"
      >
        {DOC_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input
        ref={fileRef}
        type="file"
        className="text-xs text-gray-600"
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {uploading ? 'Envoi...' : 'Ajouter un document'}
      </button>
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
    </div>
  );
}

function DocumentList({ docs, onDelete }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (doc) => {
    if (!confirm('Supprimer « ' + doc.file_name + ' » ?')) return;
    setDeleting(doc.id);

    const urlParts = doc.file_url.split(`/${STORAGE_BUCKET}/`);
    if (urlParts[1]) {
      await supabase.storage.from(STORAGE_BUCKET).remove([urlParts[1]]);
    }

    await supabase.from('documents').delete().eq('id', doc.id);
    setDeleting(null);
    onDelete();
  };

  if (docs.length === 0) {
    return <p className="text-xs text-gray-400 mb-1">Aucun document.</p>;
  }

  return (
    <ul className="space-y-1 mb-2">
      {docs.map((doc) => (
        <li key={doc.id} className="flex items-center gap-2 text-xs">
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{doc.doc_type || 'Autre'}</span>
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 hover:underline truncate max-w-xs"
          >
            {doc.file_name || 'Document'}
          </a>
          <span className="text-gray-400">
            {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('fr-FR') : ''}
          </span>
          <button
            onClick={() => handleDelete(doc)}
            disabled={deleting === doc.id}
            className="text-red-400 hover:text-red-600 ml-auto"
            title="Supprimer"
          >
            {deleting === doc.id ? '...' : '✕'}
          </button>
        </li>
      ))}
    </ul>
  );
}

function EditSupplierForm({ form, setForm, onSave, onCancel, saving }) {
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {[
          ['company_name', 'Nom *'],['supplier_type', 'Type'],['country', 'Pays'],
          ['city', 'Ville'],['address', 'Adresse'],['email', 'Email'],
          ['phone', 'Téléphone'],['website', 'Site web'],
          ['contact_person', 'Contact'],['contact_role', 'Fonction'],
        ].map(([field, label]) => (
          <div key={field}>
            <label className="block text-gray-500 mb-1">{label}</label>
            <input value={form[field]} onChange={set(field)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
          </div>
        ))}
        <div className="md:col-span-2">
          <label className="block text-gray-500 mb-1">Spécialités</label>
          <input value={form.specialties} onChange={set('specialties')}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-500 mb-1">Commentaires</label>
          <textarea value={form.comments} onChange={set('comments')} rows={2}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving}
          className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button onClick={onCancel}
          className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-300">
          Annuler
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, link }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-gray-500">{label} : </span>
      {link ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">
          {value}
        </a>
      ) : (
        <span className="text-gray-900">{value}</span>
      )}
    </div>
  );
}
