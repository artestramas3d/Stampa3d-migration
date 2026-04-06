import { useState, useEffect, useRef } from 'react';
import { createBugReport, getMyBugReports } from '../lib/api';
import { useLang } from '../context/LangContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Bug, Send, ImagePlus, X, Clock, CheckCircle, Wrench } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_MAP = {
  aperto: { label: 'Aperto', color: 'bg-yellow-500/20 text-yellow-500' },
  in_lavorazione: { label: 'In Lavorazione', color: 'bg-blue-500/20 text-blue-500' },
  risolto: { label: 'Risolto', color: 'bg-emerald-500/20 text-emerald-500' },
};

const STATUS_ICON = {
  aperto: Clock,
  in_lavorazione: Wrench,
  risolto: CheckCircle,
};

export default function BugReportPage() {
  const { t } = useLang();
  const [reports, setReports] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('media');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      const data = await getMyBugReports();
      setReports(data);
    } catch { /* ignore */ }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Immagine troppo grande (max 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(reader.result);
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Compila titolo e descrizione');
      return;
    }
    setSending(true);
    try {
      await createBugReport({ title, description, priority, screenshot });
      toast.success('Segnalazione inviata!');
      setTitle('');
      setDescription('');
      setPriority('media');
      removeScreenshot();
      loadReports();
    } catch {
      toast.error('Errore nell\'invio');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="bug-report-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Segnala un Problema</h1>
        <p className="text-muted-foreground mt-1">Aiutaci a migliorare segnalando eventuali malfunzionamenti</p>
      </div>

      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Bug className="w-4 h-4" /> Nuova Segnalazione
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Titolo</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Il calcolatore non salva..." className="h-9" data-testid="bug-title" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priorità</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9" data-testid="bug-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bassa">Bassa</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descrizione</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrivi il problema nel dettaglio..." rows={4} data-testid="bug-description" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Screenshot (opzionale, max 5MB)</Label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => fileRef.current?.click()} data-testid="bug-screenshot-btn">
                <ImagePlus className="w-3.5 h-3.5 mr-1.5" /> Allega Immagine
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {screenshotPreview && (
                <div className="relative">
                  <img src={screenshotPreview} alt="preview" className="h-16 rounded border border-border/40" />
                  <button onClick={removeScreenshot} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={sending || !title.trim() || !description.trim()} data-testid="bug-submit-btn">
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Invio...' : 'Invia Segnalazione'}
          </Button>
        </CardContent>
      </Card>

      {reports.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              Le mie Segnalazioni ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.map(r => {
                const statusInfo = STATUS_MAP[r.status] || STATUS_MAP.aperto;
                const StatusIcon = STATUS_ICON[r.status] || Clock;
                return (
                  <div key={r.id} className="p-3 rounded-md bg-muted/30 border border-border/40" data-testid={`bug-report-${r.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{r.title}</p>
                          <Badge className={`${statusInfo.color} text-[10px]`}>
                            <StatusIcon className="w-2.5 h-2.5 mr-1" />{statusInfo.label}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{r.priority}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{r.description}</p>
                        {r.admin_note && (
                          <p className="text-xs mt-2 p-2 rounded bg-primary/10 border border-primary/20">
                            <span className="font-semibold">Risposta Admin:</span> {r.admin_note}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('it-IT') : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
