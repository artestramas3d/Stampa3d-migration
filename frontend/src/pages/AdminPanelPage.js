import { useState, useEffect } from 'react';
import { getAdminUsers, getAdminStats, getAdminEmailLogs, getAdminNewsletters, sendAdminNewsletter, adminVerifyUser, adminToggleAdmin, adminDeleteUser } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  Users, Mail, Send, Shield, ShieldCheck, Trash2, CheckCircle, 
  XCircle, BarChart3, Newspaper, Link2, Copy
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPanelPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nlSubject, setNlSubject] = useState('');
  const [nlBody, setNlBody] = useState('');
  const [sending, setSending] = useState(false);

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
    } catch (err) {
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
    } catch (err) { toast.error('Errore nell\'eliminazione'); }
  };

  const handleSendNewsletter = async () => {
    if (!nlSubject || !nlBody) { toast.error('Compila oggetto e testo'); return; }
    setSending(true);
    try {
      const res = await sendAdminNewsletter({ subject: nlSubject, body: nlBody });
      toast.success(`Newsletter inviata a ${res.recipients_count} utenti`);
      setNlSubject('');
      setNlBody('');
      loadAll();
    } catch { toast.error('Errore nell\'invio'); }
    finally { setSending(false); }
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
        <p className="text-muted-foreground mt-1">Gestione utenti, newsletter e monitoraggio</p>
      </div>

      {/* Stats */}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-1.5" />Utenti
          </TabsTrigger>
          <TabsTrigger value="newsletter" data-testid="tab-newsletter">
            <Newspaper className="w-4 h-4 mr-1.5" />Newsletter
          </TabsTrigger>
          <TabsTrigger value="emails" data-testid="tab-emails">
            <Mail className="w-4 h-4 mr-1.5" />Email Log
          </TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">
            <Send className="w-4 h-4 mr-1.5" />Inviate
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

        {/* Newsletter Tab */}
        <TabsContent value="newsletter">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Newspaper className="w-4 h-4" /> Invia Newsletter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                La newsletter verrà inviata a tutti gli utenti con email verificata.
                <br />
                <span className="text-yellow-500">Nota: le email sono simulate finché non configuri un servizio email reale.</span>
              </p>
              <div className="space-y-1">
                <Label className="text-xs">Oggetto</Label>
                <Input
                  value={nlSubject}
                  onChange={(e) => setNlSubject(e.target.value)}
                  placeholder="Es. Novità FilamentProfit - Nuove funzionalità!"
                  className="h-9"
                  data-testid="newsletter-subject"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Testo</Label>
                <Textarea
                  value={nlBody}
                  onChange={(e) => setNlBody(e.target.value)}
                  placeholder="Scrivi il contenuto della newsletter..."
                  rows={6}
                  data-testid="newsletter-body"
                />
              </div>
              <Button onClick={handleSendNewsletter} disabled={sending || !nlSubject || !nlBody} data-testid="send-newsletter-btn">
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Invio...' : 'Invia Newsletter'}
              </Button>
            </CardContent>
          </Card>
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

        {/* Sent Newsletters Tab */}
        <TabsContent value="sent">
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Send className="w-4 h-4" /> Newsletter Inviate ({newsletters.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {newsletters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessuna newsletter inviata</p>
              ) : (
                <div className="space-y-3">
                  {newsletters.map(nl => (
                    <div key={nl.id} className="p-3 rounded-md bg-muted/30 border border-border/40">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{nl.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{nl.body}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <Badge variant="outline" className="text-[10px]">{nl.recipients_count} destinatari</Badge>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {nl.created_at ? new Date(nl.created_at).toLocaleString('it-IT') : ''}
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
