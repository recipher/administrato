create table
  public."clientPeople" (
    id text not null,
    "personId" text not null,
    "clientId" text not null,
    "startOn" date not null,
    "endOn" date null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint clientPeople_pkey primary key (id),
    constraint clientPeople_clientId_fkey foreign key ("clientId") references clients (id) on delete cascade,
    constraint clientPeople_personId_fkey foreign key ("personId") references people (id) on delete cascade
  ) tablespace pg_default;
alter table public."clientPeople" enable row level security;