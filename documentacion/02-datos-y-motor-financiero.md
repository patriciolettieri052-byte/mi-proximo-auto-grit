# 02 · Contrato de datos y motor financiero
## App "Mi Próximo Auto" — Grupo Más Autos

---

## 1. `config.json`

Fuente única de verdad de todos los parámetros. **Ningún número financiero ni número de teléfono puede estar hardcodeado en el código de la app.**

```json
{
  "app": {
    "nombre": "Mi Próximo Auto",
    "version": "1.0"
  },
  "financiacion": {
    "tipo_cambio_usd_uyu": 40,
    "factor_cuota_banco": 0.024,
    "plazo_banco": 60,
    "plazos_casa": [12, 18, 24],
    "plazo_casa_default": 24,
    "interes_flat_mensual": 0.02,
    "costo_titulos": 550,
    "entrega_minima_pct": 0.50,
    "entrega_maxima_pct": 0.90,
    "leyenda_casa": "Requiere dos garantes. Sujeto a aprobación. Incluye gastos de títulos.",
    "leyenda_banco": "Sujeto a aprobación crediticia bancaria."
  },
  "contacto": {
    "whatsapp_grit": "59896772586",
    "whatsapp_mas_autos": "59896772586",
    "vendedor_nombre": "Hernán",
    "vendedor_cargo": "Asesor comercial",
    "direccion_grit": "Nueva Palmira 2064, Montevideo",
    "direccion_mas_autos": "Nueva Palmira 2061, Montevideo",
    "horario": "Lunes a viernes 9 a 19 · Sábados 9 a 13"
  },
  "ia": {
    "endpoint": "/api/asistente",
    "timeout_ms": 4000,
    "max_llamadas_sesion": 15
  },
  "analytics": {
    "meta_pixel_id": null,
    "google_tag_id": null
  }
}
```

**Nota sobre el tipo de cambio.** Está fijo en 40 y hoy se actualiza a mano. Si el TC real se mueve y este no, todas las cuotas en pesos quedan mal y el cliente lo descubre en el local. Debe revisarse junto con cada regeneración de stock.

---

## 2. `stock.json`

Mismo esquema que "Los Más Buscados", generado por el mismo importador. La app usa un subconjunto de campos.

```json
{
  "id": "MA-HYUNDAI-GRAND_I10-2014-01",
  "empresa": "mas_autos",
  "estado": "disponible",
  "marca": "Hyundai",
  "modelo": "Grand I10",
  "version": null,
  "anio": 2014,
  "km": 140000,
  "combustible": "nafta",
  "transmision": "manual",
  "carroceria": "hatchback",
  "puertas": 5,
  "color": "Gris",
  "precio_usd": 9490,
  "credito_propio": true,
  "foto_recorte": "img/vehiculos/MA-HYUNDAI-GRAND_I10-2014-01/recorte.webp",
  "foto_original": "img/vehiculos/MA-HYUNDAI-GRAND_I10-2014-01/original.webp",
  "orden": 1
}
```

### Campos que la app consume

| Campo | Uso | Obligatorio |
|---|---|---|
| `id` | Clave, analytics, deep link | Sí |
| `empresa` | Ruteo del número de WhatsApp y dirección | Sí |
| `estado` | Solo se muestran `"disponible"` | Sí |
| `marca` `modelo` `anio` | Título de tarjeta y mensaje de WhatsApp | Sí |
| `km` `combustible` | Línea de specs | Sí |
| `precio_usd` | **Base de todo cálculo** | Sí |
| `credito_propio` | Filtro: si `false`, no aparece para quien declaró clearing | Sí |
| `foto_recorte` | Imagen de tarjeta | No — hay fallback |

**`bono_usd` se ignora en la v1.** La campaña de bonos está en prueba y sin comunicación pública. Si el campo viene en el JSON, la app no lo lee.

### Reglas de integridad

- `precio_usd` ausente, cero o no numérico → **el vehículo se descarta silenciosamente**, no se muestra con cuota rota.
- `estado !== "disponible"` → no se muestra.
- `empresa` distinto de `"grit"` → se trata como `"mas_autos"` (mismo criterio que el importador).
- `credito_propio` ausente → se asume `true`.
- `foto_recorte` ausente o 404 → placeholder de silueta.

---

## 3. Motor financiero

Módulo único, sin dependencias, sin acceso al DOM. Se testea de forma aislada.

