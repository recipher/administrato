create table
  public.milestones (
    id text not null,
    identifier text null,
    description text null,
    index integer not null,
    interval integer null,
    time timetz null,
    target boolean null,
    entities text[] null,
    "setId" text not null,
    "createdAt" timestamp with time zone not null default now(),
    "createdBy" jsonb null,
    "updatedAt" timestamp with time zone not null default now(),
    "updatedBy" jsonb null,
    constraint "milestonesPkey" primary key (id),
    constraint "milestonesSetIdFkey" foreign key ("setId") references "milestoneSets" (id) on delete cascade
  ) tablespace pg_default;

alter table public.milestones enable row level security;

create trigger "updateTimestamp" before update on public.milestones
for each row execute procedure moddatetime("updatedAt");
