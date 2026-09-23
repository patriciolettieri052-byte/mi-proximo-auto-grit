/**
 * finance.js — Motor financiero de ambos planes (Banco y Casa)
 * Módulo puro, sin dependencias de DOM.
 */

function getTitulosSplit() {
  const costoTotal = (CFG && CFG.financiacion && CFG.financiacion.costo_titulos) ? CFG.financiacion.costo_titulos : 550;
  return costoTotal / 2; // 275
}

/**
 * Factores de amortización bancaria por plazo en meses
 */
function getFactorBanco(meses) {
  const m = parseInt(meses, 10);
  const factores = (CFG && CFG.financiacion && CFG.financiacion.factores_banco)
    ? CFG.financiacion.factores_banco
    : { 12: 0.090, 24: 0.049, 36: 0.035, 60: 0.024 };
  return factores[m] || (CFG && CFG.financiacion && CFG.financiacion.factor_cuota_banco) || 0.024;
}

/**
 * Plan Banco: Cuota mensual en UYU según plazo y entrega (si aplica)
 * Redondeo ABAJO a la centena
 */
function calcPlanBanco(precioUsd, entrega = 0, meses = 60) {
  if (!precioUsd || precioUsd <= 0) return null;
  const tc = (CFG && CFG.financiacion && CFG.financiacion.tipo_cambio_usd_uyu) ? CFG.financiacion.tipo_cambio_usd_uyu : 40;
  const f = getFactorBanco(meses);
  const capitalUsd = (entrega && entrega > 0) ? Math.max(0, precioUsd - entrega) : precioUsd;
  return Math.floor(capitalUsd * tc * f / 100) * 100;
}

/**
 * Entrega mínima requerida para el Plan Casa (USD, total con títulos)
 */
function entregaMinima(precioUsd) {
  if (!precioUsd || precioUsd <= 0) return 0;
  const tit = getTitulosSplit();
  const pct = (CFG && CFG.financiacion && CFG.financiacion.entrega_minima_pct) ? CFG.financiacion.entrega_minima_pct : 0.50;
  return Math.ceil(precioUsd * pct + tit);
}

/**
 * Entrega máxima computable para el Plan Casa (USD, total con títulos)
 */
function entregaMaxima(precioUsd) {
  if (!precioUsd || precioUsd <= 0) return 0;
  const tit = getTitulosSplit();
  const pct = (CFG && CFG.financiacion && CFG.financiacion.entrega_maxima_pct) ? CFG.financiacion.entrega_maxima_pct : 0.90;
  return Math.ceil(precioUsd * pct + tit);
}

/**
 * Plan Casa: cuota en USD dada una entrega total declarada y un plazo en meses (por defecto 24)
 * Redondeo ARRIBA al entero
 */
function calcPlanCasa(precioUsd, entregaTotal, meses = 24) {
  if (!precioUsd || !entregaTotal || !meses) return null;
  const tit = getTitulosSplit();
  const minCap = precioUsd * (CFG && CFG.financiacion && CFG.financiacion.entrega_minima_pct ? CFG.financiacion.entrega_minima_pct : 0.50);
  const maxCap = precioUsd * (CFG && CFG.financiacion && CFG.financiacion.entrega_maxima_pct ? CFG.financiacion.entrega_maxima_pct : 0.90);
  const entregaCapital = entregaTotal - tit;

  if (entregaCapital < minCap) return null; // No califica

  const capUsada = Math.min(entregaCapital, maxCap); // Cap al 90%
  const financiado = (precioUsd - capUsada) + tit;
  const i = (CFG && CFG.financiacion && CFG.financiacion.interes_flat_mensual) ? CFG.financiacion.interes_flat_mensual : 0.02;

  return Math.ceil(financiado * (1 / meses + i));
}

/**
 * Conversión de USD a UYU
 */
function usd2uyu(montoUsd) {
  const tc = (CFG && CFG.financiacion && CFG.financiacion.tipo_cambio_usd_uyu) ? CFG.financiacion.tipo_cambio_usd_uyu : 40;
  return montoUsd * tc;
}

/**
 * Formateador de moneda UYU
 */
function fmtU(montoUyu) {
  return "$ " + Math.round(montoUyu).toLocaleString("es-UY");
}

/**
 * Formateador de moneda USD
 */
function fmtD(montoUsd) {
  return "USD " + Math.round(montoUsd).toLocaleString("es-UY");
}
