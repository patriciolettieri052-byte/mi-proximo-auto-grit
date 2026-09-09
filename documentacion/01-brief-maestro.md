# 01 · Brief maestro
## App "Mi Próximo Auto" — Grupo Más Autos

Versión 1.0 · Documento de referencia para desarrollo

---

## 1. Qué es

Una web app de tres pantallas que le pregunta a una persona su situación crediticia, su entrega disponible y su cuota mensual, y le devuelve **solo los vehículos del stock que realmente puede comprar**, con el número de cuota real y un botón de WhatsApp con el mensaje ya armado.

No es un catálogo. No es un configurador. Es un filtro de viabilidad financiera que termina en una conversación de WhatsApp calificada.

---

## 2. Por qué existe

La campaña de Meta "decime tu cuota y te busco el auto" genera ~50 consultas diarias a WhatsApp a USD 0,15 cada una. Ese volumen colapsa el teléfono del vendedor y llega sin calificar: la mayoría no tiene la entrega necesaria, y eso se descubre después de varios mensajes.

La app mueve esa calificación al principio y hacia el usuario. El que llega al WhatsApp ya sabe qué necesita y ya sabe que le da.

**Métrica de éxito:** no es el volumen de leads. Es la tasa lead→visita, hoy en ~10%. El objetivo es llevarla a ~14%.

---

## 3. El riesgo que hay que medir

La app **agrega pasos** entre el anuncio y el vendedor. Contra un click-to-WhatsApp directo, es razonable esperar que el CPL suba de USD 0,15 a USD 0,60–0,80 y que el volumen caiga a ~300/mes.

Eso se justifica **solo si esos leads convierten mucho mejor**. No es una suposición que se pueda dar por buena: hay que instrumentarla desde el día uno y comparar contra el canal directo corriendo en paralelo.

**Instrumentación mínima obligatoria:**

| Evento | Qué mide |
|---|---|
| `app_open` | Llegadas |
| `q1_answered` / `q2_answered` / `q3_answered` | Dónde se cae el embudo |
| `results_shown` (con cantidad) | Cuántos ven stock viable |
| `empty_state_shown` | Cuántos no llegan — el número clave |
| `wa_click` (con plan, auto, ref) | Conversión de la app |
| `need_human_click` | Fugas laterales |

Sin esto la app no se puede evaluar y no se debería lanzar.

---

## 4. La restricción que define todo el producto

El **crédito de la casa** exige, sin excepción:

- **Dos garantes**
- **50% de entrega** sobre el precio del vehículo

Esto es una regla dura confirmada por el cliente. No se negocia caso a caso y la app no puede insinuar que sí.

**Consecuencia:** el diferencial del negocio (aceptar clearing) tiene un piso de entrada alto. Con el stock actual, la entrega mínima ronda **USD 4.600** para el vehículo más accesible. Una persona en clearing sin ese capital líquido no es cliente hoy, y la app tiene que decírselo en el primer minuto, no en el local.

**Consecuencia de diseño:** la primera pregunta es el clearing, no la cuota. Es lo que bifurca los dos planes y es la única forma de dar el número de entrega antes de que el usuario invierta tiempo.

**Consecuencia de campaña:** si el creativo de Meta promete "decime tu cuota" sin mencionar la entrega, la app va a mostrar el estado vacío muy seguido. El copy de la campaña debería pre-filtrar.

---

## 5. Los dos planes

| | Crédito de la casa | Crédito bancario |
|---|---|---|
| Requiere | 2 garantes + 50% entrega | Aprobación bancaria |
| Acepta clearing | **Sí** | No |
| Moneda | USD | UYU |
| Plazos | 12 / 18 / 24 | 60 |
| Interés | 2% flat mensual | Factor 0.024 |
| Entrega | 50% a 90% | No pide |

**Bifurcación en la app:**

- Declara clearing (o no sabe) → **solo crédito de la casa**
- No declara clearing → **ambos planes**, se muestra el de cuota más baja por vehículo
- Sin entrega y sin clearing → **solo bancario**
- Sin entrega y con clearing → **no hay producto**. Se ofrece la permuta como vía de entrada.

