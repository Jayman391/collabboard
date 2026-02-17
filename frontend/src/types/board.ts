export interface Board {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
}

export interface BoardObject {
  id: string;
  board_id: string;
  type: 'sticky_note' | 'rectangle' | 'circle' | 'line' | 'connector' | 'frame' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  text: string;
  z_index: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BoardMember {
  board_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface CursorPosition {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

export interface PresenceUser {
  userId: string;
  userName: string;
  email: string;
  color: string;
  onlineAt: string;
}
