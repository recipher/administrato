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
    "updatedAt" timestamp with time zone not null default now(),
    constraint schedule_dates_pkey primary key (id),
    constraint scheduleDates_clientId_fkey foreign key ("clientId") references clients (id),
    constraint scheduleDates_scheduleId_fkey foreign key ("scheduleId") references schedules (id) on delete cascade,
    constraint scheduleDates_milestoneId_fkey foreign key ("milestoneId") references milestones (id) on delete cascade,
    constraint scheduleDates_scheduleId_milestoneId_uniq unique ("scheduleId", "milestoneId")
  ) tablespace pg_default;
alter table public."scheduleDates" ENABLE ROW LEVEL SECURITY;