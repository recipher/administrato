create table
  public.approvals (
    id text not null,
    entity text not null,
    "entityId" text[] not null,
    "userId" text not null,
    "userData" json not null,
    "isOptional" boolean null,
    "setId" text not null,
    status text not null,
    notes json null,
    constraint approvals_pkey primary key (id),
    constraint approvals_entityId_userId_uniq unique ("entityId", "userId")
  ) tablespace pg_default;
alter table public.approvals enable row level security;