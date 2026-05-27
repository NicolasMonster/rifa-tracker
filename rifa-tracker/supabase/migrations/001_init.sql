-- Tabla principal: registros diarios
create table if not exists daily_entries (
  id          uuid primary key default gen_random_uuid(),
  date        date not null unique,
  -- Meta (auto desde API)
  spend       numeric(10,2) not null default 0,
  impressions integer not null default 0,
  clicks      integer not null default 0,
  reach       integer not null default 0,
  -- Manual
  generated   numeric(10,2) not null default 0,
  rifas_sold  integer not null default 0,
  notes       text,
  -- Metadata
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index por fecha para queries rápidas
create index if not exists daily_entries_date_idx on daily_entries(date desc);

-- Trigger para updated_at automático
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on daily_entries
  for each row execute function update_updated_at();
