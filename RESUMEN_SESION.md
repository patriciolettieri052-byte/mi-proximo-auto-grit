# Resumen de Sesión — Ecosistema "Mi Próximo Auto"
**Fecha:** 11 de Septiembre de 2026  
**Clientes:** Grupo Más Autos (+autos) & Grit Automotores  
**Estado:** Ambas aplicaciones conectadas a Supabase en tiempo real, 100% de cobertura fotográfica en CDN, datos técnicos normalizados, flujo directo a WhatsApp en 1 clic y repositorios sincronizados en GitHub.

---

## 1. Objetivos Cumplidos en la Sesión

### A. Diagnóstico y Resolución Definitiva de Fotografías Faltantes
* **Diagnóstico de fondo:** Se contrastaron las publicaciones contra la última planilla oficial de Multiaviso (`Multiaviso-Pub-Activas-20260904202200.xlsx`). Se detectó que las unidades sin foto pertenecían a una exportación anterior (21 de agosto) y ya habían sido vendidas o dadas de baja del inventario físico.
* **Depuración de inventario activo:**
  * **Grupo Más Autos:** Se depuraron 9 unidades vendidas, consolidando **45 vehículos físicos activos** con fotos reales.
  * **Grit Automotores:** Se corrigieron nombres con caracteres especiales (`Citroën C3` y `Mercedes-Benz GLA200`) y fotos asignadas a unidades hermanas (`Frontier`), consolidando **42 vehículos físicos activos** con fotos reales.
* **Resultado:** **100% de cobertura fotográfica**. Cero cards sin foto en ambas aplicaciones.

---

### B. Migración Integral a Supabase (Un Proyecto, Multi-Tenant Segregado)
Se integró un único proyecto en Supabase (`tyywkunwrdgtxslrqxox`) optimizando costos (Tier Free) y segregando completamente los datos de cada firma:

1. **Storage CDN Público (`vehiculos`):**
   * Se subieron y verificaron las **87 fotografías HD** de ambas flotas:
     * Más Autos: `vehiculos/mas_autos/` (45 imágenes).
     * Grit Automotores: `vehiculos/grit/` (42 imágenes).
   * Respuestas HTTP 200 verificadas con CDN global y compresión de carga rápida.
2. **Esquema de Base de Datos PostgreSQL y RLS:**
   * `mas_autos_vehiculos` (45) y `grit_vehiculos` (42): Lectura pública (`anon`, `authenticated`).
   * `mas_autos_leads` y `grit_leads`: Inserción anónima segura (`Prefer: return=minimal`), lectura pública bloqueada para protección de datos personales.
   * `mas_autos_config` y `grit_config`: Parámetros financieros y comerciales.
3. **Cliente Vanilla Frontend (`js/supabase.js`):**
   * Implementado sin librerías externas ni dependencias NPM (< 2 KB), compatible con navegadores y Vercel Serverless.
4. **Carga Híbrida Inteligente (`js/stock.js`):**
   * Carga prioritaria en tiempo real desde Supabase. Si hay pérdida de conectividad o falla de red, conmuta de inmediato a `data/stock.json` como respaldo estático sin interrumpir la experiencia.

---

### C. Auditoría y Normalización de Especificaciones Técnicas
Se identificaron y corrigieron 5 inconsistencias estructurales heredadas del script importador inicial:

| Campo | Estado Previo | Corrección Aplicada | Impacto |
| :--- | :--- | :--- | :--- |
| **Kilometraje (`km`)** | Todo en `0` en Grit | Cruzado 100% contra Multiaviso (ej: Gladiator 39.000 km, Strada 140.000 km). Solo 1 unidad con 0 km (`Dongfeng Vigo 2026` 0km real). | Fichas técnicas verídicas |
| **Combustible (`combustible`)** | Todo `'nafta'` | Clasificación exacta: `electrico` (Geely EX5, BYD e2, BYD Yuan Pro), `diesel` (Frontier, Amarok V6, S10) y `nafta`. | Precisión técnica |
| **Transmisión (`transmision`)** | Todo `'manual'` | Clasificación exacta: `automatica` (11 en Grit y 14 en Más Autos: eléctricos, CVT, 7G-DCT, S-Tronic, ZF 8 marchas) y `manual`. | Filtros avanzados listos |
| **Carrocería (`carroceria`)** | Todo `'hatchback'` | Clasificación exacta: `pickup` (Frontier, Amarok, Ranger, S10, Strada, Gladiator, Vigo), `suv`, `sedan`, `hatchback` y `monovolumen`. | Clasificación real |
| **Puertas (`puertas`)** | Todo `5` | `4` para pick-ups doble cabina y sedanes, `3` para Strada cabina doble, `2` para Vigo cabina simple, `5` para hatchbacks y SUVs. | Anatomía vehicular exacta |
| **Versiones (`version`)** | 8 `null` en Más Autos | Subsanadas al 100% (`Gl Full`, `At`, `1.4 TFSI S-Tronic`, `Se Np300`, `2.4 4x4`, etc.). | Inventario homogéneo |

