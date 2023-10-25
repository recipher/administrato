create table
  public.contacts (
    id text not null,
    value text not null,
    classifier text not null,
    sub text null,
    "isPreferred" boolean null,
    "entityId" text not null,
    entity text not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint "contactPkey" primary key (id)
  ) tablespace pg_default;

alter table public.contacts enable row level security;

create trigger "updateTimestamp" before update on public.contacts
for each row execute procedure moddatetime("updatedAt");
