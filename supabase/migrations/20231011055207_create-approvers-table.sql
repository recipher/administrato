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
    constraint "approversPkey" primary key (id),
    constraint "approversEntityIdUserIdUniq" unique ("entityId", "userId")
  ) tablespace pg_default;

alter table public.approvers enable row level security;

create trigger "updateTimestamp" before update on public.approvers
for each row execute procedure moddatetime("updatedAt");
