import html2pdf from 'html2pdf.js';

/**
 * Genera e scarica un PDF a partire da una stringa HTML.
 * Usa html2pdf.js (html2canvas + jsPDF) — client-side, no backend.
 *
 * @param {string} html - HTML del documento (già stilato)
 * @param {string} filename - nome del file (es. "Preventivo_PRV-20260710-152535.pdf")
 * @returns {Promise<void>}
 */
export async function downloadHtmlAsPdf(html, filename = 'documento.pdf') {
  // Container temporaneo off-screen per il rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '210mm'; // A4 width
  container.style.background = '#ffffff';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
