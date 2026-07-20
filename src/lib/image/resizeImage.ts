// AI 호출/업로드 전에 사진을 적당한 크기로 줄인다. 원본 그대로 보내면 토큰 비용도 늘고
// 요청 본문 용량 제한에 걸릴 수 있다.
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.85;

export async function resizeImageToDataUrl(source: Blob): Promise<{ dataUrl: string; blob: Blob }> {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image resize failed.'))), 'image/jpeg', JPEG_QUALITY);
  });

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Image read failed.'));
    reader.readAsDataURL(blob);
  });

  return { dataUrl, blob };
}
