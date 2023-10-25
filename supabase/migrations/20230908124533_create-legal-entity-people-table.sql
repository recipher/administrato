create table
  public."legalEntityPeople" (
    id text not null,
    "personId" text not null,
    "legalEntityId" text not null,
    "startOn" date not null,
    "endOn" date null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint "legalEntityIdPkey" primary key (id),
    constraint "legalEntityIdLegalEntityIdFkey" foreign key ("legalEntityId") references "legalEntities" (id) on delete cascade,
    constraint "legalEntityIdPersonIdFkey" foreign key ("personId") references people (id) on delete cascade
  ) tablespace pg_default;

alter table public."legalEntityPeople" enable row level security;

create trigger "updateTimestamp" before update on public."legalEntityPeople"
for each row execute procedure moddatetime("updatedAt");
