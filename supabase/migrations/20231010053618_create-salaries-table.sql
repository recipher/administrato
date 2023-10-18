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
    "updatedAt" timestamp with time zone not null default now(),
    constraint salaries_pkey primary key (id),
    constraint salaries_clientId_fkey foreign key ("clientId") references clients (id),
    constraint salaries_personId_fkey foreign key ("personId") references people (id)
  ) tablespace pg_default;
alter table public.salaries enable row level security;

create trigger update_timestamp before update on public.salaries
for each row execute procedure moddatetime("updatedAt");
