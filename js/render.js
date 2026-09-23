/**
 * render.js — Pintado de pantalla de resultados, tarjetas, ajuste colapsable y estado vacío
 */

let ajusteOn = false;
let listo = false;

function setPlazo(m) {
  userSession.meses = m;
  [12, 24, 36, 60].forEach(x => {
    const btn = document.getElementById('p' + x);
    if (btn) btn.classList.toggle('on', x === m);
  });
  pintarResultados();
}

function toggleAjuste() {
  if (!listo) return;
  ajusteOn = !ajusteOn;
  const divAjuste = document.getElementById('ajuste');
  if (divAjuste) {
    divAjuste.classList.toggle('on', ajusteOn);
    divAjuste.setAttribute('aria-expanded', ajusteOn ? 'true' : 'false');
  }
  pintarResultados();
}

function moverEnt() {
  const rEnt = document.getElementById('rEnt');
  if (rEnt) {
    userSession.entrega = +rEnt.value;
    userSession.entrega_origen = 'slider';
    userSession.entregaTxt = fmtD(userSession.entrega);
    pintarResultados();
  }
}

function moverCuo() {
  const rCuo = document.getElementById('rCuo');
  if (rCuo) {
    userSession.cuota = +rCuo.value;
    pintarResultados();
  }
}

function pintarResultados() {
  const lista = document.getElementById('lista');
  const divAjuste = document.getElementById('ajuste');
  const divPlazos = document.getElementById('plazos');
  const badge = document.getElementById('badge');

  if (!listo) {
    if (divAjuste) {
      divAjuste.style.opacity = '0.4';
      divAjuste.style.pointerEvents = 'none';
    }
    if (lista) {
      lista.innerHTML = `
        <div class="vacio">
          <h3>Sin datos de búsqueda</h3>
          <p>Al completar las 3 preguntas en el chat, aquí se listarán automáticamente los vehículos acordes a tus posibilidades.</p>
          <button class="btn-linea" onclick="ir('chat')">Comenzar en el chat</button>
        </div>`;
    }
    return;
  }

  if (divAjuste) {
    divAjuste.style.opacity = '1';
    divAjuste.style.pointerEvents = 'auto';
  }

  const lblEnt = document.getElementById('lblEnt');
  const lblCuo = document.getElementById('lblCuo');
  if (lblEnt) lblEnt.textContent = fmtD(userSession.entrega);
  if (lblCuo) lblCuo.innerHTML = `${fmtU(userSession.cuota)} <i>/mes</i>`;

  const r = buscarResultados(STOCK, userSession);
  userSession.resultados_count = r.length;

  const hayBanco = r.some(item => item.fin && item.fin.plan === 'banco');
  const esClearing = (userSession.clearing === 'si' || userSession.clearing === true || userSession.clearing === 'nose' || userSession.plan === 'casa');
  if (divPlazos) {
    divPlazos.classList.toggle('oculto', esClearing || !hayBanco);
  }

  const conteo = document.getElementById('conteo');
  if (conteo) {
    conteo.innerHTML = r.length
      ? `<b>${r.length} vehículo${r.length > 1 ? 's' : ''}</b> disponibles con estos valores`
      : 'No hay vehículos disponibles con estos valores';
  }

  if (badge) {
    if (r.length) {
      badge.textContent = r.length;
      badge.classList.remove('oculto');
    } else {
      badge.classList.add('oculto');
    }
  }

  if (!r.length) {
    renderEmptyState(lista);
    Analytics.emptyStateShown(userSession.entrega, userSession.cuota);
    return;
  }

  Analytics.resultsShown(r.length);

  const mTit = document.getElementById('mTit');
  const mSub = document.getElementById('mSub');
  if (mTit) mTit.textContent = `Vehículos disponibles (${r.length})`;
  if (mSub) {
    const plazoActual = userSession.meses || 60;
    mSub.innerHTML = userSession.entrega > 0
      ? `Con <b>${fmtD(userSession.entrega)}</b> de entrega y cuota mensual de hasta <b>${fmtU(userSession.cuota)}</b>.`
      : `Crédito bancario (${plazoActual} cuotas) sin entrega. Hasta <b>${fmtU(userSession.cuota)}/mes</b>.`;
  }

  if (lista) {
    lista.innerHTML = r.map((item, idx) => renderCard(item, idx)).join('');
  }
}

