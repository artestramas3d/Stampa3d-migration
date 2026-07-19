/**
 * Comprime un'immagine base64 (data URL) ridimensionandola e ricomprimendola
 * come JPEG. Usa canvas HTML5 lato client.
 *
 * @param {string} dataUrl - stringa base64 (es. "data:image/png;base64,...")
 * @param {object} opts
 * @param {number} opts.maxWidth - larghezza massima in px (default 400)
 * @param {number} opts.quality - qualita' JPEG 0..1 (default 0.75)
 * @returns {Promise<string>} nuovo data URL JPEG compresso
 */
export function compressImageBase64(dataUrl, { maxWidth = 400, quality = 0.75 } = {}) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string') return resolve(dataUrl);
    if (!dataUrl.startsWith('data:image')) return resolve(dataUrl);

    const img = new Image();
    img.onload = () => {
      try {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        // Sfondo bianco per PNG con trasparenza (evita nero nel JPEG)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const out = canvas.toDataURL('image/jpeg', quality);
        // Se il risultato e' piu' grande dell'originale, restituisci l'originale
        resolve(out.length < dataUrl.length ? out : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Comprime un array di data URL base64 in parallelo.
 * @param {string[]} dataUrls
 * @param {object} opts
 * @returns {Promise<string[]>}
 */
export function compressImagesBatch(dataUrls, opts) {
  return Promise.all((dataUrls || []).map((d) => compressImageBase64(d, opts)));
}
