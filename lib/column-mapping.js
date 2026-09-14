const HEADER_ALIASES = {
  company_name: [
    'supplier_name', 'supplier name', 'fournisseur', 'nom entreprise',
    'company_name', 'company name', 'nom fournisseur', 'nom_fournisseur',
    'societe', 'société', 'raison sociale',
  ],
  supplier_type: [
    'supplier_type', 'supplier type', 'type fournisseur', 'type',
  ],
  category: [
    'category', 'categorie', 'catégorie', 'product_category',
    'product category', 'famille',
  ],
  product_name: [
    'product', 'product_name', 'product name', 'produit', 'nom produit',
    'nom_produit', 'designation', 'désignation',
  ],
  country: [
    'country', 'pays', 'pays_origine', 'supplier_country',
  ],
  city: [
    'city', 'ville',
  ],
  address: [
    'address', 'adresse', 'adress',
  ],
  email: [
    'email', 'email_pattern', 'e-mail', 'mail', 'courriel',
  ],
  phone: [
    'phone', 'telephone', 'téléphone', 'tel', 'tél', 'phone_number',
  ],
  website: [
    'website', 'site web', 'site_web', 'url', 'web',
  ],
  contact_person: [
    'contact person', 'contact_person', 'contact', 'nom contact',
    'interlocuteur', 'personne de contact',
  ],
  contact_role: [
    'contact_position', 'contact position', 'role', 'rôle',
    'fonction', 'poste',
  ],
  origin: [
    'origin', 'origine', 'pays origine', 'pays_origine',
  ],
  specs: [
    'technical specification', 'technical_specification', 'specs',
    'specifications', 'spécifications', 'spec technique',
    'specifications techniques', 'technical specs',
  ],
  certifications: [
    'certifications', 'certification', 'certificats', 'normes',
  ],
  moq: [
    'moq', 'minimum order quantity', 'qte minimum', 'quantité minimum',
    'quantite minimum', 'commande minimum',
  ],
  price: [
    'price', 'prix', 'target_price_hint', 'target price hint',
    'prix indicatif', 'prix cible',
  ],
  currency: [
    'currency', 'devise', 'monnaie',
  ],
  incoterm: [
    'incoterms', 'incoterm', 'conditions livraison',
  ],
  packaging: [
    'packaging', 'emballage', 'conditionnement',
  ],
  available_quantity: [
    'supplier_capacity', 'supplier capacity', 'quantity', 'quantité',
    'quantite', 'capacite', 'capacité', 'available_quantity',
  ],
  specialties: [
    'specialties', 'spécialités', 'specialites',
  ],
  comments: [
    'notes after exchanges', 'notes_after_exchanges', 'notes',
    'commentaires', 'remarques', 'observations',
  ],
  payment_terms: [
    'payment_terms', 'payment terms', 'conditions de paiement',
    'conditions paiement',
  ],
  loading_port: [
    'loading_port', 'loading port', 'port chargement',
    'port de chargement',
  ],
  discharge_port: [
    'discharge port', 'discharge_port', 'port déchargement',
    'port de déchargement',
  ],
  priority: [
    'priority', 'priorité', 'priorite',
  ],
};

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[_\-]/g, ' ')
    .trim();
}

export function mapColumns(headers) {
  const mapping = {};
  const unmapped = [];

  for (const header of headers) {
    const norm = normalize(header);
    let matched = false;

    for (const [concept, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((alias) => normalize(alias) === norm)) {
        mapping[header] = concept;
        matched = true;
        break;
      }
    }

    if (!matched) {
      unmapped.push(header);
      console.log(`Column ignorée (non reconnue) : "${header}"`);
    }
  }

  return { mapping, unmapped };
}

export function applyMapping(rows, mapping) {
  return rows.map((row) => {
    const mapped = {};
    for (const [originalHeader, concept] of Object.entries(mapping)) {
      const val = row[originalHeader];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        mapped[concept] = String(val).trim();
      }
    }
    return mapped;
  }).filter((row) => Object.keys(row).length > 0);
}