function renderEmptyState(container) {
  const elegibles = STOCK.filter(a => userSession.plan === 'casa' ? a.credito_propio : true);
  if (!elegibles.length) {
    container.innerHTML = `<div class="vacio"><h3>Stock no disponible</h3><p>En este momento no disponemos de unidades con estas características.</p></div>`;
    return;
  }

  // Candidato más accesible (priorizando unidades con foto)
  const conFoto = elegibles.filter(a => a.foto_recorte);
  const pool = conFoto.length ? conFoto : elegibles;
  const cand = pool.reduce((a, c) => entregaMinima(c.precio_usd) < entregaMinima(a.precio_usd) ? c : a);

  // Calcular el plan financiero correspondiente para la unidad candidata
  const esClearing = (userSession.clearing === 'si' || userSession.clearing === true || userSession.clearing === 'nose');
  const esCasa = (userSession.plan === 'casa' || esClearing) && cand.credito_propio;
  
  let finObj = null;
  if (esCasa) {
    const ent = Math.max(entregaMinima(cand.precio_usd), userSession.entrega || 0);
    const cuotaUsd = calcPlanCasa(cand.precio_usd, ent, 60);
    finObj = {
      plan: 'casa',
      cuotaUsd: cuotaUsd,
      cuotaUyu: usd2uyu(cuotaUsd),
      meses: 60,
      entrega: ent
    };
  } else {
    const mesesBanco = userSession.meses || 60;
    const cuotaUyu = calcPlanBanco(cand.precio_usd, userSession.entrega || 0, mesesBanco);
    finObj = {
      plan: 'banco',
      cuotaUyu: cuotaUyu,
      meses: mesesBanco,
      entrega: userSession.entrega || 0
    };
  }

  const mTit = document.getElementById('mTit');
  const mSub = document.getElementById('mSub');
  if (mTit) mTit.textContent = "Opción más cercana";
  if (mSub) mSub.textContent = "Te mostramos la opción más accesible de nuestro stock.";

  const divPlazos = document.getElementById('plazos');
  if (divPlazos) {
    divPlazos.classList.toggle('oculto', esClearing || esCasa);
  }

  container.innerHTML = renderCard({ vehiculo: cand, fin: finObj }, 0);
}

function renderCard(item, index) {
  const a = item.vehiculo;
  const f = item.fin;
  const esCasa = f.plan === 'casa';

  registrarAutoVisto(a.id);

  const cuotaTxt = fmtU(f.cuotaUyu);
  const plazoBanco = f.meses || userSession.meses || 60;
  const cuotaSub = esCasa
    ? `60 cuotas · (≈ ${fmtD(f.cuotaUsd)})`
    : `${plazoBanco} cuotas fijas en pesos`;

  const planNombre = esCasa ? 'Plan Casa' : 'Plan Banco';

  return `
    <div class="card-auto" style="animation-delay: ${index * 0.04}s">
      <div class="card-foto">
        ${a.foto_recorte ? `<img src="${a.foto_recorte}" alt="${a.marca} ${a.modelo}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';">` : ''}
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="${a.foto_recorte ? 'display:none;' : ''}"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/></svg>
      </div>
      <div class="card-info">
        <div>
          <div class="card-head">
            <h3 class="card-title">${a.marca} ${a.modelo}</h3>
            <span class="badge-plan ${esCasa ? 'casa' : 'banco'}">${planNombre}</span>
          </div>
          <div class="card-specs">${a.anio} · ${a.km.toLocaleString('es-UY')} km · <b>${fmtD(a.precio_usd)}</b></div>
          <div class="fin-box">
            ${esCasa ? `<div class="fin-row"><span>Entrega inicial</span><b>${fmtD(f.entrega)}</b></div>` : `<div class="fin-row"><span>Entrega inicial</span><b>${userSession.entrega > 0 ? `${fmtD(userSession.entrega)} (o 100% financiado)` : 'Sin entrega (100% financiado)'}</b></div>`}
            <div class="fin-row cuota-row">
              <span class="label">Cuota mensual</span>
              <span class="monto">${cuotaTxt}</span>
            </div>
            <span class="fin-note">${cuotaSub}</span>
          </div>
        </div>
        <button class="btn-wa-card" onclick="pedirAutoCard('${a.id}')">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.6-.4.8-.4h.6c.2 0 .4 0 .7.5l.9 2.1c.1.2.1.4 0 .6l-.4.5-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.2.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.2z"/></svg>
          Consultar por WhatsApp
        </button>
      </div>
    </div>
  `;
}

function pedirAutoCard(vehiculoId) {
  const auto = STOCK.find(x => x.id === vehiculoId);
  if (auto) {
    userSession.auto_consultado = auto.marca + ' ' + auto.modelo + ' ' + auto.anio;
    userSession.auto_obj = auto;
    guardarSesionLocal();

    const fin = evaluarVehiculo(auto, userSession);
    Analytics.waClick(auto.id, fin ? fin.plan : userSession.plan, userSession.ref);

    sincronizarLeadBackend({
      auto_consultado: userSession.auto_consultado,
      plan: fin ? fin.plan : userSession.plan,
      entrega_usd: userSession.entrega,
      cuota_uyu: fin ? fin.cuotaUyu : userSession.cuota
    });

    const linkObj = armarLinkWA(auto, fin, userSession, auto.asesor);
    abrirWhatsAppLink(linkObj.url);
  }
}
