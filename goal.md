# Objetivo: Truth Tracker — Verificador de Reels de Instagram

## Resumen

Construir un complemento de Chrome (Manifest V3) para Instagram Reels que, al activarse en un reel, extraiga el guión del video, lo envíe a un backend de verificación (Tavily + Claude Haiku) y muestre un informe estructurado con: información correcta, información falsa, información selectiva (Sí/No) con contexto y fuentes, afirmaciones sin evidencia suficiente, y análisis de medidas propuestas.

## Decisiones de diseño (grilling)


| Tema                     | Decisión                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Extracción de guión      | Captions del DOM → si no hay, audio del `<video>` → Deepgram                              |
| Transcripción            | En el backend (Deepgram), no en el navegador                                              |
| Modelo de costo          | Uso personal; el desarrollador paga las APIs (~alerta si > $0.50/reel)                    |
| Arquitectura             | **Fase 1:** backend en `localhost` (Next.js en `todo/`) → **Fase 2:** desplegar a la nube |
| Búsqueda web             | Tavily                                                                                    |
| Análisis de afirmaciones | Claude Haiku                                                                              |
| UI del informe           | Panel lateral en Instagram                                                                |
| Activación               | Botón flotante en el reel + acción en popup de la extensión                               |
| Sin fuentes verificables | Cuarta categoría: `sin_evidencia` (ni verdadera ni falsa)                                 |
| Fallo de extracción      | Error claro + opción de pegar guión manualmente                                           |




## Flujo de usuario

1. El usuario está en Instagram viendo un reel.
2. Activa la verificación desde el **botón flotante** en el reel o desde el **popup de la extensión**.
3. La extensión extrae el guión: captions del DOM; si no hay, captura audio del `<video>` y lo envía al backend para transcripción (Deepgram).
4. Si la extracción falla por completo, se muestra un error y el usuario puede **pegar el guión manualmente**.
5. El backend busca información en la web (Tavily) y analiza afirmaciones (Claude Haiku).
6. La extensión muestra un **panel lateral** dentro de Instagram con el informe completo y fuentes clicables.



## Formato de salida esperado



### Información correcta

Lista de afirmaciones verdaderas, cada una con fuente.

**Ejemplo:**

> 3000 extorsiones en 2026 (Correcto) según Observatorio de Seguridad Ciudadana.



### Información falsa

Lista de afirmaciones falsas con respaldo en evidencia, cada una con fuente o explicación.

**Ejemplo:**

> El robo en moto solo representa el 40% de los robos.



### Sin evidencia suficiente

Afirmaciones que no pueden clasificarse como verdaderas ni falsas por falta de fuentes verificables en la web.

**Ejemplo:**

> No hay información verificable de que la mayoría de asaltantes sean venezolanos.



### Información selectiva

- **Resultado:** Sí / No
- **Explicación:** qué contexto falta y cuál es el panorama completo.

**Ejemplo:**

> Sí. No se cuenta la información completa sobre el dimensionamiento y las causas del problema.
> El robo se compone por: asaltos al paso (30%), asaltos con moto (40%), extorsiones por llamadas (30%).
> Las extorsiones se dan por facilidad para amenazar y dificultad para rastrear números.
> Por lo tanto, las acciones más recomendadas o efectivas son: rastreo financiero, rastreo de identificación.
> Las medidas planteadas no son efectivas porque: [razón basada en evidencia].



## Caso de prueba de referencia

**Input (guión del reel):**

> En San Miguel hay 3000 extorsiones en este año, la mayoría de asaltos son por venezolanos y por motos. Por eso, para acabar con ella vamos a instalar más cámaras y vamos a sacar más policías a las calles.

**Output esperado:** informe con las cuatro secciones de afirmaciones pobladas (`correcta`, `falsa`, `sin_evidencia`, `selectiva`), al menos una fuente por afirmación verificada, y evaluación de las medidas propuestas en `analisis_medidas`.

## Criterios de éxito


| Criterio             | Umbral                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Instalación          | La extensión carga sin errores en Chrome                                                                         |
| Extracción de guión  | Obtiene el texto de un reel de prueba (≥ 80% del contenido hablado)                                              |
| Informe estructurado | JSON con secciones: `correcta`, `falsa`, `sin_evidencia`, `selectiva`, `analisis_medidas`                        |
| Caso San Miguel      | Produce salida con categorías pobladas y fuentes citadas                                                         |
| Tiempo de respuesta  | ≤ 90 s para un reel de 30–60 s                                                                                   |
| Precisión mínima     | En 3 reels de prueba curados manualmente, ≥ 2 clasifican correctamente afirmaciones obviamente verdaderas/falsas |




## En alcance (MVP)

- Complemento Chrome para Instagram Reels (Manifest V3)
- Extracción de guión: captions del DOM → Deepgram si no hay captions
- Fallback manual: pegar guión si falla la extracción automática
- Backend Next.js en `todo/`: API de verificación (Tavily + Claude Haiku + Deepgram)
- Panel lateral con detalle completo
- Botón flotante en reel + activación desde popup de extensión
- Idioma principal: español
- Despliegue: localhost primero, nube después



## Fuera de alcance (fases posteriores)

- YouTube, TikTok u otras plataformas
- Verificación automática sin acción del usuario (overlay en tiempo real)
- Base de datos propia de fact-checking
- Moderación legal por jurisdicción
- Detección de deepfakes o manipulación visual
- Auth de usuarios, cuotas y modelo freemium



## Stack técnico


| Componente    | Tecnología           |
| ------------- | -------------------- |
| Extensión     | Chrome Manifest V3   |
| Backend       | Next.js 16 (`todo/`) |
| STT           | Deepgram             |
| Búsqueda web  | Tavily               |
| Análisis LLM  | Claude Haiku         |
| Deploy Fase 1 | `localhost`          |
| Deploy Fase 2 | Nube (p. ej. Vercel) |




## Arquitectura

```
Usuario en Reel
    → Extensión Chrome
        → [Botón flotante / popup] Activar verificación
        → Extraer guión
            → Captions DOM → texto
            → Si no hay: audio <video> → Backend → Deepgram
            → Si falla: usuario pega guión manualmente
        → Backend API (localhost → nube)
            → Tavily: búsqueda web
            → Claude Haiku: extraer afirmaciones
            → Claude Haiku: comparar afirmaciones vs evidencia
        → Informe estructurado (JSON)
    → Panel lateral: detalle completo + fuentes
```



## Condición de parada

Detenerse y consultar al usuario si:

- Ni la extracción automática ni el fallback manual de guión son viables para continuar el MVP
- El costo por verificación supera un umbral razonable (p. ej. > $0.50/reel) de forma sostenida

**No detenerse** por afirmaciones sin fuentes verificables: clasificarlas en `sin_evidencia` y continuar el informe.

**No detenerse** por bloqueo puntual de Instagram: ofrecer fallback manual (pegar guión).