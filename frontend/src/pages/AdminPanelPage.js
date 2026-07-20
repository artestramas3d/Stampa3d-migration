import { useState, useEffect, useRef } from 'react';
import {
  getAdminUsers, getAdminStats, getAdminEmailLogs, getAdminNewsletters,
  sendAdminNewsletter, deleteAdminNewsletter, adminVerifyUser, adminToggleAdmin, adminDeleteUser,
  getSiteSettings, updateSiteSettings, getDemoStats,
  getAdminBugReports, getAdminBugScreenshot, updateAdminBugReport,
  getLandingSettings, updateLandingSettings, getContactRequests,
  getProducts, createProduct, updateProduct, deleteProduct,
  getAdminUserProfile,
  getAdminInquiries, updateAdminInquiry, deleteAdminInquiry, getAdminProductStats,
  getAdminPageStats,
  getAdminAffiliateLinks, createAffiliateLink, updateAffiliateLink, deleteAffiliateLink, getAdminAffiliateStats
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { CsvInput } from '../components/CsvInput';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Users, Mail, Send, Shield, ShieldCheck, Trash2, CheckCircle,
  XCircle, Newspaper, Copy, Settings2, Bug, Image, Calendar, Clock, Wrench, X, Globe, MessageSquare, Plus,
  ShoppingBag, Pencil, ImagePlus, Eye, EyeOff, Package, ExternalLink, UserCircle, Code,
  Inbox, Phone, Palette, Ruler, Sparkles, FileText, BarChart3, TrendingUp, LineChart, Link2, MousePointerClick, Save, Check, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../components/ui/switch';
import { Checkbox } from '../components/ui/checkbox';
import { downloadHtmlAsPdf } from '../lib/pdfExport';
import { compressImageBase64 } from '../lib/imageCompress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

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
      toast.success('Impostazioni salvate');
    } catch { toast.error('Errore salvataggio'); }
    finally { setSaving(false); }
  };

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      {/* Demo/Listino Banner */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            Banner Pagina Demo e Listino
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

      {/* Script esterni */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Code className="w-4 h-4" /> Script Esterni (AdSense, Analytics)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Codice aggiunto nel &lt;head&gt; delle pagine pubbliche (landing, demo, listino).
          </p>
          <Textarea
            value={data.head_scripts}
            onChange={e => setData(prev => ({...prev, head_scripts: e.target.value}))}
            placeholder='Es. <script async src="https://pagead2.googlesyndication.com/..."></script>'
            rows={4}
            className="font-mono text-xs"
            data-testid="head-scripts-input"
          />
          <p className="text-xs text-muted-foreground">
            Codice aggiunto prima della chiusura &lt;/body&gt;.
          </p>
          <Textarea
            value={data.body_scripts}
            onChange={e => setData(prev => ({...prev, body_scripts: e.target.value}))}
            placeholder='Es. <script src="https://widget.esempio.com/chat.js"></script>'
            rows={3}
            className="font-mono text-xs"
            data-testid="body-scripts-input"
          />
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
  const initialForm = { name: '', description: '', description_long: '', price: '', category: '', materials: '', photos: [], is_public: true, color_options: [], material_options: [], size_options: [], is_customizable: false, custom_field_label: '', show_price: true, price_from: false };
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  // Multi-selezione per esportazione Listino PDF
  const [selectedIds, setSelectedIds] = useState([]);
  const [exportDialog, setExportDialog] = useState(false);
  const [showPricesInPdf, setShowPricesInPdf] = useState(true);
  const [showAllPhotosInPdf, setShowAllPhotosInPdf] = useState(true);
  const [exportTitle, setExportTitle] = useState('Listino Prodotti');
  const [exporting, setExporting] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const clearSelection = () => setSelectedIds([]);
  const selectAll = () => setSelectedIds(products.map(p => p.id));

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setProducts(await getProducts()); } catch { /* ignore */ }
  };

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (form.photos.length + files.length > 5) { toast.error('Massimo 5 foto'); return; }
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: max 5MB`); return; }
      const reader = new FileReader();
      reader.onload = () => setForm(prev => ({ ...prev, photos: [...prev.photos, reader.result] }));
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (index) => setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));

  // CSV string -> array (es. "Rosso, Blu, Verde" -> ["Rosso","Blu","Verde"])
  const parseCsv = (s) => (s || '').split(',').map(x => x.trim()).filter(Boolean);
  const formatCsv = (arr) => (arr || []).join(', ');

  // Genera HTML listino PDF con prodotti selezionati raggruppati per categoria
  const buildListinoHtml = async () => {
    const selected = products.filter(p => selectedIds.includes(p.id));

    // Precomprimo tutte le foto in parallelo (main + extra) per non ripetere lavoro
    // main: 512px @ q=0.8 · extra thumb: 128px @ q=0.7
    const compressed = new Map(); // dataUrlOriginale -> dataUrlCompresso
    const compressTasks = [];
    selected.forEach(p => {
      const all = (p.photos && p.photos.length) ? p.photos : (p.photo ? [p.photo] : []);
      all.forEach((ph, idx) => {
        if (!ph || compressed.has(ph)) return;
        const opts = idx === 0 ? { maxWidth: 512, quality: 0.8 } : { maxWidth: 128, quality: 0.7 };
        compressTasks.push(
          compressImageBase64(ph, opts).then(out => compressed.set(ph, out))
        );
      });
    });
    await Promise.all(compressTasks);
    const c = (ph) => compressed.get(ph) || ph;

    const grouped = {};
    selected.forEach(p => {
      const cat = p.category || 'Senza categoria';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });
    const catNames = Object.keys(grouped).sort();
    const now = new Date();
    const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const rowsHtml = catNames.map(cat => {
      const items = grouped[cat].map(p => {
        const allPhotos = (p.photos && p.photos.length) ? p.photos : (p.photo ? [p.photo] : []);
        const mainPhoto = allPhotos[0] ? c(allPhotos[0]) : '';
        const extraPhotos = showAllPhotosInPdf ? allPhotos.slice(1).map(c) : []; // dalla 2a in poi, solo se toggle attivo
        const colors = (p.color_options || []).join(', ');
        const sizes = (p.size_options || []).join(', ');
        const desc = (p.description || '').slice(0, 200);
        const priceCell = showPricesInPdf
          ? (p.show_price === false
              ? `<td style="text-align:right;font-style:italic;color:#666;font-size:10px;white-space:nowrap;vertical-align:top;padding:8px 6px;">Su richiesta</td>`
              : `<td style="text-align:right;font-weight:700;font-size:12px;color:#f97316;white-space:nowrap;vertical-align:top;padding:8px 6px;">
                   ${p.price_from ? `<div style="font-size:9px;font-weight:400;font-style:italic;color:#666;margin-bottom:2px;">a partire da</div>` : ''}
                   € ${parseFloat(p.price || 0).toFixed(2)}
                 </td>`)
          : `<td style="text-align:right;font-style:italic;color:#666;font-size:10px;white-space:nowrap;vertical-align:top;padding:8px 6px;">Su richiesta</td>`;
        const photoCell = mainPhoto
          ? `<img src="${mainPhoto}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:4px;border:1px solid #e5e5e5;display:block;" />`
          : `<div style="width:64px;height:64px;background:#f3f3f3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:9px;">no foto</div>`;
        const extraGrid = extraPhotos.length
          ? `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:2px;max-width:88px;">
               ${extraPhotos.map(ph => `<img src="${ph}" alt="" style="width:28px;height:28px;object-fit:cover;border-radius:2px;border:1px solid #e5e5e5;display:block;" />`).join('')}
             </div>`
          : '';
        return `
          <tr style="border-bottom:1px solid #e5e5e5;page-break-inside:avoid;">
            <td style="width:96px;padding:8px 6px;vertical-align:top;">
              ${photoCell}
              ${extraGrid}
            </td>
            <td style="padding:8px 10px;vertical-align:top;">
              <div style="font-weight:700;font-size:13px;color:#222;margin-bottom:3px;">${p.name || ''}</div>
              ${desc ? `<div style="font-size:10px;color:#666;line-height:1.35;margin-bottom:5px;">${desc}</div>` : ''}
              <div style="font-size:9.5px;color:#444;">
                ${colors ? `<div><strong>Colori:</strong> ${colors}</div>` : ''}
                ${sizes ? `<div><strong>Dimensioni:</strong> ${sizes}</div>` : ''}
                ${allPhotos.length > 1 ? `<div style="color:#999;font-style:italic;margin-top:2px;">${allPhotos.length} foto disponibili</div>` : ''}
              </div>
            </td>
            ${priceCell}
          </tr>`;
      }).join('');
      return `
        <div style="margin-top:14px;page-break-inside:avoid;">
          <h2 style="font-size:14px;font-weight:700;color:#f97316;margin:0 0 6px 0;padding-bottom:4px;border-bottom:2px solid #f97316;text-transform:uppercase;letter-spacing:0.5px;">${cat}</h2>
          <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
            <tbody>${items}</tbody>
          </table>
        </div>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${exportTitle}</title></head>
      <body style="font-family:Arial,sans-serif;color:#222;margin:0;padding:20px;background:#fff;">
        <div style="border-bottom:3px solid #f97316;padding-bottom:10px;margin-bottom:14px;">
          <h1 style="font-size:22px;font-weight:800;color:#f97316;margin:0;">${exportTitle}</h1>
          <div style="font-size:10px;color:#666;margin-top:4px;">Aggiornato al ${dateStr} · ${selected.length} prodotti${showPricesInPdf ? '' : ' · prezzi su richiesta'}</div>
        </div>
        ${rowsHtml || '<p style="text-align:center;color:#999;">Nessun prodotto selezionato.</p>'}
        <div style="margin-top:24px;padding-top:10px;border-top:1px solid #e5e5e5;font-size:9px;color:#999;text-align:center;">
          Artes&amp;Tramas 3D · Listino generato automaticamente · I prezzi possono variare in base a personalizzazioni e quantità
        </div>
      </body></html>`;
  };

  const handleExportListino = async () => {
    if (selectedIds.length === 0) { toast.error('Seleziona almeno un prodotto'); return; }
    setExporting(true);
    try {
      const html = await buildListinoHtml();
      const dateSlug = new Date().toISOString().slice(0, 10);
      await downloadHtmlAsPdf(html, `Listino_${dateSlug}.pdf`);
      toast.success('Listino PDF scaricato');
      setExportDialog(false);
    } catch {
      toast.error('Errore nella generazione del listino');
    } finally {
      setExporting(false);
    }
  };

  const openNew = () => { setForm(initialForm); setEditing(null); setDialogOpen(true); };
  const openEdit = (p) => {
    const photos = p.photos?.length ? p.photos : (p.photo ? [p.photo] : []);
    setForm({
      name: p.name,
      description: p.description,
      description_long: p.description_long || '',
      price: p.price,
      category: p.category,
      materials: p.materials || '',
      photos,
      is_public: p.is_public,
      color_options: p.color_options || [],
      material_options: p.material_options || [],
      size_options: p.size_options || [],
      is_customizable: p.is_customizable || false,
      custom_field_label: p.custom_field_label || '',
      show_price: p.show_price !== false,
      price_from: p.price_from || false,
    });
    setEditing(p.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Inserisci nome e prezzo'); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), photo: form.photos[0] || null };
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
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Prodotti Vetrina ({products.length})
              {selectedIds.length > 0 && (
                <Badge className="bg-primary/15 text-primary border-primary/30 ml-2" data-testid="selection-count-badge">
                  {selectedIds.length} selezionati
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              {selectedIds.length > 0 && (
                <>
                  <Button variant="ghost" size="sm" onClick={clearSelection} data-testid="clear-selection-btn">
                    <X className="w-3.5 h-3.5 mr-1" />Deseleziona
                  </Button>
                  <Button variant="default" size="sm" onClick={() => setExportDialog(true)} data-testid="open-export-listino-btn">
                    <FileText className="w-3.5 h-3.5 mr-1.5" />Esporta Listino PDF ({selectedIds.length})
                  </Button>
                </>
              )}
              {products.length > 0 && selectedIds.length === 0 && (
                <Button variant="outline" size="sm" onClick={selectAll} data-testid="select-all-btn">
                  <Check className="w-3.5 h-3.5 mr-1" />Seleziona tutti
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => {
                const host = window.location.hostname;
                const shopUrl = host.endsWith('artestramas3d.it') ? 'https://shop.artestramas3d.it' : '/listino';
                window.open(shopUrl, '_blank');
              }} data-testid="view-listino-btn">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Vedi Vetrina
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={openNew} data-testid="add-product-btn">
                    <Plus className="w-4 h-4 mr-1.5" />Aggiungi
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading">{editing ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</DialogTitle>
                    <DialogDescription className="text-xs">
                      Compila i campi del prodotto. Le foto saranno mostrate nella vetrina pubblica.
                    </DialogDescription>
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
                      <Label className="text-xs">Descrizione breve (card)</Label>
                      <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="Mostrata nella card del catalogo (1-2 righe)" data-testid="product-description" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Descrizione lunga (pagina dettaglio)</Label>
                      <Textarea value={form.description_long} onChange={e => setForm({...form, description_long: e.target.value})} rows={5} placeholder="Descrizione completa con caratteristiche, dimensioni, tempo di consegna ecc. Supporta a capo." data-testid="product-description-long" />
                    </div>

                    {/* Varianti */}
                    <div className="rounded-md border border-border/40 p-3 space-y-2 bg-muted/20">
                      <Label className="text-xs font-semibold">Varianti disponibili (opzionali, separate da virgola)</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Colori</Label>
                          <CsvInput value={form.color_options} onChange={(arr) => setForm({...form, color_options: arr})} placeholder="Rosso, Blu, Nero, Bianco..." className="h-9" data-testid="product-colors" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Materiali</Label>
                          <CsvInput value={form.material_options} onChange={(arr) => setForm({...form, material_options: arr})} placeholder="PLA, PETG, ABS, Resin..." className="h-9" data-testid="product-material-options" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Dimensioni</Label>
                          <CsvInput value={form.size_options} onChange={(arr) => setForm({...form, size_options: arr})} placeholder="S, M, L, XL oppure 5cm, 10cm..." className="h-9" data-testid="product-sizes" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Il cliente potra' scegliere una variante. Il prezzo finale sara' confermato via email.</p>
                    </div>

                    {/* Personalizzazione */}
                    <div className="rounded-md border border-border/40 p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center gap-3">
                        <Switch checked={form.is_customizable} onCheckedChange={v => setForm({...form, is_customizable: v})} data-testid="product-customizable-toggle" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Prodotto personalizzabile</p>
                          <p className="text-[10px] text-muted-foreground">Il cliente puo' inserire un testo personalizzato (nome, dedica, data...)</p>
                        </div>
                      </div>
                      {form.is_customizable && (
                        <div className="space-y-1 mt-2">
                          <Label className="text-[10px] text-muted-foreground">Etichetta del campo personalizzato</Label>
                          <Input value={form.custom_field_label} onChange={e => setForm({...form, custom_field_label: e.target.value})} placeholder='Es. "Nome da incidere", "Dedica", "Data..."' className="h-9" data-testid="product-custom-label" />
                        </div>
                      )}
                    </div>

                    {/* Multi-photo upload */}
                    <div className="space-y-2">
                      <Label className="text-xs">Foto (max 5, ognuna max 5MB)</Label>
                      <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => fileRef.current?.click()} disabled={form.photos.length >= 5}>
                        <ImagePlus className="w-3.5 h-3.5 mr-1.5" />Aggiungi Foto ({form.photos.length}/5)
                      </Button>
                      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
                      {form.photos.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {form.photos.map((photo, i) => (
                            <div key={i} className="relative">
                              <img src={photo} alt={`foto-${i}`} className="h-20 w-20 rounded-md border border-border/40 object-cover" />
                              <button onClick={() => removePhoto(i)} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
                      <Switch checked={form.is_public} onCheckedChange={v => setForm({...form, is_public: v})} data-testid="product-public-toggle" />
                      <div>
                        <p className="text-sm font-medium">{form.is_public ? 'Visibile nella Vetrina' : 'Nascosto'}</p>
                        <p className="text-[10px] text-muted-foreground">I prodotti pubblici appaiono nella vetrina online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
                      <Switch checked={form.show_price} onCheckedChange={v => setForm({...form, show_price: v})} data-testid="product-show-price-toggle" />
                      <div>
                        <p className="text-sm font-medium">{form.show_price ? 'Mostra prezzo in vetrina' : 'Nascondi prezzo'}</p>
                        <p className="text-[10px] text-muted-foreground">Se disattivato, sul prodotto apparira': "Scrivici per sapere il prezzo"</p>
                      </div>
                    </div>
                    {form.show_price && (
                      <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
                        <Switch
                          checked={form.price_from}
                          onCheckedChange={v => setForm({...form, price_from: v})}
                          data-testid="product-price-from-toggle"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {form.price_from ? 'Prezzo variabile ("a partire da")' : 'Prezzo fisso'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {form.price_from
                              ? `Nella vetrina verra' mostrato "a partire da €${parseFloat(form.price || 0).toFixed(2)}"`
                              : `Il prezzo verra' mostrato senza prefisso (utile per prodotti standard non personalizzabili)`}
                          </p>
                        </div>
                      </div>
                    )}
                    <Button onClick={handleSave} disabled={saving} className="w-full" data-testid="save-product-btn">
                      {saving ? 'Salvataggio...' : editing ? 'Aggiorna' : 'Aggiungi'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nessun prodotto. Aggiungi il primo!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => {
                const photo = p.photos?.[0] || p.photo;
                const photoCount = p.photos?.length || (p.photo ? 1 : 0);
                return (
                  <Card
                    key={p.id}
                    className={`border-border/40 overflow-hidden group relative transition-all ${selectedIds.includes(p.id) ? 'ring-2 ring-primary shadow-md' : ''}`}
                    data-testid={`product-card-${p.id}`}
                  >
                    <div
                      className="absolute top-2 left-2 z-10 bg-background/95 backdrop-blur-sm rounded p-1 shadow-sm cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={(e) => { e.stopPropagation(); toggleSelect(p.id); }}
                      data-testid={`select-product-${p.id}`}
                    >
                      <Checkbox
                        checked={selectedIds.includes(p.id)}
                        className="h-4 w-4 pointer-events-none"
                      />
                    </div>
                    {photo ? (
                      <div className="aspect-square bg-muted/30 overflow-hidden relative">
                        <img src={photo} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {photoCount > 1 && <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">{photoCount} foto</span>}
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
                        <div className="text-right shrink-0">
                          {p.price_from && <div className="text-[9px] text-muted-foreground italic leading-none">a partire da</div>}
                          <p className="font-heading font-bold text-primary">&euro;{parseFloat(p.price).toFixed(2)}</p>
                        </div>
                      </div>
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Esporta Listino PDF */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent className="max-w-lg" data-testid="export-listino-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Esporta Listino PDF
            </DialogTitle>
            <DialogDescription className="text-xs">
              Genera un PDF con i {selectedIds.length} prodotti selezionati, raggruppati per categoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-xs">Titolo del listino</Label>
              <Input
                value={exportTitle}
                onChange={(e) => setExportTitle(e.target.value)}
                placeholder="Listino Prodotti"
                className="h-9"
                data-testid="listino-title-input"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/40 bg-muted/20 px-3 py-2">
              <div className="min-w-0">
                <Label className="text-sm font-medium">Mostra prezzi nel PDF</Label>
                <p className="text-[10px] text-muted-foreground">
                  {showPricesInPdf
                    ? 'I prezzi saranno visibili accanto ad ogni prodotto'
                    : 'I prezzi saranno sostituiti da "Su richiesta"'}
                </p>
              </div>
              <Switch
                checked={showPricesInPdf}
                onCheckedChange={setShowPricesInPdf}
                data-testid="toggle-prices-listino"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/40 bg-muted/20 px-3 py-2">
              <div className="min-w-0">
                <Label className="text-sm font-medium">Includi tutte le foto</Label>
                <p className="text-[10px] text-muted-foreground">
                  {showAllPhotosInPdf
                    ? 'Foto principale + miniature delle foto aggiuntive'
                    : 'Solo la foto principale (PDF più compatto)'}
                </p>
              </div>
              <Switch
                checked={showAllPhotosInPdf}
                onCheckedChange={setShowAllPhotosInPdf}
                data-testid="toggle-photos-listino"
              />
            </div>
            <div className="rounded-md bg-muted/30 border border-border/40 p-3">
              <p className="text-[11px] font-medium mb-1.5">Riepilogo categorie</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(products.filter(p => selectedIds.includes(p.id)).map(p => p.category || 'Senza categoria'))).sort().map(cat => {
                  const count = products.filter(p => selectedIds.includes(p.id) && (p.category || 'Senza categoria') === cat).length;
                  return (
                    <Badge key={cat} variant="outline" className="text-[10px]">
                      {cat} · {count}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button variant="outline" size="sm" onClick={() => setExportDialog(false)} data-testid="cancel-export-btn">
                Annulla
              </Button>
              <Button
                size="sm"
                onClick={handleExportListino}
                disabled={exporting || selectedIds.length === 0}
                data-testid="confirm-export-listino-btn"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {exporting ? 'Generazione...' : 'Scarica PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============= INQUIRIES (Richieste Vetrina) TAB =============

const INQUIRY_STATUSES = [
  { value: 'nuova', label: 'Nuova', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'in_lavorazione', label: 'In lavorazione', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'preventivo_inviato', label: 'Preventivo inviato', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'chiusa', label: 'Chiusa', color: 'bg-green-100 text-green-700 border-green-300' },
];

const TYPE_LABELS = {
  info: { label: 'Info', color: 'bg-slate-100 text-slate-600' },
  quote: { label: 'Preventivo', color: 'bg-orange-100 text-orange-700' },
};

function InquiriesTab() {
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all'); // all | nuova | in_lavorazione | ...
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [inq, st] = await Promise.all([getAdminInquiries(), getAdminProductStats()]);
      setInquiries(inq);
      setStats(st);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status, note) => {
    try {
      await updateAdminInquiry(id, { status, admin_note: note });
      toast.success('Stato aggiornato');
      load();
    } catch { toast.error('Errore aggiornamento'); }
  };

  const removeInquiry = async (id) => {
    if (!window.confirm('Eliminare definitivamente questa richiesta?')) return;
    try {
      await deleteAdminInquiry(id);
      toast.success('Richiesta eliminata');
      load();
    } catch { toast.error('Errore eliminazione'); }
  };

  const filtered = filter === 'all' ? inquiries : inquiries.filter(i => (i.status || 'nuova') === filter);
  const counts = INQUIRY_STATUSES.reduce((acc, s) => {
    acc[s.value] = inquiries.filter(i => (i.status || 'nuova') === s.value).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4" data-testid="inquiries-tab">
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-border/40">
            <CardContent className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Inbox className="w-3 h-3" /> Tot. Richieste</p>
              <p className="text-2xl font-heading font-bold font-mono">{stats.total_inquiries}</p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3" /> Personalizzate</p>
              <p className="text-2xl font-heading font-bold font-mono">{stats.custom_requests}</p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> Preventivi</p>
              <p className="text-2xl font-heading font-bold font-mono">{stats.quote_requests}</p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Nuove</p>
              <p className="text-2xl font-heading font-bold font-mono text-blue-600">{counts.nuova || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Prodotti */}
      {stats?.top_products?.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Prodotti piu' visti
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Prodotto</TableHead>
                    <TableHead className="text-right">Visualizzazioni</TableHead>
                    <TableHead className="text-right">Richieste</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.top_products.slice(0, 5).map((p, i) => {
                    const conv = p.views > 0 ? ((p.inquiries / p.views) * 100).toFixed(1) : '0.0';
                    return (
                      <TableRow key={p.id} data-testid={`top-product-${i}`}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {p.photo ? <img src={p.photo} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><Package className="w-4 h-4 text-muted-foreground" /></div>}
                            <span className="font-medium text-sm">{p.name}</span>
                            {!p.is_public && <Badge variant="outline" className="text-[9px]">privato</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{p.views}</TableCell>
                        <TableCell className="text-right font-mono font-bold" style={{ color: p.inquiries > 0 ? '#f97316' : undefined }}>{p.inquiries}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">{conv}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtri stato */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border/40 hover:bg-muted/40'}`}
          data-testid="inquiry-filter-all"
        >Tutte ({inquiries.length})</button>
        {INQUIRY_STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === s.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border/40 hover:bg-muted/40'}`}
            data-testid={`inquiry-filter-${s.value}`}
          >{s.label} ({counts[s.value] || 0})</button>
        ))}
      </div>

      {/* Lista richieste */}
      <Card className="border-border/40">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Caricamento...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Inbox className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nessuna richiesta {filter !== 'all' ? `con stato "${INQUIRY_STATUSES.find(s => s.value === filter)?.label}"` : 'ricevuta'}.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map(inq => {
                const statusObj = INQUIRY_STATUSES.find(s => s.value === (inq.status || 'nuova')) || INQUIRY_STATUSES[0];
                const typeObj = TYPE_LABELS[inq.inquiry_type] || TYPE_LABELS.info;
                const isOpen = openId === inq.id;
                const created = new Date(inq.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={inq.id} className="p-4 hover:bg-muted/20 transition-colors" data-testid={`inquiry-row-${inq.id}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusObj.color}`}>{statusObj.label}</span>
                          {inq.is_custom ? (
                            <Badge variant="outline" className="text-[10px]"><Sparkles className="w-2.5 h-2.5 mr-1" />Personalizzata</Badge>
                          ) : (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${typeObj.color}`}>{typeObj.label}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{created}</span>
                        </div>
                        <p className="font-semibold text-sm">{inq.customer_name} {inq.product_name && <span className="text-muted-foreground font-normal">— {inq.product_name}</span>}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap mt-0.5">
                          <a href={`mailto:${inq.customer_email}?subject=Re: ${encodeURIComponent(inq.product_name || 'Richiesta')}`} className="hover:text-primary flex items-center gap-1" data-testid={`reply-${inq.id}`}>
                            <Mail className="w-3 h-3" />{inq.customer_email}
                          </a>
                          {inq.customer_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{inq.customer_phone}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Select value={inq.status || 'nuova'} onValueChange={(v) => updateStatus(inq.id, v, inq.admin_note)}>
                          <SelectTrigger className="h-8 text-xs w-[160px]" data-testid={`status-select-${inq.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INQUIRY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => { setOpenId(isOpen ? null : inq.id); setAdminNote(inq.admin_note || ''); }} data-testid={`toggle-${inq.id}`}>
                          {isOpen ? <X className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive" onClick={() => removeInquiry(inq.id)} data-testid={`delete-${inq.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 pl-1 border-l-2 border-primary/30 ml-1 pl-3 space-y-2">
                        {(inq.selected_color || inq.selected_material || inq.selected_size || inq.custom_text) && (
                          <div className="bg-orange-50 border border-orange-100 rounded p-2 text-xs space-y-1">
                            {inq.selected_color && <p><Palette className="w-3 h-3 inline mr-1" />Colore: <strong>{inq.selected_color}</strong></p>}
                            {inq.selected_material && <p><FileText className="w-3 h-3 inline mr-1" />Materiale: <strong>{inq.selected_material}</strong></p>}
                            {inq.selected_size && <p><Ruler className="w-3 h-3 inline mr-1" />Dimensione: <strong>{inq.selected_size}</strong></p>}
                            {inq.custom_text && <p><Sparkles className="w-3 h-3 inline mr-1" />Personalizzazione: <strong>{inq.custom_text}</strong></p>}
                          </div>
                        )}
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Messaggio cliente</Label>
                          <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded p-2">{inq.message}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Note interne (solo admin)</Label>
                          <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2} placeholder="Annotazioni private sulla richiesta..." data-testid={`note-${inq.id}`} />
                          <Button size="sm" className="h-7 text-xs" onClick={() => updateStatus(inq.id, inq.status || 'nuova', adminNote)} data-testid={`save-note-${inq.id}`}>
                            Salva nota
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============= PAGE ANALYTICS TAB =============

const PRESET_DAYS = [7, 14, 30, 60];
const pathLabel = (p) => {
  if (p === '/') return 'Dashboard (home loggati)';
  if (p === '/listino' || p === '*') return 'Shop / Listino pubblico';
  if (p.startsWith('/shop/prodotto')) return 'Pagine prodotto (tutti)';
  return p;
};

function PageAnalyticsTab() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  const load = async (d) => {
    setLoading(true);
    try { setData(await getAdminPageStats(d)); } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(days); }, [days]);

  const daily = data?.daily || [];
  const byPage = data?.by_page || [];

  return (
    <div className="space-y-4" data-testid="page-analytics-tab">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/40"><CardContent className="p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visite Totali</p>
          <p className="text-2xl font-heading font-bold font-mono">{data?.total_views || 0}</p>
          <p className="text-[10px] text-muted-foreground">Ultimi {days} giorni</p>
        </CardContent></Card>
        <Card className="border-border/40"><CardContent className="p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visitatori Unici</p>
          <p className="text-2xl font-heading font-bold font-mono text-primary">{data?.total_unique || 0}</p>
          <p className="text-[10px] text-muted-foreground">Per dispositivo/browser</p>
        </CardContent></Card>
        <Card className="border-border/40"><CardContent className="p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pagine viste</p>
          <p className="text-2xl font-heading font-bold font-mono">{byPage.length}</p>
          <p className="text-[10px] text-muted-foreground">URL distinti</p>
        </CardContent></Card>
        <Card className="border-border/40"><CardContent className="p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Media/giorno</p>
          <p className="text-2xl font-heading font-bold font-mono">{daily.length > 0 ? Math.round((data?.total_unique || 0) / daily.length) : 0}</p>
          <p className="text-[10px] text-muted-foreground">Visitatori unici</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground">Periodo:</span>
        {PRESET_DAYS.map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${days === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border/40 hover:bg-muted/40'}`}
            data-testid={`days-${d}`}
          >{d} giorni</button>
        ))}
      </div>

      {/* Grafico giornaliero */}
      {daily.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <LineChart className="w-4 h-4 text-primary" /> Trend visite per giorno
            </CardTitle>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: 'var(--primary)', opacity: 0.35 }} /> Totali
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: 'var(--primary)' }} /> Unici
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-1 h-40" data-testid="daily-chart">
              {daily.map(d => {
                const maxTotal = Math.max(1, ...daily.map(x => x.total));
                const hTotal = Math.max(4, Math.round((d.total / maxTotal) * 100));
                const hUnique = Math.max(2, Math.round((d.unique / maxTotal) * 100));
                const dt = new Date(d.date + 'T00:00:00');
                const label = dt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.date} — ${d.total} totali / ${d.unique} unici`}>
                    <div className="flex flex-col items-center leading-tight">
                      <span className="text-[10px] font-mono font-bold text-foreground" data-testid={`daily-total-${d.date}`}>{d.total}</span>
                      <span className="text-[9px] font-mono text-primary" data-testid={`daily-unique-${d.date}`}>{d.unique}u</span>
                    </div>
                    <div className="w-full relative flex-1 flex items-end" style={{ height: '100px' }}>
                      {/* Barra totali (sfondo, opacità bassa) */}
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all"
                        style={{ height: `${hTotal}%`, background: 'var(--primary)', opacity: 0.3 }}
                      />
                      {/* Barra unici (in primo piano, opacità piena) */}
                      <div
                        className="absolute bottom-0 left-1/4 right-1/4 rounded-t-md transition-all"
                        style={{ height: `${hUnique}%`, background: 'var(--primary)', opacity: 0.9 }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">{label}</span>
                  </div>
                );
              })}
            </div>

            {/* Tabella riassuntiva giornaliera */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs" data-testid="daily-summary-table">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground">
                    <th className="text-left py-1.5 font-medium">Giorno</th>
                    <th className="text-right py-1.5 font-medium">Totali</th>
                    <th className="text-right py-1.5 font-medium">Unici</th>
                    <th className="text-right py-1.5 font-medium">Ripetute</th>
                  </tr>
                </thead>
                <tbody>
                  {[...daily].reverse().map(d => {
                    const dt = new Date(d.date + 'T00:00:00');
                    const label = dt.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' });
                    return (
                      <tr key={d.date} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="py-1.5 capitalize">{label}</td>
                        <td className="text-right font-mono font-bold">{d.total}</td>
                        <td className="text-right font-mono text-primary">{d.unique}</td>
                        <td className="text-right font-mono text-muted-foreground">{Math.max(0, d.total - d.unique)}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold bg-muted/30">
                    <td className="py-1.5">Totale {days}gg</td>
                    <td className="text-right font-mono">{daily.reduce((s, d) => s + (d.total || 0), 0)}</td>
                    <td className="text-right font-mono text-primary">{daily.reduce((s, d) => s + (d.unique || 0), 0)}</td>
                    <td className="text-right font-mono text-muted-foreground">{daily.reduce((s, d) => s + Math.max(0, (d.total || 0) - (d.unique || 0)), 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabella pagine */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Pagine piu' visitate
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Caricamento...</div>
          ) : byPage.length === 0 ? (
            <div className="p-10 text-center">
              <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nessuna visita registrata. Il tracking parte da ora. Condividi i tuoi link e torna domani.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Pagina</TableHead>
                    <TableHead className="text-right">Visitatori unici</TableHead>
                    <TableHead className="text-right">Visite totali</TableHead>
                    <TableHead className="text-right">V/U</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byPage.map((p, i) => {
                    const ratio = p.unique_visitors > 0 ? (p.total_views / p.unique_visitors).toFixed(1) : '0.0';
                    return (
                      <TableRow key={p.path} data-testid={`page-row-${i}`}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{pathLabel(p.path)}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{p.path}</p>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary">{p.unique_visitors}</TableCell>
                        <TableCell className="text-right font-mono">{p.total_views}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground" title="Visite per utente">{ratio}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground text-center">
        Le statistiche tracciano le visite dei browser sui tuoi domini (calcolatore, shop, demo). Per analytics avanzati (sorgenti traffico, geolocalizzazione, dispositivi) integra Google Analytics dal tab "Codici".
      </p>
    </div>
  );
}

// ============= AFFILIATE LINKS TAB =============

const PLACEMENT_LABELS = {
  guida: 'Pagina Guida (utenti loggati)',
  shop_footer: 'Footer Shop pubblico',
  calculator: 'Calcolatore (utenti loggati)',
  demo: 'Demo pubblica',
  filaments_low_stock: 'Filamenti — Avviso scorte basse (contestuale)',
  dashboard: 'Dashboard utente (home dopo login)',
};

function AffiliateStatsCard() {
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getAdminAffiliateStats(days).then(d => {
      if (mounted) { setStats(d); setLoading(false); }
    }).catch(() => setLoading(false));
    return () => { mounted = false; };
  }, [days]);

  const daily = stats?.daily || [];
  const top = stats?.top || [];
  const maxClick = Math.max(1, ...daily.map(d => d.clicks));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" data-testid="affiliate-stats">
      {/* Grafico click per giorno */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <LineChart className="w-4 h-4 text-primary" /> Click affiliati per giorno
            </CardTitle>
            <div className="flex gap-1">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${days === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border/40'}`}
                  data-testid={`aff-stats-days-${d}`}
                >{d}gg</button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground pt-1">
            Totale periodo: <strong className="text-primary font-mono">{stats?.total_clicks_period || 0}</strong> click
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Caricamento...</div>
          ) : daily.length === 0 ? (
            <div className="py-8 text-center">
              <MousePointerClick className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">Nessun click nel periodo. Condividi i tuoi link e torna qui!</p>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-1 h-28" data-testid="aff-daily-chart">
              {daily.map(d => {
                const h = Math.max(6, Math.round((d.clicks / maxClick) * 100));
                const dt = new Date(d.date + 'T00:00:00');
                const label = dt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.date}: ${d.clicks} click`}>
                    <span className="text-[10px] font-mono font-bold">{d.clicks}</span>
                    <div className="w-full rounded-t-md" style={{ height: `${h}%`, background: 'var(--primary)', opacity: 0.85 }} />
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top link cliccati */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Top link cliccati
          </CardTitle>
          <p className="text-[10px] text-muted-foreground pt-1">
            Ordinati per click totali (all-time: <strong className="text-primary font-mono">{stats?.total_clicks_all_time || 0}</strong>)
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Caricamento...</div>
          ) : top.length === 0 || top.every(t => (t.clicks_total || 0) === 0) ? (
            <div className="py-8 text-center">
              <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">Nessun click ancora registrato.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40 max-h-64 overflow-y-auto">
              {top.filter(t => (t.clicks_total || 0) > 0).slice(0, 5).map((t, i) => (
                <div key={t.id} className="px-3 py-2 flex items-center gap-2" data-testid={`aff-top-${t.id}`}>
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate flex items-center gap-1.5">
                      {t.title}
                      {!t.is_active && <Badge variant="outline" className="text-[8px] px-1 py-0">off</Badge>}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">{(t.placements || []).join(' · ')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-bold text-primary">{t.clicks_total}</p>
                    <p className="text-[9px] text-muted-foreground">+{t.clicks_period} ({days}gg)</p>
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

function AffiliateLinksTab() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const initial = { title: '', url: '', description: '', image_url: '', coupon_code: '', placements: ['guida'], is_active: true, sort_order: 0 };
  const [form, setForm] = useState(initial);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setLinks(await getAdminAffiliateLinks()); } catch { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const togglePlacement = (p) => {
    setForm(f => ({ ...f, placements: f.placements.includes(p) ? f.placements.filter(x => x !== p) : [...f.placements, p] }));
  };

  const resetForm = () => { setForm(initial); setEditId(null); setShowForm(false); };

  const handleSave = async () => {
    if (!form.title || !form.url) { toast.error('Titolo e URL obbligatori'); return; }
    if (form.placements.length === 0) { toast.error('Seleziona almeno una pagina'); return; }
    try {
      if (editId) {
        await updateAffiliateLink(editId, form);
        toast.success('Link aggiornato');
      } else {
        await createAffiliateLink(form);
        toast.success('Link creato');
      }
      resetForm();
      load();
    } catch { toast.error('Errore salvataggio'); }
  };

  const handleEdit = (l) => {
    setForm({
      title: l.title,
      url: l.url,
      description: l.description || '',
      image_url: l.image_url || '',
      coupon_code: l.coupon_code || '',
      placements: l.placements?.length ? l.placements : ['guida'],
      is_active: l.is_active,
      sort_order: l.sort_order || 0,
    });
    setEditId(l.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare il link?')) return;
    try { await deleteAffiliateLink(id); toast.success('Eliminato'); load(); }
    catch { toast.error('Errore'); }
  };

  const totalClicks = links.reduce((s, l) => s + (l.clicks || 0), 0);

  return (
    <div className="space-y-4" data-testid="affiliate-tab">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-heading font-bold flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" /> Link Affiliati</h3>
          <p className="text-xs text-muted-foreground">Gestisci i link sponsorizzati visibili su Guida, Shop, Calcolatore, Demo. Total click: <strong className="text-primary">{totalClicks}</strong></p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} data-testid="add-affiliate-btn"><Plus className="w-4 h-4 mr-1.5" />Nuovo Link</Button>
      </div>

      {/* Widget statistiche (grafico click + top link) */}
      <AffiliateStatsCard />

      {showForm && (
        <Card className="border-primary/40">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Titolo *</Label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Es. Bambu Lab — Stampanti 3D" className="h-9" data-testid="aff-title" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">URL affiliato *</Label>
                <Input value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://amzn.to/... oppure https://bambulab.com/?ref=..." className="h-9" data-testid="aff-url" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descrizione (max 100 caratteri)</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value.slice(0, 100)})} placeholder="Es. Le stampanti che uso e consiglio" className="h-9" data-testid="aff-description" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">URL immagine/logo (opzionale)</Label>
              <Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://.../logo.png" className="h-9" data-testid="aff-image" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Codice coupon (opzionale)</Label>
              <Input
                value={form.coupon_code}
                onChange={e => setForm({...form, coupon_code: e.target.value.toUpperCase().slice(0, 30)})}
                placeholder="Es. ARTES10 · sconto 10% per i tuoi utenti"
                className="h-9 font-mono uppercase tracking-wider"
                data-testid="aff-coupon"
              />
              <p className="text-[10px] text-muted-foreground">Se presente, verrà mostrato accanto al link con pulsante &quot;Copia&quot;. Aumenta conversione fino a 3x.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Mostra nelle pagine *</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PLACEMENT_LABELS).map(([k, label]) => {
                  const active = form.placements.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => togglePlacement(k)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground hover:bg-muted/40'}`}
                      data-testid={`aff-placement-${k}`}
                    >
                      <span className="w-3 h-3 rounded-full border" style={{ background: active ? 'currentColor' : 'transparent' }} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Ordine (0 = primo)</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})} className="h-9 font-mono" data-testid="aff-order" />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} data-testid="aff-active" />
                <Label className="text-xs">Attivo (visibile pubblicamente)</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} data-testid="aff-save"><Save className="w-3.5 h-3.5 mr-1.5" />Salva</Button>
              <Button size="sm" variant="outline" onClick={resetForm}>Annulla</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <Card className="border-border/40">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Caricamento...</div>
          ) : links.length === 0 ? (
            <div className="p-10 text-center">
              <Link2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Nessun link affiliato configurato.</p>
              <p className="text-[11px] text-muted-foreground max-w-md mx-auto">Aggiungi i tuoi link (Amazon Associates, Bambu Lab Affiliate, 3DJake, ecc.). Verranno mostrati automaticamente nelle pagine selezionate con il disclaimer GDPR.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {links.map(l => (
                <div key={l.id} className="p-3 hover:bg-muted/20 flex items-center gap-3 flex-wrap" data-testid={`aff-row-${l.id}`}>
                  {l.image_url ? <img src={l.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" /> : <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0"><Link2 className="w-4 h-4 text-primary" /></div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{l.title}</p>
                      {l.coupon_code && (
                        <Badge className="text-[9px] bg-primary/15 text-primary border-primary/30 font-mono">
                          {l.coupon_code}
                        </Badge>
                      )}
                      {!l.is_active && <Badge variant="outline" className="text-[9px]">Disattivo</Badge>}
                      <Badge variant="outline" className="text-[9px] flex items-center gap-1"><MousePointerClick className="w-2.5 h-2.5" />{l.clicks || 0}</Badge>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">{l.url}</p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {(l.placements || []).map(pl => <span key={pl} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{pl}</span>)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(l)} data-testid={`aff-edit-${l.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(l.id)} data-testid={`aff-delete-${l.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
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

export default function AdminPanelPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoStats, setDemoStats] = useState({ total: 0, today: 0, daily: [] });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [usersData, statsData, logsData, nlData, demoData] = await Promise.all([
        getAdminUsers(), getAdminStats(), getAdminEmailLogs(), getAdminNewsletters(), getDemoStats()
      ]);
      setUsers(usersData);
      setStats(statsData);
      setEmailLogs(logsData);
      setNewsletters(nlData);
      setDemoStats(demoData);
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
          <Card className="border-border/40">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visite Demo</p>
              <p className="text-2xl font-heading font-bold font-mono">{demoStats.total}</p>
              <p className="text-[10px] text-muted-foreground">Oggi: {demoStats.today}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Demo - Grafico visite giornaliere ultimi 7 giorni */}
      {demoStats.daily && demoStats.daily.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Visite Demo — Ultimi 7 giorni
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const days = [...demoStats.daily].reverse(); // dal piu' vecchio al piu' recente
              const max = Math.max(1, ...days.map(d => d.count));
              return (
                <div className="flex items-end justify-between gap-2 h-32" data-testid="demo-daily-chart">
                  {days.map(d => {
                    const h = Math.max(4, Math.round((d.count / max) * 100));
                    const dt = new Date(d.date + 'T00:00:00');
                    const label = dt.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <span className="text-[10px] font-mono text-muted-foreground">{d.count}</span>
                        <div
                          className="w-full rounded-t-md transition-all"
                          style={{ height: `${h}%`, background: 'linear-gradient(180deg, var(--primary), var(--primary))', opacity: 0.85 }}
                          title={`${d.date}: ${d.count} visite`}
                        />
                        <span className="text-[10px] text-muted-foreground capitalize truncate w-full text-center">{label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5 sm:grid-cols-11">
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-1.5 hidden sm:inline" />Utenti
          </TabsTrigger>
          <TabsTrigger value="vetrina" data-testid="tab-vetrina">
            <ShoppingBag className="w-4 h-4 mr-1.5 hidden sm:inline" />Gestione Vetrina
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
          <TabsTrigger value="orders" data-testid="tab-orders">
            <Inbox className="w-4 h-4 mr-1.5 hidden sm:inline" />Richieste
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="w-4 h-4 mr-1.5 hidden sm:inline" />Analytics
          </TabsTrigger>
          <TabsTrigger value="affiliates" data-testid="tab-affiliates">
            <Link2 className="w-4 h-4 mr-1.5 hidden sm:inline" />Affiliati
          </TabsTrigger>
          <TabsTrigger value="emails" data-testid="tab-emails">
            <Mail className="w-4 h-4 mr-1.5 hidden sm:inline" />Email Log
          </TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">
            <Send className="w-4 h-4 mr-1.5 hidden sm:inline" />Inviate
          </TabsTrigger>
          <TabsTrigger value="scripts" data-testid="tab-scripts">
            <Code className="w-4 h-4 mr-1.5 hidden sm:inline" />Codici
          </TabsTrigger>
        </TabsList>

        {/* Orders/Inquiries Tab */}
        <TabsContent value="orders">
          <InquiriesTab />
        </TabsContent>

        {/* Page Analytics Tab */}
        <TabsContent value="analytics">
          <PageAnalyticsTab />
        </TabsContent>

        {/* Affiliate Links Tab */}
        <TabsContent value="affiliates">
          <AffiliateLinksTab />
        </TabsContent>

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
                      <TableHead>Ultimo Accesso</TableHead>
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
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {user.last_login ? new Date(user.last_login).toLocaleString('it-IT') : 'Mai'}
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

        {/* Site Settings Tab */}
        <TabsContent value="settings">
          <SiteSettingsTab />
        </TabsContent>

        {/* Vetrina Tab (solo Prodotti) */}
        <TabsContent value="vetrina">
          <ProductsTab />
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

        {/* Codici/Scripts Tab */}
        <TabsContent value="scripts">
          <ScriptsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