---

## 6. Alcance de la v1

**Incluye:**
- Chat de 3 preguntas con chips + texto libre interpretado por IA
- Motor financiero de ambos planes, portado de la landing "Los Más Buscados"
- Lista de resultados con cuota real por vehículo y plan aplicado
- Selector de plazo (12/18/24) que recalcula en vivo
- Ajuste opcional de entrega y cuota post-resultado
- Estado vacío con la brecha exacta en USD y UYU
- Salida a WhatsApp con mensaje armado y código de referencia
- Persistencia de sesión contra ese código

**No incluye (v1):**
- Bonos de descuento. La campaña de bonos está en fase de prueba y sin comunicación pública. El motor calcula sobre `precio_usd` limpio.
- Tasación automática de permutas. La permuta va directo al vendedor.
- Galería de fotos por vehículo. Una foto por tarjeta.
- Login, cuentas de usuario, favoritos.
- Panel de administración. El stock se genera igual que en la landing.

---

## 7. Stack

Igual que "Los Más Buscados", por decisión deliberada: mismo hosting, mismo deploy, mismo dev, misma fuente de stock.

- **Front:** HTML5 + CSS3 + JavaScript vanilla (ES2020+). Sin framework, sin build step.
- **Deploy:** FTP al hosting existente de `grupomasautos.com`
- **Datos:** `stock.json` y `config.json` estáticos, generados desde el Excel del cliente con el importador que ya existe
- **IA:** OpenAI `gpt-4o-mini` vía función serverless (la clave **nunca** en el cliente)
- **Analytics:** Meta Pixel + GA4

---

## 8. Reutilización desde "Los Más Buscados"

**Se porta sin modificar:**
- `calculatePlanBanco()`
- El split de gastos de títulos (USD 550 → 275 entrega / 275 financiado)
- `config.json` como fuente única de tipo de cambio, factores y números de WhatsApp
- El patrón de `getWhatsAppCustomLink()` (devuelve string, no muta el DOM)
- El importador de Excel → `stock.json`

**Se corrige al portar:**
- `calculatePlanCasa()` tiene el plazo hardcodeado en 24 aunque la firma recibe `months`. Se generaliza a `financiado × (1/n + 0.02)`.
- El mensaje de WhatsApp omite la moneda en el Plan Casa ("24 cuotas de 295"). Se agrega `USD` explícito — es la ambigüedad más cara del negocio.
- `updateWhatsAppLink()` asume un CTA global único y `activeVehicleIndex`. En la app hay N tarjetas: se usa la variante que devuelve string.
- `credito_propio` existe en el schema y no lo lee nadie. En la app **filtra**: si es `false`, el vehículo no aparece para quien declaró clearing.

**Regla de oro:** un solo módulo de cálculo, dos consumidores. La app **no invierte la fórmula** para filtrar — calcula la cuota de cada vehículo y compara contra el objetivo. Invertirla por separado haría divergir los redondeos (`floor` a centena en UYU, `ceil` en USD) y el mismo auto mostraría cuotas distintas en la landing y en la app.

---

## 9. Documentos de este paquete

| # | Documento | Para quién |
|---|---|---|
| 01 | Brief maestro | Todos |
| 02 | Contrato de datos y motor financiero | Dev |
| 03 | Flujo, UI y sistema de diseño | Dev + diseño |
| 04 | Tickets de implementación y QA | Dev |
| 05 | Prompt del asistente | Dev |

---

## 10. Decisiones pendientes del cliente

1. **Criterio de `credito_propio: false`.** ¿Hay un tope de valor por encima del cual no va crédito de la casa? Hoy el campo se setea `true` a todo por defecto.
2. **Números de WhatsApp separados.** Hoy Grit y Más Autos comparten el mismo número en `config.json`. El ruteo por empresa está implementado pero nunca se ejerció.
3. **Foto por vehículo.** ¿Se reutiliza el recorte sobre fondo de "Los Más Buscados" o va la foto original?
