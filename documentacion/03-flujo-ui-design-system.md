# 03 · Flujo, UI y sistema de diseño
## App "Mi Próximo Auto" — Grupo Más Autos

---

## PARTE A — FLUJO

### A1. Estructura

Tres pantallas con navegación inferior persistente. Sin onboarding de datos: el nombre, teléfono y mail se capturan cuando llega el WhatsApp, no antes.

```
[ Mi próximo auto ]   [ Chat ]   [ Vendedor ]
```

La app abre directo en **Chat**. La nav está visible desde el primer segundo — el usuario tiene que ver que hay más que un formulario.

### A2. Guión del chat

Seis intercambios cortos. El asistente pregunta poco y explica menos.

```
IA   Hola. Tres preguntas y te digo qué autos te entran.

IA   ¿Estás en el clearing o tenés atrasos? Acá eso no te frena.
     [Sí, estoy en clearing] [No] [No estoy seguro]
```

**Rama A — declara clearing (o no sabe):**

```
IA   Con eso trabajamos todos los días. Vas por el crédito de la casa:
     dos garantes y 50% de entrega. Desde USD 4.625.

IA   ¿Cuánto podés poner de entrega?
     [USD 5.000] [USD 8.000] [USD 12.500] [Entrego mi auto]
```

**Rama B — no declara clearing:**

```
IA   Listo.

IA   ¿Con cuánto arrancás?
     [No tengo entrega] [USD 5.000] [USD 8.000] [USD 12.500] [Entrego mi auto]
```

**Ambas ramas convergen:**

```
IA   ¿Cuánto podés pagar por mes?
     [$ 10.000] [$ 15.000] [$ 22.000] [$ 30.000] [Más de $ 40.000]

IA   Tengo 4 autos para vos.
     [Ver mis autos →]
```

**Regla de longitud:** ninguna línea del asistente supera una frase, con **una sola excepción**: el mensaje que sigue a declarar clearing. Ese menciona los garantes, el 50% y el piso en USD. Es el único punto donde la app da información en vez de pedirla, y es lo que evita que el usuario rebote en la pregunta siguiente.

**El piso en USD es calculado, no escrito.** Sale de `entregaMinima()` sobre el vehículo más accesible del stock elegible. Si el stock cambia, el número cambia solo.

### A3. Chips de entrega

Se generan desde el stock, no están hardcodeados:

```javascript
const piso = entregaMinima(vehiculoMasAccesible.precio_usd);
const base = Math.ceil(piso / 500) * 500;
// chips: base, base × 1,6, base × 2,5
```

`"No tengo entrega"` aparece **solo en la rama B**. Ofrecérselo a alguien en clearing es mentirle.

### A4. Permuta

Chip destacado en verde, no uno más de la fila. Para el perfil con clearing, la permuta suele ser la única vía realista de reunir el 50%.

```
IA   Bien. Hernán te lo tasa hoy — decile marca, modelo y año.
     [Escribirle a Hernán →]  [Poner un monto igual]
```

No hay tasación automática. Va directo al vendedor.

### A5. Texto libre

El usuario puede escribir en vez de tocar chips. Lo interpreta el asistente de IA (ver documento 05). Si la API falla, cae al parser de reglas y el usuario no se entera.

### A6. Pantalla de resultados

De arriba hacia abajo:

1. **Encabezado** — cantidad y condiciones aplicadas
2. **Selector de plazo** (12/18/24) — solo si hay Plan Casa en juego. Recalcula la lista viva.
3. **Ajuste opcional**, colapsado por defecto — dos sliders: entrega y cuota
4. **Lista de tarjetas**

El ajuste arranca **apagado**. Se activa como opt-in. El usuario ya declaró sus números; mostrarle sliders de entrada convierte la app en una calculadora y diluye el matcheo.

### A7. Tarjeta de vehículo

```
┌─────────────────────────────┐
│ [foto]      GRIT | CASA     │
├─────────────────────────────┤
│ Fiat Cronos Drive           │
│ 2020 · 55.000 km · nafta    │
│ USD 15.900                  │
│ ┌─────────────────────────┐ │
│ │ Entrega      USD 8.225  │ │
│ │ Cuota        USD 505    │ │
│ │ ≈ $ 20.200 · 24 cuotas  │ │
│ │ Requiere dos garantes.  │ │
│ └─────────────────────────┘ │
│ [ Pedir pre-aprobación ]    │
└─────────────────────────────┘
```

El badge de plan indica **cuál se aplicó**, no cuáles existen. Un vehículo elegible por ambos muestra el de cuota más baja.

### A8. Estado vacío — la pantalla más importante

Con el piso de entrada del crédito de la casa, va a aparecer seguido. **No es una pantalla de error.**

Muestra:
- El vehículo más accesible del stock elegible, con nombre y precio
- **La brecha exacta de entrega** en USD, si falta
- **La brecha exacta de cuota** en UYU, si falta
- Botón de WhatsApp igualmente disponible
- Una línea sobre la permuta como vía para cubrir la diferencia

