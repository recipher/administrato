create table
  public."legalEntities" (
    id text not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    name text not null,
    identifier text not null,
    logo text null,
    frequency text null default 'monthly'::text,
    "targetDay" text null default 'last'::text,
    "serviceCentreId" text not null,
    "providerId" text null,
    "clientId" text null,
    "milestoneSetId" text null,
    "isArchived" boolean null default false,
    "keyStart" bigint null,
    "keyEnd" bigint null,
    localities text[] null,
    constraint legal_entities_pkey primary key (id),
    constraint legalEntities_clientId_fkey foreign key ("clientId") references clients (id),
    constraint legalEntities_providerId_fkey foreign key ("providerId") references providers (id),
    constraint legalEntities_serviceCentreId_fkey foreign key ("serviceCentreId") references "serviceCentres" (id),
    constraint legalEntities_milestoneSetId_fkey foreign key ("milestoneSetId") references "milestoneSets" (id)
  ) tablespace pg_default;
alter table public."legalEntities" ENABLE ROW LEVEL SECURITY;