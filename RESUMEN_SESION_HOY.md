# Resumen de Sesión — Ecosistema Grupo Más Autos & Grit Automotores
**Fecha:** 25 de Septiembre de 2026  
**Clientes:** Grit Automotores & Grupo Más Autos (+autos)  
**Estado:** Producción actualizada en Grit Car + Documentación y Arquitectura Maestra consolidada para la nueva App de Tasaciones y Dashboard con IA.

---

## 1. Cambios Ejecutados y Desplegados en la App "Valor Cuota Grit"

### A. Extracción e Integración de Fotos Oficiales de Grit Automotores
- **Problema previo:** La app tenía fotos heredadas de Más Autos en Supabase y `data/stock.json`.
- **Solución implementada:**
  - Se realizó ingeniería inversa sobre la API de MultiAviso (`gritautomotores.com/?ma_page=1` a `4`) mediante firma HMAC-SHA256 con timestamp UTC.
  - Se extrajo el **100% del inventario activo real (48 vehículos)** con metadatos completos.
  - Se verificaron las 48 imágenes en el CDN de Amazon S3 (`https://s3.amazonaws.com/static.multiaviso.com/vehicle/images/...`): **48/48 HTTP 200 OK**.
  - **Sincronización en Supabase:** Se marcaron como no disponibles (`estado: 'no_disponible'`) las 6 unidades vendidas del stock anterior y se actualizaron las 48 unidades activas.
  - **Sincronización de Fallback Local:** Se regeneró `data/stock.json` con los 48 vehículos de Grit Automotores.
  - **Validación:** Se testeó la función `loadStock()` simulando producción, confirmando la carga de las 48 unidades con sus fotos auténticas.

