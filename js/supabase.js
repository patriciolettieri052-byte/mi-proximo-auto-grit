/**
 * supabase.js — Conexión y operaciones con Supabase para Grit Automotores
 */
const SUPABASE_CONFIG = {
  url: "https://tyywkunwrdgtxslrqxox.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXdrdW53cmRndHhzbHJxeG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNTQzNzQsImV4cCI6MjEwNDczMDM3NH0.NOpwXUN5wVsA5WfiTwXjfqM_B8Jummlbts7QD91ZiXg"
};

async function fetchFromSupabase(table, queryParams = '') {
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}${queryParams}`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Error consultando Supabase (${table}):`, err);
    return null;
  }
}

async function insertLeadSupabase(leadData) {
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/grit_leads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(leadData)
    });
    if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
    return { ok: true };
  } catch (err) {
    console.warn('Error insertando lead en Supabase:', err);
    return null;
  }
}
