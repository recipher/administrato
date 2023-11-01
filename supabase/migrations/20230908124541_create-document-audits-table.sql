create table
  public."documentAudits" (
    id text not null,
    "documentId" text not null,
    "action" text not null,
    "user" jsonb not null,
    "auditedAt" timestamp with time zone not null default now(),
    constraint "documentAuditsPkey" primary key (id),
    constraint "documentIdFkey" foreign key ("documentId") references documents (id) on delete cascade
  ) tablespace pg_default;

alter table public."documentAudits" enable row level security;

create trigger "updateTimestamp" before update on public."documentAudits"
for each row execute procedure moddatetime("updatedAt");
