import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { formatApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold tracking-tight">Artes&Tramas</h1>
          <p className="text-muted-foreground text-sm mt-1">3D Print Manager</p>
        </div>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="font-heading">{t('login')}</CardTitle>
            <CardDescription>{t('email')} & {t('password')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="font-mono" data-testid="login-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="login-password" />
              </div>
              <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit">
                {loading ? t('logging_in') : t('login')}
              </Button>
              <div className="text-center">
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors" data-testid="forgot-password-link">
                  {t('forgot_password')}
                </Link>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              {t('no_account')}{' '}
              <Link to="/register" className="text-primary hover:underline" data-testid="go-to-register">{t('register')}</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
