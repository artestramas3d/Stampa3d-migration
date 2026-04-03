import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { resetPassword, formatApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Printer, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Le password non coincidono');
      return;
    }
    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri');
      return;
    }
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
            <p className="text-destructive mb-4">Link non valido. Richiedi un nuovo link di recupero.</p>
            <Link to="/forgot-password">
              <Button>Recupera Password</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="reset-password-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-primary/10 mb-4">
            <Printer className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">FilamentProfit</h1>
        </div>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="font-heading">Nuova Password</CardTitle>
            <CardDescription>
              {done ? 'Password aggiornata!' : 'Inserisci la tua nuova password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-center">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-sm font-medium">Password reimpostata con successo!</p>
                </div>
                <Link to="/login">
                  <Button className="w-full">Vai al Login</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Nuova Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 6 caratteri"
                    required
                    minLength={6}
                    data-testid="reset-password-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conferma Password</Label>
                  <Input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Ripeti la password"
                    required
                    data-testid="reset-password-confirm"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="reset-submit">
                  {loading ? 'Salvataggio...' : 'Reimposta Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
