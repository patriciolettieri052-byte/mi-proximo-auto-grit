# FLUJO DE EXPERIENCIA Y USUARIO: APP DE TASACIONES (MÁS AUTOS)
> **DOCUMENTO MAESTRO DE UX & EMBEDDED CHAT FUNNEL**  
> *Describe la interacción paso a paso del usuario en la app móvil, el comportamiento del cargador de 5 fotos y el posterior flujo operativo del vendedor dentro del dashboard asistido por IA.*

---

## 1. Mapa de Flujo de Extremo a Extremo (Ecosystem Journey)

```mermaid
sequenceDiagram
    autonumber
    actor Cliente
    participant App as App Móvil (Cliente)
    participant DB as Supabase DB & Storage
    actor Vendedor as Vendedor Más Autos
    participant Dash as Dashboard + Asistente IA

    Note over Cliente, App: Fase 1: Captación y Relevamiento
    Cliente->>App: Ingresa y pulsa "Comenzar tasación"
    App->>Cliente: Pide Marca, Modelo, Año y Kilometraje (Input directo)
    Cliente->>App: Ingresa datos técnicos
    App->>Cliente: Despliega uploader de 5 fotos obligatorias
    Cliente->>App: Carga las 5 fotos (Frente, Trasera, 2 Laterales, Interior)
    App->>Cliente: Pide Nombre y WhatsApp para recibir la cotización
    Cliente->>App: Ingresa datos de contacto y pulsa "Enviar para tasación"

    Note over App, DB: Fase 2: Persistencia Segura
    App->>DB: Guarda registro + fotos optimizadas
    App->>Cliente: Muestra pantalla de confirmación ("Solicitud recibida")

    Note over Vendedor, Dash: Fase 3: Evaluación Asistida por IA
    DB->>Dash: Notificación de nueva solicitud entrante
    Vendedor->>Dash: Abre ficha del auto e inspecciona las 5 fotos
    Vendedor->>Dash: Clic en "Generar análisis con IA"
    Dash-->>Vendedor: Rango sugerido (USD) + Borrador de mensaje WhatsApp
    Vendedor->>Cliente: Envía mensaje por WhatsApp e inicia negociación
```

---

## 2. Flujo del Usuario en la App Pública (Lado Cliente)

La experiencia del usuario es **100% mobile-first, sin distracciones, sin chips innecesarios y sin formularios pesados**:

### Paso 0: Pantalla de Bienvenida (Intro Hero)
- **Título de impacto:** *"¿Querés vender o entregar tu auto en permuta? Tasalo hoy en Más Autos"*
- **Subtítulo:** *"Recibí una cotización real de nuestro equipo en pocos minutos. Solo necesitás los datos de tu auto y 5 fotos."*
- **Badges de confianza:**
  - Salón de ventas propio en Montevideo.
  - Cotización formal respaldada por Más Autos.
  - Tomamos tu auto como parte de pago o te lo compramos directo.
- **Acción:** Botón primario *"Comenzar tasación"* ➔ Pasa inmediatamente a la vista conversacional.

---

### Paso 1: Relevamiento Técnico del Vehículo (Chat Guiado)
El asistente formula las preguntas de forma secuencial en el chat. El usuario responde tipeando directamente en el campo de texto inferior, que adapta su comportamiento:

1. **Pregunta 1 (Marca):**
   - *Asistente:* *"¡Hola! Vamos a tasar tu vehículo. Para empezar, ¿cuál es la marca de tu auto?"*
   - *Input:* Teclado de texto libre con capitalización automática.
   - *Ejemplo usuario:* `Volkswagen`
2. **Pregunta 2 (Modelo y Versión):**
   - *Asistente:* *"Bien, un Volkswagen. ¿Cuál es el modelo y versión?"*
   - *Input:* Texto libre (placeholder: *"Ej. Gol Trend 1.6 Highline"*).
   - *Ejemplo usuario:* `Gol Trend 1.6`
