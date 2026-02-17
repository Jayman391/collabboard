-- Enable RLS on all tables
alter table boards enable row level security;
alter table board_objects enable row level security;
alter table board_members enable row level security;

-- Boards: users can see boards they're a member of
create policy "Users can view their boards"
  on boards for select
  using (
    id in (select board_id from board_members where user_id = auth.uid())
  );

-- Boards: any authenticated user can create a board
create policy "Authenticated users can create boards"
  on boards for insert
  with check (auth.uid() is not null);

-- Boards: only the creator can update the board
create policy "Board creator can update"
  on boards for update
  using (created_by = auth.uid());

-- Boards: only the creator can delete the board
create policy "Board creator can delete"
  on boards for delete
  using (created_by = auth.uid());

-- Board objects: members can view objects on their boards
create policy "Members can view board objects"
  on board_objects for select
  using (
    board_id in (select board_id from board_members where user_id = auth.uid())
  );

-- Board objects: editors and owners can insert
create policy "Editors can create board objects"
  on board_objects for insert
  with check (
    board_id in (
      select board_id from board_members
      where user_id = auth.uid() and role in ('owner', 'editor')
    )
  );

-- Board objects: editors and owners can update
create policy "Editors can update board objects"
  on board_objects for update
  using (
    board_id in (
      select board_id from board_members
      where user_id = auth.uid() and role in ('owner', 'editor')
    )
  );

-- Board objects: editors and owners can delete
create policy "Editors can delete board objects"
  on board_objects for delete
  using (
    board_id in (
      select board_id from board_members
      where user_id = auth.uid() and role in ('owner', 'editor')
    )
  );

-- Board members: users can see members of boards they belong to
create policy "Members can view board members"
  on board_members for select
  using (
    board_id in (select board_id from board_members where user_id = auth.uid())
  );

-- Board members: board owners can manage members
create policy "Owners can manage board members"
  on board_members for insert
  with check (
    board_id in (
      select board_id from board_members
      where user_id = auth.uid() and role = 'owner'
    )
    or
    -- Allow self-join (for board URL sharing)
    user_id = auth.uid()
  );

-- Board members: owners can remove members
create policy "Owners can remove board members"
  on board_members for delete
  using (
    board_id in (
      select board_id from board_members
      where user_id = auth.uid() and role = 'owner'
    )
    or user_id = auth.uid()
  );
