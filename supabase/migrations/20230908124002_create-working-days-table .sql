create table
  public."workingDays" (
    id text not null,
    country text not null,
    days int4[] not null,
    "createdAt" timestamp with time zone not null default now(),
    "createdBy" jsonb null,
    "updatedAt" timestamp with time zone not null default now(),
    "updatedBy" jsonb null,
    constraint "workingDaysPkey" primary key (id),
    constraint "workingDaysCountryUniq" unique ("country")
  ) tablespace pg_default;

alter table public."workingDays" enable row level security;

create trigger "updateTimestamp" before update on public."workingDays"
for each row execute procedure moddatetime("updatedAt");
