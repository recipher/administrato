create table
  public.salaries (
    id text not null,
    "personId" text not null,
    "clientId" text not null,
    amount decimal not null,
    currency text not null,
    "startOn" date not null,
    "endOn" date null,
    "createdAt" timestamp with time zone not null default now(),
    "createdBy" jsonb null,
    "updatedAt" timestamp with time zone not null default now(),
    "updatedBy" jsonb null,
    constraint "salariesPkey" primary key (id),
    constraint "salariesClientIdFkey" foreign key ("clientId") references clients (id),
    constraint "salariesPersonIdFkey" foreign key ("personId") references people (id)
  ) tablespace pg_default;

alter table public.salaries enable row level security;

create trigger "updateTimestamp" before update on public.salaries
for each row execute procedure moddatetime("updatedAt");
