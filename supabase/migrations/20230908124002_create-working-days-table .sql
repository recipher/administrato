create table
  public."workingDays" (
    id text not null,
    country text not null,
    days int4[] not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint workingDays_pkey primary key (id)
  ) tablespace pg_default;
alter table public."workingDays" enable row level security;