const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Cargar variables de entorno desde .env si existe
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
  entrega   -> monto numérico en USD. Si lo indica en pesos uruguayos, convertilo dividiendo por el tipo de cambio proporcionado en "tc". Si indica "sin entrega"/"cero" -> 0. Si ofrece vehículo propio como forma de pago -> asigná permuta: true.
  permuta   -> true si menciona entregar un vehículo usado en permuta. Si especifica marca, modelo o año, registralos en permuta_detalle.
  cuota     -> monto mensual en PESOS uruguayos (UYU). Si lo indica en dólares, multiplicalo por "tc".

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

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Endpoint API /api/asistente
  if (pathname === '/api/asistente') {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      });
      return res.end();
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Método no permitido' }));
    }

    let bodyStr = '';
    req.on('data', chunk => bodyStr += chunk);
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const { expecting, tc, known, message } = body;

        const apiKey = OPENAI_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'OPENAI_API_KEY no configurada' }));
        }

        const userPrompt = JSON.stringify({
          expecting: expecting || null,
          tc: tc || 40,
          known: known || {},
          message: message || ''
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
            temperature: 0.6,
            max_tokens: 120,
            response_format: { type: 'json_object' }
          })
        });

        if (!openaiRes.ok) {
          const errText = await openaiRes.text();
          console.error('OpenAI Error:', errText);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Error OpenAI', details: errText }));
        }

        const data = await openaiRes.json();
        const rawContent = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '{}';

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(rawContent);
      } catch (err) {
        console.error('Error procesando request API:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Endpoint API /api/leads (Registro simple de leads en JSON)
  if (pathname === '/api/leads') {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      });
      return res.end();
    }

    const leadsFile = path.join(__dirname, 'data', 'leads.json');

    if (req.method === 'GET') {
      try {
        const leadsData = fs.existsSync(leadsFile) ? JSON.parse(fs.readFileSync(leadsFile, 'utf8')) : [];
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        return res.end(JSON.stringify({ total: leadsData.length, leads: leadsData }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Método no permitido' }));
    }

    let bodyStr = '';
    req.on('data', chunk => bodyStr += chunk);
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const { nombre, celular, ref, auto_consultado, plan, entrega_usd, cuota_uyu, clearing, permuta, permuta_detalle } = body;

        if (!nombre || !celular) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Nombre y celular son obligatorios' }));
        }

        let leads = [];
        if (fs.existsSync(leadsFile)) {
          try {
            leads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
          } catch (e) {
            leads = [];
          }
        }

        const now = new Date();
        const leadRef = ref || 'MPA-000';
        const idx = leads.findIndex(l => (l.session_ref === leadRef || l.ref === leadRef));

        let lead;
        if (idx >= 0) {
          lead = {
            ...leads[idx],
            nombre: nombre ? nombre.trim() : leads[idx].nombre,
            celular: celular ? celular.trim() : leads[idx].celular,
            auto_consultado: auto_consultado !== undefined ? auto_consultado : leads[idx].auto_consultado,
            plan: plan !== undefined ? plan : leads[idx].plan,
            entrega_usd: typeof entrega_usd === 'number' ? entrega_usd : leads[idx].entrega_usd,
            cuota_uyu: typeof cuota_uyu === 'number' ? cuota_uyu : leads[idx].cuota_uyu,
            clearing: clearing !== undefined ? clearing : leads[idx].clearing,
            permuta: typeof permuta === 'boolean' ? permuta : leads[idx].permuta,
            permuta_detalle: permuta_detalle !== undefined ? permuta_detalle : leads[idx].permuta_detalle,
            updated_at: now.toLocaleString('es-UY', { timeZone: 'America/Montevideo' })
          };
          leads[idx] = lead;
        } else {
          lead = {
            id: 'LEAD-' + Date.now().toString(36).toUpperCase(),
            fecha: now.toISOString(),
            created_at: now.toLocaleString('es-UY', { timeZone: 'America/Montevideo' }),
            nombre: nombre.trim(),
            celular: celular.trim(),
            ref: leadRef,
            session_ref: leadRef,
            auto_consultado: auto_consultado || null,
            plan: plan || null,
            entrega_usd: typeof entrega_usd === 'number' ? entrega_usd : null,
            cuota_uyu: typeof cuota_uyu === 'number' ? cuota_uyu : null,
            clearing: clearing || null,
            permuta: Boolean(permuta),
            permuta_detalle: permuta_detalle || null
          };
          leads.push(lead);
        }

        fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2), 'utf8');

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ ok: true, lead }));
      } catch (err) {
        console.error('Error guardando lead:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Servidor de archivos estáticos (busca en public/ primero)
  const relPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  let filePath = path.join(__dirname, 'public', relPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, relPath);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      return res.end('404 No Encontrado');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(` Servidor local ejecutándose exitosamente!`);
  console.log(` App disponible en: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
