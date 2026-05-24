import { createClient } from '@supabase/supabase-js';

function serverClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function parseBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  let raw = '';
  for await (const chunk of request) raw += chunk;
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

async function requireManager(request, supabase) {
  const header = request.headers.authorization || request.headers.Authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');

  if (!token) throw new Error('Missing authorization token');

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) throw new Error('Invalid authorization token');

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, role, status')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'manager' || profile.status !== 'active') {
    throw new Error('Manager access required');
  }

  return profile;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = serverClient();
    const manager = await requireManager(request, supabase);
    const body = await parseBody(request);

    if (!body.name) return response.status(400).json({ error: 'Client name is required' });

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name: body.name,
        type: body.type || 'Individual',
        email: body.email || null,
        phone: body.phone || null,
        identity: body.identity || null,
        address: body.address || null,
        notes: body.notes || null
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('audit_log').insert({
      actor_id: manager.user_id,
      action: 'create_client',
      entity_type: 'client',
      entity_id: client.id,
      metadata: { name: client.name }
    });

    return response.status(200).json({ client });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Failed to create client' });
  }
}
