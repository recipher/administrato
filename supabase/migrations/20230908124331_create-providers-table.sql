create table
  public.providers (
    id text not null,
    name text not null,
    identifier text not null,
    logo text null,
    "securityGroupId" text not null,
    "isArchived" boolean null default false,
    "keyStart" bigint null,
    "keyEnd" bigint null,
    localities text[] null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint providers_pkey primary key (id)
  ) tablespace pg_default;
alter table public.providers enable row level security;

create trigger update_timestamp before update on public.providers
for each row execute procedure moddatetime("updatedAt");
