create table
  public.schedules (
    id text not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    "legalEntityId" text not null,
    year integer null,
    index integer null,
    name text null,
    status text null default 'draft'::text,
    version integer null default 0,
    constraint schedules_pkey primary key (id),
    constraint schedules_legalEntityId_fkey foreign key ("legalEntityId") references "legalEntities" (id) on delete cascade
  ) tablespace pg_default;
alter table public.schedules ENABLE ROW LEVEL SECURITY;