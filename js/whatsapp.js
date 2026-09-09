/**
 * whatsapp.js — Generación de enlaces y mensajes formateados para WhatsApp
 * Patrón heredado de getWhatsAppCustomLink(): devuelve un objeto { url, text }, no muta el DOM.
 */

function getComercial(asesorParam) {
  const comerciales = (CFG && CFG.contacto && CFG.contacto.comerciales) ? CFG.contacto.comerciales : [
    { id: 'sebastian', nombre: 'Sebastián', whatsapp: '59897300504' }
  ];

  if (typeof asesorParam === 'object' && asesorParam !== null) {
    return asesorParam;
  }

  if (typeof asesorParam === 'string') {
    const found = comerciales.find(c => c.id === asesorParam.toLowerCase() || c.nombre.toLowerCase() === asesorParam.toLowerCase());
    if (found) return found;
  }

  return comerciales[0] || { id: 'sebastian', nombre: 'Sebastián', whatsapp: '59897300504' };
}

function armarLinkWA(vehiculo, fin, userSession, asesorParam) {
  const targetAsesor = asesorParam || (vehiculo && vehiculo.asesor) || null;
  const comercial = getComercial(targetAsesor);
  const number = comercial.whatsapp || '59897300504';
  const asesorNombre = comercial.nombre || 'Sebastián';

  let text = '';
  const ref = (userSession && userSession.ref) ? userSession.ref : 'MPA-000';
  const autoNombre = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}` : null;
  const cuotaFormatted = (userSession && userSession.cuota) ? `$ ${Math.round(userSession.cuota).toLocaleString('es-UY')}` : '';
  const entregaFormatted = (userSession && userSession.entrega) ? `USD ${Math.round(userSession.entrega).toLocaleString('es-UY')}` : '';
  const saludoIntro = (userSession && userSession.nombre) ? `Hola ${asesorNombre}, soy ${userSession.nombre}. ` : `Hola ${asesorNombre}, `;

  if (userSession && userSession.permuta) {
    if (vehiculo) {
      const cuotaExtra = userSession.cuota ? ` Puedo abonar una cuota de aprox. ${cuotaFormatted} UYU/mes.` : '';
      text = `${saludoIntro}Me interesa el ${autoNombre}. Tengo un vehículo para entregar en permuta y quisiera coordinar la tasación.${cuotaExtra} Ref: ${ref}`;
    } else {
      const detalle = userSession.permuta_detalle ? ` (Unidad: ${userSession.permuta_detalle})` : '';
      text = `${saludoIntro}Tengo un vehículo usado para entregar en permuta y quisiera coordinar la tasación oficial.${detalle} Ref: ${ref}`;
    }
  } else if (fin && fin.plan === 'casa') {
    text = `${saludoIntro}Me interesa el ${autoNombre}. Deseo solicitar la pre-aprobación del Crédito de la Casa con entrega de USD ${Math.round(fin.entrega).toLocaleString('es-UY')} y ${userSession.meses || 24} cuotas de USD ${Math.round(fin.cuotaUsd).toLocaleString('es-UY')}. Ref: ${ref}`;
  } else if (fin && fin.plan === 'banco') {
    const plazoBanco = (CFG && CFG.financiacion && CFG.financiacion.plazo_banco) ? CFG.financiacion.plazo_banco : 60;
    text = `${saludoIntro}Me interesa el ${autoNombre}. Deseo solicitar pre-aprobación de crédito bancario 100% financiado en ${plazoBanco} cuotas en pesos de aprox. $ ${Math.round(fin.cuotaUyu).toLocaleString('es-UY')}. Ref: ${ref}`;
  } else if (vehiculo) {
    text = `${saludoIntro}Me interesa el ${autoNombre}. Cuento con ${entregaFormatted} de entrega y aprox. ${cuotaFormatted}/mes de cuota. ¿Podemos coordinar? Ref: ${ref}`;
  } else {
    text = `${saludoIntro}Quisiera asesoramiento para financiar mi próximo vehículo. Ref: ${ref}`;
  }

  const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  return { url, text, comercial };
}

function abrirWhatsAppLink(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}
