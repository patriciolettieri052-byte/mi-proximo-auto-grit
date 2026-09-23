/**
 * config.js — Carga de la configuración del sistema (data/config.json)
 */
let CFG = null;

async function loadConfig() {
  try {
    const res = await fetch('data/config.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    CFG = await res.json();
    return CFG;
  } catch (err) {
    console.error('Error cargando config.json, usando fallback:', err);
    // Fallback mínimo de seguridad para evitar crash
    CFG = {
      app: { nombre: "Mi Próximo Auto", version: "1.0" },
      financiacion: {
        tipo_cambio_usd_uyu: 40,
        factor_cuota_banco: 0.024,
        factores_banco: { 12: 0.090, 24: 0.049, 36: 0.035, 60: 0.024 },
        plazos_banco: [12, 24, 36, 60],
        plazo_banco_default: 60,
        plazo_casa: 60,
        interes_flat_mensual: 0.02,
        costo_titulos: 550,
        entrega_minima_pct: 0.50,
        entrega_maxima_pct: 0.90,
        leyenda_casa: "Requiere dos garantes. Sujeto a aprobación. Incluye gastos de títulos.",
        leyenda_banco: "Sujeto a aprobación crediticia bancaria."
      },
      contacto: {
        whatsapp: "59897300504",
        vendedor_nombre: "Sebastián",
        vendedor_cargo: "Asesor comercial",
        telefono_visible: "+598 97 300 504"
      },
      ia: {
        endpoint: "/api/asistente",
        timeout_ms: 4000,
        max_llamadas_sesion: 15
      }
    };
    return CFG;
  }
}
