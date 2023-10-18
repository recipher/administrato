create table
  public.holidays (
    id text not null,
    locality text not null,
    date date not null,
    observed date null,
    name text not null,
    entity text null,
    "entityId" text null,
    "isRemoved" boolean null,    
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint holiday_pkey primary key (id),
    constraint holidays_locality_fkey foreign key (locality) references localities ("isoCode"),
    constraint holidays_locality_name_date_entity_uniq unique (locality, name, date, entity, "entityId")
  ) tablespace pg_default;
alter table public.holidays enable row level security;

create trigger update_timestamp before update on public.holidays
for each row execute procedure moddatetime("updatedAt");
