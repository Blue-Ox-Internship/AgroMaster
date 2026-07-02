create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  business_name text,
  password_hash text not null,
  role text not null default 'Sales Attendant' check (role in ('Administrator','Store Manager','Sales Attendant')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  medicine_name text not null,
  category text not null check (category in ('Antibiotic','Antiparasitic','Supplement','Pesticide','Antifungal','Anti-inflammatory','Vaccine','Other')),
  manufacturer text,
  batch_number text,
  expiry_date date not null,
  quantity integer not null default 0 check (quantity >= 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  phone text not null,
  email text,
  address text,
  contact_person text,
  payment_terms text not null default 'Net 30',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  medicine_id uuid not null references public.medicines(id) on delete restrict,
  quantity integer not null check (quantity >= 1),
  buying_price numeric(12,2) not null check (buying_price >= 0),
  total_cost numeric(12,2) not null default 0,
  purchase_date date not null default current_date,
  invoice_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid not null references public.medicines(id) on delete restrict,
  quantity integer not null check (quantity >= 1),
  selling_price numeric(12,2) not null check (selling_price >= 0),
  total_amount numeric(12,2) not null default 0,
  sale_date date not null default current_date,
  customer_name text,
  payment_method text not null default 'Cash' check (payment_method in ('Cash','Mobile Money','Bank Transfer','Credit')),
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  alert_type text not null check (alert_type in ('low_stock','expiry','expired','system')),
  message text not null,
  severity text not null default 'warning' check (severity in ('info','warning','danger')),
  status text not null default 'unread' check (status in ('unread','read','archived')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_medicines_expiry_date on public.medicines (expiry_date);
create index if not exists idx_purchases_supplier_date on public.purchases (supplier_id, purchase_date desc);
create index if not exists idx_sales_date on public.sales (sale_date desc);
create index if not exists idx_alerts_status_created on public.alerts (status, created_at desc);

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_medicines_updated_at
before update on public.medicines
for each row execute function public.set_updated_at();

create trigger set_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

create trigger set_purchases_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

create trigger set_sales_updated_at
before update on public.sales
for each row execute function public.set_updated_at();

create trigger set_alerts_updated_at
before update on public.alerts
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.medicines enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.sales enable row level security;
alter table public.alerts enable row level security;

create policy if not exists "service role can manage users" on public.users for all to service_role using (true) with check (true);
create policy if not exists "service role can manage medicines" on public.medicines for all to service_role using (true) with check (true);
create policy if not exists "service role can manage suppliers" on public.suppliers for all to service_role using (true) with check (true);
create policy if not exists "service role can manage purchases" on public.purchases for all to service_role using (true) with check (true);
create policy if not exists "service role can manage sales" on public.sales for all to service_role using (true) with check (true);
create policy if not exists "service role can manage alerts" on public.alerts for all to service_role using (true) with check (true);
