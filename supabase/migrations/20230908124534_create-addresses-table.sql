create table
  public.addresses (
    id text not null,
    "address1" text null,
    "address2" text null,
    "addressNum" text null,
    country text null,
    "countryIsoCode" text null,
    city text null,
    "do" text null,
    dong text null,
    gu text null,
    "postalCode" text null,
    prefecture text null,
    province text null,
    region text null,
    republic text null,
    si text null,
    state text null,
    "isPreferred" boolean null,
    classifier text null,
    "entityId" text not null,
    entity text not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint address_pkey primary key (id)
  ) tablespace pg_default;
alter table public.addresses enable row level security;

create trigger update_timestamp before update on public.addresses
for each row execute procedure moddatetime("updatedAt");
