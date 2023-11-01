create table
  public."scheduleDates" (
    id text not null,
    "scheduleId" text not null,
    "milestoneId" text not null,
    date date not null,
    "isManual" boolean null default false,
    "clientId" text null,
    status text not null,
    index integer not null,
    target boolean not null,
    "createdAt" timestamp with time zone not null default now(),
    "createdBy" jsonb null,
    "updatedAt" timestamp with time zone not null default now(),
    "updatedBy" jsonb null,
    constraint "scheduleDatesPkey" primary key (id),
    constraint "scheduleDatesClientIdFkey" foreign key ("clientId") references clients (id),
    constraint "scheduleDatesScheduleIdFkey" foreign key ("scheduleId") references schedules (id) on delete cascade,
    constraint "scheduleDatesMilestoneIdFkey" foreign key ("milestoneId") references milestones (id) on delete cascade,
    constraint "scheduleDatesScheduleIdMilestoneIdUniq" unique ("scheduleId", "milestoneId")
  ) tablespace pg_default;

alter table public."scheduleDates" enable row level security;

create trigger "updateTimestamp" before update on public."scheduleDates"
for each row execute procedure moddatetime("updatedAt");
