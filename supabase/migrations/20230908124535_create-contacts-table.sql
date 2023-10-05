create table
  public.contacts (
    id text not null,
    value text not null,
    classifier text not null,
    "isPrimary" boolean null,
    "entityId" text not null,
    entity text not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint contact_pkey primary key (id)
  ) tablespace pg_default;
alter table public.contacts ENABLE ROW LEVEL SECURITY;