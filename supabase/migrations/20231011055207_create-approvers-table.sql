create table
  public.approvers (
    id text not null,
    entity text not null,
    "entityId" text not null,
    required json not null default '[]'::json,
    optional json not null default '[]'::json,
    constraint approvers_pkey primary key (id)
  ) tablespace pg_default;
alter table public.approvers enable row level security;