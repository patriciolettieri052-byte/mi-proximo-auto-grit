/**
 * main.js — Inicialización de la aplicación, navegación entre vistas y eventos globales
 */

const HEAD_TITLES = {
  onboarding: ["Mi próximo auto", "Grit Automotores"],
  chat: ["Mi próximo auto", "Asesor virtual de financiación"],
  autos: ["Mi próximo auto", "Vehículos acordes a tu presupuesto"],
  vend: ["Asesor comercial", "Grit Automotores"]
};

let chatIniciado = false;

function ir(vistaId) {
  const vistas = ['vOnboarding', 'vChat', 'vAutos', 'vVend'];
  const navBtns = ['nChat', 'nAutos', 'nVend'];

  vistas.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('on');
  });

  navBtns.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('on');
  });

  const nav = document.getElementById('nav');

  if (vistaId === 'onboarding') {
    const vOnb = document.getElementById('vOnboarding');
    if (vOnb) vOnb.classList.add('on');
    if (nav) nav.style.display = 'none';
  } else if (vistaId === 'chat') {
    const vChat = document.getElementById('vChat');
    const nChat = document.getElementById('nChat');
    if (vChat) vChat.classList.add('on');
    if (nChat) nChat.classList.add('on');
    if (nav) nav.style.display = 'flex';
    if (!chatIniciado) {
      chatIniciado = true;
      iniciarChat();
    }
  } else if (vistaId === 'autos') {
    const vAutos = document.getElementById('vAutos');
    const nAutos = document.getElementById('nAutos');
    if (vAutos) vAutos.classList.add('on');
    if (nAutos) nAutos.classList.add('on');
    if (nav) nav.style.display = 'flex';
    pintarResultados();
  } else if (vistaId === 'vend') {
    const vVend = document.getElementById('vVend');
    const nVend = document.getElementById('nVend');
    if (vVend) vVend.classList.add('on');
    if (nVend) nVend.classList.add('on');
    if (nav) nav.style.display = 'flex';
    actualizarVistaVendedor();
  }

  const h = HEAD_TITLES[vistaId];
  if (h) {
    const tTit = document.getElementById('tTit');
    const tSub = document.getElementById('tSub');
    if (tTit) tTit.textContent = h[0];
    if (tSub) tSub.textContent = h[1];
  }
}

async function comenzarOnboarding() {
  const inNombre = document.getElementById('leadNombre');
  const inCelular = document.getElementById('leadCelular');
  const btn = document.getElementById('btnOnboarding');

  const nombre = inNombre ? inNombre.value.trim() : '';
  const celular = inCelular ? inCelular.value.trim() : '';

  if (!nombre) {
    if (inNombre) inNombre.focus();
    return;
  }
  if (!celular) {
    if (inCelular) inCelular.focus();
    return;
  }

  if (btn) btn.disabled = true;

  // 1. Guardar en memoria de sesión y localStorage
  guardarLeadLocal(nombre, celular);

  // 2. Guardar en backend (Supabase / leads.json) en segundo plano
  sincronizarLeadBackend();

  // 3. Pasar al chat
  ir('chat');
}

function actualizarVistaVendedor() {
  const clMap = { si: "En clearing", no: "Sin atrasos", nose: "A confirmar" };

  const rClearing = document.getElementById('rClearing');
  const rPlan = document.getElementById('rPlan');
  const rEntrega = document.getElementById('rEntrega');
  const rCuota = document.getElementById('rCuota');
  const rAuto = document.getElementById('rAuto');
  const rAsesor = document.getElementById('rAsesor');
  const refTxt = document.getElementById('refTxt');

  if (rClearing) rClearing.textContent = clMap[userSession.clearing] || "—";
  if (rPlan) {
    rPlan.textContent = userSession.plan === 'casa'
      ? "Crédito de la casa"
      : userSession.plan === 'banco'
        ? "Crédito bancario"
        : userSession.plan === 'ambos'
          ? "Ambos"
          : "—";
  }
  if (rEntrega) rEntrega.textContent = userSession.entregaTxt || "—";
  if (rCuota) rCuota.textContent = listo ? `${fmtU(userSession.cuota)} /mes` : "—";
  if (rAuto) rAuto.textContent = userSession.auto_consultado || "—";
  if (rAsesor) {
    if (userSession.auto_obj && userSession.auto_obj.asesor) {
      rAsesor.textContent = userSession.auto_obj.asesor === 'hernan' ? 'Hernán' : 'Sebastián';
    } else {
      rAsesor.textContent = 'Sebastián';
    }
  }
  if (refTxt) refTxt.textContent = `Ref: ${userSession.ref}`;
}

function abrirWhatsAppComercial(asesorId) {
  Analytics.waClick(
    userSession.auto_obj ? userSession.auto_obj.id : 'ninguno',
    userSession.plan,
    userSession.ref
  );
  sincronizarLeadBackend();
  const linkObj = armarLinkWA(userSession.auto_obj, null, userSession, asesorId || 'sebastian');
  abrirWhatsAppLink(linkObj.url);
}

function abrirWhatsAppVendedor() {
  abrirWhatsAppComercial('sebastian');
}

document.addEventListener('DOMContentLoaded', async () => {
  // Carga de configuración y stock estático
  await loadConfig();
  await loadStock();

  // Registrar evento de apertura
  Analytics.appOpen();

  // Inicializar vistas y verificar si ya completó onboarding
  const savedLead = cargarLeadGuardado();
  if (savedLead && savedLead.nombre) {
    const inNombre = document.getElementById('leadNombre');
    const inCelular = document.getElementById('leadCelular');
    if (inNombre) inNombre.value = savedLead.nombre;
    if (inCelular) inCelular.value = savedLead.celular;
    ir('chat');
  } else {
    ir('onboarding');
  }

  pintarResultados();
});
