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
    const { nombre, celular, ref, auto_consultado, plan, entrega_usd, cuota_uyu, clearing, permuta, permuta_detalle } = body || {};

    if (!nombre || !celular) {
      return res.status(400).json({ error: 'Nombre y celular son obligatorios.' });
    }

    const leadData = {
      nombre: nombre.trim(),
      celular: celular.trim(),
      ref: ref || 'MPA-000',
      auto_consultado: auto_consultado || null,
      plan: plan || null,
      entrega_usd: typeof entrega_usd === 'number' ? entrega_usd : null,
      cuota_uyu: typeof cuota_uyu === 'number' ? cuota_uyu : null,
      clearing: clearing || null,
      permuta: Boolean(permuta),
      permuta_detalle: permuta_detalle || null
    };

    // 1. Guardar en Supabase (grit_leads)
    const supabaseUrl = process.env.SUPABASE_URL || 'https://tyywkunwrdgtxslrqxox.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXdrdW53cmRndHhzbHJxeG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNTQzNzQsImV4cCI6MjEwNDczMDM3NH0.NOpwXUN5wVsA5WfiTwXjfqM_B8Jummlbts7QD91ZiXg';

    let supabaseInserted = false;
    try {
      const sRes = await fetch(`${supabaseUrl}/rest/v1/grit_leads`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(leadData)
      });
      if (sRes.ok) {
        supabaseInserted = true;
      } else {
        console.warn('Supabase lead insert warning:', await sRes.text());
      }
    } catch (sErr) {
      console.warn('Supabase lead insert error:', sErr.message);
    }

    // 2. Backup en data/leads.json (si filesystem permite)
    try {
      const leadsFile = path.join(process.cwd(), 'data', 'leads.json');
      let leads = fs.existsSync(leadsFile) ? JSON.parse(fs.readFileSync(leadsFile, 'utf8')) : [];
      leads.push({ ...leadData, created_at: new Date().toISOString() });
      fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2), 'utf8');
    } catch (writeErr) {
      // Normal en Vercel read-only filesystem
    }

    return res.status(200).json({ ok: true, supabase: supabaseInserted, lead: leadData });
  } catch (error) {
    console.error('Error guardando lead:', error);
    return res.status(500).json({ error: 'Error al guardar lead', message: error.message });
  }
}
