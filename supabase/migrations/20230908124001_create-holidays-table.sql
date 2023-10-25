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
    constraint "holidayPkey" primary key (id),
    constraint "holidaysLocalityFkey" foreign key (locality) references localities ("isoCode"),
    constraint "holidaysLocalityNameDateEntityUniq" unique (locality, name, date, entity, "entityId")
  ) tablespace pg_default;

alter table public.holidays enable row level security;

create trigger "updateTimestamp" before update on public.holidays
for each row execute procedure moddatetime("updatedAt");
