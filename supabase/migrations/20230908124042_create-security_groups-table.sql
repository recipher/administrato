create table
  public."securityGroups" (
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
    constraint security_groups_pkey primary key (id),
    constraint security_groups_parentId_fkey foreign key ("parentId") references "securityGroups" (id) on delete cascade
  ) tablespace pg_default;
alter table public."securityGroups" enable row level security;

create trigger update_timestamp before update on public."securityGroups"
for each row execute procedure moddatetime("updatedAt");
