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
    constraint "authorizationsPkey" primary key (id)
  ) tablespace pg_default;

alter table public.authorizations enable row level security;

create extension if not exists moddatetime;
create trigger "updateTimestamp" before update on public.authorizations
for each row execute procedure moddatetime("updatedAt");
