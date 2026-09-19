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

    // 1. Guardar o actualizar en Supabase (grit_leads)
    const supabaseUrl = process.env.SUPABASE_URL || 'https://tyywkunwrdgtxslrqxox.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXdrdW53cmRndHhzbHJxeG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTE1NDM3NCwiZXhwIjoyMTA0NzMwMzc0fQ.N6sIl7SjK9niQyP-BQsVXq0TPALMvo5iK_DrEb11_2c';
    const tableName = 'grit_leads';

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    let supabaseSuccess = false;
    let leadResult = null;

    try {
      // Verificar si ya existe registro previo con la misma ref
      let existingId = null;
      if (ref) {
        const checkRes = await fetch(`${supabaseUrl}/rest/v1/${tableName}?ref=eq.${encodeURIComponent(ref)}&select=id`, {
          headers
        });
        if (checkRes.ok) {
          const rows = await checkRes.json();
          if (rows && rows.length > 0) {
            existingId = rows[0].id;
          }
        }
      }

      if (existingId) {
        // PATCH: actualizar únicamente los campos provistos
        const updateData = {};
        if (nombre) updateData.nombre = nombre.trim();
        if (celular) updateData.celular = celular.trim();
        if (auto_consultado !== undefined && auto_consultado !== null) updateData.auto_consultado = auto_consultado;
        if (plan !== undefined && plan !== null) updateData.plan = plan;
        if (typeof entrega_usd === 'number') updateData.entrega_usd = entrega_usd;
        if (typeof cuota_uyu === 'number') updateData.cuota_uyu = cuota_uyu;
        if (clearing !== undefined && clearing !== null) updateData.clearing = clearing;
        if (typeof permuta === 'boolean') updateData.permuta = permuta;
        if (permuta_detalle !== undefined && permuta_detalle !== null) updateData.permuta_detalle = permuta_detalle;

        const patchRes = await fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${existingId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updateData)
        });

        if (patchRes.ok) {
          supabaseSuccess = true;
          const patchRows = await patchRes.json();
          leadResult = patchRows[0] || updateData;
        } else {
          console.warn('Supabase lead patch warning:', await patchRes.text());
        }
      } else {
        // POST: inserción inicial
        const leadData = {
          nombre: (nombre || '').trim(),
          celular: (celular || '').trim(),
          ref: ref || 'MPA-000',
          auto_consultado: auto_consultado || null,
          plan: plan || null,
          entrega_usd: typeof entrega_usd === 'number' ? entrega_usd : null,
          cuota_uyu: typeof cuota_uyu === 'number' ? cuota_uyu : null,
          clearing: clearing || null,
          permuta: Boolean(permuta),
          permuta_detalle: permuta_detalle || null
        };

        const postRes = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(leadData)
        });

        if (postRes.ok) {
          supabaseSuccess = true;
          const postRows = await postRes.json();
          leadResult = postRows[0] || leadData;
        } else {
          console.warn('Supabase lead insert warning:', await postRes.text());
        }
      }
    } catch (sErr) {
      console.warn('Supabase lead sync error:', sErr.message);
    }

    // 2. Backup en data/leads.json (si filesystem permite)
    try {
      const leadsFile = path.join(process.cwd(), 'data', 'leads.json');
      let leads = fs.existsSync(leadsFile) ? JSON.parse(fs.readFileSync(leadsFile, 'utf8')) : [];
      const idx = leads.findIndex(l => (ref && (l.ref === ref || l.session_ref === ref)));
      const now = new Date().toISOString();
      if (idx >= 0) {
        leads[idx] = {
          ...leads[idx],
          ...(leadResult || body),
          updated_at: now
        };
      } else {
        leads.push({
          ...(leadResult || body),
          ref: ref || 'MPA-000',
          created_at: now
        });
      }
      fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2), 'utf8');
    } catch (writeErr) {
      // Normal en Vercel read-only filesystem
    }

    return res.status(200).json({ ok: true, supabase: supabaseSuccess, lead: leadResult || body });
  } catch (error) {
    console.error('Error guardando lead:', error);
    return res.status(500).json({ error: 'Error al guardar lead', message: error.message });
  }
}
