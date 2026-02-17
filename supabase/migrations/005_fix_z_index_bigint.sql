-- Fix z_index overflow: Date.now() returns values > INT max (~2.1B).
-- Change to BIGINT to support timestamp-based z-ordering.
alter table board_objects alter column z_index type bigint;
