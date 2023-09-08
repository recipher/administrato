create table
  public.localities (
    "createdAt" timestamp with time zone not null default now(),
    "isoCode" text not null,
    name text not null,
    parent text null,
    constraint localities_pkey primary key ("isoCode"),
    constraint localities_parent_fkey foreign key (parent) references localities ("isoCode")
  ) tablespace pg_default;