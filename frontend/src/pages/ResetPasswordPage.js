import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { resetPassword, formatApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const { t } = useLang();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError(t('passwords_no_match')); return; }
    if (password.length < 6) { setError(t('password_min')); return; }
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/40">
          <CardContent className="p-8 text-center">
            <p className="text-destructive mb-4">{t('invalid_link')}</p>
            <Link to="/forgot-password"><Button>{t('forgot_title')}</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="reset-password-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Artes&Tramas" className="w-20 h-20 mx-auto rounded-sm object-contain mb-4" />
          <h1 className="text-3xl font-heading font-bold tracking-tight">Artes&Tramas</h1>
        </div>
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="font-heading">{t('reset_title')}</CardTitle>
            <CardDescription>{done ? t('reset_success') : t('reset_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-center">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-sm font-medium">{t('reset_success')}</p>
                </div>
                <Link to="/login"><Button className="w-full">{t('go_to_login')}</Button></Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">{error}</div>
                )}
                <div className="space-y-2">
                  <Label>{t('new_password')}</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} data-testid="reset-password-input" />
                </div>
                <div className="space-y-2">
                  <Label>{t('confirm_password')}</Label>
                  <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required data-testid="reset-password-confirm" />
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="reset-submit">
                  {loading ? t('reset_saving') : t('reset_submit')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
