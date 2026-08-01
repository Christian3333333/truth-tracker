# 03 — Popup activación + panel automático

**What to build:** Popup de la extensión para configurar la URL del backend y activar "Verificar reel actual"; al completar cualquier verificación (manual o futura automática), el panel lateral se abre automáticamente en Instagram con el informe — sin popup de resumen intermedio.

**Blocked by:** 02 — Verificación manual en Instagram

**Status:** ready-for-agent

- [ ] Popup: input URL backend (default localhost), botón "Verificar reel actual", estados loading/error
- [ ] Activación desde popup dispara el mismo flujo de verificación que el content script
- [ ] Al recibir informe, service worker notifica content script → panel lateral se abre y renderiza sin acción extra del usuario
- [ ] `verificationReport` persiste entre service worker y content script (storage TBD: session o local)
- [ ] Demo: activar verificación desde popup con guión manual → panel aparece solo al terminar
