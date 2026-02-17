const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';

export async function sendAICommand(boardId: string, message: string): Promise<string> {
  const res = await fetch(`${AI_SERVER_URL}/api/ai/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board_id: boardId, message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'AI server error' }));
    throw new Error(err.detail || `AI request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.response;
}
