/**
 * session.js — Gestión del estado de sesión del usuario y persistencia
 */

function generarRefSesion() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 3; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'MPA-' + rand;
}

const userSession = {
  ref: generarRefSesion(),
  ts_inicio: new Date().toISOString(),
  nombre: '',
  celular: '',
  lead_saved: false,
  clearing: null, // 'si' | 'no' | 'nose'
  plan: null,     // 'casa' | 'banco' | 'ambos'
  entrega: 0,
  entrega_origen: 'chip',
  permuta: false,
  permuta_detalle: null,
  cuota: 12000,
  meses: 60,
  resultados_count: 0,
  autos_vistos: [],
  auto_consultado: null,
  auto_obj: null,
  turnos_ia: 0,
  need_human_flags: []
};

function cargarLeadGuardado() {
  try {
    const raw = localStorage.getItem('mpa_lead');
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.nombre && data.celular) {
        userSession.nombre = data.nombre;
        userSession.celular = data.celular;
        userSession.lead_saved = true;
        return data;
      }
    }
  } catch (e) {
    console.warn('Error leyendo mpa_lead:', e);
  }
  return null;
}

function guardarLeadLocal(nombre, celular) {
  userSession.nombre = nombre.trim();
  userSession.celular = celular.trim();
  userSession.lead_saved = true;
  try {
    localStorage.setItem('mpa_lead', JSON.stringify({
      nombre: userSession.nombre,
      celular: userSession.celular,
      ts: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('Error guardando mpa_lead:', e);
  }
  guardarSesionLocal();
}

function registrarAutoVisto(autoId) {
  if (autoId && !userSession.autos_vistos.includes(autoId)) {
    userSession.autos_vistos.push(autoId);
  }
  guardarSesionLocal();
}

function registrarNeedHuman(mensajeLiteral) {
  if (mensajeLiteral) {
    userSession.need_human_flags.push({
      ts: new Date().toISOString(),
      mensaje: mensajeLiteral
    });
  }
  guardarSesionLocal();
}

function guardarSesionLocal() {
  try {
    sessionStorage.setItem('mpa_session_' + userSession.ref, JSON.stringify(userSession));
  } catch (e) {
    console.warn('No se pudo guardar la sesión en sessionStorage:', e);
  }
}

async function sincronizarLeadBackend(datosExtra = {}) {
  if (!userSession.nombre || !userSession.celular) return;

  const payload = {
    nombre: userSession.nombre,
    celular: userSession.celular,
    ref: userSession.ref,
    clearing: userSession.clearing || null,
    plan: userSession.plan || null,
    entrega_usd: typeof userSession.entrega === 'number' ? userSession.entrega : null,
    cuota_uyu: typeof userSession.cuota === 'number' ? userSession.cuota : null,
    auto_consultado: userSession.auto_consultado || null,
    permuta: Boolean(userSession.permuta),
    permuta_detalle: userSession.permuta_detalle || null,
    ...datosExtra
  };

  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Error sincronizando lead con backend:', err);
  }
}

window.sincronizarLeadBackend = sincronizarLeadBackend;