---

### D. Optimización de UX: Derivación Directa a WhatsApp en 1 Clic
* **Problema resuelto:** Anteriormente, al hacer clic en el botón de un vehículo en la lista de resultados, la app derivaba a la pestaña `#vVend` (vista del comercial), obligando al usuario a hacer un segundo clic para recién abrir WhatsApp.
* **Nueva experiencia sin fricción:**
  * Al presionar el botón en la tarjeta de cualquier auto, la app calcula la viabilidad financiera, guarda el auto en memoria y **abre directamente WhatsApp en 1 solo clic**.
  * **Nuevo texto de CTA:** Se actualizó de *"Pedir pre-aprobación"* a **`Consultar por WhatsApp`** con el ícono oficial.
  * **Mensaje personalizado pre-armado:**
    > *"Hola [Asesor], soy [Nombre]. Me interesa el [Auto Año]. Deseo solicitar la pre-aprobación del Crédito de la Casa con entrega de USD [Monto] y [N] cuotas de USD [Monto]. Ref: MPA-[XXX]"*
* **Ruteo independiente garantizado:**
  * **Más Autos:** Dirige directamente a **Hernán** (`+598 96 776 442`).
  * **Grit Automotores:** Dirige directamente a **Sebastián** (`+598 97 300 504`).
* **Pestaña "Asesor" preservada:** Permanece disponible en la barra de navegación inferior para quienes quieran ver la dirección del local (Nueva Palmira), horarios de atención o realizar consultas generales.

---

## 2. Estado de los Repositorios y Despliegue en Vercel

### Comparativa de Repositorios Oficiales:

| Característica | Repositorio 1: Grupo Más Autos | Repositorio 2: Grit Automotores |
| :--- | :--- | :--- |
| **Repositorio GitHub** | [patriciolettieri052-byte/mi-proximo-auto](https://github.com/patriciolettieri052-byte/mi-proximo-auto.git) | [patriciolettieri052-byte/mi-proximo-auto-grit](https://github.com/patriciolettieri052-byte/mi-proximo-auto-grit.git) |
| **Rama principal** | `main` | `main` |
| **Último Commit** | `b2e9b4f` | `8be7455` |
| **Asesor Comercial** | **Hernán** (`59896776442`) | **Sebastián** (`59897300504`) |
| **Tabla de Vehículos** | `mas_autos_vehiculos` (45 unidades) | `grit_vehiculos` (42 unidades) |
| **Tabla de Leads** | `mas_autos_leads` | `grit_leads` |
| **Tabla de Config** | `mas_autos_config` | `grit_config` |
| **Fotos CDN** | `vehiculos/mas_autos/` (100% activas) | `vehiculos/grit/` (100% activas) |
| **Identidad de Marca** | Grupo Más Autos® | Grit Automotores® (Logo circular recortado HD) |

---

## 3. Variables de Entorno en Vercel (Guía Rápida)

Para ambos proyectos en el panel de **Vercel** (**Settings** ➔ **Environment Variables**):

| Variable | Valor |
| :--- | :--- |
| `OPENAI_API_KEY` | *(Clave API de OpenAI para el asistente conversacional)* |
| `SUPABASE_URL` | `https://tyywkunwrdgtxslrqxox.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXdrdW53cmRndHhzbHJxeG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNTQzNzQsImV4cCI6MjEwNDczMDM3NH0.NOpwXUN5wVsA5WfiTwXjfqM_B8Jummlbts7QD91ZiXg` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXdrdW53cmRndHhzbHJxeG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTE1NDM3NCwiZXhwIjoyMTA0NzMwMzc0fQ.N6sIl7SjK9niQyP-BQsVXq0TPALMvo5iK_DrEb11_2c` |

---

## 4. Conclusiones y Próximos Pasos

1. **Estabilidad y robustez:** El sistema no tiene fallas bloqueantes; ambas aplicaciones operan con alta velocidad, datos 100% limpios y arquitectura tolerante a fallos (híbrida).
2. **Cero fricción comercial:** La derivación a WhatsApp en 1 clic acelerará la tasa de contacto y conversión de leads tanto para Hernán como para Sebastián.
3. **Mantenimiento futuro simplificado:** Modificar precios, pausar autos vendidos o agregar nuevas unidades se puede hacer directamente en Supabase (o subiendo fotos al bucket), reflejándose de inmediato en las apps sin necesidad de redeploys.
