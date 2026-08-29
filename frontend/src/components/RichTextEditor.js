import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, Undo, Redo, Heading2, Heading3, Code } from 'lucide-react';

/**
 * Editor rich text basato su Tiptap.
 * Props:
 *  - value: HTML string
 *  - onChange: (html) => void
 *  - placeholder: string
 */
export function RichTextEditor({ value = '', onChange, placeholder = 'Scrivi qui...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[240px] p-3 [&_*]:!text-gray-900 dark:[&_*]:!text-gray-100 [&_h2]:!text-gray-900 dark:[&_h2]:!text-white [&_h3]:!text-gray-800 dark:[&_h3]:!text-gray-200 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const btn = (active, onClick, icon, label) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex items-center justify-center w-8 h-8 rounded transition-colors text-xs ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
    >{icon}</button>
  );

  return (
    <div className="border border-border rounded-md overflow-hidden bg-background" data-testid="richtext-editor">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/50 p-1.5 bg-muted/30">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold className="w-3.5 h-3.5" />, 'Grassetto')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic className="w-3.5 h-3.5" />, 'Corsivo')}
        <span className="mx-1 h-4 w-px bg-border" />
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="w-3.5 h-3.5" />, 'Titolo')}
        {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 className="w-3.5 h-3.5" />, 'Sottotitolo')}
        <span className="mx-1 h-4 w-px bg-border" />
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List className="w-3.5 h-3.5" />, 'Elenco puntato')}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="w-3.5 h-3.5" />, 'Elenco numerato')}
        {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), <Quote className="w-3.5 h-3.5" />, 'Citazione')}
        {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), <Code className="w-3.5 h-3.5" />, 'Codice')}
        <span className="mx-1 h-4 w-px bg-border" />
        {btn(editor.isActive('link'), () => {
          const prev = editor.getAttributes('link').href || '';
          const url = window.prompt('URL link:', prev);
          if (url === null) return;
          if (url === '') editor.chain().focus().unsetLink().run();
          else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }, <LinkIcon className="w-3.5 h-3.5" />, 'Link')}
        {btn(false, () => {
          const url = window.prompt('URL immagine:');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }, <ImageIcon className="w-3.5 h-3.5" />, 'Immagine')}
        <span className="mx-1 h-4 w-px bg-border" />
        {btn(false, () => editor.chain().focus().undo().run(), <Undo className="w-3.5 h-3.5" />, 'Annulla')}
        {btn(false, () => editor.chain().focus().redo().run(), <Redo className="w-3.5 h-3.5" />, 'Ripeti')}
      </div>
      <EditorContent editor={editor} data-placeholder={placeholder} />
    </div>
  );
}
