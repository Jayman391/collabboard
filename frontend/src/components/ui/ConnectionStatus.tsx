import { useState, useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ConnectionStatusProps {
  channel: RealtimeChannel | null;
}

type Status = 'connecting' | 'connected' | 'disconnected';

export function ConnectionStatus({ channel }: ConnectionStatusProps) {
  const [status, setStatus] = useState<Status>('connecting');

  useEffect(() => {
    if (!channel) {
      setStatus('connecting');
      return;
    }

    const checkStatus = () => {
      const state = (channel as unknown as { state: string }).state;
      if (state === 'joined') setStatus('connected');
      else if (state === 'closed' || state === 'errored') setStatus('disconnected');
      else setStatus('connecting');
    };

    // Poll channel state since there's no direct event for state changes
    const interval = setInterval(checkStatus, 2000);
    checkStatus();

    return () => clearInterval(interval);
  }, [channel]);

  // Only show indicator when not connected
  if (status === 'connected') return null;

  const config = {
    connecting: { color: '#f39c12', label: 'Connecting...' },
    disconnected: { color: '#e74c3c', label: 'Disconnected — retrying...' },
  }[status];

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(26, 26, 46, 0.9)',
        color: config.color,
        padding: '6px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        backdropFilter: 'blur(8px)',
      }}
    >
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: config.color,
        display: 'inline-block',
        animation: status === 'connecting' ? 'pulse 1.5s infinite' : undefined,
      }} />
      {config.label}
    </div>
  );
}
