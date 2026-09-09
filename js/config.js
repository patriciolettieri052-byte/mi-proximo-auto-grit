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
        plazo_banco: 60,
        plazos_casa: [12, 18, 24],
        plazo_casa_default: 24,
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
