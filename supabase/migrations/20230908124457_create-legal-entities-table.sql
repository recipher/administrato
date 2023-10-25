create table
  public."legalEntities" (
    id text not null,
    name text not null,
    identifier text not null,
    logo text null,
    frequency text null default 'monthly'::text,
    "target" text null default 'last'::text,
    "securityGroupId" text not null,
    "providerId" text null,
    "clientId" text null,
    "milestoneSetId" text null,
    "isArchived" boolean null default false,
    "keyStart" bigint null,
    "keyEnd" bigint null,
    localities text[] null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint "legalEntitiesPkey" primary key (id),
    constraint "legalEntitiesClientIdFkey" foreign key ("clientId") references clients (id),
    constraint "legalEntitiesProviderIdFkey" foreign key ("providerId") references providers (id),
    constraint "legalEntitiesSecurityGroupIdFkey" foreign key ("securityGroupId") references "securityGroups" (id),
    constraint "legalEntitiesMilestoneSetIdFkey" foreign key ("milestoneSetId") references "milestoneSets" (id)
  ) tablespace pg_default;

alter table public."legalEntities" enable row level security;

create trigger "updateTimestamp" before update on public."legalEntities"
for each row execute procedure moddatetime("updatedAt");
