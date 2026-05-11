import { useState, useEffect, useRef } from 'react';
import {
  getAdminUsers, getAdminStats, getAdminEmailLogs, getAdminNewsletters,
  sendAdminNewsletter, deleteAdminNewsletter, adminVerifyUser, adminToggleAdmin, adminDeleteUser,
  getSiteSettings, updateSiteSettings,
  getAdminBugReports, getAdminBugScreenshot, updateAdminBugReport,
  getLandingSettings, updateLandingSettings, getContactRequests,
  getProducts, createProduct, updateProduct, deleteProduct,
  getAdminUserProfile
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
  XCircle, Newspaper, Copy, Settings2, Bug, Image, Calendar, Clock, Wrench, X, Globe, MessageSquare, Plus,
  ShoppingBag, Pencil, ImagePlus, Eye, EyeOff, Package, ExternalLink, UserCircle, Code
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

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


function ScriptsTab() {
  const [data, setData] = useState({
    head_scripts: '', body_scripts: '',
    demo_banner_text: '', demo_banner_enabled: false,
    demo_banner_color: '#f97316', demo_banner_link: ''
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSiteSettings().then(s => {
      setData({
        head_scripts: s.head_scripts || '',
        body_scripts: s.body_scripts || '',
        demo_banner_text: s.demo_banner_text || '',
        demo_banner_enabled: s.demo_banner_enabled || false,
        demo_banner_color: s.demo_banner_color || '#f97316',
        demo_banner_link: s.demo_banner_link || ''
      });
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSiteSettings(data);
      toast.success('Impostazioni script salvate');
    } catch { toast.error('Errore salvataggio'); }
    finally { setSaving(false); }
  };

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      {/* Head Scripts */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Code className="w-4 h-4" /> Script Head (Google AdSense, Analytics, ecc.)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Il codice inserito qui verra' aggiunto nel &lt;head&gt; di tutte le pagine pubbliche (landing, demo, listino). Ideale per Google AdSense, Analytics, Meta Pixel, ecc.
          </p>
          <Textarea
            value={data.head_scripts}
            onChange={e => setData(prev => ({...prev, head_scripts: e.target.value}))}
            placeholder='Es. <script async src="https://pagead2.googlesyndication.com/..."></script>'
            rows={5}
            className="font-mono text-xs"
            data-testid="head-scripts-input"
          />
        </CardContent>
      </Card>

      {/* Body Scripts */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Code className="w-4 h-4" /> Script Body
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Codice aggiunto prima della chiusura &lt;/body&gt;. Per chatbot, widget, ecc.
          </p>
          <Textarea
            value={data.body_scripts}
            onChange={e => setData(prev => ({...prev, body_scripts: e.target.value}))}
            placeholder='Es. <script src="https://widget.esempio.com/chat.js"></script>'
            rows={4}
            className="font-mono text-xs"
            data-testid="body-scripts-input"
          />
        </CardContent>
      </Card>

      {/* Demo Banner */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            Banner Pagina Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={data.demo_banner_enabled}
                onCheckedChange={v => setData(prev => ({...prev, demo_banner_enabled: v}))}
                data-testid="demo-banner-toggle"
              />
              <span className="text-sm">{data.demo_banner_enabled ? 'Attivo' : 'Disattivato'}</span>
            </label>
          </div>
          {data.demo_banner_enabled && (
            <div className="space-y-3 p-3 rounded-md bg-muted/30 border border-border/40">
              <div className="space-y-1">
                <Label className="text-xs">Testo del banner</Label>
                <Input
                  value={data.demo_banner_text}
                  onChange={e => setData(prev => ({...prev, demo_banner_text: e.target.value}))}
                  placeholder="Es. Offerta lancio: tutto gratis per 3 mesi!"
                  data-testid="demo-banner-text-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Colore sfondo</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={data.demo_banner_color} onChange={e => setData(prev => ({...prev, demo_banner_color: e.target.value}))} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                    <Input value={data.demo_banner_color} onChange={e => setData(prev => ({...prev, demo_banner_color: e.target.value}))} className="h-8 text-xs font-mono" data-testid="demo-banner-color-input" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Link (opzionale)</Label>
                  <Input
                    value={data.demo_banner_link}
                    onChange={e => setData(prev => ({...prev, demo_banner_link: e.target.value}))}
                    placeholder="https://..."
                    className="h-8 text-xs"
                    data-testid="demo-banner-link-input"
                  />
                </div>
              </div>
              {data.demo_banner_text && (
                <div className="rounded-md p-2.5 text-white text-center text-sm font-semibold" style={{ backgroundColor: data.demo_banner_color }}>
                  Anteprima: {data.demo_banner_text}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} data-testid="save-scripts-btn">
        <Settings2 className="w-4 h-4 mr-2" /> {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
      </Button>
    </div>
  );
}


function NewsletterTab({ newsletters, onReload, users }) {
  const [nlSubject, setNlSubject] = useState('');
  const [nlBody, setNlBody] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [isScheduled, setIsScheduled] = useState(false);
  const [sending, setSending] = useState(false);
  const [isHtml, setIsHtml] = useState(true);
  const [recipientMode, setRecipientMode] = useState('all'); // 'all' or 'selected'
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const editorRef = useRef(null);

  const execCmd = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const getEditorHtml = () => editorRef.current?.innerHTML || '';

  const handleSend = async () => {
    const body = isHtml ? getEditorHtml() : nlBody;
    if (!nlSubject || !body) { toast.error('Compila oggetto e contenuto'); return; }
    setSending(true);
    try {
      let scheduled_at = null;
      if (isScheduled && scheduledDate) {
        scheduled_at = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      }
      const payload = {
        subject: nlSubject,
        body: body,
        is_html: isHtml,
        recipient_ids: recipientMode === 'selected' ? selectedUserIds : [],
        scheduled_at
      };
      const res = await sendAdminNewsletter(payload);
      if (res.status === 'scheduled') {
        toast.success('Newsletter programmata!');
      } else {
        toast.success(`Newsletter inviata a ${res.recipients_count} destinatari`);
      }
      setNlSubject('');
      setNlBody('');
      if (editorRef.current) editorRef.current.innerHTML = '';
      setScheduledDate('');
      setIsScheduled(false);
      setSelectedUserIds([]);
      setRecipientMode('all');
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

  const toggleUser = (userId) => {
    setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const selectAllUsers = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.id));
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const recipientCount = recipientMode === 'all' ? users.length : selectedUserIds.length;

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Newspaper className="w-4 h-4" /> Crea Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject */}
          <div className="space-y-1">
            <Label className="text-xs">Oggetto</Label>
            <Input value={nlSubject} onChange={e => setNlSubject(e.target.value)} placeholder="Es. Novità del mese!" className="h-9" data-testid="newsletter-subject" />
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-2">
              <Users className="w-3 h-3" /> Destinatari
            </Label>
            <div className="flex gap-2">
              <Button
                variant={recipientMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecipientMode('all')}
                data-testid="recipients-all-btn"
              >
                <Users className="w-3 h-3 mr-1" /> Tutti ({users.length})
              </Button>
              <Button
                variant={recipientMode === 'selected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecipientMode('selected')}
                data-testid="recipients-selected-btn"
              >
                <UserCircle className="w-3 h-3 mr-1" /> Seleziona
              </Button>
            </div>
            {recipientMode === 'selected' && (
              <div className="p-3 rounded-md bg-muted/30 border border-border/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Cerca utente..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="h-7 text-xs flex-1"
                    data-testid="recipient-search"
                  />
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAllUsers}>
                    {selectedUserIds.length === users.length ? 'Deseleziona' : 'Seleziona'} tutti
                  </Button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-0.5">
                  {filteredUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-2 p-1.5 rounded-sm hover:bg-muted/50 cursor-pointer text-xs" data-testid={`recipient-user-${u.id}`}>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="rounded"
                      />
                      <span className="font-medium">{u.name || 'N/A'}</span>
                      <span className="text-muted-foreground font-mono">{u.email}</span>
                      {u.email_verified && <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />}
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {selectedUserIds.length} utente/i selezionato/i
                </p>
              </div>
            )}
          </div>

          {/* Editor mode toggle */}
          <div className="flex items-center gap-3">
            <Label className="text-xs">Modalità:</Label>
            <div className="flex gap-1">
              <Button
                variant={isHtml ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsHtml(true)}
                data-testid="mode-html-btn"
              >
                Formattato
              </Button>
              <Button
                variant={!isHtml ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsHtml(false)}
                data-testid="mode-text-btn"
              >
                Testo Semplice
              </Button>
            </div>
          </div>

          {/* Content editor */}
          {isHtml ? (
            <div className="space-y-1">
              <Label className="text-xs">Contenuto</Label>
              {/* Toolbar */}
              <div className="flex flex-wrap gap-1 p-1.5 rounded-t-md border border-border/40 bg-muted/20" data-testid="editor-toolbar">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => execCmd('bold')} title="Grassetto">
                  <span className="font-bold text-xs">B</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => execCmd('italic')} title="Corsivo">
                  <span className="italic text-xs">I</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => execCmd('underline')} title="Sottolineato">
                  <span className="underline text-xs">U</span>
                </Button>
                <div className="w-px h-5 bg-border/40 self-center mx-0.5" />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => execCmd('formatBlock', 'h2')} title="Titolo">
                  <span className="font-bold text-[10px]">H2</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => execCmd('formatBlock', 'h3')} title="Sottotitolo">
                  <span className="font-bold text-[10px]">H3</span>
                </Button>
                <div className="w-px h-5 bg-border/40 self-center mx-0.5" />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => execCmd('insertUnorderedList')} title="Elenco puntato">
                  <span className="text-xs">&#8226;</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => execCmd('insertOrderedList')} title="Elenco numerato">
                  <span className="text-xs">1.</span>
                </Button>
                <div className="w-px h-5 bg-border/40 self-center mx-0.5" />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                  const url = prompt('URL del link:');
                  if (url) execCmd('createLink', url);
                }} title="Inserisci link">
                  <ExternalLink className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => execCmd('removeFormat')} title="Rimuovi formattazione">
                  <X className="w-3 h-3" />
                </Button>
                <div className="w-px h-5 bg-border/40 self-center mx-0.5" />
                <label className="flex items-center gap-1 cursor-pointer" title="Colore testo">
                  <span className="text-xs">A</span>
                  <input type="color" className="w-5 h-5 cursor-pointer border-0 p-0 bg-transparent" defaultValue="#f97316" onChange={(e) => execCmd('foreColor', e.target.value)} />
                </label>
              </div>
              {/* Editable area */}
              <div
                ref={editorRef}
                contentEditable
                data-testid="newsletter-editor"
                className="min-h-[180px] max-h-[350px] overflow-y-auto p-3 rounded-b-md border border-t-0 border-border/40 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                style={{ lineHeight: '1.6' }}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
                  document.execCommand('insertHTML', false, text);
                }}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">Testo</Label>
              <Textarea value={nlBody} onChange={e => setNlBody(e.target.value)} placeholder="Scrivi il contenuto della newsletter..." rows={8} data-testid="newsletter-body" />
            </div>
          )}

          {/* Preview button */}
          {isHtml && (
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} data-testid="preview-btn">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              {showPreview ? 'Nascondi' : 'Mostra'} Anteprima
            </Button>
          )}
          {showPreview && isHtml && (
            <div className="p-4 rounded-md border border-border/40 bg-white text-black">
              <p className="text-xs text-gray-400 mb-2">Anteprima Email:</p>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: getEditorHtml() }}
              />
            </div>
          )}

          {/* Schedule */}
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

          {/* Send button */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSend} disabled={sending || !nlSubject || (isHtml ? false : !nlBody) || (isScheduled && !scheduledDate) || (recipientMode === 'selected' && selectedUserIds.length === 0)} data-testid="send-newsletter-btn">
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Invio...' : isScheduled ? 'Programma Newsletter' : `Invia a ${recipientCount} destinatari`}
            </Button>
            {recipientMode === 'selected' && selectedUserIds.length === 0 && (
              <p className="text-xs text-destructive">Seleziona almeno un destinatario</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Newsletter History */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Send className="w-4 h-4" /> Storico Newsletter ({newsletters.length})
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
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-2">{nl.body?.replace(/<[^>]*>/g, '').substring(0, 120)}</p>
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

function LandingSettingsTab() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState('');

  useEffect(() => {
    getLandingSettings().then(setSettings).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateLandingSettings(settings);
      setSettings(updated);
      toast.success('Impostazioni landing salvate!');
    } catch { toast.error('Errore'); }
    finally { setSaving(false); }
  };

  const addService = () => {
    if (!newService.trim()) return;
    const services = [...(settings.services || []), newService.trim()];
    setSettings({ ...settings, services });
    setNewService('');
  };

  const removeService = (i) => {
    const services = (settings.services || []).filter((_, idx) => idx !== i);
    setSettings({ ...settings, services });
  };

  if (!settings) return <div className="py-8 text-center text-muted-foreground">Caricamento...</div>;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <Globe className="w-4 h-4" /> Impostazioni Landing Page
        </CardTitle>
        <p className="text-xs text-muted-foreground">Configura la pagina pubblica del tuo sito</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Titolo Hero</Label>
            <Input value={settings.hero_title || ''} onChange={e => setSettings({...settings, hero_title: e.target.value})} placeholder="Il tuo slogan..." className="h-9" data-testid="landing-hero-title" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sottotitolo Hero</Label>
            <Input value={settings.hero_subtitle || ''} onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} placeholder="Descrizione breve..." className="h-9" data-testid="landing-hero-subtitle" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Chi Siamo (Testo)</Label>
          <Textarea value={settings.about_text || ''} onChange={e => setSettings({...settings, about_text: e.target.value})} rows={4} placeholder="Racconta la tua storia..." data-testid="landing-about" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Servizi</Label>
          <div className="flex gap-2">
            <Input value={newService} onChange={e => setNewService(e.target.value)} placeholder="Es. Stampa 3D personalizzata" className="h-9" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addService())} data-testid="landing-new-service" />
            <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={addService}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          {(settings.services || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(settings.services || []).map((s, i) => (
                <Badge key={i} variant="outline" className="text-xs py-1 gap-1">
                  {s}
                  <button onClick={() => removeService(i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Email Contatto</Label>
            <Input value={settings.contact_email || ''} onChange={e => setSettings({...settings, contact_email: e.target.value})} className="h-9" data-testid="landing-contact-email" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Telefono</Label>
            <Input value={settings.contact_phone || ''} onChange={e => setSettings({...settings, contact_phone: e.target.value})} className="h-9" data-testid="landing-contact-phone" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Instagram (URL)</Label>
            <Input value={settings.social_instagram || ''} onChange={e => setSettings({...settings, social_instagram: e.target.value})} placeholder="https://instagram.com/..." className="h-9" data-testid="landing-instagram" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Facebook (URL)</Label>
            <Input value={settings.social_facebook || ''} onChange={e => setSettings({...settings, social_facebook: e.target.value})} placeholder="https://facebook.com/..." className="h-9" data-testid="landing-facebook" />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} data-testid="landing-settings-save">
          {saving ? 'Salvataggio...' : 'Salva Impostazioni Landing'}
        </Button>
      </CardContent>
    </Card>
  );
}

function ContactRequestsTab() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    getContactRequests().then(setRequests).catch(() => {});
  }, []);

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Richieste Preventivo ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nessuna richiesta</p>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="p-3 rounded-md bg-muted/30 border border-border/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.email} {r.phone && `• ${r.phone}`}</p>
                    <p className="text-xs mt-1 whitespace-pre-wrap">{r.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {r.created_at ? new Date(r.created_at).toLocaleString('it-IT') : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', materials: '', photo: null, is_public: true });
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setProducts(await getProducts()); } catch { /* ignore */ }
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => { setForm(prev => ({ ...prev, photo: reader.result })); setPhotoPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setForm(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const openNew = () => { setForm({ name: '', description: '', price: '', category: '', materials: '', photo: null, is_public: true }); setEditing(null); setPhotoPreview(null); setDialogOpen(true); };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description, price: p.price, category: p.category, materials: p.materials, photo: p.photo || null, is_public: p.is_public });
    setPhotoPreview(p.photo || null);
    setEditing(p.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Inserisci nome e prezzo'); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editing) { await updateProduct(editing, payload); toast.success('Prodotto aggiornato'); }
      else { await createProduct(payload); toast.success('Prodotto aggiunto'); }
      setDialogOpen(false);
      load();
    } catch { toast.error('Errore'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo prodotto?')) return;
    try { await deleteProduct(id); toast.success('Eliminato'); load(); } catch { toast.error('Errore'); }
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">I prodotti pubblici appaiono nel listino online e nella landing page.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open('/listino', '_blank')} data-testid="view-listino-btn">
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Vedi Listino
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew} data-testid="add-product-btn">
                <Plus className="w-4 h-4 mr-1.5" />Aggiungi Prodotto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">{editing ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome *</Label>
                    <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-9" data-testid="product-name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Prezzo (EUR) *</Label>
                    <Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="h-9" data-testid="product-price" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Categoria</Label>
                    <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} list="admin-categories" className="h-9" data-testid="product-category" />
                    <datalist id="admin-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Materiali</Label>
                    <Input value={form.materials} onChange={e => setForm({...form, materials: e.target.value})} placeholder="PLA, PETG..." className="h-9" data-testid="product-materials" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descrizione</Label>
                  <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} data-testid="product-description" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Foto (max 5MB)</Label>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => fileRef.current?.click()}>
                      <ImagePlus className="w-3.5 h-3.5 mr-1.5" />Carica Foto
                    </Button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                    {photoPreview && (
                      <div className="relative">
                        <img src={photoPreview} alt="preview" className="h-16 rounded border border-border/40 object-cover" />
                        <button onClick={removePhoto} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"><X className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
                  <Switch checked={form.is_public} onCheckedChange={v => setForm({...form, is_public: v})} data-testid="product-public-toggle" />
                  <div>
                    <p className="text-sm font-medium">{form.is_public ? 'Visibile nel Listino' : 'Nascosto'}</p>
                    <p className="text-[10px] text-muted-foreground">I prodotti pubblici appaiono nel listino online</p>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full" data-testid="save-product-btn">
                  {saving ? 'Salvataggio...' : editing ? 'Aggiorna' : 'Aggiungi'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="py-12 text-center">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nessun prodotto. Aggiungi il primo!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <Card key={p.id} className="border-border/40 overflow-hidden group" data-testid={`product-card-${p.id}`}>
              {p.photo ? (
                <div className="aspect-square bg-muted/30 overflow-hidden">
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="aspect-square bg-muted/20 flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground/20" />
                </div>
              )}
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{p.name}</h3>
                    {p.category && <Badge variant="outline" className="text-[10px] mt-1">{p.category}</Badge>}
                  </div>
                  <p className="font-heading font-bold text-primary shrink-0">{parseFloat(p.price).toFixed(2)}</p>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                  <Badge className={p.is_public ? 'bg-emerald-500/20 text-emerald-500 text-[10px]' : 'bg-muted text-muted-foreground text-[10px]'}>
                    {p.is_public ? <><Eye className="w-2.5 h-2.5 mr-1" />Pubblico</> : <><EyeOff className="w-2.5 h-2.5 mr-1" />Nascosto</>}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)} data-testid={`edit-product-${p.id}`}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)} data-testid={`delete-product-${p.id}`}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
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

  const [viewingUser, setViewingUser] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const viewUserProfile = async (userId) => {
    setProfileLoading(true);
    setViewingUser(userId);
    try {
      const data = await getAdminUserProfile(userId);
      setUserProfileData(data);
    } catch { toast.error('Errore caricamento profilo'); }
    finally { setProfileLoading(false); }
  };

  const closeProfile = () => { setViewingUser(null); setUserProfileData(null); };

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
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-9">
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-1.5 hidden sm:inline" />Utenti
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            <ShoppingBag className="w-4 h-4 mr-1.5 hidden sm:inline" />Prodotti
          </TabsTrigger>
          <TabsTrigger value="landing" data-testid="tab-landing">
            <Globe className="w-4 h-4 mr-1.5 hidden sm:inline" />Landing
          </TabsTrigger>
          <TabsTrigger value="newsletter" data-testid="tab-newsletter">
            <Newspaper className="w-4 h-4 mr-1.5 hidden sm:inline" />Newsletter
          </TabsTrigger>
          <TabsTrigger value="bugs" data-testid="tab-bugs">
            <Bug className="w-4 h-4 mr-1.5 hidden sm:inline" />Segnalazioni
          </TabsTrigger>
          <TabsTrigger value="contacts" data-testid="tab-contacts">
            <MessageSquare className="w-4 h-4 mr-1.5 hidden sm:inline" />Preventivi
          </TabsTrigger>
          <TabsTrigger value="emails" data-testid="tab-emails">
            <Mail className="w-4 h-4 mr-1.5 hidden sm:inline" />Email Log
          </TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">
            <Send className="w-4 h-4 mr-1.5 hidden sm:inline" />Inviate
          </TabsTrigger>
          <TabsTrigger value="scripts" data-testid="tab-scripts">
            <Code className="w-4 h-4 mr-1.5 hidden sm:inline" />Codici & Script
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
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => viewUserProfile(user.id)} data-testid={`view-profile-${user.id}`}>
                              <UserCircle className="w-3 h-3 mr-1" />Profilo
                            </Button>
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

          {/* User Profile Modal */}
          {viewingUser && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeProfile}>
              <div className="bg-card rounded-xl border border-border/40 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} data-testid="user-profile-modal">
                <div className="flex items-center justify-between p-4 border-b border-border/40">
                  <h3 className="font-heading font-bold text-lg">Profilo Utente</h3>
                  <button onClick={closeProfile} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>
                {profileLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Caricamento...</div>
                ) : userProfileData && (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{userProfileData.user.name || 'Senza nome'}</p>
                        <p className="text-sm text-muted-foreground">{userProfileData.user.email}</p>
                        <div className="flex gap-2 mt-1">
                          {userProfileData.user.email_verified && <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">Verificato</Badge>}
                          {userProfileData.user.is_admin && <Badge className="bg-primary/20 text-primary text-[10px]">Admin</Badge>}
                          <Badge variant="outline" className="text-[10px]">Lingua: {userProfileData.user.language?.toUpperCase()}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-3 rounded-md bg-muted/30 text-center">
                        <p className="text-lg font-bold font-mono">{userProfileData.stats.filaments}</p>
                        <p className="text-[10px] text-muted-foreground">Filamenti</p>
                      </div>
                      <div className="p-3 rounded-md bg-muted/30 text-center">
                        <p className="text-lg font-bold font-mono">{userProfileData.stats.sales}</p>
                        <p className="text-[10px] text-muted-foreground">Vendite</p>
                      </div>
                      <div className="p-3 rounded-md bg-muted/30 text-center">
                        <p className="text-lg font-bold font-mono">{userProfileData.stats.purchases}</p>
                        <p className="text-[10px] text-muted-foreground">Acquisti</p>
                      </div>
                      <div className="p-3 rounded-md bg-muted/30 text-center">
                        <p className="text-lg font-bold font-mono">{userProfileData.stats.printers}</p>
                        <p className="text-[10px] text-muted-foreground">Stampanti</p>
                      </div>
                    </div>
                    {userProfileData.recent_sales.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Ultime Vendite</p>
                        <div className="space-y-1">
                          {userProfileData.recent_sales.map(s => (
                            <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/20">
                              <span className="font-medium">{s.product_name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-mono">{s.sale_price?.toFixed(2)}</span>
                                <span className="font-mono text-emerald-500">+{s.profit?.toFixed(2)}</span>
                                {s.is_paid ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-yellow-500" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {userProfileData.filaments.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Filamenti ({userProfileData.filaments.length})</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {userProfileData.filaments.map(f => (
                            <div key={f.id} className="flex items-center gap-2 p-2 rounded bg-muted/20 text-xs">
                              <div className="w-4 h-4 rounded-full border border-border/60 shrink-0" style={{ background: f.color_hex2 ? `linear-gradient(135deg, ${f.color_hex} 50%, ${f.color_hex2} 50%)` : f.color_hex }} />
                              <div className="min-w-0">
                                <p className="font-medium truncate">{f.material_type} {f.color}</p>
                                <p className="text-[10px] text-muted-foreground">{f.brand} - {Math.round(f.remaining_grams)}g</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground text-center pt-2">
                      Registrato: {userProfileData.user.created_at ? new Date(userProfileData.user.created_at).toLocaleString('it-IT') : '-'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>

        {/* Site Settings Tab */}
        <TabsContent value="settings">
          <SiteSettingsTab />
        </TabsContent>

        {/* Landing Settings Tab */}
        <TabsContent value="landing">
          <LandingSettingsTab />
        </TabsContent>

        {/* Newsletter Tab */}
        <TabsContent value="newsletter">
          <NewsletterTab newsletters={newsletters} onReload={loadAll} users={users} />
        </TabsContent>

        {/* Bug Reports Tab */}
        <TabsContent value="bugs">
          <BugReportsTab />
        </TabsContent>

        {/* Contact Requests Tab */}
        <TabsContent value="contacts">
          <ContactRequestsTab />
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

        {/* Scripts Tab */}
        <TabsContent value="scripts">
          <ScriptsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
