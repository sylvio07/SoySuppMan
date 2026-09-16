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

const EMPTY_OFFER_FORM = {
  product_id: '',
  status: 'À vérifier',
  moq: '',
  available_quantity: '',
  price: '',
  currency: 'USD',
  incoterm: '',
  origin: '',
  packaging: '',
  certifications: '',
  technical_specs: '',
  comments: '',
  payment_terms: '',
  loading_port: '',
  discharge_port: '',
  priority: '',
};

export default function SupplierDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState(null);
  const [offers, setOffers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [supplierDocs, setSupplierDocs] = useState([]);
  const [offerDocs, setOfferDocs] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingOffer, setAddingOffer] = useState(false);
  const [offerForm, setOfferForm] = useState(EMPTY_OFFER_FORM);
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerError, setOfferError] = useState(null);

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

      const { data: prods } = await supabase
        .from('products')
        .select('id, name, categories(name)')
        .order('name');

      if (sup) setSupplier(sup);
      if (off) setOffers(off);
      if (prods) setAllProducts(prods);
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

  const handleAddOffer = async () => {
    setOfferError(null);
    if (!offerForm.product_id) {
      setOfferError('Veuillez sélectionner un produit.');
      return;
    }
    const alreadyLinked = offers.some((o) => o.product_id === offerForm.product_id);
    if (alreadyLinked) {
      setOfferError('Ce produit est déjà lié à ce fournisseur.');
      return;
    }
    setOfferSaving(true);
    const payload = {
      supplier_id: id,
      product_id: offerForm.product_id,
      status: offerForm.status || 'À vérifier',
      moq: offerForm.moq.trim() || null,
      available_quantity: offerForm.available_quantity.trim() || null,
      price: offerForm.price ? parseFloat(offerForm.price) : null,
      currency: offerForm.currency.trim() || null,
      incoterm: offerForm.incoterm.trim() || null,
      origin: offerForm.origin.trim() || null,
      packaging: offerForm.packaging.trim() || null,
      certifications: offerForm.certifications.trim() || null,
      technical_specs: offerForm.technical_specs.trim() || null,
      comments: offerForm.comments.trim() || null,
      payment_terms: offerForm.payment_terms.trim() || null,
      loading_port: offerForm.loading_port.trim() || null,
      discharge_port: offerForm.discharge_port.trim() || null,
      priority: offerForm.priority.trim() || null,
    };
    const { data, error } = await supabase.from('offers').insert(payload).select('*, products(name, category_id, categories:category_id(name))').single();
    if (error) {
      setOfferError(`Erreur : ${error.message}`);
    } else {
      setOffers((prev) => [...prev, data]);
      setOfferForm(EMPTY_OFFER_FORM);
      setAddingOffer(false);
    }
    setOfferSaving(false);
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Produits proposés
            <span className="ml-2 text-sm font-normal text-gray-500">({offers.length})</span>
          </h2>
          {!addingOffer && (
            <button
              onClick={() => { setAddingOffer(true); setOfferError(null); setOfferForm(EMPTY_OFFER_FORM); }}
              className="inline-flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              <span className="text-base leading-none">+</span> Ajouter une offre
            </button>
          )}
        </div>

        {/* Add offer form */}
        {addingOffer && (
          <div className="bg-white border border-green-200 rounded-xl shadow-sm p-5 mb-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span> Nouvelle offre
            </h3>

            {offerError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg mb-4">
                <span>⚠️</span> {offerError}
              </div>
            )}

            {/* Product selector — required */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Produit <span className="text-red-500">*</span>
              </label>
              <select
                value={offerForm.product_id}
                onChange={(e) => setOfferForm((p) => ({ ...p, product_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">— Sélectionner un produit —</option>
                {allProducts
                  .filter((p) => !offers.some((o) => o.product_id === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.categories?.name ? ` (${p.categories.name})` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Offer fields in a responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">
              {[
                ['status', 'Statut', 'select'],
                ['moq', 'MOQ', 'text'],
                ['available_quantity', 'Quantité disponible', 'text'],
                ['price', 'Prix', 'number'],
                ['currency', 'Devise', 'text'],
                ['incoterm', 'Incoterm', 'text'],
                ['origin', 'Origine', 'text'],
                ['packaging', 'Conditionnement', 'text'],
                ['payment_terms', 'Conditions de paiement', 'text'],
                ['loading_port', 'Port de chargement', 'text'],
                ['discharge_port', 'Port de déchargement', 'text'],
                ['priority', 'Priorité', 'text'],
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">{label}</label>
                  {type === 'select' ? (
                    <select
                      value={offerForm[field]}
                      onChange={(e) => setOfferForm((p) => ({ ...p, [field]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={offerForm[field]}
                      onChange={(e) => setOfferForm((p) => ({ ...p, [field]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs text-gray-500 mb-1 font-medium">Certifications</label>
                <input
                  type="text"
                  value={offerForm.certifications}
                  onChange={(e) => setOfferForm((p) => ({ ...p, certifications: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs text-gray-500 mb-1 font-medium">Spécifications techniques</label>
                <input
                  type="text"
                  value={offerForm.technical_specs}
                  onChange={(e) => setOfferForm((p) => ({ ...p, technical_specs: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs text-gray-500 mb-1 font-medium">Commentaires</label>
                <textarea
                  rows={2}
                  value={offerForm.comments}
                  onChange={(e) => setOfferForm((p) => ({ ...p, comments: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1 border-t border-gray-100">
              <button
                onClick={handleAddOffer}
                disabled={offerSaving}
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {offerSaving ? 'Enregistrement...' : 'Enregistrer l\'offre'}
              </button>
              <button
                onClick={() => { setAddingOffer(false); setOfferError(null); }}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {offers.length === 0 && !addingOffer ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-gray-500 text-sm font-medium mb-1">Aucun produit lié à ce fournisseur.</p>
            <p className="text-gray-400 text-sm">Cliquez sur &ldquo;+ Ajouter une offre&rdquo; pour en créer une.</p>
          </div>
        ) : offers.length > 0 ? (
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
        ) : null}
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
