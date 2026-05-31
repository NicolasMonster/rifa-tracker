-- Filtro de campañas por cuenta (IDs guardados como JSON array string)
alter table ad_accounts
  add column if not exists selected_campaign_ids text not null default '[]';
