# 02 — Verificación manual en Instagram

**What to build:** Extensión Chrome MV3 que se carga en Instagram, permite pegar el guión de un reel en un modal cuando no hay extracción automática, llama al backend de verificación, y muestra el informe completo en un panel lateral inyectado en la página (secciones correcta, falsa, sin_evidencia, selectiva, analisis_medidas con fuentes clicables).

**Blocked by:** 01 — Verification API (texto + audio)

**Status:** ready-for-agent

- [ ] Extensión MV3 carga sin errores en Chrome (`manifest.json`, service worker, content script en instagram.com)
- [ ] Modal bloqueante (P4): textarea + "Verificar texto" + cancelar
- [ ] Service worker envía transcript al backend configurado y recibe `VerificationReport`
- [ ] Panel lateral (P3) renderiza todas las secciones del informe; botón cerrar vuelve al reel
- [ ] Estados loading y error visibles durante la verificación
- [ ] Demo: pegar guión San Miguel en Instagram → panel con informe categorizado y fuentes
