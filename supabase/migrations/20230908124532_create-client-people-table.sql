create table
  public."clientPeople" (
    id text not null,
    "personId" text not null,
    "clientId" text not null,
    "startOn" date not null,
    "endOn" date null,
    "createdAt" timestamp with time zone not null default now(),
    "createdBy" jsonb null,
    "updatedAt" timestamp with time zone not null default now(),
    "updatedBy" jsonb null,
    constraint "clientPeoplePkey" primary key (id),
    constraint "clientPeopleClientIdFkey" foreign key ("clientId") references clients (id) on delete cascade,
    constraint "clientPeoplePersonIdFkey" foreign key ("personId") references people (id) on delete cascade
  ) tablespace pg_default;

alter table public."clientPeople" enable row level security;

create trigger "updateTimestamp" before update on public."clientPeople"
for each row execute procedure moddatetime("updatedAt");
