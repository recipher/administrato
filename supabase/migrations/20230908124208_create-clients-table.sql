create table
  public.clients (
    id text not null,
    name text not null,
    identifier text not null,
    logo text null,
    "isArchived" boolean null default false,
    "parentId" text null,
    "keyStart" bigint null,
    "keyEnd" bigint null,
    localities text[] null,
    "serviceCentreId" text not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint clients_pkey primary key (id),
    constraint clients_parentId_fkey foreign key ("parentId") references clients (id) on delete cascade,
    constraint clients_serviceCentreId_fkey foreign key ("serviceCentreId") references "serviceCentres" (id)
  ) tablespace pg_default;
alter table public.clients ENABLE ROW LEVEL SECURITY;