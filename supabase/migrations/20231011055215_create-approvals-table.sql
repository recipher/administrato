create table
  public.approvals (
    id text not null,
    entity text not null,
    "entityId" text[] not null,
    "userId" text null,
    "userData" json null,
    "isOptional" boolean null,
    "setId" text null,
    status text not null,
    notes json null,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint "approvalsPkey" primary key (id),
    constraint "approvalsEntityIdUserIdUniq" unique ("entityId", "userId")
  ) tablespace pg_default;

alter table public.approvals enable row level security;

create trigger "updateTimestamp" before update on public.approvals
for each row execute procedure moddatetime("updatedAt");