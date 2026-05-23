import React, { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient.js';
import './styles.css';

const roles = {
  manager: 'Manager',
  lawfirm: 'Law Firm User',
  finance: 'Finance User',
  client: 'Client User'
};

const initialCreateUser = {
  email: '',
  password: '',
  full_name: '',
  role: 'lawfirm',
  client_id: '',
  client_name: '',
  client_type: 'Individual',
  client_phone: '',
  client_identity: ''
};

const initialClient = {
  name: '',
  type: 'Individual',
  email: '',
  phone: '',
  identity: '',
  address: '',
  notes: ''
};

const initialInvoiceRequest = {
  matter_id: '',
  request_type: 'Court fee',
  amount: '',
  currency: 'AED',
  description: '',
  urgency: 'Normal'
};

const initialEngagementLetter = {
  matter_id: '',
  ref: '',
  title: 'Engagement Letter',
  status: 'draft',
  sent_date: '',
  signed_date: '',
  payment_terms: '50% advance / 50% after first instance judgment',
  payment_due_date: '',
  notes: ''
};

const initialInvoice = {
  matter_id: '',
  engagement_letter_id: '',
  invoice_type: 'Court fee',
  invoice_no: '',
  amount: '',
  currency: 'AED',
  vat_applicable: 'false',
  vat_rate: '5',
  issue_date: '',
  due_date: '',
  description: '',
  status: 'pending_approval'
};

function Card({ title, action, children }) {
  return (
    <section className="card">
      <div className="cardHeader">
        <h2>{title}</h2>
        {action}
      </div>
      <div className="cardBody">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

function money(value, currency = 'AED') {
  return `${currency} ${Number(value || 0).toLocaleString()}`;
}

function defaultVatForInvoiceType(type) {
  const taxable = ['Professional fee', 'Translation', 'Consultation', 'Drafting fee', 'Legal services'];
  const nonTaxable = ['Court fee', 'Government fee', 'Notary fee'];
  if (taxable.includes(type)) return 'true';
  if (nonTaxable.includes(type)) return 'false';
  return 'false';
}

function calculateVat(amount, vatApplicable, vatRate) {
  const subtotal = Number(amount || 0);
  const rate = Number(vatRate || 0);
  const isApplicable = String(vatApplicable) === 'true';
  const vat = isApplicable ? +(subtotal * rate / 100).toFixed(2) : 0;
  const total = +(subtotal + vat).toFixed(2);
  return { subtotal, vat, total };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToDate(date, days) {
  if (!date) return '';
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function paymentReminderText(invoice) {
  const matterRef = invoice.matters?.ref || 'your matter';
  const matterTitle = invoice.matters?.title || '';
  const clientName = invoice.matters?.clients?.name || 'Client';
  return [
    `Dear ${clientName},`,
    '',
    `Kindly note that payment is due in relation to ${matterRef}${matterTitle ? ` — ${matterTitle}` : ''}.`,
    '',
    `Invoice: ${invoice.invoice_no || '-'}`,
    `Amount: ${money(invoice.total_amount || invoice.amount, invoice.currency)}`,
    `Due date: ${invoice.due_date || '-'}`,
    '',
    'Please arrange payment on or before the due date to avoid any delay in the required legal work.',
    '',
    'Best regards,',
    'OS Legal'
  ].join('\n');
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [login, setLogin] = useState({ email: 'omar@os-legal.net', password: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [clients, setClients] = useState([]);
  const [matters, setMatters] = useState([]);
  const [invoiceRequests, setInvoiceRequests] = useState([]);
  const [engagementLetters, setEngagementLetters] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [paymentReminders, setPaymentReminders] = useState([]);
  const [newUser, setNewUser] = useState(initialCreateUser);
  const [newClient, setNewClient] = useState(initialClient);
  const [newInvoiceRequest, setNewInvoiceRequest] = useState(initialInvoiceRequest);
  const [newEngagementLetter, setNewEngagementLetter] = useState(initialEngagementLetter);
  const [newInvoice, setNewInvoice] = useState(initialInvoice);

  const isManager = profile?.role === 'manager';
  const isFinance = profile?.role === 'finance';
  const isLawFirm = profile?.role === 'manager' || profile?.role === 'lawfirm' || profile?.role === 'finance';
  const isClient = profile?.role === 'client';

  const nav = useMemo(() => {
    if (!profile) return [];
    if (isClient) return [
      ['dashboard', 'My Portal'],
      ['matters', 'My Matters']
    ];
    if (profile.role === 'lawfirm') return [
      ['dashboard', 'Dashboard'],
      ['clients', 'Clients'],
      ['matters', 'All Matters'],
      ['invoice-requests', 'Invoice Requests']
    ];

    if (profile.role === 'finance') return [
      ['dashboard', 'Dashboard'],
      ['clients', 'Clients'],
      ['matters', 'All Matters'],
      ['invoice-requests', 'Invoice Requests'],
      ['finance', 'Finance Operations']
    ];

    return [
      ['dashboard', 'Dashboard'],
      ['users', 'Users'],
      ['clients', 'Clients'],
      ['matters', 'Matters'],
      ['invoice-requests', 'Invoice Requests'],
      ['finance', 'Finance Operations'],
      ['audit', 'Audit']
    ];
  }, [profile, isClient]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadProfile(session.user.id);
    } else {
      setProfile(null);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (profile) {
      loadDashboardData();
    }
  }, [profile?.user_id, profile?.role, profile?.client_id]);

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, role, status, client_id, clients(name)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data) {
      setMessage('Login succeeded, but no profile was found for this user. Ask the manager to create a profile.');
      return;
    }

    if (data.status !== 'active') {
      setMessage('This user is disabled.');
      await supabase.auth.signOut();
      return;
    }

    setProfile(data);
  }

  async function loadDashboardData() {
    await Promise.all([
      loadProfiles(),
      loadClients(),
      loadMatters(),
      loadInvoiceRequests(),
      loadFinanceData()
    ]);
  }

  async function loadProfiles() {
    if (!isManager) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, role, status, client_id, clients(name)')
      .order('created_at', { ascending: false });

    if (!error) setProfiles(data || []);
  }

  async function loadClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, type, email, phone, identity, address, notes, created_at')
      .order('created_at', { ascending: false });

    if (!error) setClients(data || []);
  }

  async function loadMatters() {
    const { data, error } = await supabase
      .from('matters')
      .select('id, ref, title, client_id, matter_type, forum, opponent, stage, status, deadline, facts, next_step, clients(name)')
      .order('created_at', { ascending: false });

    if (!error) setMatters(data || []);
  }

  async function loadInvoiceRequests() {
    const { data, error } = await supabase
      .from('invoice_requests')
      .select('id, matter_id, request_type, amount, currency, description, urgency, status, created_at, requested_by_profile:profiles!invoice_requests_requested_by_fkey(full_name, email), matters(ref, title, clients(name, email))')
      .order('created_at', { ascending: false });

    if (!error) setInvoiceRequests(data || []);
  }

  async function loadFinanceData() {
    if (!isManager && !isFinance) return;

    const [engagementRes, invoiceRes, reminderRes] = await Promise.all([
      supabase
        .from('engagement_letters')
        .select('id, matter_id, ref, title, status, sent_date, signed_date, payment_terms, payment_due_date, notes, created_at, matters(ref, title, clients(name, email))')
        .order('created_at', { ascending: false }),
      supabase
        .from('invoices')
        .select('id, matter_id, engagement_letter_id, invoice_no, invoice_type, amount, currency, vat_applicable, vat_rate, vat_amount, total_amount, issue_date, due_date, status, description, created_at, approved_at, sent_at, matters(ref, title, clients(name, email)), engagement_letters(ref, title)')
        .order('created_at', { ascending: false }),
      supabase
        .from('payment_reminders')
        .select('id, invoice_id, matter_id, reminder_date, channel, status, message, sent_at, invoices(invoice_no, amount, currency, due_date, status, matters(ref, title, clients(name, email)))')
        .order('reminder_date', { ascending: true })
    ]);

    if (!engagementRes.error) setEngagementLetters(engagementRes.data || []);
    if (!invoiceRes.error) setInvoices(invoiceRes.data || []);
    if (!reminderRes.error) setPaymentReminders(reminderRes.data || []);
  }

  async function loginUser(event) {
    event.preventDefault();
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: login.email,
      password: login.password
    });

    if (error) {
      setMessage(error.message);
    }
  }

  async function logoutUser() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  async function authHeader() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function createUser(event) {
    event.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await authHeader())
        },
        body: JSON.stringify(newUser)
      });

      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await response.json()
        : { error: 'The user creation API is not running. If you are testing locally, run with Vercel CLI using: vercel dev. Client creation works locally, but creating auth users requires the server API route.' };

      if (!response.ok || result.error) {
        setMessage(result.error || 'Failed to create user');
        return;
      }

      setNewUser(initialCreateUser);
      setMessage('User created successfully.');
      await loadDashboardData();
    } catch (error) {
      setMessage(error.message || 'Failed to create user. If testing locally, use vercel dev or deploy to Vercel.');
    }
  }

  async function createClient(event) {
    event.preventDefault();
    setMessage('');

    if (!newClient.name.trim()) {
      setMessage('Client name is required.');
      return;
    }

    const { error } = await supabase
      .from('clients')
      .insert({
        name: newClient.name,
        type: newClient.type || 'Individual',
        email: newClient.email || null,
        phone: newClient.phone || null,
        identity: newClient.identity || null,
        address: newClient.address || null,
        notes: newClient.notes || null
      });

    if (error) {
      setMessage(error.message || 'Failed to create client. Check that you are logged in as manager and that RLS policies were created.');
      return;
    }

    setNewClient(initialClient);
    setMessage('Client created successfully.');
    await loadDashboardData();
  }


  async function createInvoiceRequest(event) {
    event.preventDefault();
    setMessage('');

    if (!newInvoiceRequest.matter_id) {
      setMessage('Please select a matter.');
      return;
    }

    if (!newInvoiceRequest.amount || Number(newInvoiceRequest.amount) <= 0) {
      setMessage('Please enter a valid amount.');
      return;
    }

    const { error } = await supabase
      .from('invoice_requests')
      .insert({
        matter_id: newInvoiceRequest.matter_id,
        request_type: newInvoiceRequest.request_type,
        amount: Number(newInvoiceRequest.amount),
        currency: newInvoiceRequest.currency || 'AED',
        description: newInvoiceRequest.description || null,
        urgency: newInvoiceRequest.urgency || 'Normal',
        requested_by: profile.user_id,
        status: 'pending'
      });

    if (error) {
      setMessage(error.message || 'Failed to create invoice request.');
      return;
    }

    setNewInvoiceRequest(initialInvoiceRequest);
    setMessage('Invoice request submitted successfully.');
    await loadDashboardData();
  }

  async function updateInvoiceRequestStatus(id, status) {
    setMessage('');

    const { error } = await supabase
      .from('invoice_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      setMessage(error.message || 'Failed to update invoice request.');
      return;
    }

    await loadDashboardData();
  }


  async function createEngagementLetter(event) {
    event.preventDefault();
    setMessage('');

    if (!newEngagementLetter.matter_id) {
      setMessage('Please select a matter for the engagement letter.');
      return;
    }

    const payload = {
      matter_id: newEngagementLetter.matter_id,
      ref: newEngagementLetter.ref || `EL-${Date.now().toString().slice(-6)}`,
      title: newEngagementLetter.title || 'Engagement Letter',
      status: newEngagementLetter.status || 'draft',
      sent_date: newEngagementLetter.sent_date || null,
      signed_date: newEngagementLetter.signed_date || null,
      payment_terms: newEngagementLetter.payment_terms || null,
      payment_due_date: newEngagementLetter.payment_due_date || null,
      notes: newEngagementLetter.notes || null,
      created_by: profile.user_id
    };

    const { error } = await supabase.from('engagement_letters').insert(payload);

    if (error) {
      setMessage(error.message || 'Failed to create engagement letter.');
      return;
    }

    setNewEngagementLetter(initialEngagementLetter);
    setMessage('Engagement letter record created successfully.');
    await loadDashboardData();
  }

  function buildReminderRows(invoice) {
    const offsets = [-7, -3, 0, 3];
    return offsets
      .map((offset) => ({
        invoice_id: invoice.id,
        matter_id: invoice.matter_id,
        reminder_date: addDaysToDate(invoice.due_date, offset),
        channel: 'email',
        status: 'scheduled',
        message: paymentReminderText(invoice)
      }))
      .filter((row) => row.reminder_date);
  }

  async function createInvoice(event) {
    event.preventDefault();
    setMessage('');

    if (!newInvoice.matter_id) {
      setMessage('Please select a matter.');
      return;
    }

    if (!newInvoice.amount || Number(newInvoice.amount) <= 0) {
      setMessage('Please enter a valid invoice amount.');
      return;
    }

    if (!newInvoice.due_date) {
      setMessage('Please enter the payment due date.');
      return;
    }

    const vatCalc = calculateVat(newInvoice.amount, newInvoice.vat_applicable, newInvoice.vat_rate);

    const payload = {
      matter_id: newInvoice.matter_id,
      engagement_letter_id: newInvoice.engagement_letter_id || null,
      invoice_no: newInvoice.invoice_no || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
      invoice_type: newInvoice.invoice_type,
      amount: vatCalc.subtotal,
      currency: newInvoice.currency || 'AED',
      vat_applicable: String(newInvoice.vat_applicable) === 'true',
      vat_rate: String(newInvoice.vat_applicable) === 'true' ? Number(newInvoice.vat_rate || 0) : 0,
      vat_amount: vatCalc.vat,
      total_amount: vatCalc.total,
      issue_date: newInvoice.issue_date || today(),
      due_date: newInvoice.due_date,
      status: newInvoice.status || 'pending_approval',
      description: newInvoice.description || null,
      created_by: profile.user_id
    };

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert(payload)
      .select('id, matter_id, engagement_letter_id, invoice_no, invoice_type, amount, currency, issue_date, due_date, status, description, matters(ref, title, clients(name, email)), engagement_letters(ref, title)')
      .single();

    if (error) {
      setMessage(error.message || 'Failed to create invoice.');
      return;
    }

    const reminders = buildReminderRows(invoice);
    if (reminders.length) {
      await supabase.from('payment_reminders').insert(reminders);
    }

    setNewInvoice(initialInvoice);
    setMessage('Invoice created and payment reminders scheduled.');
    await loadDashboardData();
  }

  async function updateInvoiceStatus(id, status) {
    setMessage('');

    const patch = { status };
    if (status === 'approved') patch.approved_at = new Date().toISOString();
    if (status === 'sent') patch.sent_at = new Date().toISOString();

    const { error } = await supabase
      .from('invoices')
      .update(patch)
      .eq('id', id);

    if (error) {
      setMessage(error.message || 'Failed to update invoice.');
      return;
    }

    await loadDashboardData();
  }

  async function markReminderSent(id) {
    const { error } = await supabase
      .from('payment_reminders')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setMessage(error.message || 'Failed to mark reminder as sent.');
      return;
    }

    await loadDashboardData();
  }


  if (loading) {
    return <main className="centerPage">Loading...</main>;
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="centerPage">
        <section className="setupCard">
          <div className="brandMark">OS</div>
          <h1>Supabase is not configured</h1>
          <p>Add the following environment variables and redeploy:</p>
          <pre>{`VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=`}</pre>
        </section>
      </main>
    );
  }

  if (!session || !profile) {
    return (
      <main className="centerPage">
        <section className="loginCard">
          <div className="brandMark">OS</div>
          <h1>OS Legal</h1>
          <p>Production authentication module</p>

          <form onSubmit={loginUser}>
            <Field label="Email / Username">
              <input value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} />
            </Field>
            <Field label="Password">
              <input type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} />
            </Field>
            <button className="primary full">Login</button>
          </form>

          {message && <div className="notice">{message}</div>}
        </section>
      </main>
    );
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="logo">
          <span>OS</span>
          <small>{roles[profile.role]}</small>
        </div>

        <nav>
          {nav.map(([key, label]) => (
            <button key={key} className={page === key ? 'active' : ''} onClick={() => setPage(key)}>
              {label}
            </button>
          ))}
        </nav>

        <div className="userBox">
          <strong>{profile.full_name}</strong>
          <small>{profile.email}</small>
          <small>{roles[profile.role]}</small>
        </div>

        <button onClick={logoutUser}>Logout</button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{nav.find(([key]) => key === page)?.[1] || 'Dashboard'}</h1>
            <p>{profile.full_name} — {roles[profile.role]}</p>
          </div>
        </header>

        <section className="content">
          {message && <div className="notice">{message}</div>}

          {page === 'dashboard' && (
            <div className="stats">
              <Stat label="Users" value={isManager ? profiles.length : 1} />
              <Stat label="Clients" value={clients.length} />
              <Stat label="Matters" value={matters.length} />
              <Stat label="Role" value={roles[profile.role]} />
            </div>
          )}

          {page === 'users' && isManager && (
            <div className="grid two">
              <Card title="Create User">
                <form onSubmit={createUser} className="formGrid">
                  <Field label="Full name">
                    <input value={newUser.full_name} onChange={(event) => setNewUser({ ...newUser, full_name: event.target.value })} />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} />
                  </Field>
                  <Field label="Temporary password">
                    <input type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} />
                  </Field>
                  <Field label="Role">
                    <select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}>
                      <option value="manager">Manager</option>
                      <option value="lawfirm">Law Firm User</option>
                      <option value="finance">Finance User</option>
                      <option value="client">Client User</option>
                    </select>
                  </Field>

                  {newUser.role === 'client' && (
                    <>
                      <Field label="Existing client">
                        <select value={newUser.client_id} onChange={(event) => setNewUser({ ...newUser, client_id: event.target.value })}>
                          <option value="">Create new client below</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                          ))}
                        </select>
                      </Field>
                      {!newUser.client_id && (
                        <>
                          <Field label="New client name">
                            <input value={newUser.client_name} onChange={(event) => setNewUser({ ...newUser, client_name: event.target.value })} />
                          </Field>
                          <Field label="Client type">
                            <select value={newUser.client_type} onChange={(event) => setNewUser({ ...newUser, client_type: event.target.value })}>
                              <option>Individual</option>
                              <option>Company</option>
                            </select>
                          </Field>
                          <Field label="Client phone">
                            <input value={newUser.client_phone} onChange={(event) => setNewUser({ ...newUser, client_phone: event.target.value })} />
                          </Field>
                          <Field label="Client ID / Licence">
                            <input value={newUser.client_identity} onChange={(event) => setNewUser({ ...newUser, client_identity: event.target.value })} />
                          </Field>
                        </>
                      )}
                    </>
                  )}

                  <button className="primary">Create User</button>
                </form>
              </Card>

              <Card title="Users">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Client</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((item) => (
                      <tr key={item.user_id}>
                        <td><strong>{item.full_name}</strong></td>
                        <td>{item.email}</td>
                        <td><Pill>{roles[item.role]}</Pill></td>
                        <td>{item.clients?.name || '-'}</td>
                        <td>{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {page === 'clients' && isLawFirm && (
            <div className={isManager ? "grid two" : "grid"}>
              {(isManager || isFinance) && (
                <Card title="Create Client">
                  <form onSubmit={createClient} className="formGrid">
                    <Field label="Client name">
                      <input value={newClient.name} onChange={(event) => setNewClient({ ...newClient, name: event.target.value })} />
                    </Field>
                    <Field label="Type">
                      <select value={newClient.type} onChange={(event) => setNewClient({ ...newClient, type: event.target.value })}>
                        <option>Individual</option>
                        <option>Company</option>
                      </select>
                    </Field>
                    <Field label="Email">
                      <input value={newClient.email} onChange={(event) => setNewClient({ ...newClient, email: event.target.value })} />
                    </Field>
                    <Field label="Phone">
                      <input value={newClient.phone} onChange={(event) => setNewClient({ ...newClient, phone: event.target.value })} />
                    </Field>
                    <Field label="ID / Licence">
                      <input value={newClient.identity} onChange={(event) => setNewClient({ ...newClient, identity: event.target.value })} />
                    </Field>
                    <Field label="Address">
                      <input value={newClient.address} onChange={(event) => setNewClient({ ...newClient, address: event.target.value })} />
                    </Field>
                    <Field label="Notes">
                      <textarea value={newClient.notes} onChange={(event) => setNewClient({ ...newClient, notes: event.target.value })} />
                    </Field>
                    <button className="primary">Create Client</button>
                  </form>
                </Card>
              )}

              <Card title="Clients">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id}>
                        <td><strong>{client.name}</strong></td>
                        <td>{client.type}</td>
                        <td>{client.email || '-'}</td>
                        <td>{client.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {page === 'matters' && (
            <Card title={isClient ? 'My Matters' : 'Matters'}>
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Title</th>
                    <th>Client</th>
                    <th>Stage</th>
                    <th>Status</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {matters.map((matter) => (
                    <tr key={matter.id}>
                      <td><strong>{matter.ref}</strong></td>
                      <td>{matter.title}</td>
                      <td>{matter.clients?.name || '-'}</td>
                      <td>{matter.stage}</td>
                      <td>{matter.status}</td>
                      <td>{matter.deadline || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}


          {page === 'invoice-requests' && isLawFirm && (
            <div className="grid two">
              <Card title="Request Invoice / Disbursement">
                <form onSubmit={createInvoiceRequest} className="formGrid">
                  <Field label="Matter">
                    <select
                      value={newInvoiceRequest.matter_id}
                      onChange={(event) => setNewInvoiceRequest({ ...newInvoiceRequest, matter_id: event.target.value })}
                    >
                      <option value="">Select matter</option>
                      {matters.map((matter) => (
                        <option key={matter.id} value={matter.id}>{matter.ref} — {matter.title}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Request type">
                    <select
                      value={newInvoiceRequest.request_type}
                      onChange={(event) => setNewInvoiceRequest({ ...newInvoiceRequest, request_type: event.target.value })}
                    >
                      <option>Court fee</option>
                      <option>Translation</option>
                      <option>Expert fee</option>
                      <option>Government fee</option>
                      <option>Courier / service fee</option>
                      <option>Notary fee</option>
                      <option>Other disbursement</option>
                    </select>
                  </Field>

                  <Field label="Amount">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newInvoiceRequest.amount}
                      onChange={(event) => setNewInvoiceRequest({ ...newInvoiceRequest, amount: event.target.value })}
                    />
                  </Field>

                  <Field label="Currency">
                    <select
                      value={newInvoiceRequest.currency}
                      onChange={(event) => setNewInvoiceRequest({ ...newInvoiceRequest, currency: event.target.value })}
                    >
                      <option>AED</option>
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </select>
                  </Field>

                  <Field label="Urgency">
                    <select
                      value={newInvoiceRequest.urgency}
                      onChange={(event) => setNewInvoiceRequest({ ...newInvoiceRequest, urgency: event.target.value })}
                    >
                      <option>Normal</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </Field>

                  <Field label="Description / reason">
                    <textarea
                      value={newInvoiceRequest.description}
                      onChange={(event) => setNewInvoiceRequest({ ...newInvoiceRequest, description: event.target.value })}
                      placeholder="Example: Court fee required for registration / certified legal translation / expert deposit."
                    />
                  </Field>

                  <button className="primary">Submit Request</button>
                </form>
              </Card>

              <Card title={isManager ? "All Invoice Requests" : "My Invoice Requests"}>
                <table>
                  <thead>
                    <tr>
                      <th>Matter</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Urgency</th>
                      <th>Status</th>
                      {(isManager || isFinance) && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <strong>{request.matters?.ref || '-'}</strong><br />
                          <small>{request.matters?.title || '-'}</small>
                        </td>
                        <td>{request.request_type}<br /><small>{request.description || ''}</small></td>
                        <td>{request.currency} {Number(request.amount || 0).toLocaleString()}</td>
                        <td>{request.urgency}</td>
                        <td><Pill>{request.status}</Pill></td>
                        {(isManager || isFinance) && (
                          <td>
                            <button onClick={() => updateInvoiceRequestStatus(request.id, 'approved')}>Approve</button>
                            <button onClick={() => updateInvoiceRequestStatus(request.id, 'rejected')}>Reject</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}


          {page === 'finance' && (isManager || isFinance) && (
            <div className="grid">
              <div className="stats">
                <Stat label="Pending approvals" value={invoices.filter((invoice) => invoice.status === 'pending_approval').length} />
                <Stat label="Sent invoices" value={invoices.filter((invoice) => invoice.status === 'sent').length} />
                <Stat label="Overdue reminders" value={paymentReminders.filter((reminder) => reminder.status === 'scheduled' && reminder.reminder_date <= new Date().toISOString().slice(0, 10)).length} />
                <Stat label="Open requests" value={invoiceRequests.filter((request) => request.status === 'pending').length} />
              </div>

              <div className="grid two">
                <Card title="Create Engagement Letter Record">
                  <form onSubmit={createEngagementLetter} className="formGrid">
                    <Field label="Matter">
                      <select value={newEngagementLetter.matter_id} onChange={(event) => setNewEngagementLetter({ ...newEngagementLetter, matter_id: event.target.value })}>
                        <option value="">Select matter</option>
                        {matters.map((matter) => (
                          <option key={matter.id} value={matter.id}>{matter.ref} — {matter.title}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Reference">
                      <input value={newEngagementLetter.ref} onChange={(event) => setNewEngagementLetter({ ...newEngagementLetter, ref: event.target.value })} placeholder="EL-2026-001" />
                    </Field>
                    <Field label="Title">
                      <input value={newEngagementLetter.title} onChange={(event) => setNewEngagementLetter({ ...newEngagementLetter, title: event.target.value })} />
                    </Field>
                    <Field label="Status">
                      <select value={newEngagementLetter.status} onChange={(event) => setNewEngagementLetter({ ...newEngagementLetter, status: event.target.value })}>
                        <option>draft</option>
                        <option>sent</option>
                        <option>signed</option>
                        <option>cancelled</option>
                      </select>
                    </Field>
                    <Field label="Sent date">
                      <input type="date" value={newEngagementLetter.sent_date} onChange={(event) => setNewEngagementLetter({ ...newEngagementLetter, sent_date: event.target.value })} />
                    </Field>
                    <Field label="Signed date">
                      <input type="date" value={newEngagementLetter.signed_date} onChange={(event) => setNewEngagementLetter({ ...newEngagementLetter, signed_date: event.target.value })} />
                    </Field>
                    <Field label="Payment due date">
                      <input type="date" value={newEngagementLetter.payment_due_date} onChange={(event) => setNewEngagementLetter({ ...newEngagementLetter, payment_due_date: event.target.value })} />
                    </Field>
                    <Field label="Payment terms">
                      <textarea value={newEngagementLetter.payment_terms} onChange={(event) => setNewEngagementLetter({ ...newEngagementLetter, payment_terms: event.target.value })} />
                    </Field>
                    <button className="primary">Create Engagement Record</button>
                  </form>
                </Card>

                <Card title="Create Invoice Linked to Matter / Engagement">
                  <form onSubmit={createInvoice} className="formGrid">
                    <Field label="Matter">
                      <select value={newInvoice.matter_id} onChange={(event) => setNewInvoice({ ...newInvoice, matter_id: event.target.value })}>
                        <option value="">Select matter</option>
                        {matters.map((matter) => (
                          <option key={matter.id} value={matter.id}>{matter.ref} — {matter.title}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Engagement letter">
                      <select value={newInvoice.engagement_letter_id} onChange={(event) => setNewInvoice({ ...newInvoice, engagement_letter_id: event.target.value })}>
                        <option value="">No engagement letter</option>
                        {engagementLetters
                          .filter((letter) => !newInvoice.matter_id || letter.matter_id === newInvoice.matter_id)
                          .map((letter) => (
                            <option key={letter.id} value={letter.id}>{letter.ref} — {letter.title}</option>
                          ))}
                      </select>
                    </Field>
                    <Field label="Invoice type">
                      <select
                        value={newInvoice.invoice_type}
                        onChange={(event) => {
                          const invoiceType = event.target.value;
                          setNewInvoice({
                            ...newInvoice,
                            invoice_type: invoiceType,
                            vat_applicable: defaultVatForInvoiceType(invoiceType)
                          });
                        }}
                      >
                        <option>Professional fee</option>
                        <option>Court fee</option>
                        <option>Translation</option>
                        <option>Consultation</option>
                        <option>Drafting fee</option>
                        <option>Legal services</option>
                        <option>Expert fee</option>
                        <option>Government fee</option>
                        <option>Notary fee</option>
                        <option>Courier / service fee</option>
                        <option>Other disbursement</option>
                      </select>
                    </Field>
                    <Field label="Invoice number">
                      <input value={newInvoice.invoice_no} onChange={(event) => setNewInvoice({ ...newInvoice, invoice_no: event.target.value })} placeholder="Auto if blank" />
                    </Field>
                    <Field label="Amount">
                      <input type="number" min="0" step="0.01" value={newInvoice.amount} onChange={(event) => setNewInvoice({ ...newInvoice, amount: event.target.value })} />
                    </Field>
                    <Field label="Currency">
                      <select value={newInvoice.currency} onChange={(event) => setNewInvoice({ ...newInvoice, currency: event.target.value })}>
                        <option>AED</option>
                        <option>USD</option>
                        <option>EUR</option>
                        <option>GBP</option>
                      </select>
                    </Field>

                    <Field label="VAT">
                      <select value={newInvoice.vat_applicable} onChange={(event) => setNewInvoice({ ...newInvoice, vat_applicable: event.target.value })}>
                        <option value="true">Apply VAT</option>
                        <option value="false">No VAT / disbursement</option>
                      </select>
                    </Field>

                    <Field label="VAT rate %">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newInvoice.vat_rate}
                        disabled={String(newInvoice.vat_applicable) !== 'true'}
                        onChange={(event) => setNewInvoice({ ...newInvoice, vat_rate: event.target.value })}
                      />
                    </Field>

                    <div className="vatSummary">
                      {(() => {
                        const calc = calculateVat(newInvoice.amount, newInvoice.vat_applicable, newInvoice.vat_rate);
                        return (
                          <>
                            <span>Subtotal: {money(calc.subtotal, newInvoice.currency)}</span>
                            <span>VAT: {money(calc.vat, newInvoice.currency)}</span>
                            <strong>Total: {money(calc.total, newInvoice.currency)}</strong>
                          </>
                        );
                      })()}
                    </div>
                    <Field label="Issue date">
                      <input type="date" value={newInvoice.issue_date} onChange={(event) => setNewInvoice({ ...newInvoice, issue_date: event.target.value })} />
                    </Field>
                    <Field label="Payment due date">
                      <input type="date" value={newInvoice.due_date} onChange={(event) => setNewInvoice({ ...newInvoice, due_date: event.target.value })} />
                    </Field>
                    <Field label="Description">
                      <textarea value={newInvoice.description} onChange={(event) => setNewInvoice({ ...newInvoice, description: event.target.value })} placeholder="Example: Court registration fee / first installment / translation costs." />
                    </Field>
                    <button className="primary">Create Invoice + Schedule Reminders</button>
                  </form>
                </Card>
              </div>

              <div className="grid two">
                <Card title="Internal Invoice Requests">
                  <table>
                    <thead>
                      <tr>
                        <th>Matter</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Urgency</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceRequests.map((request) => (
                        <tr key={request.id}>
                          <td><strong>{request.matters?.ref || '-'}</strong><br /><small>{request.matters?.title || '-'}</small></td>
                          <td>{request.request_type}<br /><small>{request.description || ''}</small></td>
                          <td>{request.currency} {Number(request.amount || 0).toLocaleString()}</td>
                          <td>{request.urgency}</td>
                          <td><Pill>{request.status}</Pill></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card title="Manager Approval Queue">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Matter</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.filter((invoice) => ['pending_approval', 'approved', 'sent'].includes(invoice.status)).map((invoice) => (
                        <tr key={invoice.id}>
                          <td><strong>{invoice.invoice_no}</strong><br /><small>{invoice.invoice_type}</small></td>
                          <td>{invoice.matters?.ref || '-'}<br /><small>{invoice.matters?.clients?.name || ''}</small></td>
                          <td>
                            {money(invoice.total_amount || invoice.amount, invoice.currency)}<br />
                            <small>Subtotal: {money(invoice.amount, invoice.currency)} / VAT: {money(invoice.vat_amount || 0, invoice.currency)}</small>
                          </td>
                          <td><Pill>{invoice.status}</Pill></td>
                          <td>
                            {isManager && invoice.status === 'pending_approval' && <button onClick={() => updateInvoiceStatus(invoice.id, 'approved')}>Approve</button>}
                            {(isManager || isFinance) && invoice.status === 'approved' && <button onClick={() => updateInvoiceStatus(invoice.id, 'sent')}>Mark Sent</button>}
                            {(isManager || isFinance) && invoice.status === 'sent' && <button onClick={() => updateInvoiceStatus(invoice.id, 'paid')}>Mark Paid</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              <div className="grid two">
                <Card title="Payment Calendar">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Matter / Client</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ...invoices.map((invoice) => ({
                          id: `invoice-${invoice.id}`,
                          date: invoice.due_date,
                          type: `Invoice due: ${invoice.invoice_no}`,
                          matter: `${invoice.matters?.ref || '-'} — ${invoice.matters?.clients?.name || ''}`,
                          status: invoice.status
                        })),
                        ...paymentReminders.map((reminder) => ({
                          id: `reminder-${reminder.id}`,
                          date: reminder.reminder_date,
                          type: 'Payment reminder',
                          matter: `${reminder.invoices?.matters?.ref || '-'} — ${reminder.invoices?.matters?.clients?.name || ''}`,
                          status: reminder.status
                        }))
                      ].sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))).map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.date || '-'}</strong></td>
                          <td>{item.type}</td>
                          <td>{item.matter}</td>
                          <td><Pill>{item.status}</Pill></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card title="Payment Reminder Queue">
                  <table>
                    <thead>
                      <tr>
                        <th>Reminder date</th>
                        <th>Invoice</th>
                        <th>Client</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentReminders.map((reminder) => {
                        const invoice = reminder.invoices || {};
                        const clientEmail = invoice.matters?.clients?.email || '';
                        const subject = `Payment reminder — ${invoice.invoice_no || ''}`;
                        const body = reminder.message || paymentReminderText(invoice);
                        return (
                          <tr key={reminder.id}>
                            <td>{reminder.reminder_date}</td>
                            <td><strong>{invoice.invoice_no || '-'}</strong><br /><small>{money(invoice.total_amount || invoice.amount, invoice.currency)}</small></td>
                            <td>{invoice.matters?.clients?.name || '-'}<br /><small>{clientEmail}</small></td>
                            <td><Pill>{reminder.status}</Pill></td>
                            <td>
                              <a className="button" href={`mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>Open Email</a>
                              {reminder.status !== 'sent' && <button onClick={() => markReminderSent(reminder.id)}>Mark Sent</button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              </div>

              <Card title="Engagement Letters">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Matter</th>
                      <th>Status</th>
                      <th>Payment Due</th>
                      <th>Terms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engagementLetters.map((letter) => (
                      <tr key={letter.id}>
                        <td><strong>{letter.ref}</strong><br /><small>{letter.title}</small></td>
                        <td>{letter.matters?.ref || '-'}<br /><small>{letter.matters?.clients?.name || ''}</small></td>
                        <td><Pill>{letter.status}</Pill></td>
                        <td>{letter.payment_due_date || '-'}</td>
                        <td>{letter.payment_terms || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {page === 'audit' && isManager && (
            <Card title="Audit Log">
              <p>Audit log table is ready. Detailed audit viewer will be added in the next module.</p>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
