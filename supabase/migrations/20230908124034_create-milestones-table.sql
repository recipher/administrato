create table
  public.milestones (
    id text not null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    identifier text null,
    description text null,
    index integer null,
    interval integer null,
    time timetz null,
    pivot boolean null,
    entities text[] null,
    "setId" text not null,
    constraint milestones_pkey primary key (id),
    constraint milestones_setId_fkey foreign key ("setId") references "milestoneSets" (id) on delete cascade
  ) tablespace pg_default;
alter table public."milestones" ENABLE ROW LEVEL SECURITY;