/**
 * matcher.js — Evaluación de viabilidad crediticia y ordenamiento de resultados
 */

function evaluarVehiculo(vehiculo, userState) {
  const esClearing = (userState.clearing === 'si' || userState.clearing === true || userState.clearing === 'nose');
  
  // Regla: si credito_propio es false, no se evalúa Plan Casa ni aparece para personas con clearing
  const permiteCasa = vehiculo.credito_propio && userState.entrega > 0;
  const permiteBanco = !esClearing;

  let opcionCasa = null;
  if (permiteCasa && entregaMinima(vehiculo.precio_usd) <= userState.entrega) {
    const cuotaUsd = calcPlanCasa(vehiculo.precio_usd, userState.entrega, userState.meses);
    if (cuotaUsd !== null) {
      opcionCasa = {
        plan: 'casa',
        cuotaUsd: cuotaUsd,
        cuotaUyu: usd2uyu(cuotaUsd),
        entrega: Math.min(userState.entrega, entregaMaxima(vehiculo.precio_usd))
      };
    }
  }

  let opcionBanco = null;
  if (permiteBanco) {
    const cuotaUyu = calcPlanBanco(vehiculo.precio_usd);
    if (cuotaUyu !== null) {
      opcionBanco = {
        plan: 'banco',
        cuotaUyu: cuotaUyu,
        entrega: 0
      };
    }
  }

  // 1. Si el usuario ingresó entrega > 0 y califica para Plan Casa (en el plazo base de 24 meses o en el plazo actual)
  if (userState.entrega > 0 && opcionCasa) {
    const cuotaBase24Uyu = usd2uyu(calcPlanCasa(vehiculo.precio_usd, userState.entrega, 24));
    if (cuotaBase24Uyu <= userState.cuota || opcionCasa.cuotaUyu <= userState.cuota) {
      return opcionCasa;
    }
  }

  // 2. Si no califica a Plan Casa pero califica por Banco dentro de su cuota
  if (opcionBanco && opcionBanco.cuotaUyu <= userState.cuota) {
    return opcionBanco;
  }

  // 3. Fallback a Plan Casa si califica
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
