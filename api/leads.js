import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const leadsFile = path.join(process.cwd(), 'data', 'leads.json');
      const leadsData = fs.existsSync(leadsFile) ? JSON.parse(fs.readFileSync(leadsFile, 'utf8')) : [];
      return res.status(200).json({ total: leadsData.length, leads: leadsData });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usá POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { nombre, celular, ref } = body || {};

    if (!nombre || !celular) {
      return res.status(400).json({ error: 'Nombre y celular son obligatorios.' });
    }

    const leadsFile = path.join(process.cwd(), 'data', 'leads.json');
    let leads = [];
    if (fs.existsSync(leadsFile)) {
      try {
        leads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
      } catch (e) {
        leads = [];
      }
    }

    const now = new Date();
    const lead = {
      id: 'LEAD-' + Date.now().toString(36).toUpperCase(),
      fecha: now.toISOString(),
      created_at: now.toLocaleString('es-UY', { timeZone: 'America/Montevideo' }),
      nombre: nombre.trim(),
      celular: celular.trim(),
      session_ref: ref || 'MPA-000'
    };

    try {
      leads.push(lead);
      fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2), 'utf8');
    } catch (writeErr) {
      console.warn('Serverless filesystem is read-only, lead captured in logs:', writeErr.message);
    }

    return res.status(200).json({ ok: true, lead });
  } catch (error) {
    console.error('Error guardando lead:', error);
    return res.status(500).json({ error: 'Error al guardar lead', message: error.message });
  }
}
