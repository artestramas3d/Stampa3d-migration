import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, X, Upload, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateShopSettings } from '../lib/api';
import { compressImageBase64 } from '../lib/imageCompress';

/**
 * Hook per la modalità editor sulla home shop.
 * - Rileva se l'utente è shop_owner
 * - Gestisce la modalità "on/off"
 * - Espone `save(patch)` che aggiorna backend + settings locali
 */
export function useShopEditor({ user, settings, setSettings }) {
  const isOwner = !!user?.is_shop_owner;
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async (patch) => {
    if (!isOwner) return;
    setSaving(true);
    try {
      // Backend richiede il payload intero: uniamo settings esistenti + patch
      const merged = { ...(settings || {}), ...patch };
      // Rimuoviamo campi non serializzabili / read-only
      delete merged._id;
      delete merged.id;
      delete merged.updated_at;
      const updated = await updateShopSettings(merged);
      setSettings(updated);
      toast.success('Modifiche salvate');
    } catch (e) {
      toast.error('Errore nel salvataggio');
      throw e;
    } finally {
      setSaving(false);
    }
  }, [isOwner, settings, setSettings]);

  return { isOwner, editMode, setEditMode, saving, save };
}

/**
 * Wrapper che mostra un pulsante "Modifica" al passaggio del mouse.
 * In modalità editor.
 */
export function EditableField({ active, label, onEdit, children, className = '', position = 'top-right' }) {
  if (!active) return children;

  const posClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  }[position] || 'top-2 right-2';

  return (
    <div className={`relative group/edit ring-2 ring-dashed ring-orange-400/0 hover:ring-orange-400/70 rounded-lg transition-all ${className}`}>
      {children}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
        className={`absolute ${posClasses} z-30 opacity-0 group-hover/edit:opacity-100 transition-opacity inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-orange-500 text-white shadow-lg hover:bg-orange-600`}
        title={`Modifica ${label || ''}`.trim()}
        data-testid={`edit-${(label || 'field').toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Pencil className="w-3 h-3" /> Modifica
      </button>
    </div>
  );
}

/**
 * Modal per la modifica di un campo.
 * type: 'text' | 'textarea' | 'image'
 */
export function EditModal({ open, onClose, onSave, label, value, type = 'text', saving }) {
  const [val, setVal] = useState(value ?? '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { setVal(value ?? ''); }, [value, open]);

  if (!open) return null;

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      toast.error('Immagine troppo grande (max 4MB)');
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const compressed = await compressImageBase64(ev.target.result, { maxWidth: 900, quality: 0.82 });
          setVal(compressed);
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => { setUploading(false); toast.error('Errore lettura file'); };
      reader.readAsDataURL(f);
    } catch {
      setUploading(false);
    }
  };

  const handleSave = () => onSave(val);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" data-testid="edit-modal">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Modifica {label}</h3>
            <p className="text-[11px] text-gray-500">Le modifiche saranno immediatamente visibili sul sito.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center" data-testid="edit-modal-close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {type === 'text' && (
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-gray-900 bg-white"
            autoFocus
            data-testid="edit-input-text"
          />
        )}

        {type === 'textarea' && (
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none text-gray-900 bg-white"
            autoFocus
            data-testid="edit-input-textarea"
          />
        )}

        {type === 'image' && (
          <div className="space-y-3">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
              {val ? (
                <img src={val} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">Nessuna immagine</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold disabled:opacity-60"
                data-testid="edit-image-upload"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Comprimo...' : 'Carica immagine'}
              </button>
              {val && (
                <button
                  type="button"
                  onClick={() => setVal('')}
                  className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                  data-testid="edit-image-remove"
                >
                  Rimuovi
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Oppure incolla URL</label>
              <input
                type="url"
                value={val?.startsWith('data:') ? '' : val}
                onChange={(e) => setVal(e.target.value)}
                placeholder="https://..."
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-xs text-gray-900 bg-white"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100"
            data-testid="edit-modal-cancel"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60"
            data-testid="edit-modal-save"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Salva
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Barra flottante per attivare/disattivare l'editor.
 * Visibile solo se l'utente è shop_owner.
 */
export function EditorToolbar({ isOwner, editMode, setEditMode, saving }) {
  if (!isOwner) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[9998] flex items-center gap-2" data-testid="editor-toolbar">
      {saving && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 text-white text-[11px] font-semibold shadow-lg">
          <Loader2 className="w-3 h-3 animate-spin" /> Salvo...
        </div>
      )}
      <button
        onClick={() => setEditMode(v => !v)}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold shadow-xl transition-all hover:-translate-y-0.5 ${
          editMode
            ? 'bg-orange-500 hover:bg-orange-600 text-white ring-2 ring-orange-300'
            : 'bg-gray-900 hover:bg-gray-800 text-white'
        }`}
        data-testid="editor-toolbar-toggle"
      >
        <Pencil className="w-3.5 h-3.5" />
        {editMode ? 'Editor ON' : 'Modifica sito'}
      </button>
    </div>
  );
}
