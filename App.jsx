import React, { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient.js';
import './styles.css';

const LANG_KEY = 'oslegal_lang_v2';

const roleLabels = {
  manager: 'Manager',
  lawfirm: 'Law Firm User',
  finance: 'Finance User',
  hr: 'HR User',
  client: 'Client User'
};

const ar = {
  Dashboard: 'لوحة التحكم',
  Users: 'المستخدمون',
  Clients: 'العملاء',
  Matters: 'الملفات',
  Tasks: 'المهام',
  Finance: 'المالية',
  HR: 'الموارد البشرية',
  Library: 'المكتبة',
  Announcements: 'الإعلانات',
  Search: 'البحث',
  Settings: 'الإعدادات',
  Logout: 'تسجيل الخروج',
  Login: 'دخول',
  Email: 'البريد الإلكتروني',
  Password: 'كلمة المرور',
  'Good morning': 'صباح الخير',
  'Good afternoon': 'مساء الخير',
  'Good evening': 'مساء الخير',
  "Let's start a great day.": 'لنبدأ يوماً رائعاً.',
  'Quick Actions': 'إجراءات سريعة',
  'Active Matters': 'الملفات النشطة',
  'Open Tasks': 'المهام المفتوحة',
  'Clients': 'العملاء',
  'Team Members': 'أعضاء الفريق',
  'Create Task': 'إنشاء مهمة',
  'Task title': 'عنوان المهمة',
  'Owner': 'المسؤول',
  'Due date': 'تاريخ الاستحقاق',
  'Priority': 'الأولوية',
  'Status': 'الحالة',
  'Create': 'إنشاء',
  'Save': 'حفظ',
  'Pending': 'قيد الانتظار',
  'In Progress': 'قيد التنفيذ',
  'Done': 'تم',
  'Cancelled': 'ملغي',
  'Normal': 'عادي',
  'High': 'مرتفع',
  'Urgent': 'عاجل',
  'Low': 'منخفض',
  'Template Library': 'مكتبة النماذج',
  'Create Template': 'إنشاء نموذج',
  'Category': 'الفئة',
  'Language': 'اللغة',
  'Title': 'العنوان',
  'Body': 'المحتوى',
  'Preview': 'معاينة',
  'Announcement Bar': 'شريط الإعلانات',
  'Create Announcement': 'إنشاء إعلان',
  'Message': 'الرسالة',
  'Audience': 'الجمهور',
  'Active': 'نشط',
  'Inactive': 'غير نشط',
  'Search everything': 'ابحث في كل شيء',
  'User photo URL': 'رابط صورة المستخدم',
  'Profile': 'الملف الشخصي'
};

function t(lang, text) {
  return lang === 'ar' ? (ar[text] || text) : text;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function greeting(lang, name) {
  const hour = new Date().getHours();
  const firstName = (name || 'Omar').split(' ')[0];
  if (hour < 12) return `${t(lang, 'Good morning')}, ${firstName}`;
  if (hour < 18) return `${t(lang, 'Good afternoon')}, ${firstName}`;
  return `${t(lang, 'Good evening')}, ${firstName}`;
}

function initials(name) {
  return String(name || 'OS').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
}

function Card({ title, action, children, className = '' }) {
  return (
    <section className={`modern-card ${className}`}>
      <div className="modern-card-header">
        <h2>{title}</h2>
        {action}
      </div>
      <div className="modern-card-body">{children}</div>
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

function Pill({ children, tone = 'default' }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function UserAvatar({ profile, size = 'normal' }) {
  const url = profile?.avatar_url;
  return (
    <div className={`avatar ${size}`}>
      {url ? <img src={url} alt={profile?.full_name || 'User'} /> : <span>{initials(profile?.full_name)}</span>}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem(LANG_KEY) || 'en');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [message, setMessage] = useState('');
  const [login, setLogin] = useState({ email: 'omar@os-legal.net', password: '' });
  const [profiles, setProfiles] = useState([]);
  const [clients, setClients] = useState([]);
  const [matters, setMatters] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [library, setLibrary] = useState([]);
  const [search, setSearch] = useState('');
  const [newTask, setNewTask] = useState({ title: '', owner_name: '', due_date: '', priority: 'Normal', status: 'Pending', matter_id: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', audience: 'all', active: true });
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    category: 'Client Update',
    language: 'English',
    body: 'Dear {client},\n\nWe would like to update you regarding {matter_ref} — {matter_title}.\n\nBest regards,\nOS Legal'
  });

  const isRtl = lang === 'ar';
  const role = profile?.role;
  const isManager = role === 'manager';
  const isInternal = ['manager', 'lawfirm', 'finance', 'hr'].includes(role);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = isRtl ? 'ar' : 'en';
    localStorage.setItem(LANG_KEY, lang);
  }, [lang, isRtl]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) loadProfile(session.user.id);
    else setProfile(null);
  }, [session?.user?.id]);

  useEffect(() => {
    if (profile) loadAll();
  }, [profile?.user_id, profile?.role]);

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, role, status, client_id, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) setMessage(error.message);
    else if (!data) setMessage('No profile found for this user.');
    else setProfile(data);
  }

  async function safeSelect(loader) {
    try {
      const { data, error } = await loader();
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }

  async function loadAll() {
    const [profilesData, clientsData, mattersData, tasksData, announcementsData, libraryData] = await Promise.all([
      isManager ? safeSelect(() => supabase.from('profiles').select('user_id, email, full_name, role, status, avatar_url').order('created_at', { ascending: false })) : Promise.resolve([]),
      safeSelect(() => supabase.from('clients').select('id, name, type, email, phone').order('created_at', { ascending: false })),
      safeSelect(() => supabase.from('matters').select('id, ref, title, stage, status, deadline, clients(name, email)').order('created_at', { ascending: false })),
      safeSelect(() => supabase.from('meeting_tasks').select('id, title, owner_name, due_date, priority, status, matter_id, matters(ref, title)').order('due_date', { ascending: true })),
      safeSelect(() => supabase.from('announcements').select('id, title, message, audience, active, created_at').order('created_at', { ascending: false })),
      safeSelect(() => supabase.from('library_templates').select('id, title, category, language, body, status, created_at').order('created_at', { ascending: false }))
    ]);

    setProfiles(profilesData);
    setClients(clientsData);
    setMatters(mattersData);
    setTasks(tasksData);
    setAnnouncements(announcementsData);
    setLibrary(libraryData);
  }

  async function loginUser(event) {
    event.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email: login.email, password: login.password });
    if (error) setMessage(error.message);
  }

  async function logoutUser() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  async function createTask(event) {
    event.preventDefault();
    if (!newTask.title.trim()) {
      setMessage('Task title is required.');
      return;
    }

    const { error } = await supabase.from('meeting_tasks').insert({
      title: newTask.title,
      owner_name: newTask.owner_name || null,
      due_date: newTask.due_date || null,
      priority: newTask.priority,
      status: newTask.status,
      matter_id: newTask.matter_id || null,
      created_by: profile.user_id
    });

    if (error) setMessage(error.message);
    else {
      setNewTask({ title: '', owner_name: '', due_date: '', priority: 'Normal', status: 'Pending', matter_id: '' });
      await loadAll();
    }
  }

  async function updateTask(id, patch) {
    const { error } = await supabase.from('meeting_tasks').update(patch).eq('id', id);
    if (error) setMessage(error.message);
    else await loadAll();
  }

  async function createAnnouncement(event) {
    event.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      setMessage('Announcement title and message are required.');
      return;
    }

    const { error } = await supabase.from('announcements').insert({
      title: newAnnouncement.title,
      message: newAnnouncement.message,
      audience: newAnnouncement.audience,
      active: newAnnouncement.active,
      created_by: profile.user_id
    });

    if (error) setMessage(error.message);
    else {
      setNewAnnouncement({ title: '', message: '', audience: 'all', active: true });
      await loadAll();
    }
  }

  async function createTemplate(event) {
    event.preventDefault();
    if (!newTemplate.title.trim()) {
      setMessage('Template title is required.');
      return;
    }

    const { error } = await supabase.from('library_templates').insert({
      title: newTemplate.title,
      category: newTemplate.category,
      language: newTemplate.language,
      body: newTemplate.body,
      status: 'approved',
      created_by: profile.user_id
    });

    if (error) setMessage(error.message);
    else {
      setNewTemplate({
        title: '',
        category: 'Client Update',
        language: 'English',
        body: 'Dear {client},\n\nWe would like to update you regarding {matter_ref} — {matter_title}.\n\nBest regards,\nOS Legal'
      });
      await loadAll();
    }
  }

  async function updateAvatar(url) {
    if (!profile?.user_id) return;
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', profile.user_id);
    if (error) setMessage(error.message);
    else await loadProfile(profile.user_id);
  }

  const activeAnnouncements = announcements.filter(a => a.active);
  const openTasks = tasks.filter(task => task.status !== 'Done' && task.status !== 'Cancelled');

  const nav = useMemo(() => {
    if (!profile) return [];
    if (role === 'client') return [
      ['dashboard', 'Dashboard'],
      ['matters', 'Matters']
    ];

    const base = [
      ['dashboard', 'Dashboard'],
      ['matters', 'Matters'],
      ['tasks', 'Tasks'],
      ['library', 'Library'],
      ['search', 'Search']
    ];

    if (isManager) return [
      ['dashboard', 'Dashboard'],
      ['users', 'Users'],
      ['clients', 'Clients'],
      ['matters', 'Matters'],
      ['tasks', 'Tasks'],
      ['library', 'Library'],
      ['announcements', 'Announcements'],
      ['search', 'Search'],
      ['settings', 'Settings']
    ];

    return base;
  }, [profile, role, isManager]);

  function filteredSearchResults() {
    const q = search.toLowerCase().trim();
    if (!q) return [];

    const results = [];

    matters.forEach(item => {
      const haystack = [item.ref, item.title, item.stage, item.status, item.clients?.name].join(' ').toLowerCase();
      if (haystack.includes(q)) results.push({ type: 'Matter', title: `${item.ref} — ${item.title}`, detail: item.clients?.name || '' });
    });

    clients.forEach(item => {
      const haystack = [item.name, item.email, item.phone, item.type].join(' ').toLowerCase();
      if (haystack.includes(q)) results.push({ type: 'Client', title: item.name, detail: item.email || item.phone || '' });
    });

    tasks.forEach(item => {
      const haystack = [item.title, item.owner_name, item.priority, item.status].join(' ').toLowerCase();
      if (haystack.includes(q)) results.push({ type: 'Task', title: item.title, detail: item.owner_name || '' });
    });

    library.forEach(item => {
      const haystack = [item.title, item.category, item.language, item.body].join(' ').toLowerCase();
      if (haystack.includes(q)) results.push({ type: 'Library', title: item.title, detail: item.category });
    });

    return results;
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="center-page">
        <Card title="Supabase is not configured">
          <p>Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
        </Card>
      </main>
    );
  }

  if (!session || !profile) {
    return (
      <main className="login-screen">
        <section className="login-panel">
          <div className="login-brand">OS</div>
          <h1>OS Legal</h1>
          <p>Smart legal operations platform</p>

          <form onSubmit={loginUser}>
            <Field label={t(lang, 'Email')}>
              <input value={login.email} onChange={event => setLogin({ ...login, email: event.target.value })} />
            </Field>
            <Field label={t(lang, 'Password')}>
              <input type="password" value={login.password} onChange={event => setLogin({ ...login, password: event.target.value })} />
            </Field>
            <button className="primary full">{t(lang, 'Login')}</button>
          </form>

          <button className="ghost full" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
            {lang === 'en' ? 'العربية' : 'English'}
          </button>

          {message && <div className="notice">{message}</div>}
        </section>
      </main>
    );
  }

  return (
    <div className="modern-shell">
      <aside className="modern-sidebar">
        <div className="brand-block">
          <div className="brand-logo">OS</div>
          <div>
            <strong>OS Legal</strong>
            <small>{roleLabels[role] || role}</small>
          </div>
        </div>

        <nav>
          {nav.map(([key, label]) => (
            <button key={key} className={page === key ? 'active' : ''} onClick={() => setPage(key)}>
              {t(lang, label)}
            </button>
          ))}
        </nav>

        <div className="sidebar-profile">
          <UserAvatar profile={profile} />
          <div>
            <strong>{profile.full_name}</strong>
            <small>{profile.email}</small>
          </div>
        </div>

        <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
        <button onClick={logoutUser}>{t(lang, 'Logout')}</button>
      </aside>

      <main className="modern-main">
        {activeAnnouncements.length > 0 && (
          <div className="announcement-bar">
            <strong>{activeAnnouncements[0].title}</strong>
            <span>{activeAnnouncements[0].message}</span>
          </div>
        )}

        <header className="modern-topbar">
          <div>
            <h1>{t(lang, nav.find(([key]) => key === page)?.[1] || 'Dashboard')}</h1>
            <p>{profile.full_name} — {roleLabels[role] || role}</p>
          </div>
          <UserAvatar profile={profile} size="small" />
        </header>

        <section className="modern-content">
          {message && <div className="notice">{message}</div>}

          {page === 'dashboard' && (
            <>
              <section className="hero-card">
                <div>
                  <p className="eyebrow">Module 6C+ Active</p>
                  <h2>{greeting(lang, profile.full_name)}</h2>
                  <p>{t(lang, "Let's start a great day.")}</p>
                </div>
                <div className="hero-actions">
                  <button onClick={() => setPage('tasks')}>{t(lang, 'Create Task')}</button>
                  <button onClick={() => setPage('library')}>{t(lang, 'Template Library')}</button>
                </div>
              </section>

              <div className="stats-grid">
                <div className="stat-card"><span>{t(lang, 'Active Matters')}</span><strong>{matters.length}</strong></div>
                <div className="stat-card"><span>{t(lang, 'Open Tasks')}</span><strong>{openTasks.length}</strong></div>
                <div className="stat-card"><span>{t(lang, 'Clients')}</span><strong>{clients.length}</strong></div>
                <div className="stat-card"><span>{t(lang, 'Team Members')}</span><strong>{profiles.length || 1}</strong></div>
              </div>

              <div className="grid two">
                <Card title={t(lang, 'Tasks')}>
                  {openTasks.slice(0, 6).map(task => (
                    <div className="list-item" key={task.id}>
                      <div>
                        <strong>{task.title}</strong>
                        <small>{task.owner_name || 'No owner'} · {task.due_date || 'No due date'}</small>
                      </div>
                      <Pill>{task.priority}</Pill>
                    </div>
                  ))}
                </Card>

                <Card title={t(lang, 'Announcements')}>
                  {activeAnnouncements.slice(0, 5).map(item => (
                    <div className="list-item" key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.message}</small>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </>
          )}

          {page === 'tasks' && (
            <div className="grid two">
              <Card title={t(lang, 'Create Task')}>
                <form onSubmit={createTask} className="form-grid">
                  <Field label={t(lang, 'Task title')}>
                    <input value={newTask.title} onChange={event => setNewTask({ ...newTask, title: event.target.value })} />
                  </Field>
                  <Field label={t(lang, 'Owner')}>
                    <input value={newTask.owner_name} onChange={event => setNewTask({ ...newTask, owner_name: event.target.value })} />
                  </Field>
                  <Field label={t(lang, 'Due date')}>
                    <input type="date" value={newTask.due_date} onChange={event => setNewTask({ ...newTask, due_date: event.target.value })} />
                  </Field>
                  <Field label={t(lang, 'Priority')}>
                    <select value={newTask.priority} onChange={event => setNewTask({ ...newTask, priority: event.target.value })}>
                      {['Low', 'Normal', 'High', 'Urgent'].map(x => <option key={x}>{x}</option>)}
                    </select>
                  </Field>
                  <Field label="Matter">
                    <select value={newTask.matter_id} onChange={event => setNewTask({ ...newTask, matter_id: event.target.value })}>
                      <option value="">No matter</option>
                      {matters.map(matter => <option key={matter.id} value={matter.id}>{matter.ref} — {matter.title}</option>)}
                    </select>
                  </Field>
                  <button className="primary">{t(lang, 'Create')}</button>
                </form>
              </Card>

              <Card title={t(lang, 'Tasks')}>
                <table>
                  <thead>
                    <tr>
                      <th>{t(lang, 'Task title')}</th>
                      <th>{t(lang, 'Owner')}</th>
                      <th>{t(lang, 'Due date')}</th>
                      <th>{t(lang, 'Priority')}</th>
                      <th>{t(lang, 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id}>
                        <td><input value={task.title || ''} onChange={event => updateTask(task.id, { title: event.target.value })} /></td>
                        <td><input value={task.owner_name || ''} onChange={event => updateTask(task.id, { owner_name: event.target.value })} /></td>
                        <td><input type="date" value={task.due_date || ''} onChange={event => updateTask(task.id, { due_date: event.target.value || null })} /></td>
                        <td>
                          <select value={task.priority || 'Normal'} onChange={event => updateTask(task.id, { priority: event.target.value })}>
                            {['Low', 'Normal', 'High', 'Urgent'].map(x => <option key={x}>{x}</option>)}
                          </select>
                        </td>
                        <td>
                          <select value={task.status || 'Pending'} onChange={event => updateTask(task.id, { status: event.target.value })}>
                            {['Pending', 'In Progress', 'Done', 'Cancelled'].map(x => <option key={x}>{x}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {page === 'library' && (
            <div className="grid two">
              <Card title={t(lang, 'Create Template')}>
                <form onSubmit={createTemplate} className="form-grid">
                  <Field label={t(lang, 'Title')}>
                    <input value={newTemplate.title} onChange={event => setNewTemplate({ ...newTemplate, title: event.target.value })} />
                  </Field>
                  <Field label={t(lang, 'Category')}>
                    <select value={newTemplate.category} onChange={event => setNewTemplate({ ...newTemplate, category: event.target.value })}>
                      {['Client Update', 'Legal Notice', 'Engagement Letter', 'Settlement Agreement', 'Expert Memo', 'Court Memo', 'POA', 'HR', 'Finance'].map(x => <option key={x}>{x}</option>)}
                    </select>
                  </Field>
                  <Field label={t(lang, 'Language')}>
                    <select value={newTemplate.language} onChange={event => setNewTemplate({ ...newTemplate, language: event.target.value })}>
                      <option>English</option>
                      <option>Arabic</option>
                      <option>Bilingual</option>
                    </select>
                  </Field>
                  <Field label={t(lang, 'Body')}>
                    <textarea value={newTemplate.body} onChange={event => setNewTemplate({ ...newTemplate, body: event.target.value })} />
                  </Field>
                  <button className="primary">{t(lang, 'Create')}</button>
                </form>
              </Card>

              <Card title={t(lang, 'Template Library')}>
                {library.map(item => (
                  <details className="template-item" key={item.id}>
                    <summary><strong>{item.title}</strong> <small>{item.category} · {item.language}</small></summary>
                    <pre>{item.body}</pre>
                  </details>
                ))}
              </Card>
            </div>
          )}

          {page === 'announcements' && isManager && (
            <div className="grid two">
              <Card title={t(lang, 'Create Announcement')}>
                <form onSubmit={createAnnouncement} className="form-grid">
                  <Field label={t(lang, 'Title')}>
                    <input value={newAnnouncement.title} onChange={event => setNewAnnouncement({ ...newAnnouncement, title: event.target.value })} />
                  </Field>
                  <Field label={t(lang, 'Message')}>
                    <textarea value={newAnnouncement.message} onChange={event => setNewAnnouncement({ ...newAnnouncement, message: event.target.value })} />
                  </Field>
                  <Field label={t(lang, 'Audience')}>
                    <select value={newAnnouncement.audience} onChange={event => setNewAnnouncement({ ...newAnnouncement, audience: event.target.value })}>
                      <option>all</option>
                      <option>manager</option>
                      <option>lawfirm</option>
                      <option>finance</option>
                      <option>hr</option>
                    </select>
                  </Field>
                  <Field label={t(lang, 'Active')}>
                    <select value={newAnnouncement.active ? 'true' : 'false'} onChange={event => setNewAnnouncement({ ...newAnnouncement, active: event.target.value === 'true' })}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </Field>
                  <button className="primary">{t(lang, 'Create')}</button>
                </form>
              </Card>

              <Card title={t(lang, 'Announcements')}>
                {announcements.map(item => (
                  <div className="list-item" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                    </div>
                    <Pill>{item.active ? 'Active' : 'Inactive'}</Pill>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {page === 'search' && (
            <div className="grid two">
              <Card title={t(lang, 'Search')}>
                <Field label={t(lang, 'Search everything')}>
                  <input value={search} onChange={event => setSearch(event.target.value)} />
                </Field>
              </Card>
              <Card title="Results">
                {filteredSearchResults().map((item, index) => (
                  <div className="list-item" key={index}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.type} · {item.detail}</small>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {page === 'settings' && (
            <Card title={t(lang, 'Profile')}>
              <Field label={t(lang, 'User photo URL')}>
                <input defaultValue={profile.avatar_url || ''} onBlur={event => updateAvatar(event.target.value)} />
              </Field>
              <p>Paste an image URL and click outside the field to save.</p>
            </Card>
          )}

          {['users', 'clients', 'matters'].includes(page) && (
            <Card title={t(lang, page === 'users' ? 'Users' : page === 'clients' ? 'Clients' : 'Matters')}>
              <p>This modern replacement is active. Your detailed operational pages remain connected in the full module package. This page is ready for the next detailed rebuild.</p>
              <table>
                <tbody>
                  {(page === 'users' ? profiles : page === 'clients' ? clients : matters).map((item, index) => (
                    <tr key={item.id || item.user_id || index}>
                      <td><strong>{item.full_name || item.name || item.ref}</strong></td>
                      <td>{item.email || item.title || item.type || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
