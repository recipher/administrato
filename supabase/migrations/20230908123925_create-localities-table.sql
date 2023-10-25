create table
  public.localities (
    "isoCode" text not null,
    name text not null,
    "diallingCode" text null,
    parent text null,
    constraint "localitiesPkey" primary key ("isoCode"),
    constraint "localitiesParentFkey" foreign key (parent) references localities ("isoCode")
  ) tablespace pg_default;
alter table public.localities enable row level security;