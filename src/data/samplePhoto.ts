const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1264A3"/>
      <stop offset="1" stop-color="#4A154B"/>
    </linearGradient>
  </defs>
  <rect width="320" height="400" fill="url(#g)"/>
  <circle cx="160" cy="150" r="46" fill="rgba(255,255,255,0.9)"/>
  <path d="M90 340c0-58 31-94 70-94s70 36 70 94v20H90v-20z" fill="rgba(255,255,255,0.9)"/>
  <text x="160" y="386" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="rgba(255,255,255,0.7)" letter-spacing="2">SAMPLE PHOTO</text>
</svg>
`.trim();

export const samplePhotoDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
