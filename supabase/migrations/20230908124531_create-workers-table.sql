create table
  public.workers (
    id bigint generated by default as identity,
    "createdAt" timestamp with time zone not null default now(),
    "firstName" text not null,
    "lastName" text not null,
    "clientId" bigint not null,
    "legalEntityId" bigint not null,
    "isArchived" boolean null default false,
    locality text null,
    constraint worker_pkey primary key (id),
    constraint workers_clientId_fkey foreign key ("clientId") references clients (id) on delete set null,
    constraint workers_legalEntityId_fkey foreign key ("legalEntityId") references "legalEntities" (id) on delete set null
  ) tablespace pg_default;
alter table public.workers ENABLE ROW LEVEL SECURITY;