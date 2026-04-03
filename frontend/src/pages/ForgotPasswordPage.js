import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, formatApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Printer, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="forgot-password-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-primary/10 mb-4">
            <Printer className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">FilamentProfit</h1>
        </div>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="font-heading">Recupera Password</CardTitle>
            <CardDescription>
              {sent ? 'Controlla la tua email' : 'Inserisci la tua email per ricevere il link di recupero'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-sm text-center">
                  <Mail className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-sm">Se l'email è registrata, riceverai un link per reimpostare la password.</p>
                  <p className="text-xs text-muted-foreground mt-2">Controlla anche la cartella spam.</p>
                </div>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Torna al login
                  </Button>
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@esempio.com"
                    required
                    className="font-mono"
                    data-testid="forgot-email"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="forgot-submit">
                  {loading ? 'Invio...' : 'Invia Link di Recupero'}
                </Button>
                <Link to="/login" className="block text-center text-sm text-primary hover:underline">
                  <ArrowLeft className="w-3 h-3 inline mr-1" />
                  Torna al login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
