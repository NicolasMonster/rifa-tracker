-- ── Cuentas publicitarias (multi-cuenta Meta Ads) ──────────────────────────
create table if not exists ad_accounts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  account_id text not null unique,   -- act_XXXXXXXXX
  is_active  boolean not null default true,
  color      text    not null default '#1D9E75',
  created_at timestamptz default now()
);

-- ── Nuevas columnas en daily_entries ────────────────────────────────────────
alter table daily_entries
  add column if not exists clientes       integer      not null default 0,
  add column if not exists ticket_promedio numeric(10,2) not null default 0;

-- Migrar datos existentes: rifas_sold → clientes
update daily_entries
  set clientes = rifas_sold
  where clientes = 0 and rifas_sold > 0;

-- Calcular ticket_promedio para registros existentes
update daily_entries
  set ticket_promedio = round(generated / clientes, 2)
  where clientes > 0 and ticket_promedio = 0 and generated > 0;
