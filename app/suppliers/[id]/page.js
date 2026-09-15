'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const STATUS_OPTIONS = ['À vérifier', 'Qualifié', 'En attente', 'Rejeté'];
const DOC_TYPES = ['Certificat', 'Fiche technique', 'Bon de commande', 'Facture', 'Contrat', 'Autre'];
const STORAGE_BUCKET = 'documents';

const STATUS_STYLES = {
  'Qualifié':   { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-800' },
  'À vérifier': { dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
  'En attente': { dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-700' },
  'Rejeté':     { dot: 'bg-red-400',    badge: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['À vérifier'];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status || 'À vérifier'}
    </span>
  );
}

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

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }
  if (!supplier) return <p className="text-red-500">Fournisseur introuvable.</p>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/suppliers" className="hover:text-green-700 transition-colors">Fournisseurs</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{supplier.company_name}</span>
      </nav>

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{supplier.company_name}</h1>
            <div className="mt-2">
              <StatusBadge status={supplier.status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={supplier.status || 'À vérifier'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={startEdit}
              className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="border border-red-300 text-red-600 px-4 py-1.5 rounded-lg text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? '...' : 'Supprimer'}
            </button>
          </div>
        </div>

        {editing ? (
          <EditSupplierForm
            form={editForm}
            setForm={setEditForm}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            saving={saving}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <InfoRow icon="🏷️" label="Type" value={supplier.supplier_type} />
            <InfoRow icon="🌍" label="Pays" value={supplier.country} />
            <InfoRow icon="🏙️" label="Ville" value={supplier.city} />
            <InfoRow icon="📍" label="Adresse" value={supplier.address} />
            <InfoRow icon="👤" label="Contact" value={supplier.contact_person} />
            <InfoRow icon="💼" label="Fonction" value={supplier.contact_role} />
            <InfoRow icon="📧" label="Email" value={supplier.email} />
            <InfoRow icon="📞" label="Téléphone" value={supplier.phone} />
            <InfoRow icon="🌐" label="Site web" value={supplier.website} link />
            <InfoRow icon="⭐" label="Spécialités" value={supplier.specialties} />
            <div className="sm:col-span-2">
              <InfoRow icon="💬" label="Commentaires" value={supplier.comments} />
            </div>
          </div>
        )}
      </div>

      {/* Documents */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Documents du fournisseur
          <span className="ml-2 text-sm font-normal text-gray-500">({supplierDocs.length})</span>
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <DocumentList docs={supplierDocs} onDelete={loadDocuments} />
          <DocumentUpload supplierId={id} onUploaded={loadDocuments} />
        </div>
      </section>

      {/* Offers */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Produits proposés
          <span className="ml-2 text-sm font-normal text-gray-500">({offers.length})</span>
        </h2>

        {offers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-gray-400 text-sm">Aucun produit lié à ce fournisseur.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      <Link href={`/products/${offer.product_id}`} className="hover:text-green-700 transition-colors">
                        {offer.products?.name || 'Produit inconnu'}
                      </Link>
                    </h3>
                    {offer.products?.categories?.name && (
                      <span className="inline-block mt-1 text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">
                        {offer.products.categories.name}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={offer.status} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <InfoRow icon="📐" label="MOQ" value={offer.moq} />
                  <InfoRow icon="📊" label="Quantité dispo." value={offer.available_quantity} />
                  <InfoRow icon="💰" label="Prix" value={offer.price ? `${offer.price} ${offer.currency || ''}` : null} />
                  <InfoRow icon="🚢" label="Incoterm" value={offer.incoterm} />
                  <InfoRow icon="📍" label="Origine" value={offer.origin} />
                  <InfoRow icon="📦" label="Conditionnement" value={offer.packaging} />
                  <InfoRow icon="🏅" label="Certifications" value={offer.certifications} />
                  <InfoRow icon="🔬" label="Spécifications" value={offer.technical_specs} />
                  <InfoRow icon="💬" label="Commentaires" value={offer.comments} />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Documents de l&apos;offre ({(offerDocs[offer.id] || []).length})
                  </p>
                  <DocumentList docs={offerDocs[offer.id] || []} onDelete={loadDocuments} />
                  <DocumentUpload supplierId={id} offerId={offer.id} onUploaded={loadDocuments} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoRow({ icon, label, value, link }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div>
        <span className="text-xs text-gray-400 block">{label}</span>
        {link ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 hover:underline text-sm"
          >
            {value}
          </a>
        ) : (
          <span className="text-gray-900 text-sm">{value}</span>
        )}
      </div>
    </div>
  );
}

function EditSupplierForm({ form, setForm, onSave, onCancel, saving }) {
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition';
  const labelCls = 'block text-xs text-gray-500 mb-1 font-medium';

  return (
    <div className="border-t border-gray-100 pt-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {[
          ['company_name', 'Nom *'],
          ['supplier_type', 'Type'],
          ['country', 'Pays'],
          ['city', 'Ville'],
          ['address', 'Adresse'],
          ['email', 'Email'],
          ['phone', 'Téléphone'],
          ['website', 'Site web'],
          ['contact_person', 'Contact'],
          ['contact_role', 'Fonction'],
        ].map(([field, label]) => (
          <div key={field}>
            <label className={labelCls}>{label}</label>
            <input value={form[field]} onChange={set(field)} className={inputCls} />
          </div>
        ))}
        <div className="md:col-span-2">
          <label className={labelCls}>Spécialités</label>
          <input value={form.specialties} onChange={set('specialties')} className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Commentaires</label>
          <textarea value={form.comments} onChange={set('comments')} rows={2} className={inputCls} />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          onClick={onCancel}
          className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>
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
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
        className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
      >
        {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input ref={fileRef} type="file" className="text-xs text-gray-500 flex-1 min-w-0" />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 shrink-0"
      >
        {uploading ? 'Envoi...' : '+ Ajouter'}
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
    <ul className="space-y-1.5 mb-1">
      {docs.map((doc) => (
        <li key={doc.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-base">📄</span>
          <span className="bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs shrink-0">
            {doc.doc_type || 'Autre'}
          </span>
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 hover:underline truncate flex-1"
          >
            {doc.file_name || 'Document'}
          </a>
          {doc.uploaded_at && (
            <span className="text-gray-400 shrink-0">
              {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
            </span>
          )}
          <button
            onClick={() => handleDelete(doc)}
            disabled={deleting === doc.id}
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-auto"
            title="Supprimer"
          >
            {deleting === doc.id ? '...' : '✕'}
          </button>
        </li>
      ))}
    </ul>
  );
}
