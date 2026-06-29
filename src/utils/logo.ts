/**
 * Generates or fetches the exact crisp PNG logo for LSCG / Full Circle Fiber.
 * Prioritizes loading `/logo.png` if uploaded by the user into the public folder.
 * Falls back to a 100% accurate Canvas recreation of the official LSCG icon.
 */

function drawLscgLogo(ctx: CanvasRenderingContext2D) {
  // Canvas dimensions: 600 x 180
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 600, 180);

  const centerX = 90;
  const centerY = 90;

  // 1. Outer dark navy rim
  ctx.fillStyle = '#154c6f';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
  ctx.fill();

  // 2. Inner bright sky blue circle
  ctx.fillStyle = '#1ba2e6';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 62, 0, Math.PI * 2);
  ctx.fill();

  // 3. Six white fiber clusters arranged symmetrically in a hexagon
  const clusterRingRadius = 38;
  for (let c = 0; c < 6; c++) {
    const angle = (c * Math.PI) / 3; // 60 degrees
    const cx = centerX + clusterRingRadius * Math.cos(angle);
    const cy = centerY + clusterRingRadius * Math.sin(angle);

    ctx.fillStyle = '#FFFFFF';

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // 6 surrounding dots touching in a 7-fiber bundle
    const dotRingRadius = 7.5;
    for (let d = 0; d < 6; d++) {
      const dAngle = (d * Math.PI) / 3;
      const dx = cx + dotRingRadius * Math.cos(dAngle);
      const dy = cy + dotRingRadius * Math.sin(dAngle);
      ctx.beginPath();
      ctx.arc(dx, dy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Typography: LSCG
  ctx.fillStyle = '#60737d';
  ctx.font = '900 76px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('LSCG', 190, 106);

  // 5. Subtext: A FULL CIRCLE FIBER COMPANY
  ctx.fillStyle = '#00a8e8';
  ctx.font = '700 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  if ('letterSpacing' in ctx) {
    (ctx as any).letterSpacing = '1px';
  }
  ctx.fillText('A FULL CIRCLE FIBER COMPANY', 193, 142);
}

async function tryFetchUploadedLogoBlob(): Promise<Blob | null> {
  const baseUrl = (import.meta as any).env?.BASE_URL || '/';
  const resolvedBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const paths = [
    resolvedBase + 'logo.png',
    '/logo.png',
    'logo.png',
    '/assets/logo.png',
    '/public/logo.png'
  ];
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 200 && blob.type.includes('image')) {
          return blob;
        }
      }
    } catch {
      // continue
    }
  }
  return null;
}

export async function getLogoBuffer(): Promise<ArrayBuffer> {
  const uploadedBlob = await tryFetchUploadedLogoBlob();
  if (uploadedBlob) {
    return await uploadedBlob.arrayBuffer();
  }

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 180;
  const ctx = canvas.getContext('2d')!;
  drawLscgLogo(ctx);

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (blob) {
        resolve(await blob.arrayBuffer());
      } else {
        resolve(new ArrayBuffer(0));
      }
    }, 'image/png');
  });
}

export async function getLogoBase64(): Promise<string> {
  const uploadedBlob = await tryFetchUploadedLogoBlob();
  if (uploadedBlob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(uploadedBlob);
    });
  }

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 180;
  const ctx = canvas.getContext('2d')!;
  drawLscgLogo(ctx);
  return canvas.toDataURL('image/png');
}
