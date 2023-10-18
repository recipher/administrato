create table
  public.approvals (
    id text not null,
    entity text not null,
    "entityId" text[] not null,
    "userId" text null,
    "userData" json null,
    "isOptional" boolean null,
    "setId" text not null,
    status text not null,
    notes json null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint approvals_pkey primary key (id),
    constraint approvals_entityId_userId_uniq unique ("entityId", "userId")
  ) tablespace pg_default;
alter table public.approvals enable row level security;

create trigger update_timestamp before update on public.approvals
for each row execute procedure moddatetime("updatedAt");