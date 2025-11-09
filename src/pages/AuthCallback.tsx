import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOAuthManager } from '@/hooks/useOAuthManager';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useOAuthManager() as any;

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // platform name
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/', { replace: true });
        return;
      }

      if (code && state) {
        await handleOAuthCallback(state, code);
        navigate('/', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
