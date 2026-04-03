import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { updateProfile, changePassword, resendVerification, formatApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { User, Lock, Globe, CheckCircle, XCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';

const LANGUAGES = [
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const { t, lang, setLang } = useLang();
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [resending, setResending] = useState(false);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ name });
      await checkAuth();
      toast.success(t('profile_updated'));
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error(t('passwords_no_match')); return; }
    if (newPw.length < 6) { toast.error(t('password_min')); return; }
    setSavingPw(true);
    try {
      await changePassword({ current_password: currentPw, new_password: newPw });
      toast.success(t('password_changed'));
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSavingPw(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      toast.success(t('resend_sent'));
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fadeIn" data-testid="profile-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">{t('profile_title')}</h1>
        <p className="text-muted-foreground mt-1">{t('profile_desc')}</p>
      </div>

      {/* Account Info */}
      <Card className="border-border/40" data-testid="profile-info-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <User className="w-4 h-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">{t('email')}</Label>
            <div className="flex items-center gap-2">
              <Input value={user?.email || ''} disabled className="h-9 font-mono text-sm" />
              {user?.email_verified ? (
                <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px] shrink-0">
                  <CheckCircle className="w-2.5 h-2.5 mr-1" />{t('verified')}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 text-[10px] shrink-0">
                  <XCircle className="w-2.5 h-2.5 mr-1" />{t('email_not_verified')}
                </Badge>
              )}
            </div>
          </div>

          {!user?.email_verified && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-sm">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">{t('email_not_verified_msg')}</p>
              <Button size="sm" variant="outline" onClick={handleResend} disabled={resending} data-testid="resend-verification-btn">
                <Mail className="w-3 h-3 mr-1" />
                {resending ? '...' : t('resend_email')}
              </Button>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">{t('name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" data-testid="profile-name-input" />
          </div>
          <Button onClick={handleProfileSave} disabled={savingProfile} size="sm" data-testid="save-profile-btn">
            {savingProfile ? t('saving') : t('save_changes')}
          </Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="border-border/40" data-testid="profile-lang-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Globe className="w-4 h-4" /> {t('language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-full sm:w-64 h-9" data-testid="lang-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => (
                <SelectItem key={l.value} value={l.value}>
                  <span className="mr-2">{l.flag}</span> {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-border/40" data-testid="profile-password-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Lock className="w-4 h-4" /> {t('change_password')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('current_password')}</Label>
              <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required className="h-9" data-testid="current-pw-input" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('new_password')}</Label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} className="h-9" data-testid="new-pw-input" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('confirm_password')}</Label>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required className="h-9" data-testid="confirm-pw-input" />
            </div>
            <Button type="submit" disabled={savingPw} size="sm" data-testid="change-pw-btn">
              {savingPw ? t('saving') : t('change_password')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