```javascript
const TIT = CFG.financiacion.costo_titulos / 2;   // 275

/* --- PLAN BANCO (UYU, 60 cuotas, sin entrega) --- */
function calcPlanBanco(precioUsd) {
  const tc = CFG.financiacion.tipo_cambio_usd_uyu;
  const f  = CFG.financiacion.factor_cuota_banco;
  if (!tc || !f || !precioUsd) return null;
  return Math.floor(precioUsd * tc * f / 100) * 100;   // redondeo ABAJO a centena
}

/* --- PLAN CASA: entrega mínima y máxima (USD, totales) --- */
function entregaMinima(precioUsd) {
  return Math.ceil(precioUsd * CFG.financiacion.entrega_minima_pct + TIT);
}
function entregaMaxima(precioUsd) {
  return Math.ceil(precioUsd * CFG.financiacion.entrega_maxima_pct + TIT);
}

/* --- PLAN CASA: cuota dada una entrega declarada --- */
function calcPlanCasa(precioUsd, entregaTotal, meses) {
  const min = precioUsd * CFG.financiacion.entrega_minima_pct;
  const max = precioUsd * CFG.financiacion.entrega_maxima_pct;
  const entregaCapital = entregaTotal - TIT;

  if (entregaCapital < min) return null;              // no califica
  const capUsada = Math.min(entregaCapital, max);     // tope 90%

  const financiado = (precioUsd - capUsada) + TIT;
  const i = CFG.financiacion.interes_flat_mensual;    // 0.02
  return Math.ceil(financiado * (1 / meses + i));     // USD, redondeo ARRIBA
}
```

### Los redondeos son intencionales y asimétricos

- **UYU (banco):** `Math.floor` a la centena. Evita cifras sucias de cara al cliente (`$ 8.647` → `$ 8.600`).
- **USD (casa):** `Math.ceil` al entero. Cubre el interés flat sin perder centavos por cuota.

**No los unifiques.** Si cambian, la app y la landing muestran cuotas distintas para el mismo auto.

### Corrección respecto de la landing

La implementación original de `calculatePlanCasa` divide por `24` fijo aunque la firma recibe `months`. Al portar se generaliza:

| Plazo | Multiplicador `(1/n + 0.02)` |
|---|---|
| 12 | 0,10333 |
| 18 | 0,07556 |
| 24 | 0,06167 |

**Esta corrección debe aplicarse también en la landing**, o los dos productos van a divergir cuando el usuario elija 12 o 18 cuotas.

---

## 4. Matcheo

La app **no invierte la fórmula**. Calcula la cuota de cada vehículo y compara contra el objetivo declarado.

```javascript
function evaluar(vehiculo, user) {
  const opciones = [];
  const permiteCasa  = vehiculo.credito_propio && user.entrega > 0;
  const permiteBanco = user.clearing === false;

  if (permiteCasa && entregaMinima(vehiculo.precio_usd) <= user.entrega) {
    const c = calcPlanCasa(vehiculo.precio_usd, user.entrega, user.meses);
    if (c !== null) opciones.push({
      plan: 'casa',
      cuotaUsd: c,
      cuotaUyu: c * CFG.financiacion.tipo_cambio_usd_uyu,
      entrega: Math.min(user.entrega, entregaMaxima(vehiculo.precio_usd))
    });
  }

  if (permiteBanco) {
    const c = calcPlanBanco(vehiculo.precio_usd);
    if (c !== null) opciones.push({ plan: 'banco', cuotaUyu: c, entrega: 0 });
  }

  const viables = opciones.filter(o => o.cuotaUyu <= user.cuota);
  if (!viables.length) return null;
  return viables.sort((a, b) => a.cuotaUyu - b.cuotaUyu)[0];   // el más barato
}
```

**Orden de la lista:** por `precio_usd` descendente. Se muestra primero el mejor auto que entra, no el más barato. El usuario ya declaró su techo; mostrarle lo más barato primero desperdicia su presupuesto.

**Comparación en pesos siempre.** El usuario declara su cuota en UYU. Las cuotas del Plan Casa se convierten a UYU con el TC de config para comparar. En pantalla se muestran las dos.

---

## 5. Estado de sesión

