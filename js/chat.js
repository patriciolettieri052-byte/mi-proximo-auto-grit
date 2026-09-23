/**
 * chat.js — Guión conversacional, máquina de estados y manejo de chips/texto libre
 */

let pasoChat = 0;

function decieMensaje(txt, quien, cb, delayMs = 600) {
  const hilo = document.getElementById('hilo');
  if (!hilo) return;

  if (quien === 'ia') {
    const typing = document.createElement('div');
    typing.className = 'msg ia escribiendo';
    typing.innerHTML = '<i></i><i></i><i></i>';
    hilo.appendChild(typing);
    hilo.scrollTop = hilo.scrollHeight;

    setTimeout(() => {
      typing.remove();
      const m = document.createElement('div');
      m.className = 'msg ia';
      m.innerHTML = txt;
      hilo.appendChild(m);
      hilo.scrollTop = hilo.scrollHeight;
      if (cb) cb();
    }, delayMs);
  } else {
    const m = document.createElement('div');
    m.className = 'msg yo';
    m.textContent = txt;
    hilo.appendChild(m);
    hilo.scrollTop = hilo.scrollHeight;
    if (cb) cb();
  }
}

function renderOpcionesChips(arr) {
  const chipsContainer = document.getElementById('chips');
  if (!chipsContainer) return;
  chipsContainer.innerHTML = '';

  arr.forEach(o => {
    const b = document.createElement('button');
    b.className = 'chip' + (o.cls ? ' ' + o.cls : '');
    b.textContent = o.t;
    b.onclick = () => {
      chipsContainer.innerHTML = '';
      decieMensaje(o.t, 'yo');
      setTimeout(o.f, 350);
    };
    chipsContainer.appendChild(b);
  });
}

function iniciarChat() {
  pasoChat = 1;
  Analytics.q1Answered(null);
  const nombreTxt = userSession.nombre ? userSession.nombre.split(' ')[0] : '';
  const saludo = nombreTxt ? `¡Hola, ${nombreTxt}! ` : "¡Hola! ";
  decieMensaje(`${saludo}En 3 simples pasos encontramos tu próximo auto.<br><br>¿Contás con antecedentes en Clearing o atrasos crediticios? Despreocupate que no es bloqueante: <b>en Grit siempre le buscamos la vuelta</b> 🙌.`, 'ia', () => renderOpcionesChips([
    { t: "Sí, estoy en Clearing", f: () => seleccionarClearing('si') },
    { t: "No, sin atrasos", f: () => seleccionarClearing('no') }
  ]), 150);
}

function preguntaPaso(n) {
  pasoChat = n;
  if (n === 1) {
    iniciarChat();
  } else if (n === 2) {
    preguntaEntrega();
  } else if (n === 3) {
    preguntaCuota();
  }
}

function seleccionarClearing(val) {
  userSession.clearing = val;
  Analytics.q1Answered(val);

  if (val === 'no') {
    userSession.plan = 'ambos';
    decieMensaje("Excelente. Podés acceder a todas nuestras líneas de financiación (Bancaria y Crédito de la Casa).", 'ia', () => setTimeout(preguntaEntrega, 400));
  } else {
    userSession.plan = 'casa';
    const elegibles = STOCK.filter(a => a.credito_propio);
    const minVeh = elegibles.length > 0
      ? elegibles.reduce((a, c) => entregaMinima(c.precio_usd) < entregaMinima(a.precio_usd) ? c : a)
      : STOCK[0];
    const pisoUsd = minVeh ? entregaMinima(minVeh.precio_usd) : 4600;

    decieMensaje(`¡Comprendido! En Grit siempre le buscamos la vuelta: contás con nuestro <b>Crédito de la Casa</b> propio (50% de entrega o tu vehículo usado y dos garantes) con entrega inicial desde <b>${fmtD(pisoUsd)}</b>.`, 'ia', () => {
      setTimeout(preguntaEntrega, 450);
    });
  }
}

