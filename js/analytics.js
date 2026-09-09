/**
 * analytics.js — Eventos de Meta Pixel y GA4
 */

function trackEvent(eventName, payload = {}) {
  console.log(`[Analytics Event] ${eventName}:`, payload);

  // Meta Pixel
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, payload);
  }

  // Google Analytics 4 (GA4)
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload);
  }
}

// Eventos específicos especificados en la arquitectura
const Analytics = {
  appOpen: () => trackEvent('app_open', { ref: userSession.ref }),
  q1Answered: (val) => trackEvent('q1_answered', { clearing: val, ref: userSession.ref }),
  q2Answered: (val, origen) => trackEvent('q2_answered', { entrega: val, origen: origen, ref: userSession.ref }),
  q3Answered: (val) => trackEvent('q3_answered', { cuota: val, ref: userSession.ref }),
  resultsShown: (count) => trackEvent('results_shown', { count: count, ref: userSession.ref }),
  emptyStateShown: (entrega, cuota) => trackEvent('empty_state_shown', { entrega: entrega, cuota: cuota, ref: userSession.ref }),
  waClick: (vehiculoId, plan, ref) => trackEvent('wa_click', { vehiculo_id: vehiculoId, plan: plan, ref: ref }),
  needHumanClick: (ref) => trackEvent('need_human_click', { ref: ref })
};
