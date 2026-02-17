import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the code exchange automatically when it detects
    // the hash fragment or query params from the OAuth redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/boards', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-primary, #1a1a2e)',
      color: '#a0a0b0',
      fontSize: 18,
    }}>
      Signing in...
    </div>
  );
}
