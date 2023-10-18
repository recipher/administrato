create table
  public."milestoneSets" (
    id text not null,
    identifier text null,
    "isDefault" boolean null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint milestoneSets_pkey primary key (id)
  ) tablespace pg_default;
alter table public."milestoneSets" enable row level security;

create trigger update_timestamp before update on public."milestoneSets"
for each row execute procedure moddatetime("updatedAt");
