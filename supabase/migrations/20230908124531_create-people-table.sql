create table
  public.people (
    id text not null,
    identifier text not null,
    classifier text not null,
    "firstName" text not null,
    "lastName" text not null,
    title text null,
    gender text null,
    dob date null,
    photo text null,
    "clientId" text null,
    "legalEntityId" text null,
    "isArchived" boolean null default false,
    "clientKeyStart" bigint null,
    "clientKeyEnd" bigint null,
    "legalEntityKeyStart" bigint null,
    "legalEntityKeyEnd" bigint null,
    locality text null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint person_pkey primary key (id),
    constraint people_clientId_fkey foreign key ("clientId") references clients (id) on delete set null,
    constraint people_legalEntityId_fkey foreign key ("legalEntityId") references "legalEntities" (id) on delete set null
  ) tablespace pg_default;
alter table public.people ENABLE ROW LEVEL SECURITY;