Alguien que se entera de que le faltan USD 1.800 es un lead vivo que vuelve en un mes. Alguien que ve una lista vacía se va para siempre.

### A9. Salida a WhatsApp

El botón está en cada tarjeta, en el estado vacío, en la pantalla de vendedor y en el chip de `need_human`. Nunca hay un punto del flujo sin salida.

La pantalla de Vendedor muestra **la ficha que le llega a Hernán**: situación crediticia, plan, entrega, cuota, auto. El usuario ve exactamente qué se comparte. Eso reduce la fricción de "¿qué saben de mí?".

---

## PARTE B — SISTEMA DE DISEÑO

### B0. Conflictos con la guía original y cómo se resolvieron

La guía de estilos viene de una landing de producto único, desktop-first, tema oscuro. La app es mobile-first, con listas densas y chat. Seis puntos requerían decisión:

| # | Conflicto | Resolución |
|---|---|---|
| 1 | Naranja de la app `#FF6B00` vs. sistema `#F2820D` | **Gana `#F2820D`.** Unificación de ecosistema. |
| 2 | App clara vs. sistema oscuro | **Gana el oscuro.** Se migra toda la UI a `--ink`. |
| 3 | Verde WhatsApp `#00A650` vs. `#25D366` | **Gana `#25D366`** con texto `#04210C`. |
| 4 | Manrope Light (300) como peso de párrafo | **No se usa en la app.** A 13px sobre fondo oscuro en pantalla de teléfono al sol, el 300 es ilegible. Mínimo **400** para texto corrido, **500** para datos financieros. Esto es una extensión justificada, no un incumplimiento. |
| 5 | Badges cuadrados sin fondo, solo borde blanco | **Se respeta para el badge de empresa.** El badge de plan sí lleva fondo (naranja para casa, borde blanco para banco) porque es información funcional que debe distinguirse a un golpe de vista en una lista. |
| 6 | `--radius-card: 8px` vs. tarjetas de 15px del prototipo | **Gana 8px** en todo. |

**Tokens que el sistema no cubre y hay que agregar:** burbujas de chat, barra de navegación inferior, sliders, chips de respuesta, estados vacíos. Se derivan de la paleta existente sin introducir colores nuevos.

### B1. Fuentes

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Se elimina el peso 300 de Manrope y las variantes itálicas de Exo 2: no se usan en la app y son bytes en el critical path.

### B2. Tokens

```css
:root{
  /* --- Base del sistema (sin cambios) --- */
  --ink:#0F0D0A;
  --ink-pleno:#000000;
  --card-dark:#0F0D0A;
  --card-border:rgba(255,255,255,.18);
  --line-divider:#28231B;

  --accent:#F2820D;
  --accent-hover:#D97209;
  --wa:#25D366;
  --wa-hover:#1EB856;
  --wa-text:#04210C;

  --text-main:#FFFFFF;
  --text-body:#EDE9E3;
  --text-muted:rgba(255,255,255,.72);

  --header-bg:#FFFFFF;
  --header-text:#1A1612;
  --header-border:#E5E2DC;

  --radius-card:8px;
  --radius-btn:8px;
  --radius-badge:0px;

  /* --- Extensión para app (derivada, sin colores nuevos) --- */
  --surface-2:#171410;                    /* bloques dentro de tarjeta */
  --accent-soft:rgba(242,130,13,.12);     /* fondo de acento */
  --text-dim:rgba(255,255,255,.45);       /* terciario, placeholders */
  --bubble-ia:#171410;
  --bubble-user:var(--accent);
  --bubble-user-text:#120C03;
  --radius-bubble:14px;
  --radius-chip:22px;                     /* única excepción al radio: los chips son táctiles */
  --nav-h:62px;
}
```

### B3. Tipografía aplicada

| Elemento | Fuente | Peso | Tamaño | Color |
|---|---|---|---|---|
| Título de pantalla | Exo 2 | 800 | 20px | `--text-main` |
| Título de vehículo | Exo 2 | 800 | 17px | `--text-main` |
| Cuota destacada | Exo 2 | 800 | 22px | `--accent` |
| Burbuja de chat | Manrope | 400 | 15px | `--text-body` |
| Burbuja del usuario | Manrope | 500 | 15px | `--bubble-user-text` |
| Specs de vehículo | Manrope | 400 | 13px | `--text-muted` |
| Etiquetas financieras | Manrope | 500 | 13px | `--text-muted` |
| Valores financieros | Manrope | 700 | 13px | `--text-body` |
| Chips | Manrope | 600 | 14px | `--text-body` |
| Botones | Manrope | 600 | 15px | según fondo |
| Badges | Manrope | 600 | 11.5px, `letter-spacing:.1em`, MAYÚSCULAS | `--text-main` |
| Legal / disclaimers | Manrope | 400 | 11px | `--text-dim` |

