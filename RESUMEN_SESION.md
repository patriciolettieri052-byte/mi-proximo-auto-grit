# Resumen de Sesión — App "Mi Próximo Auto"
**Cliente:** Grupo Más Autos (Grit Automotores + Más Autos)  
**Fecha:** 28 de Agosto, 2026  
**Versión:** 1.0  
**Estado:** ✅ Desarrollado, verificado y ejecutándose en entorno local (`http://localhost:3000`).

---

## 1. Objetivos Cumplidos

1. **Lectura y Alineación con la Documentación:**
   - Se revisó en orden la documentación oficial compuesta por los 5 archivos:
     - `01-brief-maestro.md`: Contexto del negocio, métricas y reglas duras del crédito de la casa.
     - `02-datos-y-motor-financiero.md`: Esquema de datos, redondeos asimétricos y ruteo a WhatsApp.
     - `03-flujo-ui-design-system.md`: Flujo de 3 preguntas, UI mobile-first y tokens del sistema de diseño.
     - `04-tickets-y-qa.md`: Especificación de 12 tickets de desarrollo y criterios de aceptación.
     - `05-prompt-asistente.md`: System prompt del vendedor uruguayo para OpenAI y fallback.

2. **Diseño y Estética del Prototipo:**
   - Se tomó como referencia la estética y UX del prototipo `app-mi-proximo-auto-v3.html` (ancho máximo 480px, layout de teléfono, navegación inferior persistente).

3. **Nueva Funcionalidad Solicitada (Dark / Light Mode):**
   - Se agregó un conmutador en la barra superior (icono sol/luna) que permite alternar dinámicamente entre **Modo Oscuro (Dark)** y **Modo Claro (Light)**.
   - Persistencia de la preferencia del usuario en `localStorage` y respeto a `prefers-color-scheme`.

4. **Plan de Implementación Aprobado e Insumos:**
   - Se creó el plan técnico de trabajo y se configuró la clave de API de OpenAI suministrada (`OPENAI_API_KEY`) para despliegue en Vercel/GitHub.

---

## 2. Arquitectura de Archivos Desarrollada

Se modularizó todo el código fuente del proyecto en una estructura limpia y mantenible:

```
/
├── index.html                  # Shell HTML5 semántico con vistas y componentes
├── server.js                   # Servidor local Node.js (sirve estáticos y API local)
├── vercel.json                 # Configuración de ruteo para despliegue en Vercel
├── .env                        # Clave de API de OpenAI resguardada en servidor
├── RESUMEN_SESION.md           # Resumen ejecutivo en formato Markdown
├── css/
│   ├── tokens.css              # Variables de color (Modo Oscuro / Claro) y dimensiones
│   └── app.css                 # Estilos de vistas, chat, tarjetas, sliders y navegación (0 hex hardcodeados)
├── js/
│   ├── theme.js                # Control del conmutador Dark/Light mode con localStorage
│   ├── config.js               # Carga y expone data/config.json
│   ├── stock.js                # Carga y sanea data/stock.json con validaciones de integridad
│   ├── finance.js              # Motor financiero puro (calcPlanBanco, calcPlanCasa, etc.)
│   ├── matcher.js              # Matcheo y ordenamiento de autos por precio descendente
│   ├── chat.js                 # Máquina de estados de 3 preguntas, chips y texto libre
│   ├── ia.js                   # Cliente API para /api/asistente con fallback local regex
│   ├── render.js               # Renderizado de tarjetas, plazos (12/18/24), ajuste y estado vacío
│   ├── whatsapp.js             # Generación de enlaces wa.me con Ref y moneda explícita
│   ├── session.js              # Gestión de sesión, Ref (MPA-XXX) y persistencia local
│   ├── analytics.js            # Rastreo de eventos Meta Pixel y GA4
│   └── main.js                 # Arranque, ruteo entre vistas y listeners
├── data/
│   ├── config.json             # Parámetros del sistema (TC 40, factores, contactos)
│   └── stock.json              # Inventario estático inicial de vehículos
└── api/
    └── asistente.js            # Function Serverless para Vercel (OpenAI gpt-4o-mini)
```

---

## 3. Puntos Clave de la Implementación Técnica

### Motor Financiero (`js/finance.js`)
- **Plan Banco (UYU):** 60 cuotas sin entrega. Redondeo `Math.floor` a la centena en pesos (`$ 8.600`).
- **Plan Casa (USD):** Requiere 2 garantes y 50% de entrega mínima. Gastos de títulos ($550 split 50/50).
- **Plazos:** Soporta 12, 18 y 24 meses. Redondeo `Math.ceil` al entero en dólares (`USD 295`).
- **Verificación:** Pruebas unitarias de Node.js ejecutadas con 100% de coincidencia sobre la tabla de valores de QA.

### Asistente IA (`api/asistente.js` & `js/ia.js`)
- Conectado con OpenAI `gpt-4o-mini` con formato de respuesta JSON forzado.
- Tono de vendedor uruguayo cercano sin mencionar números ni inventar stock.
- Manejo de bandera `need_human` cuando el usuario hace preguntas fuera de alcance (dirección, horarios, papeles), mostrando un chip verde a WhatsApp ("Preguntale a Hernán →").
- Timeout de 4s y degradación a parser regex local transparente.

### Visual & Accesibilidad (`css/app.css` & `css/tokens.css`)
- `css/app.css` totalmente libre de códigos hexadecimales sueltos (todos referenciados vía `var(--...)`).
- Cumple reglas inquebrantables: sin `text-shadow`, objetivos táctiles ≥ 42px, moneda explícita (`USD 295` o `$ 20.200`) y peso de datos financieros ≥ 500.

---

## 4. Análisis de la Base de Datos Real (`Multiaviso-Pub-Activas-20260821192137.xlsx`)

Se realizó la inspección directa del archivo Excel oficial del cliente ubicado en `documentacion/`:
- **Resultado:** De los 367 registros activos en la planilla, se confirmó que **NO existe una Ford EcoSport** en la base de datos real.
- Los únicos vehículos de marca Ford activos son camionetas **Ford Ranger** (años 2010 y 2011). La EcoSport que figuraba en el prototipo pertenecía únicamente al stock mock de prueba.

---

## 5. Estado Actual e Instrucciones de Prueba Local

El entorno local se encuentra **activo y corriendo en segundo plano**:

- **URL de prueba:** [http://localhost:3000](http://localhost:3000)
- **Servidor:** `server.js` (procesa archivos estáticos y peticiones de IA a `/api/asistente`).

### Para redesplegar en Vercel o GitHub:
1. Subir los archivos a tu repositorio de GitHub.
2. Importar el proyecto en Vercel.
3. Configurar la variable de entorno `OPENAI_API_KEY` en el panel de Vercel.
