create table
  public.localities (
    "isoCode" text not null,
    name text not null,
    "diallingCode" text null,
    parent text null,
    constraint localities_pkey primary key ("isoCode"),
    constraint localities_parent_fkey foreign key (parent) references localities ("isoCode")
  ) tablespace pg_default;
alter table public.localities enable row level security;