import { useState, useCallback, useRef, useEffect } from 'react';
import { sendAICommand } from '../../services/aiApi';

interface AIPanelProps {
  boardId: string;
  onCommandComplete: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIPanel({ boardId, onCommandComplete }: AIPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const msg = input.trim();
      if (!msg || isLoading) return;

      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: msg }]);
      setIsLoading(true);

      try {
        const response = await sendAICommand(boardId, msg);
        setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
        onCommandComplete();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }]);
      } finally {
        setIsLoading(false);
      }
    },
    [boardId, input, isLoading, onCommandComplete],
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          background: '#6c63ff',
          color: '#fff',
          borderRadius: '50%',
          width: 48,
          height: 48,
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
          zIndex: 20,
          cursor: 'pointer',
          border: 'none',
        }}
        title="AI Assistant"
      >
        AI
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 360,
        height: 480,
        background: '#1a1a2e',
        borderRadius: 12,
        border: '1px solid rgba(108,99,255,0.3)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#e0e0e0', fontWeight: 600, fontSize: 14 }}>AI Assistant</span>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            color: '#a0a0b0',
            fontSize: 18,
            cursor: 'pointer',
            border: 'none',
            padding: '0 4px',
          }}
        >
          x
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: '#a0a0b0', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
            <p style={{ marginBottom: 8 }}>Try commands like:</p>
            <p style={{ fontStyle: 'italic' }}>"Add a yellow sticky note that says User Research"</p>
            <p style={{ fontStyle: 'italic' }}>"Create a SWOT analysis"</p>
            <p style={{ fontStyle: 'italic' }}>"Arrange sticky notes in a grid"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.role === 'user' ? '#6c63ff' : 'rgba(255,255,255,0.08)',
              color: msg.role === 'user' ? '#fff' : '#e0e0e0',
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: 'rgba(255,255,255,0.08)',
              color: '#a0a0b0',
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 13,
            }}
          >
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: 12,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI to create or modify objects..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.08)',
            color: '#e0e0e0',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            background: isLoading ? '#555' : '#6c63ff',
            color: '#fff',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            border: 'none',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
