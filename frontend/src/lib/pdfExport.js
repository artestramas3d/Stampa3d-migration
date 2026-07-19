import html2pdf from 'html2pdf.js';

/**
 * Genera e scarica un PDF a partire da una stringa HTML.
 *
 * Strategia:
 *  - Iframe temporaneo VISIBILE ma con opacity:0 e pointer-events:none.
 *  - Forza background bianco su <html> e <body> dell'iframe per evitare
 *    ereditarieta' dal tema dark del parent (che appariva come sfondo nero
 *    nel PDF nella prima iterazione).
 *
 * @param {string} html - HTML completo del documento (con doctype/head/body)
 * @param {string} filename - nome del file (es. "Preventivo_PRV-XXX.pdf")
 * @returns {Promise<void>}
 */
export async function downloadHtmlAsPdf(html, filename = 'documento.pdf') {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 794px;
    height: 1123px;
    border: 0;
    opacity: 0;
    pointer-events: none;
    z-index: -1;
    background: #ffffff;
  `;
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    // Forza sfondo bianco su HTML e BODY (l'iframe eredita il tema dark del parent).
    // Aggiungiamo lo stile PRIMA che il rendering venga catturato.
    const forceStyle = doc.createElement('style');
    forceStyle.textContent = `
      html { background: #ffffff !important; background-color: #ffffff !important; color-scheme: light !important; }
      body { background: #ffffff !important; background-color: #ffffff !important; color: #333333; }
      * { color-scheme: light !important; }
    `;
    if (doc.head) {
      doc.head.appendChild(forceStyle);
    } else {
      doc.documentElement.appendChild(forceStyle);
    }
    // Fallback diretto anche sugli elementi (per sicurezza)
    if (doc.documentElement) doc.documentElement.style.background = '#ffffff';
    if (doc.body) doc.body.style.background = '#ffffff';

    // Attende font e immagini
    await new Promise((resolve) => {
      const done = () => setTimeout(resolve, 300);
      if (doc.readyState === 'complete') return done();
      iframe.onload = done;
      setTimeout(resolve, 1800); // safety timeout
    });

    const target = doc.body;
    if (!target) throw new Error('Body iframe non disponibile');

    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 794,
          logging: false,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(target)
      .save();
  } finally {
    document.body.removeChild(iframe);
  }
}
