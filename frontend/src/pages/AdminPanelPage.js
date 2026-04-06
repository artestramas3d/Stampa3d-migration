import { useState, useEffect } from 'react';
import {
  getAdminUsers, getAdminStats, getAdminEmailLogs, getAdminNewsletters,
  sendAdminNewsletter, deleteAdminNewsletter, adminVerifyUser, adminToggleAdmin, adminDeleteUser,
  getSiteSettings, updateSiteSettings,
  getAdminBugReports, getAdminBugScreenshot, updateAdminBugReport
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Users, Mail, Send, Shield, ShieldCheck, Trash2, CheckCircle,
  XCircle, Newspaper, Copy, Settings2, Bug, Image, Calendar, Clock, Wrench, X
} from 'lucide-react';
import { toast } from 'sonner';

function SiteSettingsTab() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewColor, setPreviewColor] = useState('#f97316');
  const [previewAccent, setPreviewAccent] = useState('#2563eb');

  useEffect(() => {
    getSiteSettings().then(s => {
      setSettings(s);
      setPreviewColor(s.primary_color || '#f97316');
      setPreviewAccent(s.accent_color || '#2563eb');
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateSiteSettings({
        brand_name: settings.brand_name,
        subtitle: settings.subtitle,
        primary_color: previewColor,
        accent_color: previewAccent
      });
      setSettings(updated);
      toast.success('Impostazioni salvate! Ricarica la pagina per vedere le modifiche ai colori.');
    } catch { toast.error('Errore nel salvataggio'); }
    finally { setSaving(false); }
  };

  if (!settings) return <div className="py-8 text-center text-muted-foreground">Caricamento...</div>;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <Settings2 className="w-4 h-4" /> Impostazioni Sito
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Nome Brand</Label>
            <Input value={settings.brand_name} onChange={e => setSettings({...settings, brand_name: e.target.value})} className="h-9" data-testid="site-brand-name" />
            <p className="text-[10px] text-muted-foreground">Appare nella sidebar e nelle pagine di login</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sottotitolo</Label>
            <Input value={settings.subtitle} onChange={e => setSettings({...settings, subtitle: e.target.value})} className="h-9" data-testid="site-subtitle" />
            <p className="text-[10px] text-muted-foreground">Sotto il nome brand nella sidebar</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Colore Primario</Label>
            <div className="flex items-center gap-3">
              <input type="color" value={previewColor} onChange={e => setPreviewColor(e.target.value)} className="w-10 h-9 rounded border border-border cursor-pointer" data-testid="site-primary-color" />
              <Input value={previewColor} onChange={e => setPreviewColor(e.target.value)} className="h-9 font-mono text-sm" />
              <div className="w-20 h-9 rounded" style={{ backgroundColor: previewColor }} />
            </div>
            <p className="text-[10px] text-muted-foreground">Colore dei pulsanti e elementi principali</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Colore Accento</Label>
            <div className="flex items-center gap-3">
              <input type="color" value={previewAccent} onChange={e => setPreviewAccent(e.target.value)} className="w-10 h-9 rounded border border-border cursor-pointer" data-testid="site-accent-color" />
              <Input value={previewAccent} onChange={e => setPreviewAccent(e.target.value)} className="h-9 font-mono text-sm" />
              <div className="w-20 h-9 rounded" style={{ backgroundColor: previewAccent }} />
            </div>
            <p className="text-[10px] text-muted-foreground">Colore secondario per grafici e accenti</p>
          </div>
        </div>
        <div className="p-3 rounded-md bg-muted/30 border border-border/40">
          <p className="text-xs font-medium mb-2">Anteprima</p>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded text-white text-sm font-medium" style={{ backgroundColor: previewColor }}>
              {settings.brand_name || 'Brand'}
            </div>
            <div className="px-4 py-2 rounded text-white text-sm font-medium" style={{ backgroundColor: previewAccent }}>
              Accento
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} data-testid="site-settings-save">
          {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
        </Button>
      </CardContent>
    </Card>
  );
}

