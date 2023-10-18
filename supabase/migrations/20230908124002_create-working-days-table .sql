create table
  public."workingDays" (
    id text not null,
    country text not null,
    days int4[] not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint workingDays_pkey primary key (id),
    constraint workingDays_country_uniq unique ("country")
  ) tablespace pg_default;
alter table public."workingDays" enable row level security;

create trigger update_timestamp before update on public."workingDays"
for each row execute procedure moddatetime("updatedAt");
