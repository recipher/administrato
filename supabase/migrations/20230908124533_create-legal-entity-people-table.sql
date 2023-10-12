create table
  public."legalEntityPeople" (
    id text not null,
    "personId" text not null,
    "legalEntityId" text not null,
    "startOn" date not null,
    "endOn" date null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint legalEntityId_pkey primary key (id),
    constraint legalEntityId_legalEntityId_fkey foreign key ("legalEntityId") references "legalEntities" (id) on delete cascade,
    constraint legalEntityId_personId_fkey foreign key ("personId") references people (id) on delete cascade
  ) tablespace pg_default;
alter table public."legalEntityPeople" enable row level security;