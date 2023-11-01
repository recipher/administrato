create table
  public.clients (
    id text not null,
    name text not null,
    identifier text not null,
    logo text null,
    "isArchived" boolean null default false,
    "parentId" text null,
    "keyStart" bigint null,
    "keyEnd" bigint null,
    localities text[] null,
    "securityGroupId" text not null,
    "createdAt" timestamp with time zone not null default now(),
    "createdBy" jsonb null,
    "updatedAt" timestamp with time zone not null default now(),
    "updatedBy" jsonb null,
    constraint "clientsPkey" primary key (id),
    constraint "clientsParentIdFkey" foreign key ("parentId") references clients (id) on delete cascade,
    constraint "clientsSecurityGroupIdFkey" foreign key ("securityGroupId") references "securityGroups" (id)
  ) tablespace pg_default;

alter table public.clients enable row level security;

create trigger "updateTimestamp" before update on public.clients
for each row execute procedure moddatetime("updatedAt");
