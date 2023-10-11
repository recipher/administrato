create table
  public.approvals (
    id text not null,
    entity text not null,
    "entityId" text not null,
    required json not null default '[]'::json,
    optional json not null default '[]'::json,
    constraint approvals_pkey primary key (id)
  ) tablespace pg_default;
alter table public.approvals enable row level security;