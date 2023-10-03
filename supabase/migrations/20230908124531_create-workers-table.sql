create table
  public.workers (
    id text not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    identifier text not null,
    "firstName" text not null,
    "lastName" text not null,
    photo text null,
    "clientId" text not null,
    "legalEntityId" text not null,
    "isArchived" boolean null default false,
    "clientKeyStart" bigint not null,
    "clientKeyEnd" bigint not null,
    "legalEntityKeyStart" bigint not null,
    "legalEntityKeyEnd" bigint not null,
    locality text null,
    constraint worker_pkey primary key (id),
    constraint workers_clientId_fkey foreign key ("clientId") references clients (id) on delete set null,
    constraint workers_legalEntityId_fkey foreign key ("legalEntityId") references "legalEntities" (id) on delete set null
  ) tablespace pg_default;
alter table public.workers ENABLE ROW LEVEL SECURITY;