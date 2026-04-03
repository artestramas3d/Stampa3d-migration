import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { formatApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="register-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold tracking-tight">Artes&Tramas</h1>
          <p className="text-muted-foreground text-sm mt-1">Calcolatore</p>
        </div>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="font-heading">{t('register')}</CardTitle>
            <CardDescription>{t('name')}, {t('email')} & {t('password')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>{t('name')}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="register-name" />
              </div>
              <div className="space-y-2">
                <Label>{t('email')}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="font-mono" data-testid="register-email" />
              </div>
              <div className="space-y-2">
                <Label>{t('password')}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} data-testid="register-password" />
              </div>
              <Button type="submit" className="w-full" disabled={loading} data-testid="register-submit">
                {loading ? t('registering') : t('register')}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              {t('have_account')}{' '}
              <Link to="/login" className="text-primary hover:underline" data-testid="go-to-login">{t('login')}</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