function preguntaEntrega() {
  pasoChat = 2;
  const elegibles = STOCK.filter(a => userSession.plan === 'casa' ? a.credito_propio : true);
  const minVeh = elegibles.length > 0
    ? elegibles.reduce((a, c) => entregaMinima(c.precio_usd) < entregaMinima(a.precio_usd) ? c : a)
    : STOCK[0];

  const pisoUsd = minVeh ? entregaMinima(minVeh.precio_usd) : 4600;
  const baseUsd = Math.ceil(pisoUsd / 500) * 500;

  const opts = [];
  if (userSession.plan === 'ambos') {
    opts.push({ t: "Sin entrega inicial (100% financiado)", f: () => seleccionarEntrega(0, "Sin entrega inicial", "chip") });
  }
  opts.push({ t: fmtD(baseUsd), f: () => seleccionarEntrega(baseUsd, fmtD(baseUsd), "chip") });
  opts.push({ t: fmtD(Math.round(baseUsd * 1.6)), f: () => seleccionarEntrega(Math.round(baseUsd * 1.6), fmtD(Math.round(baseUsd * 1.6)), "chip") });
  opts.push({ t: fmtD(Math.round(baseUsd * 2.5)), f: () => seleccionarEntrega(Math.round(baseUsd * 2.5), fmtD(Math.round(baseUsd * 2.5)), "chip") });
  opts.push({ t: "Entrego vehículo en permuta", cls: "permuta", f: () => flujoPermuta() });

  const pregTexto = "¿Con qué monto estimado disponés para la entrega inicial?";

  decieMensaje(pregTexto, 'ia', () => renderOpcionesChips(opts));
}

function seleccionarEntrega(valUsd, valTxt, origen) {
  userSession.entrega = valUsd;
  userSession.entregaTxt = valTxt;
  userSession.entrega_origen = origen || 'chip';
  userSession.permuta = false;

  if (valUsd === 0) userSession.plan = 'banco';

  Analytics.q2Answered(valUsd, origen);
  setTimeout(preguntaCuota, 300);
}

function flujoPermuta() {
  userSession.permuta = true;
  userSession.entregaTxt = "Vehículo en permuta a tasar";
  userSession.entrega_origen = "permuta";
  Analytics.q2Answered("permuta", "permuta");

  decieMensaje("Tomamos tu vehículo como parte de pago. Para realizar la tasación, nuestro asesor comercial te solicitará: <b>marca, modelo, año, kilometraje y fotos</b> de la unidad.", 'ia', () => {
    const chipsContainer = document.getElementById('chips');
    if (chipsContainer) {
      chipsContainer.innerHTML = `
        <button class="chip permuta" onclick="ir('vend')">Coordinar tasación por WhatsApp →</button>
        <button class="chip" onclick="preguntaEntrega()">Ingresar un monto en dinero</button>
      `;
    }
  });
}

function preguntaCuota() {
  pasoChat = 3;
  decieMensaje("¿Cuál es el valor máximo estimado que podés destinar a la cuota mensual? (En pesos uruguayos)", 'ia', () => renderOpcionesChips([
    { t: "$ 10.000", f: () => seleccionarCuota(10000) },
    { t: "$ 15.000", f: () => seleccionarCuota(15000) },
    { t: "$ 22.000", f: () => seleccionarCuota(22000) },
    { t: "$ 30.000", f: () => seleccionarCuota(30000) },
    { t: "Más de $ 40.000", f: () => seleccionarCuota(45000) }
  ]));
}

function seleccionarCuota(valUyu) {
  userSession.cuota = valUyu;
  Analytics.q3Answered(valUyu);
  finalizarChat();
}

function finalizarChat() {
  listo = true;
  const rEnt = document.getElementById('rEnt');
  const rCuo = document.getElementById('rCuo');
  if (rEnt) rEnt.value = userSession.entrega;
  if (rCuo) rCuo.value = userSession.cuota;

  // Persistir perfil financiero completo en base de datos
  sincronizarLeadBackend();

  const res = buscarResultados(STOCK, userSession);
  const msgCierre = res.length
    ? `¡Excelente! Seleccionamos <b>${res.length} vehículo${res.length > 1 ? 's' : ''}</b> que cumplen con tus condiciones financieras.`
    : `Con los valores ingresados no alcanzamos el valor mínimo actual, pero te mostramos la opción más cercana y la diferencia requerida.`;

  decieMensaje(msgCierre, 'ia', () => {
    const chipsContainer = document.getElementById('chips');
    if (chipsContainer) {
      chipsContainer.innerHTML = '<button class="chip cta" onclick="ir(\'autos\')">Ver vehículos disponibles →</button>';
    }
    pintarResultados();
  });
}

