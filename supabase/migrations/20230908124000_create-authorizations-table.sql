create table
  public.authorizations (
    id text not null,
    "user" text not null,
    "organization" text not null,
    "keyStart" bigint null,
    "keyEnd" bigint null,
    entity text not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint authorizations_pkey primary key (id)
  ) tablespace pg_default;
alter table public.authorizations ENABLE ROW LEVEL SECURITY;