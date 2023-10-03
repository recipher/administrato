create table
  public."milestoneSets" (
    id text not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    identifier text null,
    "isDefault" boolean null,
    constraint milestoneSets_pkey primary key (id)
  ) tablespace pg_default;
alter table public."milestoneSets" ENABLE ROW LEVEL SECURITY;