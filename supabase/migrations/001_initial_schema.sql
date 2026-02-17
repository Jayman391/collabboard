-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Boards table
create table boards (
  id uuid primary key default uuid_generate_v4(),
  title text not null default 'Untitled Board',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Board objects table
create table board_objects (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  type text not null check (type in ('sticky_note', 'rectangle', 'connector')),
  x float not null default 0,
  y float not null default 0,
  width float not null default 200,
  height float not null default 200,
  rotation float not null default 0,
  color text not null default '#FDFD96',
  text text not null default '',
  z_index int not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Board members table
create table board_members (
  board_id uuid not null references boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  primary key (board_id, user_id)
);

-- Index for fast board object lookups
create index idx_board_objects_board_id on board_objects(board_id);

-- Index for finding user's boards
create index idx_board_members_user_id on board_members(user_id);

-- Auto-update updated_at on board_objects
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger board_objects_updated_at
  before update on board_objects
  for each row execute function update_updated_at();