function NewsletterTab({ newsletters, onReload }) {
  const [nlSubject, setNlSubject] = useState('');
  const [nlBody, setNlBody] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [isScheduled, setIsScheduled] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!nlSubject || !nlBody) { toast.error('Compila oggetto e testo'); return; }
    setSending(true);
    try {
      let scheduled_at = null;
      if (isScheduled && scheduledDate) {
        scheduled_at = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      }
      const res = await sendAdminNewsletter({ subject: nlSubject, body: nlBody, scheduled_at });
      if (res.status === 'scheduled') {
        toast.success('Newsletter programmata!');
      } else {
        toast.success(`Newsletter inviata a ${res.recipients_count} utenti`);
      }
      setNlSubject('');
      setNlBody('');
      setScheduledDate('');
      setIsScheduled(false);
      onReload();
    } catch { toast.error("Errore nell'invio"); }
    finally { setSending(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questa newsletter?')) return;
    try {
      await deleteAdminNewsletter(id);
      toast.success('Newsletter eliminata');
      onReload();
    } catch { toast.error('Errore'); }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Newspaper className="w-4 h-4" /> Crea Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            La newsletter verrà inviata a tutti gli utenti con email verificata via SMTP.
          </p>
          <div className="space-y-1">
            <Label className="text-xs">Oggetto</Label>
            <Input value={nlSubject} onChange={e => setNlSubject(e.target.value)} placeholder="Es. Novità del mese!" className="h-9" data-testid="newsletter-subject" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Testo</Label>
            <Textarea value={nlBody} onChange={e => setNlBody(e.target.value)} placeholder="Scrivi il contenuto della newsletter..." rows={6} data-testid="newsletter-body" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} className="rounded" data-testid="newsletter-schedule-toggle" />
              <span className="text-sm"><Calendar className="w-3.5 h-3.5 inline mr-1" />Programma invio</span>
            </label>
          </div>
          {isScheduled && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-muted/30 border border-border/40">
              <div className="space-y-1">
                <Label className="text-xs">Data</Label>
                <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="h-9" data-testid="newsletter-schedule-date" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ora</Label>
                <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="h-9" data-testid="newsletter-schedule-time" />
              </div>
            </div>
          )}
          <Button onClick={handleSend} disabled={sending || !nlSubject || !nlBody || (isScheduled && !scheduledDate)} data-testid="send-newsletter-btn">
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Invio...' : isScheduled ? 'Programma Newsletter' : 'Invia Subito'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Send className="w-4 h-4" /> Newsletter ({newsletters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {newsletters.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nessuna newsletter</p>
          ) : (
            <div className="space-y-3">
              {newsletters.map(nl => (
                <div key={nl.id} className="p-3 rounded-md bg-muted/30 border border-border/40" data-testid={`newsletter-${nl.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{nl.subject}</p>
                        {nl.status === 'scheduled' ? (
                          <Badge className="bg-yellow-500/20 text-yellow-500 text-[10px]">
                            <Clock className="w-2.5 h-2.5 mr-1" />Programmata
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">
                            <CheckCircle className="w-2.5 h-2.5 mr-1" />Inviata
                          </Badge>
                        )}
                        {nl.recipients_count > 0 && (
                          <Badge variant="outline" className="text-[10px]">{nl.recipients_count} destinatari</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-2">{nl.body}</p>
                      {nl.scheduled_at && nl.status === 'scheduled' && (
                        <p className="text-xs text-yellow-500 mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Invio: {new Date(nl.scheduled_at).toLocaleString('it-IT')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[10px] text-muted-foreground">
                        {nl.created_at ? new Date(nl.created_at).toLocaleDateString('it-IT') : ''}
                      </span>
                      {nl.status === 'scheduled' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(nl.id)} data-testid={`delete-nl-${nl.id}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BugReportsTab() {
  const [reports, setReports] = useState([]);
  const [screenshotModal, setScreenshotModal] = useState(null);
  const [editingNote, setEditingNote] = useState({});

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try { setReports(await getAdminBugReports()); } catch { /* ignore */ }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateAdminBugReport(id, { status, admin_note: editingNote[id] || undefined });
      toast.success('Stato aggiornato');
      loadReports();
    } catch { toast.error('Errore'); }
  };

  const handleSaveNote = async (id) => {
    try {
      const report = reports.find(r => r.id === id);
      await updateAdminBugReport(id, { status: report.status, admin_note: editingNote[id] || '' });
      toast.success('Nota salvata');
      loadReports();
    } catch { toast.error('Errore'); }
  };

  const viewScreenshot = async (id) => {
    try {
      const data = await getAdminBugScreenshot(id);
      setScreenshotModal(data.screenshot);
    } catch { toast.error('Screenshot non disponibile'); }
  };

  const PRIORITY_COLOR = { alta: 'text-red-500 border-red-500/50', media: 'text-yellow-500 border-yellow-500/50', bassa: 'text-muted-foreground' };
  const STATUS_COLOR = {
    aperto: 'bg-yellow-500/20 text-yellow-500',
    in_lavorazione: 'bg-blue-500/20 text-blue-500',
    risolto: 'bg-emerald-500/20 text-emerald-500'
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <Bug className="w-4 h-4" /> Segnalazioni ({reports.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {screenshotModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setScreenshotModal(null)}>
            <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <button onClick={() => setScreenshotModal(null)} className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center z-10">
                <X className="w-4 h-4" />
              </button>
              <img src={screenshotModal} alt="screenshot" className="max-w-full max-h-[85vh] rounded-lg" />
            </div>
          </div>
        )}
        {reports.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nessuna segnalazione</p>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="p-3 rounded-md bg-muted/30 border border-border/40" data-testid={`admin-bug-${r.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{r.title}</p>
                      <Badge className={`${STATUS_COLOR[r.status] || ''} text-[10px]`}>{r.status}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLOR[r.priority] || ''}`}>{r.priority}</Badge>
                      {r.has_screenshot && (
                        <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1.5" onClick={() => viewScreenshot(r.id)}>
                          <Image className="w-3 h-3 mr-1" />Vedi
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Da: {r.user_name || r.user_email} - {r.created_at ? new Date(r.created_at).toLocaleString('it-IT') : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{r.description}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Select value={r.status} onValueChange={v => handleStatusChange(r.id, v)}>
                        <SelectTrigger className="h-7 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aperto">Aperto</SelectItem>
                          <SelectItem value="in_lavorazione">In Lavorazione</SelectItem>
                          <SelectItem value="risolto">Risolto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-2 flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="text-[10px]">Nota Admin</Label>
                        <Input
                          value={editingNote[r.id] !== undefined ? editingNote[r.id] : (r.admin_note || '')}
                          onChange={e => setEditingNote({...editingNote, [r.id]: e.target.value})}
                          placeholder="Risposta all'utente..."
                          className="h-7 text-xs"
                        />
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSaveNote(r.id)}>Salva</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPanelPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [usersData, statsData, logsData, nlData] = await Promise.all([
        getAdminUsers(), getAdminStats(), getAdminEmailLogs(), getAdminNewsletters()
      ]);
      setUsers(usersData);
      setStats(statsData);
      setEmailLogs(logsData);
      setNewsletters(nlData);
    } catch {
      toast.error('Errore nel caricamento dati admin');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId) => {
    try {
      await adminVerifyUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, email_verified: true } : u));
      toast.success('Utente verificato');
    } catch { toast.error('Errore'); }
  };

  const handleToggleAdmin = async (userId) => {
    try {
      const res = await adminToggleAdmin(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: res.is_admin } : u));
      toast.success(res.message);
    } catch { toast.error('Errore'); }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Eliminare l'utente ${email} e tutti i suoi dati?`)) return;
    try {
      await adminDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('Utente eliminato');
    } catch { toast.error("Errore nell'eliminazione"); }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiato');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Caricamento...</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-panel-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Pannello di Controllo</h1>
        <p className="text-muted-foreground mt-1">Gestione utenti, newsletter, impostazioni e segnalazioni</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="stat-card">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Utenti</p>
              <p className="text-2xl font-heading font-bold font-mono">{stats.total_users}</p>
            </CardContent>
          </Card>
          <Card className="stat-card border-emerald-500/30">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Verificati</p>
              <p className="text-2xl font-heading font-bold font-mono text-emerald-500">{stats.verified_users}</p>
            </CardContent>
          </Card>
          <Card className="stat-card border-yellow-500/30">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">In Attesa</p>
              <p className="text-2xl font-heading font-bold font-mono text-yellow-500">{stats.unverified_users}</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vendite</p>
              <p className="text-2xl font-heading font-bold font-mono">{stats.total_sales}</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Newsletter</p>
              <p className="text-2xl font-heading font-bold font-mono">{stats.total_newsletters}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-1.5 hidden sm:inline" />Utenti
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings2 className="w-4 h-4 mr-1.5 hidden sm:inline" />Sito
          </TabsTrigger>
          <TabsTrigger value="newsletter" data-testid="tab-newsletter">
            <Newspaper className="w-4 h-4 mr-1.5 hidden sm:inline" />Newsletter
          </TabsTrigger>
          <TabsTrigger value="bugs" data-testid="tab-bugs">
            <Bug className="w-4 h-4 mr-1.5 hidden sm:inline" />Segnalazioni
          </TabsTrigger>
          <TabsTrigger value="emails" data-testid="tab-emails">
            <Mail className="w-4 h-4 mr-1.5 hidden sm:inline" />Email Log
          </TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">
            <Send className="w-4 h-4 mr-1.5 hidden sm:inline" />Inviate
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Users className="w-4 h-4" /> Utenti Registrati ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead>Registrato</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                        <TableCell className="font-medium">{user.name || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{user.email}</TableCell>
                        <TableCell>
                          {user.email_verified ? (
                            <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">
                              <CheckCircle className="w-2.5 h-2.5 mr-1" />Verificato
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 text-[10px]">
                              <XCircle className="w-2.5 h-2.5 mr-1" />Non verificato
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.is_admin ? (
                            <Badge className="bg-primary/20 text-primary text-[10px]">
                              <ShieldCheck className="w-2.5 h-2.5 mr-1" />Admin
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Utente</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('it-IT') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {!user.email_verified && (
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-500" onClick={() => handleVerify(user.id)} data-testid={`verify-user-${user.id}`}>
                                <CheckCircle className="w-3 h-3 mr-1" />Verifica
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleToggleAdmin(user.id)} data-testid={`toggle-admin-${user.id}`}>
                              <Shield className="w-3 h-3 mr-1" />{user.is_admin ? 'Rimuovi Admin' : 'Admin'}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteUser(user.id, user.email)} data-testid={`delete-user-${user.id}`}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Settings Tab */}
        <TabsContent value="settings">
          <SiteSettingsTab />
        </TabsContent>

        {/* Newsletter Tab */}
        <TabsContent value="newsletter">
          <NewsletterTab newsletters={newsletters} onReload={loadAll} />
        </TabsContent>

        {/* Bug Reports Tab */}
        <TabsContent value="bugs">
          <BugReportsTab />
        </TabsContent>

        {/* Email Logs Tab */}
        <TabsContent value="emails">
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Mail className="w-4 h-4" /> Log Email ({emailLogs.length})
              </CardTitle>
              <p className="text-xs text-muted-foreground">Link di verifica e recupero password generati dal sistema</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Destinatario</TableHead>
                      <TableHead>Oggetto</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nessun log email</TableCell>
                      </TableRow>
                    ) : emailLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {log.type === 'verification' ? 'Verifica' : log.type === 'password_reset' ? 'Recovery' : log.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.to}</TableCell>
                        <TableCell className="text-sm">{log.subject}</TableCell>
                        <TableCell>
                          {log.link && (
                            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => copyLink(log.link)}>
                              <Copy className="w-3 h-3 mr-1" />Copia Link
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.created_at ? new Date(log.created_at).toLocaleString('it-IT') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent Newsletters Tab - merged into Newsletter tab but keep for backward compat */}
        <TabsContent value="sent">
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Send className="w-4 h-4" /> Newsletter Inviate ({newsletters.filter(n => n.status === 'sent').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {newsletters.filter(n => n.status === 'sent').length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessuna newsletter inviata</p>
              ) : (
                <div className="space-y-3">
                  {newsletters.filter(n => n.status === 'sent').map(nl => (
                    <div key={nl.id} className="p-3 rounded-md bg-muted/30 border border-border/40">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{nl.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{nl.body}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <Badge variant="outline" className="text-[10px]">{nl.recipients_count} destinatari</Badge>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {(nl.sent_at || nl.created_at) ? new Date(nl.sent_at || nl.created_at).toLocaleString('it-IT') : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
