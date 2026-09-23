/**
 * matcher.js — Evaluación de viabilidad crediticia y ordenamiento de resultados
 */

function evaluarVehiculo(vehiculo, userState) {
  const esClearing = (userState.clearing === 'si' || userState.clearing === true || userState.clearing === 'nose');
  
  // Regla: si credito_propio es false, no se evalúa Plan Casa ni aparece para personas con clearing
  const permiteCasa = vehiculo.credito_propio && userState.entrega > 0;
  const permiteBanco = !esClearing;

  // Plan Casa: a 24 cuotas fijas (límite para Crédito de la Casa)
  let opcionCasa = null;
  const plazoCasa = (CFG && CFG.financiacion && CFG.financiacion.plazo_casa) ? CFG.financiacion.plazo_casa : 24;
  if (permiteCasa && entregaMinima(vehiculo.precio_usd) <= userState.entrega) {
    const cuotaUsd = calcPlanCasa(vehiculo.precio_usd, userState.entrega, plazoCasa);
    if (cuotaUsd !== null) {
      opcionCasa = {
        plan: 'casa',
        cuotaUsd: cuotaUsd,
        cuotaUyu: usd2uyu(cuotaUsd),
        meses: plazoCasa,
        entrega: Math.min(userState.entrega, entregaMaxima(vehiculo.precio_usd))
      };
    }
  }

  // Plan Banco: cuota calculada con el plazo seleccionado (12, 24, 36, 60) y entrega (si aplica)
  let opcionBanco = null;
  if (permiteBanco) {
    const mesesBanco = userState.meses || 60;
    const cuotaUyu = calcPlanBanco(vehiculo.precio_usd, userState.entrega || 0, mesesBanco);
    if (cuotaUyu !== null) {
      opcionBanco = {
        plan: 'banco',
        cuotaUyu: cuotaUyu,
        meses: mesesBanco,
        entrega: userState.entrega || 0
      };
    }
  }

  // 1. Si no tiene clearing y califica por Banco (evaluado contra la cuota base a 60m o el plazo actual)
  if (opcionBanco) {
    const cuotaBase60 = calcPlanBanco(vehiculo.precio_usd, userState.entrega || 0, 60);
    if (cuotaBase60 <= userState.cuota || opcionBanco.cuotaUyu <= userState.cuota) {
      return opcionBanco;
    }
  }

  // 2. Si el usuario ingresó entrega > 0 y califica para Plan Casa dentro de su cuota
  if (opcionCasa && opcionCasa.cuotaUyu <= userState.cuota) {
    return opcionCasa;
  }

  return null;
}

function buscarResultados(stockList, userState) {
  if (!Array.isArray(stockList)) return [];

  return stockList
    .map(v => ({ vehiculo: v, fin: evaluarVehiculo(v, userState) }))
    .filter(r => r.fin !== null)
    .sort((a, b) => b.vehiculo.precio_usd - a.vehiculo.precio_usd);
}
