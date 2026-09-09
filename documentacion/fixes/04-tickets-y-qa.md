# 04 · Tickets de implementación y QA
## App "Mi Próximo Auto" — Grupo Más Autos

Cada ticket tiene contexto cerrado, archivos mapeados y criterios de aceptación verificables. El dev no debería necesitar preguntar nada para ejecutarlos.

---

## Estructura de archivos

```
/app/
  index.html
  css/
    tokens.css          T1
    app.css             T2
  js/
    config.js           T3   carga config.json
    stock.js            T3   carga y sanea stock.json
    finance.js          T4   motor financiero — sin DOM
    matcher.js          T5   evaluación y ordenamiento
    chat.js             T6   guión y máquina de estados
    ia.js               T7   cliente del asistente + fallback
    render.js           T8   pintado de resultados
    whatsapp.js         T9   armado de enlaces
    session.js          T10  estado, ref, persistencia
    analytics.js        T11  eventos
    main.js             T12  arranque y navegación
  data/
    config.json
    stock.json
  img/vehiculos/...
/api/
  asistente.js          T7   función serverless, clave de OpenAI
```

---

## T1 · Tokens y fuentes

**Qué:** crear `tokens.css` con el `:root` completo del documento 03 sección B2, y el `<link>` de Google Fonts en el `<head>` con preconnect.

**Cerco:** ningún otro archivo declara colores. Si aparece un hex fuera de `tokens.css`, el ticket está mal hecho.

**Aceptación:**
- [ ] `grep -r "#" css/app.css` no devuelve códigos de color hex
- [ ] Exo 2 (700, 800) y Manrope (400, 500, 600, 700) cargan; el peso 300 **no** se solicita
- [ ] `* { text-shadow: none !important; }` está presente

---

## T2 · Shell de la app

**Qué:** header claro de 51px, contenedor de vista con scroll, nav inferior de 62px. Tres vistas conmutadas por clase, sin router.

**Aceptación:**
- [ ] Alto total `100dvh`, sin scroll de página — solo scroll interno de vista
- [ ] Nav respeta `env(safe-area-inset-bottom)` (verificar en iPhone con notch)
- [ ] Contenedor centrado con `max-width: 480px` en desktop
- [ ] Header muestra el `ref` de sesión desde el primer render
- [ ] Todos los objetivos táctiles miden ≥42px de alto

---

## T3 · Carga y saneo de datos

**Qué:** cargar `config.json` y `stock.json` antes de renderizar. Aplicar las reglas de integridad del documento 02 sección 2.

**Cerco:** ningún parámetro financiero ni número de teléfono hardcodeado en JS.

**Aceptación:**
- [ ] Vehículo sin `precio_usd`, con cero, o no numérico → descartado sin error visible
- [ ] `estado !== "disponible"` → no se muestra
- [ ] `empresa` distinto de `"grit"` → tratado como `"mas_autos"`
- [ ] `credito_propio` ausente → `true`
- [ ] `bono_usd` presente en el JSON → **ignorado**
- [ ] Si `stock.json` falla, se muestra mensaje y CTA directo a WhatsApp; la app no queda en blanco

---

## T4 · Motor financiero

**Qué:** portar `calcPlanBanco`, `entregaMinima`, `entregaMaxima`, `calcPlanCasa` según documento 02 sección 3.

**Cerco:** `finance.js` no toca el DOM, no lee variables globales fuera de `CFG`, y es testeable de forma aislada.

**Corrección obligatoria al portar:** `calcPlanCasa` usa el parámetro `meses`, no `24` hardcodeado.

**Aceptación — tabla de valores esperados** (precio USD 8.990, TC 40):

| Función | Entrada | Salida esperada |
|---|---|---|
| `calcPlanBanco` | 8990 | `8600` |
| `entregaMinima` | 8990 | `4770` |
| `entregaMaxima` | 8990 | `8366` |
| `calcPlanCasa` | (8990, 4770, 24) | `295` |
| `calcPlanCasa` | (8990, 4770, 18) | `354` |
| `calcPlanCasa` | (8990, 4770, 12) | `485` |
| `calcPlanCasa` | (8990, 3000, 24) | `null` — bajo el mínimo |
| `calcPlanCasa` | (8990, 20000, 24) | igual que con 8366 — capado al 90% |

- [ ] Los ocho casos pasan
- [ ] `Math.floor` a centena en UYU y `Math.ceil` a entero en USD, **sin unificar**
- [ ] **Test cruzado:** para el mismo vehículo y la misma entrega, la cuota de la app coincide al peso con la de la landing "Los Más Buscados". Si difiere, hay dos fuentes de verdad y el ticket no está terminado.

