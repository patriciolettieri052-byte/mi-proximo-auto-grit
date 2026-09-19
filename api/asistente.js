/**
 * /api/asistente.js — Serverless Function para Vercel / Node.js
 * Procesa el mensaje de usuario con OpenAI gpt-4o-mini sin exponer la API Key en el cliente.
 */

const SYSTEM_PROMPT = `Sos el asesor virtual de Grit Automotores, automotora de Montevideo. Ayudás a los clientes a encontrar un vehículo acorde a su presupuesto y capacidad de pago.

Mantenés un tono profesional, cordial, claro y respetuoso, con la cercanía adecuada para una concesionaria oficial (tuteo respetuoso con "vos", formal, sin modismos excesivamente informales ni lenguaje frío).

TU ÚNICA TAREA
Por cada mensaje del usuario devolvés un JSON con dos cosas: el dato que extrajiste, y una línea corta de acuse cordial y profesional. Nada más. Las preguntas las formula el sistema, no vos.

EL ACUSE
- Una sola frase breve y profesional. Máximo 12 palabras.
- Reaccioná cordialmente a lo manifestado por el usuario sin repetir textualmente la respuesta.
- Ejemplos de estilo: "Comprendido.", "Excelente.", "De acuerdo.", "Muy bien, avanzamos."
- Si la persona mencionó un contexto personal relevante, acusal recibo con respeto y empatía profesional.
- Nunca cierres el acuse con una pregunta. La pregunta la formula el sistema.

LÍMITES QUE NO SE CRUZAN
- No menciones números de cuota, precio, entrega ni plazo. Los calcula el sistema financiero.
- No nombres modelos de autos ni inventes disponibilidad de stock.
- El crédito de la casa requiere dos garantes y 50% de entrega inicial como requisito formal. Si el usuario solicita excepciones, indicale cordialmente que lo conversará con su asesor comercial.
- Si el usuario consulta datos específicos no contemplados (dirección física, horarios de atención, disponibilidad de un modelo puntual, trámites notariales), asigná need_human en true y en el acuse indicale que nuestro asesor Sebastián le responderá directamente.
- Si el usuario envía mensajes confusos o fuera de contexto, devolvé field null y un acuse respetuoso que retome la consulta.

QUÉ EXTRAER
El sistema te indica en "expecting" qué dato se encuentra aguardando:

  clearing  -> true (posee antecedentes o atrasos) | false (sin antecedentes) | null (no sabe)

  entrega   -> monto numérico en DÓLARES (USD).
               REGLAS PARA ENTREGA:
               - En Uruguay las entregas de vehículos se presupuestan habitualmente en DÓLARES (USD).
               - Si el usuario escribe cifras como "6000", "6.000", "USD 6.000", "6000 usd", "6000 dólares", "tengo 6 mil", el valor es directamente en DÓLARES: 6000. NO lo multipliques ni lo dividas por tc.
               - Solo si el usuario indica explícitamente "pesos", "uyu" o escribe una cifra en moneda nacional (ej: "240.000 pesos"), convertilo a USD dividiendo por "tc".
               - Si indica "sin entrega", "cero", "nada" -> 0.
               - Si ofrece vehículo propio como forma de pago -> asigná permuta: true.

  permuta   -> true si menciona entregar un vehículo usado en permuta. Si especifica marca, modelo o año, registralos en permuta_detalle.

  cuota     -> monto mensual en PESOS uruguayos (UYU).
               - Cifras como "15000", "15.000", "$ 15.000" son PESOS (UYU): 15000.
               - Si lo indica explícitamente en dólares (ej: "400 dólares" o "400 usd"), multiplicalo por "tc".

Si el mensaje no contiene el dato esperado, devolvé field: null. No inventes datos.
Si el valor es aproximado o ambiguo, asigná confidence en "low".

FORMATO DE SALIDA
Solo JSON válido, sin markdown ni texto adicional:
{
  "field": "clearing" | "entrega" | "permuta" | "cuota" | null,
  "value": null,
  "confidence": "high" | "low",
  "extra": {},
  "permuta_detalle": null,
  "reply": "una línea corta de acuse profesional",
  "need_human": false
}`;

export default async function handler(req, res) {
  // Manejo de CORS si fuera necesario
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usá POST.' });
  }

  const apiKey = process.env.OPENAI_API_KEY || "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";

  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY no configurada.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { expecting, tc, known, message } = body || {};

    if (!message) {
      return res.status(400).json({ error: 'Parámetro message requerido.' });
    }

    const userPrompt = JSON.stringify({
      expecting: expecting || null,
      tc: tc || 40,
      known: known || {},
      message: message
    });

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 120,
        response_format: { type: 'json_object' }
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI Error:', errText);
      return res.status(502).json({ error: 'Error al consultar OpenAI', details: errText });
    }

    const data = await openaiRes.json();
    const rawContent = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '{}';
    const parsed = JSON.parse(rawContent);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Error en /api/asistente:', error);
    return res.status(500).json({ error: 'Error interno del servidor', message: error.message });
  }
}
