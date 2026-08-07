# Truth Tracker — Chrome MV3 extension

## Load unpacked

1. From `todo/`: `npm run build:extension`
2. Start backend: `npm run dev`
3. Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → select this `extension/` folder
4. Open Instagram Reels → floating **Verificar** or popup **Verificar reel actual**

## Demo (San Miguel)

Paste:

> En San Miguel hay 3000 extorsiones en este año, la mayoría de asaltos son por venezolanos y por motos. Por eso, para acabar con ella vamos a instalar más cámaras y vamos a sacar más policías a las calles.

The side panel opens automatically when the backend returns the report.

## Scripts

- `npm run build:extension` — bundle service worker, content script, popup
- `npm run demo:extension` — package sanity check + demo steps
