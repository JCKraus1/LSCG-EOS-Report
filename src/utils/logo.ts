import itgLogo from '../assets/logo.png';

/**
 * Generates or fetches the crisp PNG logo for ITG / Tillman Fiber project.
 */

let cachedLogoBuffer: ArrayBuffer | null = null;
let cachedBase64: string | null = null;

export async function getLogoBase64(): Promise<string> {
  if (cachedBase64) return cachedBase64;

  try {
    const res = await fetch(itgLogo);
    if (!res.ok) throw new Error('Fetch failed');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        cachedBase64 = result;
        resolve(result);
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Fallback to direct logo URL:', err);
    return itgLogo;
  }
}

export async function getLogoBuffer(): Promise<ArrayBuffer> {
  if (cachedLogoBuffer) return cachedLogoBuffer;

  try {
    const res = await fetch(itgLogo);
    if (!res.ok) throw new Error('Fetch failed');
    const buf = await res.arrayBuffer();
    cachedLogoBuffer = buf;
    return buf;
  } catch (err) {
    console.error('Error loading logo buffer for docx:', err);
    return new ArrayBuffer(0);
  }
}

export { itgLogo };


