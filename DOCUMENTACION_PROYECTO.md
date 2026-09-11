# Documentación Oficial del Proyecto: Mi Próximo Auto (Grit Automotores)

**Cliente:** Grit Automotores  
**Aplicación:** Mi Próximo Auto — Validador y Recomendador Financiero de Vehículos  
**Versión:** 1.0.0 (Beta Release)  
**Fecha:** Septiembre 2026  
**Repositorio GitHub:** [patriciolettieri052-byte/mi-proximo-auto-grit](https://github.com/patriciolettieri052-byte/mi-proximo-auto-grit.git)  
**Despliegue:** Vercel (Producción Zero-Config + Serverless)

---

## 1. Resumen Ejecutivo y Propósito

**Mi Próximo Auto** es una aplicación web interactiva desarrollada para **Grit Automotores**, concesionaria automotriz de Montevideo. Su objetivo principal es calificar financieramente a potenciales compradores de vehículos usados y 0km mediante un asistente conversacional inteligente, calculando al instante su capacidad real de pago (cuota mensual, entrega inicial y opciones crediticias) y presentándoles un catálogo personalizado con stock real y fotos de alta calidad, derivándolos directamente al asesor comercial (**Sebastián**) con el perfil pre-aprobado.

---

## 2. Identidad de Marca y Tono Conversacional

### 2.1 Identidad Institucional
- **Marca:** Grit Automotores.
- **Distintivo en Header:** Tag oficial **`Grit Automotores®`** y switch de Modo Claro / Modo Oscuro.
- **Paleta de Colores (Tokens Maestros):**
  - **Blanco Puro (`#FFFFFF`):** Fondos de cards y áreas de lectura limpia.
  - **Fondo Suave / Neutro (`#E9EAE1`):** Fondo general de la aplicación.
  - **Naranja Marca (`#F2820D`):** Acciones principales, botones de avance y destacados.
  - **Verde WhatsApp (`#25D366`):** Botones de contacto y pre-aprobación con el equipo comercial.
  - **Gris Oscuro / Carbón (`#111827`):** Textos principales y títulos.

### 2.2 Tono del Asistente Virtual
- **Estilo:** Formal, respetuoso, empático y profesional de concesionaria oficial.
- **Tratamiento:** Tuteo respetuoso uruguayo con "vos" (ej: *"¿Contás con algún monto de entrega?"*).
- **Concisión:** Respuestas y acuses de recibo breves (<= 12 palabras), evitando párrafos largos que fatiguen al usuario.
- **Límites de IA:**
  - El asistente no calcula cuotas manualmente (lo hace el motor financiero determinista en JavaScript).
  - No inventa stock ni promete excepciones en requisitos crediticios.
  - Si el usuario requiere atención humana o realiza preguntas complejas, asigna `need_human: true` y deriva formalmente al asesor comercial.

---

## 3. Flujo de Usuario y Pantallas

```mermaid
flowchart TD
    A[1. Onboarding\nNombre y Celular] --> B[2. Asistente Conversacional\nIA GPT-4o-mini]
    B --> C[3. Calificación Financiera\nClearing / Entrega / Cuota]
    C --> D[4. Catálogo Personalizado\nVehículos filtrados por presupuesto]
    D --> E[5. Asesor Comercial y Cierre\nWhatsApp directo a Sebastián]
```

1. **Onboarding Inicial (`#vOnboarding`):**
   - Captura inmediata de **Nombre completo** y **Teléfono celular (WhatsApp)**.
   - Cero fricción (sin contraseñas ni códigos SMS).
   - Guarda el lead en el backend (`/api/leads`) y en `localStorage`.
2. **Diagnóstico Conversacional (`#vChat`):**
   - El asistente saluda al usuario por su nombre.
   - Extrae de manera conversacional:
     - Estado en Clearing de Informes (para definir vía bancaria o crédito de la casa).
     - Monto disponible para entrega inicial (o vehículo en permuta).
     - Presupuesto mensual disponible para la cuota.
3. **Catálogo de Autos Compatibles (`#vAutos`):**
   - Tarjetas de vehículos con fotografía real, cuota estimada calculada (en pesos y dólares), monto de entrega y requisitos crediticios.
   - Botón directo de **Pedir pre-aprobación** que deriva a la pantalla del Asesor Comercial con el vehículo ya seleccionado.
4. **Pantalla de Asesor Comercial (`#vVend`):**
   - Presenta la ficha de contacto del asesor comercial de Grit:
     - **Sebastián** (`+598 97 300 504`)
   - Resumen detallado de la calificación financiera (Clearing, Plan, Entrega, Cuota, Auto de interés).
   - Datos físicos del local: Nueva Palmira 2061 / 2064, Montevideo.

---

## 4. Motor Financiero y Reglas de Negocio

El sistema aplica la matriz financiera oficial de Grit Automotores:

| Perfil Financiero | Vía Crediticia | Entrega Requerida | Plazos Disponibles | Requisitos Clave |
| :--- | :--- | :--- | :--- | :--- |
| **Sin Clearing** | Bancaria / Tradicional | Desde 0% a 20% | Hasta 60 cuotas | Justificación de ingresos |
| **Con Clearing** | Crédito de la Casa (Grit) | Mínimo 50% | Hasta 24/36 cuotas | 2 Garantes solidarios |
| **Con Permuta** | Mixta | Tomado como parte de entrega | Según saldo | Tasación previa en local |

- **Tipo de Cambio:** Configurable dinámicamente (`UYU / USD`).
- **Moneda de Cuotas:** Presentación dual en Pesos Uruguayos ($UYU) y Dólares ($USD).

---

## 5. Inventario de Vehículos y Ruteo Comercial

- **Base de Datos Principal:** Supabase PostgreSQL — tabla `grit_vehiculos` (tiempo real).
- **Fallback Estático:** `data/stock.json` (42 unidades activas de Grit Automotores con código `GR-...`).
- **Activos Fotográficos y CDN:**
  - 100% de las 42 unidades activas cuentan con fotografía real en alta resolución alojadas en el bucket público de Supabase Storage: `vehiculos/grit/`.
  - Zero cards sin fotos: se corrigieron las fotos con acentos (`Citroën C3`, `GLA200`) y se eliminaron las unidades vendidas/despublicadas.
- **Ruteo Comercial a WhatsApp:**
  - Configuración centralizada de asesor en Supabase (`grit_config`) y fallback en `data/config.json`: **Sebastián** (`59897300504`).
  - Cada auto cuenta con el atributo `"asesor": "sebastian"`.
  - Al solicitar pre-aprobación o permuta, el mensaje de WhatsApp se dirige automáticamente a Sebastián.

---

## 6. Arquitectura Técnica y Despliegue

### 6.1 Estructura del Proyecto
```text
app-valor-cuota/
├── api/
│   ├── asistente.js     # Serverless Function: Proxy seguro con OpenAI GPT-4o-mini
│   └── leads.js         # Serverless Function: Captura y registro de leads en Supabase
├── assets/              # Fotografías locales de vehículos (respaldo)
├── css/
│   ├── app.css          # Estilos principales de componentes y vistas
│   └── tokens.css       # Variables de diseño (colores, tipografía, espaciado)
├── data/
│   ├── config.json      # Respaldo de parámetros financieros y asesor
│   ├── leads.json       # Respaldo local de prospectos capturados
│   └── stock.json       # Respaldo de catálogo de vehículos activos con fotos CDN
├── img/
│   └── logo.png         # Isologotipo oficial de Grit Automotores
├── js/
│   ├── main.js          # Orquestador del ciclo de vida de la aplicación y navegación
│   ├── chat.js          # Lógica conversacional y flujo de preguntas
│   ├── finance.js       # Motor de cálculo financiero determinista
│   ├── matcher.js       # Algoritmo de compatibilidad y ranking de autos
│   ├── render.js        # Renderizado de cards de vehículos y UI
│   ├── stock.js         # Carga híbrida (Supabase con fallback a stock.json)
│   ├── supabase.js      # Cliente liviano vanilla fetch para Supabase API & CDN
│   ├── session.js       # Manejo de sesión de usuario y storage local
│   ├── theme.js         # Control de Modo Claro / Modo Oscuro
│   └── whatsapp.js      # Generación de enlaces y mensajes a WhatsApp con asesor dinámico
├── index.html           # Single Page Application principal
├── package.json         # Configuración del proyecto
├── server.cjs           # Servidor Node.js para desarrollo local
└── DOCUMENTACION_PROYECTO.md # Documento maestro del proyecto
```

### 6.2 Integración con Supabase y Base de Datos
- **Proyecto Supabase Único:** Multi-inquilino segregado por tablas.
  - Vehículos: `grit_vehiculos` (RLS público para lectura).
  - Leads: `grit_leads` (RLS inserción anónima segura, lectura restringida).
  - Config: `grit_config` (RLS lectura pública).
  - CDN Storage: Bucket público `vehiculos` con ruta `grit/`.
- **Carga Híbrida Inteligente:** El cliente `js/stock.js` consulta `grit_vehiculos` vía `js/supabase.js`. Si no hay conexión o falla la API, conmuta de inmediato a `data/stock.json` sin interrumpir la experiencia de usuario.

### 6.3 Integración de Inteligencia Artificial
- **Modelo:** `gpt-4o-mini` de OpenAI.
- **Seguridad:** La clave `OPENAI_API_KEY` se gestiona en variables de entorno del servidor (Vercel Serverless), sin exponer credenciales en el frontend del cliente.
- **Formato Estricto:** La API responde en formato JSON estructurado con temperatura controlada (0.6) y límite de tokens para máxima velocidad.

### 6.4 Variables de Entorno en Vercel
Configurar en Vercel (Project Settings -> Environment Variables):
- `OPENAI_API_KEY`: API Key de OpenAI para el asistente conversacional.
- `SUPABASE_URL`: `https://tyywkunwrdgtxslrqxox.supabase.co`
- `SUPABASE_ANON_KEY`: Key pública anónima de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key de Supabase (uso exclusivo en serverless `/api/*`).

---

## 7. Guía de Mantenimiento

### Actualización de Stock en Supabase
1. Ingresar a la consola de Supabase -> Table Editor -> `grit_vehiculos`.
2. Para pausar un vehículo vendido, cambiar `activo` a `false`.
3. Para modificar precio o cuota, actualizar directamente la fila. El cambio impacta inmediatamente en la app sin necesidad de un nuevo deploy en Vercel.
4. Para subir fotos nuevas: Supabase Storage -> bucket `vehiculos` -> carpeta `grit/`.

### Ajuste de Parámetros Financieros o Números de Contacto
- Modificar en la tabla `grit_config` o editar `data/config.json` para modificar el tipo de cambio o teléfonos.

---

## 8. Próximos Pasos (Fase Beta)
1. Monitoreo de leads en la tabla `grit_leads` en tiempo real.
2. Análisis de métricas de conversión y atención por WhatsApp de Sebastián.
3. Incorporación de panel interno de administración (Backoffice) si se requiere gestión masiva sin entrar a Supabase.