---

## T5 · Matcheo

**Qué:** implementar `evaluar()` y el ordenamiento según documento 02 sección 4.

**Aceptación:**
- [ ] Con `clearing: true`, ningún vehículo con `credito_propio: false` aparece
- [ ] Con `clearing: true` y `entrega: 0`, el resultado es vacío (no hay producto)
- [ ] Con `clearing: false` y `entrega: 0`, aparecen solo opciones de plan banco
- [ ] Vehículo elegible por ambos planes → se muestra el de cuota más baja
- [ ] Lista ordenada por `precio_usd` descendente
- [ ] La comparación contra la cuota objetivo se hace siempre en UYU

---

## T6 · Chat y máquina de estados

**Qué:** guión de tres preguntas con bifurcación por clearing, según documento 03 parte A.

**Aceptación:**
- [ ] Orden fijo: clearing → entrega → cuota
- [ ] Rama con clearing: **no** se ofrece "No tengo entrega"
- [ ] Rama con clearing: el mensaje de condiciones incluye garantes, 50% y el piso en USD **calculado desde el stock**, no escrito a mano
- [ ] Chips de entrega generados desde el stock (`base`, `×1,6`, `×2,5`)
- [ ] Chip de permuta con estilo diferenciado, salida directa a WhatsApp
- [ ] Ninguna línea del asistente supera una frase, salvo el mensaje de condiciones
- [ ] Si el usuario adelanta un dato de otra pregunta, se guarda y no se vuelve a preguntar

---

## T7 · Asistente de IA

**Qué:** función serverless en `/api/asistente` que llama a OpenAI `gpt-4o-mini` con el system prompt del documento 05. Cliente en `ia.js` con timeout y fallback.

**Cerco:** la clave de OpenAI **nunca** llega al navegador. Si aparece en el bundle o en una request del cliente, es un incidente de seguridad, no un bug.

**Aceptación:**
- [ ] `response_format: json_object`, `temperature: 0.5`, `max_tokens: 120`
- [ ] Las dos tablas de casos del documento 05 sección 5 pasan (normales y adversariales)
- [ ] **Test crítico:** el `reply` nunca contiene una cifra de cuota, precio o entrega que el usuario no haya dicho antes
- [ ] Timeout de 4s → cae al parser de reglas, sin error visible
- [ ] JSON inválido → cae al parser de reglas
- [ ] Máximo 15 llamadas por sesión; superado eso, solo chips
- [ ] `need_human: true` → chip a WhatsApp, **una sola vez por sesión**, sin cortar el chat

### T7b · Gating de la máquina de estados

**Qué:** implementar `procesarTurno()` según documento 05 sección 6. El paso del guión **solo avanza con un valor válido**.

**Cerco:** `enRango()` se implementa en el código con los valores de `config.json`. No se confía en la validación del modelo.

- [ ] `intent` en `absurdo` / `confuso` / `hostil` → repregunta, **no avanza**
- [ ] `intent: "abandono"` → modo abandono, guión detenido, dos salidas visibles, sin insistir
- [ ] `intent: "pregunta"` → se responde o se ofrece WhatsApp, **no avanza**, el chat no se corta
- [ ] `field` o `value` en null → repregunta, no avanza
- [ ] Valor fuera de rango → repregunta aunque el modelo lo haya marcado como válido
- [ ] `confidence: "low"` → confirmación antes de guardar
- [ ] Tres intentos fallidos en el mismo paso → solo chips, texto libre desactivado en ese paso
- [ ] **Test adversarial completo:** recorrer la app respondiendo solo con absurdos, abandonos y preguntas. La app **nunca** debe llegar a la pantalla de resultados.

---

## T8 · Pantalla de resultados

**Qué:** encabezado, selector de plazo, ajuste colapsable, lista de tarjetas y estado vacío.

**Aceptación:**
- [ ] Ajuste **colapsado** por defecto
- [ ] Selector de plazo oculto si el plan es solo banco
- [ ] Cambiar el plazo recalcula la lista sin recargar
- [ ] Mover cualquier slider repinta en vivo
- [ ] Badge de la nav muestra la cantidad de resultados
- [ ] Toda cuota en pantalla lleva moneda explícita
- [ ] Plan Casa muestra USD y la conversión aproximada en UYU

**Estado vacío:**
- [ ] Muestra el vehículo más accesible con nombre y precio
- [ ] Muestra la brecha de entrega en USD, si falta
- [ ] Muestra la brecha de cuota en UYU, si falta
- [ ] El botón de WhatsApp está disponible
- [ ] Menciona la permuta como vía de cobertura
- [ ] **No** dice "no hay resultados" ni parece un error

