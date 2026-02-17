-- Fix: board creator can't see their own board on INSERT...RETURNING
-- because board_members row doesn't exist yet.

-- 1. Update boards SELECT policy to also allow the creator to see their board.
drop policy if exists "Users can view their boards" on boards;
create policy "Users can view their boards"
  on boards for select
  using (
    created_by = auth.uid() or is_board_member(id)
  );

-- 2. Auto-add creator as owner when a board is created (so we don't rely on client).
create or replace function add_board_creator_as_owner()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into board_members (board_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (board_id, user_id) do nothing;
  return new;
end;
$$;

create trigger board_auto_add_owner
  after insert on boards
  for each row execute function add_board_creator_as_owner();
