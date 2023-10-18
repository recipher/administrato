create table
  public.documents (
    id text not null,
    identifier text not null,
    document text not null,
    folder text null,
    tags text[] null,
    "entityId" text not null,
    entity text not null,
    "isArchived" boolean not null default FALSE,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now(),
    constraint document_pkey primary key (id)
  ) tablespace pg_default;
alter table public.documents enable row level security;

create trigger update_timestamp before update on public.documents
for each row execute procedure moddatetime("updatedAt");
