-- Add more object types for AI agent: frame, circle, line, text
alter table board_objects drop constraint board_objects_type_check;
alter table board_objects add constraint board_objects_type_check
  check (type in ('sticky_note', 'rectangle', 'circle', 'line', 'connector', 'frame', 'text'));
