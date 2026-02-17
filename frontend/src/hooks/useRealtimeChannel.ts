import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const MAX_BACKOFF = 30_000;
const INITIAL_BACKOFF = 1_000;
const POLL_INTERVAL = 3_000;

export function useRealtimeChannel(channelName: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const backoffRef = useRef(INITIAL_BACKOFF);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const onReconnectRef = useRef<(() => void) | null>(null);

  const createChannel = useCallback(() => {
    if (!mountedRef.current || !channelName) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const ch = supabase.channel(channelName);
    channelRef.current = ch;
    setChannel(ch);
    backoffRef.current = INITIAL_BACKOFF;
  }, [channelName]);

  const scheduleRetry = useCallback(() => {
    if (!mountedRef.current || !channelName) return;
    if (retryTimerRef.current) return; // already scheduled

    const delay = backoffRef.current;
    backoffRef.current = Math.min(delay * 2, MAX_BACKOFF);

    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      createChannel();
      // Notify listeners so they can re-fetch missed state
      onReconnectRef.current?.();
    }, delay);
  }, [createChannel, channelName]);

  // Poll channel health — trigger reconnect on error/closed
  useEffect(() => {
    if (!channelName) return;

    pollTimerRef.current = setInterval(() => {
      const ch = channelRef.current;
      if (!ch) return;
      const state = (ch as unknown as { state: string }).state;
      if (state === 'errored' || state === 'closed') {
        scheduleRetry();
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [scheduleRetry, channelName]);

  // Initial channel creation
  useEffect(() => {
    mountedRef.current = true;
    if (channelName) {
      createChannel();
    }

    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setChannel(null);
    };
  }, [createChannel, channelName]);

  // Allow consumers to register a reconnection callback
  const onReconnect = useCallback((cb: () => void) => {
    onReconnectRef.current = cb;
  }, []);

  return { channelRef, channel, onReconnect };
}