### B. Ajuste de Token Estético en Resultados de Búsqueda
- En las tarjetas de vehículos ([`js/render.js`](file:///d:/Bamba/Clientes/Grit+Mas%20Autos/Ecosistema%20Grupo%20Mas%20Autos/app%20valor%20cuota%20grit/js/render.js)), se removió la palabra `"fijas"` del indicador de cuota para Plan Banco:
  - **Antes:** `${plazoBanco} cuotas fijas en pesos`
  - **Ahora:** `${plazoBanco} cuotas en pesos`

### C. Eliminación del Código de Referencia en WhatsApp
- A pedido del cliente, se eliminó la etiqueta `Ref: ${ref}` de todos los mensajes iniciales personalizados salientes a WhatsApp ([`js/whatsapp.js`](file:///d:/Bamba/Clientes/Grit+Mas%20Autos/Ecosistema%20Grupo%20Mas%20Autos/app%20valor%20cuota%20grit/js/whatsapp.js) y [`js/render.js`](file:///d:/Bamba/Clientes/Grit+Mas%20Autos/Ecosistema%20Grupo%20Mas%20Autos/app%20valor%20cuota%20grit/js/render.js)).
- El código identificador se mantiene internamente en la base de datos Supabase (`grit_leads`) y analítica para preservar la trazabilidad sin ensuciar el texto enviado al vendedor.

---

## 2. Nueva App de Tasaciones y Dashboard Comercial (Grupo Más Autos)

Se diseñó la arquitectura completa para el nuevo producto de tasación de usados y toma en permuta de Más Autos:

### A. Arquitectura de Dos Frontends Desacoplados (Base de Datos Compartida)
1. **Frontend A (Público - Clientes):**
   - **Formato:** SPA Mobile-First (contenedor 480px, sin login, carga rápida en 4G).
   - **Flujo:** Onboarding ágil ➔ 4 preguntas directas del auto ➔ Uploader de 5 fotos obligatorias ➔ Contacto ➔ Confirmación.
   - **Seguridad:** Acceso anónimo con permisos estrictos de sólo inserción (`INSERT` en `mas_autos_tasaciones` y upload en Supabase Storage).
2. **Frontend B (Interno - Vendedores Más Autos):**
   - **Formato:** Desktop-First en pantalla dividida (Split Screen para PC/laptop de salón).
   - **Módulo Izquierdo (45%):** Copiloto IA con **Visión Computacional** (inspección de las 5 fotos en alta resolución) + herramientas de consulta a base de datos (histórico de compras/ventas pasadas).
   - **Módulo Derecho (55%):** Catálogo de solicitudes con campo interactivo `"Precio Tasado USD"` y botón `"Confirmar Tasación"`, disparando el mensaje pre-armado a WhatsApp Web.

### B. Especificaciones Clave de la Experiencia (UX)
- **Cero Chips en Datos Técnicos:** Para evitar ruido visual, se eliminaron los chips. El usuario escribe directamente: Marca, Modelo/Versión, Año (teclado numérico) y Kilometraje (teclado numérico con formato).
- **Slot Uploader de 5 Fotos Obligatorias:**
  - 1. Frente (delantera completa)
  - 2. Trasera (con matrícula visible)
  - 3. Lateral Izquierdo (lado conductor)
  - 4. Lateral Derecho (lado acompañante)
  - 5. Interior (volante, tablero y tapizado delantero)
  - *Compresión en cliente:* Canvas convierte a WebP (0.82) con lado máx. 1400px (~200 KB por foto, subida en 1s).
  - *Validación:* El botón de avanzar permanece inactivo hasta tener los 5 casilleros completos.
- **Datos de Contacto al Final (Opción B):** Nombre y WhatsApp uruguayo al concluir la carga de fotos, generando máxima tasa de compromiso.
- **Sin forzar WhatsApp al usuario:** La app guarda todo en DB y muestra pantalla de agradecimiento; el contacto proactivo lo realiza el vendedor de Más Autos desde el Dashboard.

### C. Lógica de Negocio y Trazabilidad de Rentabilidad (`DECISIONS.md`)
- Se incorporó la tabla `mas_autos_operaciones` para conectar el ciclo completo del usado:
  - **Modalidades de ingreso:** Compra Directa vs. Toma en Permuta (vinculada al `auto_vendido_id`).
  - **Costo base acumulado:** `Valor de Toma + Taller Mecánico + Chapa y Pintura + Estética + Escribanía`.
  - **Métricas calculadas en tiempo real:**
    - `ganancia_neta_usd` = Precio de Venta Real - Costo Total Acumulado.
    - `margen_porcentaje` = Ganancia / Costo Total * 100.
    - `dias_en_stock` = Fecha de Venta - Fecha de Ingreso.
  - **Feedback Loop para la IA:** El copiloto de IA aprende de los costos reales y márgenes de reventa de Más Autos para sugerir rangos de toma cada vez más precisos.

---

## 3. Documentación Maestra Creada en `/documentacion`

| Archivo | Contenido Principal |
| :--- | :--- |
| [**`documentacion/arquitectura.md`**](file:///d:/Bamba/Clientes/Grit+Mas%20Autos/Ecosistema%20Grupo%20Mas%20Autos/app%20valor%20cuota%20grit/documentacion/arquitectura.md) | Arquitectura técnica de los dos frontends, pipeline de compresión de imágenes, Storage en Supabase y endpoints serverless. |
| [**`documentacion/flow.md`**](file:///d:/Bamba/Clientes/Grit+Mas%20Autos/Ecosistema%20Grupo%20Mas%20Autos/app%20valor%20cuota%20grit/documentacion/flow.md) | Flujo paso a paso del cliente (4 preguntas + 5 fotos + contacto) y flujo del vendedor en el dashboard split-screen. |
| [**`documentacion/specs.md`**](file:///d:/Bamba/Clientes/Grit+Mas%20Autos/Ecosistema%20Grupo%20Mas%20Autos/app%20valor%20cuota%20grit/documentacion/specs.md) | Data Dictionary SQL (`mas_autos_tasaciones`), reglas de validación, payload multimodal GPT-4o Vision y prompt tasador. |
| [**`documentacion/DECISIONS.md`**](file:///d:/Bamba/Clientes/Grit+Mas%20Autos/Ecosistema%20Grupo%20Mas%20Autos/app%20valor%20cuota%20grit/documentacion/DECISIONS.md) | Decisiones de negocio: Permuta vs. Compra directa, DDL de `mas_autos_operaciones`, KPIs de rentabilidad y justificación desktop-first. |

---

## 4. Estado del Entorno de Trabajo
- **Restricción activa:** No realizar push a GitHub (`git push` deshabilitado por instrucción del usuario). Todos los archivos quedan guardados **estrictamente de forma local**.
- **Entorno local:** Archivos creados, validados y guardados en el disco local de la máquina de trabajo.