async function enviarTextoLibre() {
  const input = document.getElementById('txt');
  const sendBtn = document.getElementById('send');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  if (sendBtn) sendBtn.disabled = true;

  const chipsContainer = document.getElementById('chips');
  if (chipsContainer) chipsContainer.innerHTML = '';

  decieMensaje(text, 'yo');

  const expectingMap = { 1: 'clearing', 2: 'entrega', 3: 'cuota' };
  const expectingField = expectingMap[pasoChat] || null;

  userSession.turnos_ia++;

  const resIa = await consultarAsistente(expectingField, {
    clearing: userSession.clearing,
    entrega: userSession.entrega,
    permuta: userSession.permuta
  }, text);

  // Manejo de need_human (máximo 1 chip por sesión)
  if (resIa.need_human && !needHumanMostrado) {
    needHumanMostrado = true;
    registrarNeedHuman(text);
    Analytics.needHumanClick(userSession.ref);

    const acuseTxt = resIa.reply || "Con gusto nuestro asesor Sebastián te responderá directamente para coordinar ese detalle.";
    decieMensaje(acuseTxt, 'ia', () => {
      if (chipsContainer) {
        const link = armarLinkWA(userSession.auto_obj, null, userSession, 'sebastian');
        chipsContainer.innerHTML = `<button class="chip permuta" onclick="abrirWhatsAppLink('${link.url}')">Consultar con Sebastián →</button>`;
      }
      setTimeout(() => {
        if (pasoChat > 0 && pasoChat <= 3) preguntaPaso(pasoChat);
      }, 1000);
    });
    return;
  }

  // Detección de permuta en cualquier momento de la conversación
  if (resIa.field === 'permuta' || resIa.permuta === true || (resIa.extra && resIa.extra.permuta)) {
    if (resIa.permuta_detalle) userSession.permuta_detalle = resIa.permuta_detalle;
    flujoPermuta();
    return;
  }

  // Procesamiento de campo extraído según el paso
  if (resIa.field === 'clearing' && pasoChat === 1) {
    const replyText = resIa.reply || "Comprendido.";
    decieMensaje(replyText, 'ia', () => seleccionarClearing(resIa.value));
  } else if (resIa.field === 'entrega' && pasoChat === 2) {
    const replyText = resIa.reply || "Comprendido.";
    decieMensaje(replyText, 'ia', () => seleccionarEntrega(resIa.value, fmtD(resIa.value), "texto"));
  } else if (resIa.field === 'cuota' && pasoChat === 3) {
    const val = typeof resIa.value === 'number' ? resIa.value : parseInt(resIa.value, 10);
    if (val > 60000) {
      decieMensaje(`Anotado tu nivel de ingresos ($ ${val.toLocaleString('es-UY')}). Para simular la cuota mensual del auto, ¿cuál de estos montos se adapta mejor a tu presupuesto?`, 'ia', () => renderOpcionesChips([
        { t: "$ 10.000", f: () => seleccionarCuota(10000) },
        { t: "$ 15.000", f: () => seleccionarCuota(15000) },
        { t: "$ 22.000", f: () => seleccionarCuota(22000) },
        { t: "$ 30.000", f: () => seleccionarCuota(30000) },
        { t: "Más de $ 40.000", f: () => seleccionarCuota(45000) }
      ]));
      return;
    }
    const replyText = resIa.reply || "Excelente.";
    decieMensaje(replyText, 'ia', () => seleccionarCuota(val));
  } else {
    // Si no se extrajo el campo esperado o confidence es low
    const acuseFallido = resIa.reply || "Por favor, indícanos el siguiente dato:";
    decieMensaje(acuseFallido, 'ia', () => preguntaPaso(pasoChat));
  }
}
