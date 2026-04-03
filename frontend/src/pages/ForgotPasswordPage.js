import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { forgotPassword, formatApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { t } = useLang();
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
          <img src="/logo.png" alt="Artes&Tramas" className="w-20 h-20 mx-auto rounded-sm object-contain mb-4" />
          <h1 className="text-3xl font-heading font-bold tracking-tight">Artes&Tramas</h1>
        </div>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="font-heading">{t('forgot_title')}</CardTitle>
            <CardDescription>{sent ? t('forgot_sent') : t('forgot_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-sm text-center">
                  <Mail className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-sm">{t('forgot_sent_msg')}</p>
                  <p className="text-xs text-muted-foreground mt-2">{t('forgot_check_spam')}</p>
                </div>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />{t('back_to_login')}
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">{error}</div>
                )}
                <div className="space-y-2">
                  <Label>{t('email')}</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="font-mono" data-testid="forgot-email" />
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="forgot-submit">
                  {loading ? t('forgot_sending') : t('forgot_submit')}
                </Button>
                <Link to="/login" className="block text-center text-sm text-primary hover:underline">
                  <ArrowLeft className="w-3 h-3 inline mr-1" />{t('back_to_login')}
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
