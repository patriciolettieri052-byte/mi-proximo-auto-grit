# Mi Próximo Auto — Grit Automotores

Aplicación web interactiva para calcular y encontrar vehículos según posibilidades reales de pago y financiación (Crédito Bancario y Crédito de la Casa) de **Grit Automotores**. Asesor Comercial: **Sebastián** (+598 97 300 504).

## 🚀 Características

- **Diseño Plantilla Maestra:** Interfaz minimalista y moderna con tarjetas horizontales (*wide*), modo claro y modo oscuro.
- **Onboarding Simple:** Registro rápido de leads con persistencia de sesión.
- **Asistente Virtual de IA:** Procesamiento conversacional con OpenAI `gpt-4o-mini` para guiar al usuario en 3 preguntas clave (Clearing, Entrega, Cuota).
- **Motor Financiero:**
  - **Plan Banco:** 60 cuotas en pesos uruguayos (UYU) sin entrega inicial.
  - **Plan Casa:** 12, 18 o 24 cuotas en USD (50% entrega inicial mínima + 2 garantes).
- **Inventario:** Flota activa de vehículos con fotos reales descargadas en `assets/`.
- **Integración WhatsApp:** Enlace pre-armado hacia el asesor comercial con los datos del vehículo y el cálculo financiero de la sesión.

## 🛠️ Tecnologías

- **Frontend:** HTML5, CSS3 (CSS Tokens / Variables), Vanilla JavaScript modular.
- **Backend:** Node.js (Servidor local y Serverless Functions para Vercel en `/api`).
- **IA:** OpenAI API (`gpt-4o-mini`).

## 📦 Despliegue en Vercel

1. Importar este repositorio en [Vercel](https://vercel.com).
2. Configurar la variable de entorno:
   - `OPENAI_API_KEY`: Tu API Key de OpenAI.
3. Hacer clic en **Deploy**.
