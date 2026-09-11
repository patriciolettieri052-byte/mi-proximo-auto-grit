/**
 * stock.js — Carga y saneo de stock.json aplicando reglas de integridad
 */
let STOCK = [];

async function loadStock() {
  try {
    // 1. Intentar cargar en tiempo real desde Supabase
    if (typeof fetchFromSupabase === 'function') {
      const remoteData = await fetchFromSupabase('grit_vehiculos', '?select=*&estado=eq.disponible&order=orden.asc');
      if (Array.isArray(remoteData) && remoteData.length > 0) {
        STOCK = sanitizeStock(remoteData);
        return STOCK;
      }
    }
  } catch (supabaseErr) {
    console.warn('Supabase no disponible, usando fallback local:', supabaseErr);
  }

  // 2. Fallback de alta disponibilidad a data/stock.json
  try {
    const res = await fetch('data/stock.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const rawData = await res.json();
    STOCK = sanitizeStock(rawData);
    return STOCK;
  } catch (err) {
    console.error('Error total al cargar stock:', err);
    STOCK = [];
    return [];
  }
}

function sanitizeStock(list) {
  if (!Array.isArray(list)) return [];

  return list.filter(item => {
    // Regla: precio_usd ausente, cero o no numérico -> descartado silenciosamente
    if (!item.precio_usd || typeof item.precio_usd !== 'number' || item.precio_usd <= 0) {
      return false;
    }
    // Regla: estado !== "disponible" -> no se muestra
    if (item.estado !== 'disponible') {
      return false;
    }
    return true;
  }).map(item => {
    return {
      id: item.id,
      // Regla: empresa distinto de "grit" -> tratado como "mas_autos"
      empresa: item.empresa === 'grit' ? 'grit' : 'mas_autos',
      estado: item.estado,
      marca: item.marca || 'Vehículo',
      modelo: item.modelo || '',
      version: item.version || null,
      anio: item.anio || new Date().getFullYear(),
      km: typeof item.km === 'number' ? item.km : 0,
      combustible: item.combustible || 'nafta',
      transmision: item.transmision || 'manual',
      carroceria: item.carroceria || '',
      puertas: item.puertas || 5,
      color: item.color || '',
      precio_usd: item.precio_usd,
      // Regla: credito_propio ausente -> se asume true
      credito_propio: item.credito_propio !== undefined ? Boolean(item.credito_propio) : true,
      foto_recorte: item.foto_recorte || null,
      foto_original: item.foto_original || null,
      orden: item.orden || 999
    };
  });
}
