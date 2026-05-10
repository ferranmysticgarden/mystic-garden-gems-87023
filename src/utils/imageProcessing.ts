/**
 * imageProcessing.ts
 *
 * Pipeline para convertir una foto cruda (DataURL) en un icono cuadrado
 * 128×128 con máscara circular, listo para usarse como ficha del match-3.
 *
 * Pipeline:
 *  1. Cargar imagen en memoria
 *  2. Crop cuadrado central
 *  3. Resize a 128×128
 *  4. Aplicar máscara circular (transparencia fuera del círculo)
 *  5. Exportar a WebP (fallback PNG si no soportado)
 *
 * No depende de bundlers ni librerías; sólo Canvas API.
 */

const TARGET_SIZE = 128;
const WEBP_QUALITY = 0.85;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export class ImageProcessingError extends Error {
  code: "TOO_LARGE" | "LOAD_FAILED" | "CANVAS_FAILED" | "EXPORT_FAILED";
  constructor(code: ImageProcessingError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "ImageProcessingError";
  }
}

/**
 * Estima el tamaño en bytes de una DataURL base64.
 */
const estimateBytes = (dataUrl: string): number => {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) return dataUrl.length;
  const b64 = dataUrl.slice(commaIdx + 1);
  return Math.floor(b64.length * 0.75);
};

/**
 * Carga una DataURL en una HTMLImageElement.
 */
const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageProcessingError("LOAD_FAILED", "Image load failed"));
    img.src = dataUrl;
  });

/**
 * Detecta soporte real de WebP exportando un canvas mínimo.
 */
let _webpSupport: boolean | null = null;
const supportsWebP = (): boolean => {
  if (_webpSupport !== null) return _webpSupport;
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    _webpSupport = c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    _webpSupport = false;
  }
  return _webpSupport;
};

/**
 * Procesa una foto para usarla como ficha del match-3.
 * @param dataUrl DataURL de la imagen cruda (jpg/png/webp/heic decodificado).
 * @returns DataURL de la imagen procesada 128×128 circular en WebP (o PNG fallback).
 */
export async function processImageForTile(dataUrl: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    throw new ImageProcessingError("LOAD_FAILED", "Invalid data URL");
  }

  if (estimateBytes(dataUrl) > MAX_BYTES) {
    throw new ImageProcessingError("TOO_LARGE", "Image exceeds 10 MB");
  }

  // 1. Cargar imagen
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) {
    throw new ImageProcessingError("LOAD_FAILED", "Image has zero dimensions");
  }

  // 2 + 3. Crop cuadrado central + resize 128
  const side = Math.min(w, h);
  const sx = Math.floor((w - side) / 2);
  const sy = Math.floor((h - side) / 2);

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  try {
    canvas = document.createElement("canvas");
    canvas.width = TARGET_SIZE;
    canvas.height = TARGET_SIZE;
    ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
  } catch (e) {
    throw new ImageProcessingError("CANVAS_FAILED", "Crop/resize failed");
  }

  // 4. Máscara circular
  try {
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(TARGET_SIZE / 2, TARGET_SIZE / 2, TARGET_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  } catch {
    throw new ImageProcessingError("CANVAS_FAILED", "Circular mask failed");
  }

  // 5. Exportar
  try {
    const mime = supportsWebP() ? "image/webp" : "image/png";
    const out = canvas.toDataURL(mime, WEBP_QUALITY);
    if (!out || out === "data:,") {
      throw new Error("empty export");
    }
    return out;
  } catch {
    throw new ImageProcessingError("EXPORT_FAILED", "Export failed");
  }
}
