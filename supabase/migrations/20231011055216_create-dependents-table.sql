create table
  public.dependents (
    id text not null,
    relationship text not null,
    "personId" text not null,
    "dependentId" text not null,
    "createdAt" timestamp with time zone not null default now(),
    "createdBy" jsonb null,
    "updatedAt" timestamp with time zone not null default now(),
    "updatedBy" jsonb null,
    constraint "dependentsPkey" primary key (id),
    constraint "dependentsPersonIdFkey" foreign key ("personId") references people (id),
    constraint "dependentsDependentIdFkey" foreign key ("dependentId") references people (id)
  ) tablespace pg_default;

alter table public.dependents enable row level security;

create trigger "updateTimestamp" before update on public.dependents
for each row execute procedure moddatetime("updatedAt");