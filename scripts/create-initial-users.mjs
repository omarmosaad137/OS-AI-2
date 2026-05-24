import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env.local`);
    process.exit(1);
  }
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function findUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
}

async function upsertAuthUser({ email, password, full_name, role }) {
  if (!email || !password || !full_name || !role) {
    throw new Error(`Missing data for ${email || role}`);
  }

  const existing = await findUserByEmail(email);
  let user;

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });
    if (error) throw error;
    user = data.user;
    console.log(`Updated auth user: ${email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created auth user: ${email}`);
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    user_id: user.id,
    email,
    full_name,
    role,
    client_id: null,
    status: 'active',
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });

  if (profileError) throw profileError;

  console.log(`Upserted profile: ${email} (${role})`);
}

await upsertAuthUser({
  email: process.env.MANAGER_EMAIL,
  password: process.env.MANAGER_PASSWORD,
  full_name: process.env.MANAGER_FULL_NAME || 'Manager',
  role: 'manager'
});

await upsertAuthUser({
  email: process.env.LAWFIRM_EMAIL,
  password: process.env.LAWFIRM_PASSWORD,
  full_name: process.env.LAWFIRM_FULL_NAME || 'Law Firm User',
  role: 'lawfirm'
});

console.log('Initial users created/updated successfully.');
