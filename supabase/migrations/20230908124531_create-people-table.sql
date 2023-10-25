create table
  public.people (
    id text not null,
    identifier text not null,
    classifier text not null,
    "firstName" text not null,
    "secondName" text null,
    "lastName" text null,
    "firstLastName" text null,
    "secondLastName" text null,
    honorific text null,
    gender text null,
    dob date null,
    photo text null,
    locality text not null,
    nationality text not null,
    "isArchived" boolean null default false,
    "clientKeyStart" bigint null,
    "clientKeyEnd" bigint null,
    "legalEntityKeyStart" bigint null,
    "legalEntityKeyEnd" bigint null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint "personPkey" primary key (id)
  ) tablespace pg_default;

alter table public.people enable row level security;

create trigger "updateTimestamp" before update on public.people
for each row execute procedure moddatetime("updatedAt");
