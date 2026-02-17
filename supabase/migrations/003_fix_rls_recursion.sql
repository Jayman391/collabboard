-- Fix infinite recursion in RLS policies.
-- The problem: board_members SELECT policy references board_members itself.
-- The fix: use a SECURITY DEFINER function to bypass RLS when checking membership.

-- Helper function: checks if the current user is a member of a board.
-- SECURITY DEFINER runs with the function owner's privileges (bypasses RLS).
create or replace function is_board_member(p_board_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from board_members
    where board_id = p_board_id and user_id = auth.uid()
  );
$$;

-- Helper function: checks if the current user is an owner/editor of a board.
create or replace function is_board_editor(p_board_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from board_members
    where board_id = p_board_id
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
$$;

-- Helper function: checks if the current user is an owner of a board.
create or replace function is_board_owner(p_board_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from board_members
    where board_id = p_board_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

-- Drop all existing policies
drop policy if exists "Users can view their boards" on boards;
drop policy if exists "Authenticated users can create boards" on boards;
drop policy if exists "Board creator can update" on boards;
drop policy if exists "Board creator can delete" on boards;

drop policy if exists "Members can view board objects" on board_objects;
drop policy if exists "Editors can create board objects" on board_objects;
drop policy if exists "Editors can update board objects" on board_objects;
drop policy if exists "Editors can delete board objects" on board_objects;

drop policy if exists "Members can view board members" on board_members;
drop policy if exists "Owners can manage board members" on board_members;
drop policy if exists "Owners can remove board members" on board_members;

-- === Boards policies (use is_board_member) ===

create policy "Users can view their boards"
  on boards for select
  using (is_board_member(id));

create policy "Authenticated users can create boards"
  on boards for insert
  with check (auth.uid() is not null);

create policy "Board creator can update"
  on boards for update
  using (created_by = auth.uid());

create policy "Board creator can delete"
  on boards for delete
  using (created_by = auth.uid());

-- === Board objects policies (use is_board_member / is_board_editor) ===

create policy "Members can view board objects"
  on board_objects for select
  using (is_board_member(board_id));

create policy "Editors can create board objects"
  on board_objects for insert
  with check (is_board_editor(board_id));

create policy "Editors can update board objects"
  on board_objects for update
  using (is_board_editor(board_id));

create policy "Editors can delete board objects"
  on board_objects for delete
  using (is_board_editor(board_id));

-- === Board members policies (use is_board_member / is_board_owner) ===

create policy "Members can view board members"
  on board_members for select
  using (is_board_member(board_id));

create policy "Owners can manage board members"
  on board_members for insert
  with check (
    is_board_owner(board_id)
    or
    -- Allow self-join (for board URL sharing)
    user_id = auth.uid()
  );

create policy "Owners can remove board members"
  on board_members for delete
  using (
    is_board_owner(board_id)
    or user_id = auth.uid()
  );
