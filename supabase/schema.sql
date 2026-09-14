create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  name text not null,
  description text,
  specs_required text,
  certifications_required text,
  quality_docs_required text,
  packaging_required text,
  created_at timestamptz default now(),
  unique (category_id, name)
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  company_name_normalized text generated always as (lower(trim(company_name))) stored,
  country text,
  address text,
  city text,
  website text,
  phone text,
  email text,
  contact_person text,
  contact_role text,
  supplier_type text,
  specialties text,
  comments text,
  status text default 'À vérifier',
  created_at timestamptz default now(),
  last_verified_at timestamptz
);

create index idx_suppliers_name_normalized on suppliers (company_name_normalized);

create table offers (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  available_quantity text,
  moq text,
  technical_specs text,
  certifications text,
  quality_docs_available text,
  price numeric,
  currency text,
  incoterm text,
  origin text,
  packaging text,
  availability text,
  payment_terms text,
  loading_port text,
  discharge_port text,
  priority text,
  comments text,
  status text default 'À vérifier',
  verified_at timestamptz,
  created_at timestamptz default now(),
  unique (supplier_id, product_id)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete cascade,
  offer_id uuid references offers(id) on delete cascade,
  doc_type text,
  file_url text not null,
  file_name text,
  uploaded_at timestamptz default now()
);
