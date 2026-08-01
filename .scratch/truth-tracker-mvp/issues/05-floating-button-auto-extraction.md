# 05 — Botón flotante + extracción automática

**What to build:** Botón "Verificar" flotante en el reel activo de Instagram que extrae el guión automáticamente (captions del DOM → si no hay, audio del video al backend), envía al pipeline de verificación, y abre el panel lateral con el informe — sin pegar guión manualmente.

**Blocked by:** 03 — Popup activación + panel automático; 04 — Spike: extracción Instagram

**Status:** ready-for-agent

- [ ] Botón flotante visible en reel activo; spinner durante verificación
- [ ] Extracción: captions DOM primero; fallback audio blob → backend Deepgram
- [ ] Si extracción falla: error claro + oferta de modal pegar guión (P4)
- [ ] Extracción ≥ 80% del contenido hablado en al menos un reel de prueba curado
- [ ] Demo: click flotante en reel real → panel con informe completo en ≤ 90 s
