/**
 * ia.js — Cliente para /api/asistente con timeout, fallback a regex local y límite de llamadas
 */

let llamadasIaEnSesion = 0;
let needHumanMostrado = false;

async function consultarAsistente(expecting, knownState, userMessage) {
  const maxLlamadas = (CFG && CFG.ia && CFG.ia.max_llamadas_sesion) ? CFG.ia.max_llamadas_sesion : 15;
  const timeoutMs = (CFG && CFG.ia && CFG.ia.timeout_ms) ? CFG.ia.timeout_ms : 7000;
  const tc = (CFG && CFG.financiacion && CFG.financiacion.tipo_cambio_usd_uyu) ? CFG.financiacion.tipo_cambio_usd_uyu : 40;

  if (llamadasIaEnSesion >= maxLlamadas) {
    console.warn('Límite de llamadas IA por sesión alcanzado, usando fallback local.');
    return fallbackRegex(expecting, userMessage, tc);
  }

  llamadasIaEnSesion++;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = (CFG && CFG.ia && CFG.ia.endpoint) ? CFG.ia.endpoint : '/api/asistente';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expecting: expecting,
        tc: tc,
        known: knownState,
        message: userMessage
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }

    const data = await res.json();
    return sanitizeIaResponse(data, expecting, userMessage, tc);
  } catch (err) {
    clearTimeout(timer);
    console.warn('Fallback a reglas locales por error/timeout de IA:', err.message);
    return fallbackRegex(expecting, userMessage, tc);
  }
}

function sanitizeIaResponse(data, expecting, userMessage, tc) {
  if (!data || typeof data !== 'object') {
    return fallbackRegex(expecting, userMessage, tc);
  }

  return {
    field: data.field || null,
    value: data.value !== undefined ? data.value : null,
    confidence: data.confidence === 'low' ? 'low' : 'high',
    extra: data.extra || {},
    permuta_detalle: data.permuta_detalle || null,
    reply: typeof data.reply === 'string' ? data.reply : null,
    need_human: Boolean(data.need_human)
  };
}

/**
 * Parser de reglas local en JavaScript (degradación elegante cuando falla la API)
 */
function fallbackRegex(expecting, text, tc) {
  const b = text.toLowerCase();
  const n = extraeNumeros(b);

  const res = {
    field: null,
    value: null,
    confidence: 'high',
    extra: {},
    permuta_detalle: null,
    reply: null,
    need_human: false
  };

  // Detección de permuta en fallback
  if (/(auto|camioneta|moto|entrego|permuta|usado|usada|entregar)/.test(b) && !n.length) {
    res.field = 'permuta';
    res.value = true;
    res.reply = "Comprendido.";
    return res;
  }

  if (expecting === 'clearing') {
    if (/(si|sí|estoy|tuve|debo|atras|clearing|deuda)/.test(b)) {
      res.field = 'clearing'; res.value = true; res.reply = "Comprendido.";
    } else if (/(no|limpio|nunca|ninguno)/.test(b)) {
      res.field = 'clearing'; res.value = false; res.reply = "Comprendido.";
    } else if (/(no se|nosé|no estoy seguro|duda|capaz)/.test(b)) {
      res.field = 'clearing'; res.value = null; res.confidence = 'low'; res.reply = "Comprendido.";
    }
  } else if (expecting === 'entrega') {
    if (/(auto|camioneta|moto|entrego|permuta|usado)/.test(b) && !n.length) {
      res.field = 'permuta'; res.value = true; res.reply = "Bien, ese lo tasamos.";
    } else if (/(nada|no tengo|cero|ning)/.test(b)) {
      res.field = 'entrega'; res.value = 0; res.reply = "Anotado.";
    } else if (n.length > 0) {
      let v = n[0];
      if (v > 0 && v < 100) v *= 1000;
      const usd = v > 80000 ? Math.round(v / tc) : v;
      res.field = 'entrega'; res.value = usd; res.reply = `Anotado: USD ${usd.toLocaleString('es-UY')} de entrega.`;
    }
  } else if (expecting === 'cuota') {
    if (n.length > 0) {
      let v = n[0];
      if (v > 0 && v < 100) v *= 1000;
      res.field = 'cuota'; res.value = v; res.reply = `Dale, $ ${v.toLocaleString('es-UY')}.`;
    }
  }

  return res;
}

function extraeNumeros(t) {
  const m = t.replace(/[.,]/g, "").match(/\d+/g);
  return m ? m.map(Number) : [];
}