3. **Pregunta 3 (Año):**
   - *Asistente:* *"¿De qué año es la unidad?"*
   - *Input:* Teclado numérico móvil (`input type="number"`), validado entre 1980 y el año corriente.
   - *Ejemplo usuario:* `2018`
4. **Pregunta 4 (Kilometraje):**
   - *Asistente:* *"¿Cuántos kilómetros tiene aproximadamente al día de hoy?"*
   - *Input:* Teclado numérico con formateo de miles automático.
   - *Ejemplo usuario:* `95.000 km`

---

### Paso 2: El Uploader de 5 Fotos Obligatorias
El asistente envía un mensaje introductorio y renderiza el componente visual interactivo:

> *Asistente:* *"Excelente. Para que nuestro equipo evalúe el estado de chapa, pintura y tapizado, necesitamos obligatoriamente estas 5 fotos de tu auto:"*

```text
┌─────────────────────────────────────────────────────────┐
│              📸 5 FOTOS OBLIGATORIAS                    │
├────────────────────────────┬────────────────────────────┤
│ [ 📷 ] 1. Frente           │ [ 📷 ] 2. Trasera          │
│ Vista delantera completa   │ Vista trasera con matrícula│
├────────────────────────────┼────────────────────────────┤
│ [ 📷 ] 3. Lateral Izq.     │ [ 📷 ] 4. Lateral Der.     │
│ Lado del conductor         │ Lado del acompañante       │
├────────────────────────────┴────────────────────────────┤
│ [ 📷 ] 5. Interior                                      │
│ Tablero, volante y tapizado delantero                   │
└─────────────────────────────────────────────────────────┘
  [ Botón: Continuar (Deshabilitado hasta tener las 5 fotos) ]
```

#### Comportamiento UX de cada Slot:
- **Estado Inicial (Vacío):** Borde punteado, icono de cámara y nombre del ángulo requerido.
- **Acción al Tocar:** Abre el selector nativo del celular (permite tomar foto con la cámara en el momento o elegir de la galería).
- **Compresión inmediata:** En cuanto se selecciona la imagen, el pipeline local la procesa en milisegundos.
- **Estado Completo:** Muestra la miniatura de la foto recortada en relación 4:3 con un tilde verde (`✓`) y un botón circular `x` en la esquina superior para reemplazarla si el usuario no quedó conforme.
- **Validación estricta:** El botón *"Continuar a datos de contacto"* solo se activa cuando los **5 casilleros** están completos.

---

### Paso 3: Datos de Contacto (Cierre del Embudo)
Una vez cargadas las fotos, el usuario tiene un alto nivel de inversión emocional y temporal en el proceso. Aquí se le solicita su contacto de forma transparente:

> *Asistente:* *"¡Fotos listas! Por último, ¿a qué nombre y número de WhatsApp te enviamos la tasación estimada?"*

- **Campo 1:** Nombre completo (ej. *"Ignacio Rodríguez"*).
- **Campo 2:** Teléfono celular uruguayo (ej. *"099 123 456"* con validación de prefijo `09`).
- **Botón de Envío:** *"Enviar solicitud de tasación"* (con icono de candado y leyenda *"Tus datos solo se usarán para enviarte la cotización"*).

---

### Paso 4: Pantalla de Confirmación (Success Screen)
A diferencia de otros embudos, **aquí no se fuerza al usuario a saltar a WhatsApp**. La app guarda los datos en Supabase y le presenta una pantalla de confirmación limpia y tranquilizadora:

- **Icono de éxito:** Check verde animado.
- **Título:** *"¡Solicitud de tasación enviada con éxito!"*
- **Resumen visual:**
  - Ficha: `Volkswagen Gol Trend 1.6 (2018) · 95.000 km`
  - 5 fotos adjuntas correctamente.
  - Código de referencia único: `#TAS-9482`
- **Mensaje de tranquilidad:** *"Nuestro equipo de tasadores en Más Autos ya tiene toda la información. Analizaremos tu unidad y te escribiremos directamente a tu WhatsApp (**099 123 456**) con la propuesta."*
- **Botón secundario:** *"Volver al inicio"* o enlace directo al catálogo si también busca cambiar de auto.

