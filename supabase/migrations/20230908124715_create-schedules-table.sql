create table
  public.schedules (
    id text not null,
    "legalEntityId" text not null,
    date date not null,
    name text not null,
    status text not null default 'generated'::text,
    version integer not null default 0,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint schedulesPkey primary key (id),
    constraint schedules_legalEntityIdFkey foreign key ("legalEntityId") references "legalEntities" (id) on delete cascade,
    constraint schedules_legalEntityId_date_status_versionUniq unique ("legalEntityId", date, status, version)
  ) tablespace pg_default;

alter table public.schedules enable row level security;

create trigger "updateTimestamp" before update on public.schedules
for each row execute procedure moddatetime("updatedAt");