**Exo 2 solo para títulos y cifras destacadas.** Todo lo demás es Manrope. Mezclarlas en el mismo bloque rompe la jerarquía.

### B4. Header

El header es **claro sobre app oscura** — es el patrón del sistema y funciona como anclaje de marca.

```css
.top{
  background:var(--header-bg);
  color:var(--header-text);
  border-bottom:1px solid var(--header-border);
  height:51px;
  padding:0 16px;
}
```

Contiene: logo, título de pantalla, y el código de referencia de sesión (`MPA-4A7`) como badge. Que el código sea visible desde el arranque no es decorativo: es lo que el usuario puede mencionar si llama por teléfono.

### B5. Componentes

**Tarjeta**
```css
.card{
  background:var(--card-dark);
  border:1px solid var(--card-border);
  border-radius:var(--radius-card);
  box-shadow:none;
  overflow:hidden;
}
```

**Badge de empresa** — sigue la regla del sistema: cuadrado, sin fondo, borde blanco.
```css
.badge-empresa{
  font-family:'Manrope';font-weight:600;font-size:.72rem;
  letter-spacing:.1em;text-transform:uppercase;
  padding:5px 12px;border-radius:0;
  background:transparent;border:1px solid #fff;color:#fff;
}
```

**Badge de plan** — excepción justificada: información funcional en lista.
```css
.badge-plan.casa {background:var(--accent);border:1px solid var(--accent);color:#120C03}
.badge-plan.banco{background:transparent;border:1px solid #fff;color:#fff}
```

**Botón WhatsApp** — tal cual el sistema, ancho completo en mobile.
```css
.btn-wa{
  display:flex;align-items:center;justify-content:center;gap:8px;
  width:100%;background:var(--wa);color:var(--wa-text);
  font-family:'Manrope';font-weight:600;font-size:.88rem;
  padding:12px 22px;border-radius:var(--radius-btn);border:none;
  box-shadow:0 4px 15px rgba(37,211,102,.3);
  transition:all .2s ease-in-out;
}
.btn-wa:hover{background:var(--wa-hover);transform:translateY(-1px);
  box-shadow:0 6px 20px rgba(37,211,102,.45)}
```

**Chips** — único componente con radio alto. Son objetivos táctiles y el pill los hace obvios.
```css
.chip{
  border:1px solid var(--card-border);border-radius:var(--radius-chip);
  background:transparent;color:var(--text-body);
  font-family:'Manrope';font-weight:600;font-size:14px;
  padding:10px 16px;min-height:42px;
}
.chip:active{background:var(--accent);border-color:var(--accent);color:#120C03}
.chip.permuta{border-color:var(--wa);color:var(--wa)}
```

**Nav inferior**
```css
.nav{
  height:var(--nav-h);
  background:var(--ink-pleno);
  border-top:1px solid var(--line-divider);
  padding-bottom:env(safe-area-inset-bottom);
}
.nav button{color:var(--text-dim);font-family:'Manrope';font-weight:600;font-size:10.5px}
.nav button.on{color:var(--accent)}
```

**Sliders**
```css
input[type=range]{height:4px;background:var(--line-divider);border-radius:4px}
input[type=range]::-webkit-slider-thumb{
  width:26px;height:26px;border-radius:50%;
  background:var(--accent);border:3px solid var(--ink);
  box-shadow:0 2px 8px rgba(242,130,13,.4);
}
```

### B6. Reglas inquebrantables

1. **Ningún texto lleva `text-shadow`.** `* { text-shadow: none !important; }`
2. **Ningún enlace de WhatsApp se abre en la misma pestaña.** Siempre `target="_blank" rel="noopener noreferrer"` o `window.open(url,'_blank')`.
3. **Ningún color fuera de los tokens.** Si hace falta un color nuevo, se agrega al `:root` con nombre, no inline.
4. **Ninguna cifra financiera en peso menor a 500.** Los números tienen que leerse en la calle, con sol.
5. **Ningún objetivo táctil menor a 42px de alto.**
6. **Ninguna cuota en pantalla sin su moneda.** `USD 505` o `$ 20.200`, nunca `505`.

### B7. Layout mobile

- Padding lateral de seguridad: `16px`
- Padding interno de tarjetas: `20px 16px`
- Separación entre tarjetas: `12px`
- Botones de acción en tarjeta: `width: 100%`
- Ancho máximo de contenedor: `480px`, centrado en pantallas grandes
- Alto del área de chat: `100dvh` menos header y nav, con scroll interno
- Respetar `env(safe-area-inset-bottom)` en nav y barra de input

### B8. Accesibilidad

- Contraste mínimo 4.5:1 para texto. `--text-muted` sobre `--ink` cumple; `--text-dim` **solo para texto no esencial**.
- Foco visible en todos los interactivos: `outline: 2px solid var(--accent)`.
- Los chips son `<button>`, no `<div>`.
- El chat anuncia mensajes nuevos con `aria-live="polite"`.
- El estado del ajuste colapsable se comunica con `aria-expanded`.
