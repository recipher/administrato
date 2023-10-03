create table
  public.providers (
    id text not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    name text not null,
    identifier text not null,
    logo text null,
    "serviceCentreId" text not null,
    "isArchived" boolean null default false,
    "keyStart" bigint null,
    "keyEnd" bigint null,
    localities text[] null,
    constraint providers_pkey primary key (id)
  ) tablespace pg_default;
alter table public.providers ENABLE ROW LEVEL SECURITY;