---

## 3. Flujo Operativo del Vendedor (Dashboard Desktop-First en 2 Módulos)

El equipo comercial opera desde un dashboard optimizado para **pantallas de escritorio o laptops** (con adaptación responsive a tablets), estructurado en **2 módulos interactivos lado a lado**:

```text
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│        MÓDULO IZQUIERDO (45%)                │           MÓDULO DERECHO (55%)               │
│    COPILOTO IA (VISIÓN + HISTÓRICO DB)       │       CATÁLOGO DE AUTOS TASADOS (DB)         │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 💬 Chat Interactivo Multimodal:              │ 📋 Lista de Solicitudes (Filtros: Pendientes)│
│ • La IA inspecciona las 5 fotos en HD:       │                                              │
│   - Golpes, rayas o descuadre de chapa       │ 🚗 Ficha de la Unidad Seleccionada:          │
│   - Desgaste en tapizado, volante, pomo      │ • Volkswagen Gol Trend 1.6 (2018)            │
│ • Consulta en vivo a la DB (operaciones):    │ • 95.000 km · Ignacio Rodríguez (099 123456)│
│   - "¿A cuánto compramos y vendimos este     │ • Strip de 5 fotos con zoom/lightbox         │
│      modelo recientemente?"                  │                                              │
│ • Sugerencia de rango de toma y margen       │ ✍️ Acción del Vendedor:                      │
│ • Redacción de propuesta comercial para WA   │   [ Campo: Precio Tasado USD: ________ ]     │
│                                              │   [ Botón: ✓ Confirmar Tasación ]            │
│                                              │                                              │
│                                              │ 💬 Cierre Comercial:                         │
│                                              │   [ Botón: 🟢 Abrir WhatsApp con Cliente ]   │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

### Paso a Paso Operativo del Vendedor:

1. **Selección del Caso (Módulo Derecho):**
   - El vendedor selecciona una unidad pendiente de la lista.
   - Se despliegan los datos técnicos y la tira con las **5 fotos** (Frente, Trasera, Laterales e Interior) con soporte de clic para ver en pantalla completa.
   - El campo `"Precio Tasado"` aparece vacío por defecto.

2. **Auditoría con el Copiloto de IA (Módulo Izquierdo):**
   - En el chat de la izquierda, el asistente multimodal se sincroniza automáticamente con la unidad seleccionada y emite un primer reporte:
     > *"He analizado las 5 fotos del Gol Trend 2018 (#TAS-9482):*
     > *1. **Chapa y pintura:** Buen estado general; se observa un leve raspón en el zócalo lateral izquierdo.*
     > *2. **Interior:** Tapizados limpios y tablero en orden, coherente con los 95.000 km.*
     > *3. **Histórico Más Autos (DB):** En los últimos meses se vendieron 2 unidades iguales a USD 10.800 promedio.*
     > *👉 **Sugerencia:** Rango de toma entre **USD 8.200 y USD 8.600** para garantizar un margen del 18-20% considerando ~USD 300 de acondicionamiento."*

3. **Interacción Dinámica en el Chat:**
   - El vendedor puede escribirle al copiloto preguntas específicas:
     - *"¿El zócalo requiere chapa y pintura o sale con pulido?"*
     - *"¿Cuántos autos de este segmento tenemos en stock hoy?"*
     - *"Redactame un mensaje ofreciendo USD 8.400 destacando que la inspección física lleva solo 15 minutos."*

4. **Fijación de Precio y Confirmación (Módulo Derecho):**
   - El vendedor ingresa la cifra decidida (ej. `8400`) en el campo interactivo `"Precio Tasado"`.
   - Presiona el botón primario **"Confirmar Tasación"**.
   - El sistema:
     - Guarda el valor en `tasacion_final_vendedor`.
     - Cambia el estado de la solicitud en Supabase a `cotizado`.
     - Habilita el botón verde **"Abrir WhatsApp con Cliente"**, que carga el mensaje personalizado redactado por la IA en WhatsApp Web.