---

## T9 · Enlaces de WhatsApp

**Qué:** implementar `armarLinkWA()` según documento 02 sección 6. Se llama por tarjeta al renderizar.

**Aceptación:**
- [ ] Cinco variantes de mensaje implementadas (sin auto, permuta, casa, banco, no califica)
- [ ] La moneda es explícita en todos: `USD 295`, nunca `295`
- [ ] El `ref` de sesión está en todos los mensajes
- [ ] El número se rutea por `vehiculo.empresa`
- [ ] `encodeURIComponent` aplicado al texto
- [ ] Apertura con `window.open(url, '_blank')` y `noopener noreferrer`
- [ ] **Test de ruteo:** cambiar temporalmente `whatsapp_grit` en config y verificar que un vehículo de Grit va a ese número. Hoy ambos números son iguales y esta lógica nunca se ejerció.

---

## T10 · Sesión y persistencia

**Qué:** generar el `ref` al abrir, mantener el objeto de sesión del documento 02 sección 5, persistirlo en backend en cada cambio.

**Aceptación:**
- [ ] `ref` con formato `MPA-` + 3 alfanuméricos en mayúscula
- [ ] Un solo `ref` por sesión, visible en el header
- [ ] Cada cambio de estado se persiste indexado por `ref`
- [ ] El registro incluye `autos_vistos` y `auto_consultado`
- [ ] Los `need_human` quedan logueados con el mensaje literal del usuario

---

## T11 · Analytics

**Qué:** Meta Pixel + GA4 con los seis eventos del documento 01 sección 3.

**Aceptación:**
- [ ] `app_open`, `q1_answered`, `q2_answered`, `q3_answered`, `results_shown`, `empty_state_shown`, `wa_click`, `need_human_click`
- [ ] `results_shown` incluye la cantidad
- [ ] `wa_click` incluye plan, id de vehículo y `ref`
- [ ] `empty_state_shown` incluye entrega y cuota declaradas — es el dato que dice si la campaña trae al público equivocado

---

## T12 · Arranque y navegación

**Qué:** conmutación de vistas, títulos de header por pantalla, estado inicial.

**Aceptación:**
- [ ] Abre en Chat con la nav visible
- [ ] Las tres vistas conmutan sin recargar
- [ ] La pantalla de Vendedor muestra la ficha exacta que recibe Hernán
- [ ] Antes de completar el chat, la pantalla de resultados muestra un estado inicial con CTA al chat

---

## QA final antes de publicar

### Funcional
- [ ] Rama con clearing recorrida de punta a punta hasta WhatsApp
- [ ] Rama sin clearing recorrida hasta WhatsApp
- [ ] Rama de permuta recorrida hasta WhatsApp
- [ ] Estado vacío alcanzado y con salida a WhatsApp funcionando
- [ ] Los tres plazos recalculan correctamente
- [ ] Texto libre funciona con la IA caída

### Consistencia financiera
- [ ] Diez vehículos comparados entre app y landing: cuotas idénticas al peso
- [ ] Ninguna cuota en pantalla sin moneda
- [ ] El tipo de cambio de `config.json` es el vigente al publicar

### Visual
- [ ] Ningún hex fuera de `tokens.css`
- [ ] Ningún `text-shadow`
- [ ] Ninguna cifra financiera con peso tipográfico menor a 500
- [ ] Probado en iPhone SE (pantalla chica), iPhone 15 (notch) y un Android de gama media
- [ ] Legible al sol: contraste verificado en exterior, no solo en monitor

### Seguridad
- [ ] La clave de OpenAI no aparece en el cliente, ni en el bundle, ni en ninguna request
- [ ] Rate limit de 15 llamadas por sesión activo
- [ ] Todos los enlaces externos con `noopener noreferrer`

### Contenido
- [ ] La app nunca insinúa que el 50% de entrega es negociable
- [ ] La app nunca nombra un vehículo que no esté en el stock
- [ ] Las leyendas legales de ambos planes aparecen en las tarjetas correspondientes

### Adversarial (obligatorio antes de publicar)
- [ ] Cifras imposibles rechazadas con humor, sin avanzar el paso
- [ ] "No voy a comprar nada" detiene el guión sin insistir
- [ ] Preguntas al asistente respondidas o derivadas, sin avanzar el paso
- [ ] Intentos de sacar al modelo de su rol → respuesta neutra y retoma
- [ ] Nunca se llega a resultados sin haber dado los tres datos válidos
