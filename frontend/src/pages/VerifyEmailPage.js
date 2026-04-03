import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { verifyEmail, formatApiError } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const { t } = useLang();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Token mancante'); return; }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => { setStatus('error'); setError(formatApiError(err)); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="verify-email-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold tracking-tight">Artes&Tramas</h1>
        </div>
        <Card className="border-border/40">
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <div>
                <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">{t('verify_loading')}</p>
              </div>
            )}
            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />
                <h2 className="text-xl font-heading font-bold">{t('verify_success')}</h2>
                <p className="text-muted-foreground">{t('verify_success_msg')}</p>
                <Link to="/"><Button className="w-full">{t('go_to_dashboard')}</Button></Link>
              </div>
            )}
            {status === 'error' && (
              <div className="space-y-4">
                <XCircle className="w-12 h-12 mx-auto text-destructive" />
                <h2 className="text-xl font-heading font-bold">{t('verify_error')}</h2>
                <p className="text-muted-foreground">{error}</p>
                <Link to="/login"><Button variant="outline" className="w-full">{t('go_to_login')}</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
