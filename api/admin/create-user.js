import { createClient } from '@supabase/supabase-js';

function serverClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

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
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function requireManager(request, supabase) {
  const header = request.headers.authorization || request.headers.Authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new Error('Missing authorization token');
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    throw new Error('Invalid authorization token');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, role, status')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== 'manager' || profile.status !== 'active') {
    throw new Error('Manager access required');
  }

  return profile;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = serverClient();
    const manager = await requireManager(request, supabase);
    const body = await parseBody(request);

    const {
      email,
      password,
      full_name,
      avatar_url,
      role,
      client_id,
      client_name,
      client_type,
      client_phone,
      client_identity,
      avatar_url
    } = body;

    if (!email || !password || !full_name || !role) {
      return response.status(400).json({ error: 'email, password, full_name and role are required' });
    }

    if (!['manager', 'lawfirm', 'finance', 'hr', 'client'].includes(role)) {
      return response.status(400).json({ error: 'Invalid role' });
    }

    let finalClientId = client_id || null;

    if (role === 'client' && !finalClientId) {
      if (!client_name) {
        return response.status(400).json({ error: 'client_name is required when creating a client user without existing client_id' });
      }

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: client_name,
          type: client_type || 'Individual',
          email,
          phone: client_phone || null,
          identity: client_identity || null
        })
        .select()
        .single();

      if (clientError) throw clientError;
      finalClientId = client.id;
    }

    if (role === 'client' && !finalClientId) {
      return response.status(400).json({ error: 'Client users must be linked to a client' });
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        avatar_url
      }
    });

    if (authError) throw authError;

    const userId = authUser.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        email,
        full_name,
        role,
        avatar_url: avatar_url || null,
        client_id: finalClientId,
        status: 'active',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (profileError) throw profileError;

    await supabase.from('audit_log').insert({
      actor_id: manager.user_id,
      action: 'create_user',
      entity_type: 'profile',
      entity_id: userId,
      metadata: { email, role, client_id: finalClientId }
    });

    return response.status(200).json({ profile });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Failed to create user' });
  }
}
