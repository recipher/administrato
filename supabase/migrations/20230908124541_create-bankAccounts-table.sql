create table
  public."bankAccounts" (
    id text not null,
    bban text null,
    iban text null,
    "countryIsoCode" text not null,
    "entityId" text not null,
    entity text not null,
    "isArchived" boolean not null default FALSE,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint "bankAccountPkey" primary key (id)
  ) tablespace pg_default;

alter table public."bankAccounts" enable row level security;

create trigger "updateTimestamp" before update on public."bankAccounts"
for each row execute procedure moddatetime("updatedAt");