```javascript
const sesion = {
  ref: "MPA-4A7",              // generado al abrir, visible en el header
  ts_inicio: "2026-08-28T14:32:11-03:00",
  clearing: true,              // true | false | null (no sabe)
  plan: "casa",                // "casa" | "banco" | "ambos"
  entrega: 6000,               // USD declarados
  entrega_origen: "chip",      // "chip" | "texto" | "slider" | "permuta"
  permuta: false,
  permuta_detalle: null,       // "Gol 2012" si lo dijo
  cuota: 15000,                // UYU objetivo
  meses: 24,
  resultados_count: 4,
  autos_vistos: ["MA-VW-GOL-2016-01", "..."],
  auto_consultado: "GR-FIAT-CRONOS-2020-01",
  turnos_ia: 2,
  need_human_flags: []
};
```

**Persistencia:** cada cambio de estado se envía al backend indexado por `ref`. Es lo que permite que Chatwoot muestre la ficha cuando entra el WhatsApp.

**El `ref` se genera una vez por sesión** y viaja en todos los mensajes de WhatsApp de esa sesión. Formato `MPA-` + 3 caracteres alfanuméricos en mayúscula.

---

## 6. Generación del enlace de WhatsApp

Patrón heredado de `getWhatsAppCustomLink()`: devuelve un string, no muta el DOM. Se llama por tarjeta al renderizar.

```javascript
function armarLinkWA(vehiculo, fin, sesion) {
  const number = (vehiculo && vehiculo.empresa === 'grit')
    ? CFG.contacto.whatsapp_grit
    : CFG.contacto.whatsapp_mas_autos;

  let text;
  const auto = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}` : null;

  if (!vehiculo) {
    text = `Hola, vengo de la app Mi Próximo Auto. Quiero que me ayuden a encontrar un auto. Ref: ${sesion.ref}`;
  } else if (sesion.permuta) {
    text = `Hola, vengo de la app Mi Próximo Auto. Me interesa el ${auto}. Tengo un auto para entregar y quiero que me lo tasen. Puedo pagar una cuota de aprox. $ ${sesion.cuota.toLocaleString('es-UY')} UYU. Ref: ${sesion.ref}`;
  } else if (fin && fin.plan === 'casa') {
    text = `Hola, vengo de la app Mi Próximo Auto. Me interesa el ${auto}. Quiero solicitar la pre-aprobación del Crédito de la Casa con una entrega inicial de USD ${fin.entrega.toLocaleString('es-UY')} y ${sesion.meses} cuotas de USD ${fin.cuotaUsd.toLocaleString('es-UY')}. Ref: ${sesion.ref}`;
  } else if (fin && fin.plan === 'banco') {
    text = `Hola, vengo de la app Mi Próximo Auto. Me interesa el ${auto}. Quiero solicitar pre-aprobación del crédito bancario 100% en pesos de ${CFG.financiacion.plazo_banco} cuotas de aprox. $ ${fin.cuotaUyu.toLocaleString('es-UY')} UYU. Ref: ${sesion.ref}`;
  } else {
    text = `Hola, vengo de la app Mi Próximo Auto. Me interesa el ${auto}. Hoy llego con USD ${sesion.entrega.toLocaleString('es-UY')} de entrega y $ ${sesion.cuota.toLocaleString('es-UY')} por mes. ¿Se puede armar? Ref: ${sesion.ref}`;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
```

**La moneda va siempre explícita.** `USD 295`, nunca `295`. Un cliente que lee su propio mensaje y ve "24 cuotas de 295" puede entender pesos. Son USD 295 ≈ $ 11.800: es el malentendido más caro posible en este negocio.

**Apertura:** siempre `window.open(url, '_blank')` con `noopener noreferrer`.

---

## 7. Casos borde del motor

| Caso | Comportamiento |
|---|---|
| Entrega mayor al 90% del precio | Se capa al 90%. La cuota baja hasta ahí y no más. |
| Entrega exactamente igual al mínimo | Califica. La comparación es `<=`. |
| Cuota objetivo por debajo de todo el stock | Estado vacío con brecha calculada. |
| `precio_usd` = 0 o ausente | Vehículo descartado, no se muestra. |
| Clearing `null` (no sabe) | Se trata como `true` — solo Plan Casa. Conservador: mejor no prometer el bancario. |
| Sin entrega y con clearing | No hay producto. Se ofrece permuta. |
| `stock.json` no carga | Mensaje de error y CTA directo a WhatsApp. La app no queda en blanco. |
