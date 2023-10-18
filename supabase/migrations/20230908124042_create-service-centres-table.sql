create table
  public."serviceCentres" (
    id text not null,
    name text not null,
    identifier text not null,
    "parentId" text null,
    "isArchived" boolean null default false,
    "keyStart" bigint null,
    "keyEnd" bigint null,
    localities text[] null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint service_centres_pkey primary key (id),
    constraint service_centres_parentId_fkey foreign key ("parentId") references "serviceCentres" (id) on delete cascade
  ) tablespace pg_default;
alter table public."serviceCentres" enable row level security;

create trigger update_timestamp before update on public."serviceCentres"
for each row execute procedure moddatetime("updatedAt");
