import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Printer } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-primary/10 mb-4">
            <Printer className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">FilamentProfit</h1>
          <p className="text-muted-foreground mt-2">Calcolatore Costi Stampa 3D</p>
        </div>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="font-heading">Accedi</CardTitle>
            <CardDescription>Inserisci le tue credenziali per accedere</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm" data-testid="login-error">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@esempio.com"
                  required
                  className="font-mono"
                  data-testid="login-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  data-testid="login-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit">
                {loading ? 'Accesso...' : 'Accedi'}
              </Button>

              <div className="text-center">
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors" data-testid="forgot-password-link">
                  Password dimenticata?
                </Link>
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Non hai un account? </span>
              <Link to="/register" className="text-primary hover:underline" data-testid="register-link">
                Registrati
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
