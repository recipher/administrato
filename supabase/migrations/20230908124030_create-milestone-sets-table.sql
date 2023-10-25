create table
  public."milestoneSets" (
    id text not null,
    identifier text null,
    "isDefault" boolean null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint "milestoneSetsPkey" primary key (id)
  ) tablespace pg_default;

alter table public."milestoneSets" enable row level security;

create trigger "updateTimestamp" before update on public."milestoneSets"
for each row execute procedure moddatetime("updatedAt");
