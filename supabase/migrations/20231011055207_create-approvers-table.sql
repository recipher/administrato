create table
  public.approvers (
    id text not null,
    entity text not null,
    "entityId" text not null,
    "userId" text null,
    "userData" json null,
    "isOptional" boolean null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint approvers_pkey primary key (id),
    constraint approvers_entityId_userId_uniq unique ("entityId", "userId")
  ) tablespace pg_default;
alter table public.approvers enable row level security;

create trigger update_timestamp before update on public.approvers
for each row execute procedure moddatetime("updatedAt");
