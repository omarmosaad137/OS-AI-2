import React, { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient.js';
import './styles.css';

const roles = {
  manager: 'Manager',
  lawfirm: 'Law Firm User',
  finance: 'Finance User',
  hr: 'HR User',
  client: 'Client User'
};

const initialCreateUser = {
  email: '',
  password: '',
  full_name: '',
  avatar_url: '',
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

const initialEmployee = {
  full_name: '',
  email: '',
  phone: '',
  job_title: '',
  department: 'Legal',
  employee_type: 'Full-time',
  start_date: '',
  basic_salary: '',
  total_salary: '',
  status: 'active',
  notes: ''
};

const initialLeaveRequest = {
  employee_id: '',
  leave_type: 'Annual leave',
  start_date: '',
  end_date: '',
  days_count: '',
  reason: ''
};

const initialAttendance = {
  employee_id: '',
  attendance_date: '',
  status: 'Present',
  check_in: '',
  check_out: '',
  notes: ''
};

const initialPayrollItem = {
  employee_id: '',
  payroll_month: '',
  basic_salary: '',
  allowances: '',
  deductions: '',
  notes: ''
};

const initialHrDocument = {
  employee_id: '',
  document_type: 'Employment Contract',
  title: '',
  expiry_date: '',
  status: 'pending',
  notes: ''
};

const initialChatMessage = {
  matter_id: '',
  channel: 'general',
  message: ''
};

const initialEmailDraft = {
  matter_id: '',
  to_email: '',
  subject: '',
  body: '',
  email_type: 'Client update',
  status: 'draft'
};

const initialSearch = {
  query: '',
  type: 'All'
};

const initialLibraryTemplate = {
  title: '',
  category: 'Client Update',
  language: 'English',
  jurisdiction: 'UAE',
  practice_area: 'General',
  status: 'Draft',
  tags: '',
  body: ''
};

const initialAnnouncement = {
  title: '',
  message: '',
  audience: 'internal',
  priority: 'Normal',
  active: 'true'
};

const initialCourtHearing = {
  matter_id: '',
  court_name: 'Dubai Courts',
  case_number: '',
  hearing_date: '',
  hearing_time: '',
  courtroom: '',
  hearing_type: 'First hearing',
  assigned_lawyer: '',
  client_attendance_required: 'false',
  lawyer_attendance_required: 'true',
  preparation_notes: '',
  documents_required: '',
  previous_result: '',
  next_purpose: '',
  judgment_expected_date: '',
  appeal_deadline: '',
  status: 'Scheduled',
  client_visible: 'false'
};

const initialExpertMission = {
  matter_id: '',
  expert_name: '',
  expert_type: 'Accounting',
  expert_contact: '',
  appointment_date: '',
  deposit_amount: '',
  deposit_deadline: '',
  deposit_paid: 'false',
  meeting_date: '',
  meeting_location: '',
  documents_submitted: '',
  documents_pending: '',
  court_questions: '',
  site_visit_date: '',
  preliminary_report_date: '',
  objection_deadline: '',
  final_report_date: '',
  status: 'Expert appointed',
  notes: ''
};

const initialDailyMeeting = {
  meeting_date: '',
  meeting_time: '',
  meeting_type: 'Daily',
  attendees: '',
  agenda: '',
  decisions: '',
  followup_date: '',
  status: 'Scheduled'
};

const initialMeetingTask = {
  meeting_id: '',
  matter_id: '',
  title: '',
  owner_name: '',
  due_date: '',
  priority: 'Normal',
  status: 'Pending'
};

const arabicLabels = {
  Dashboard: 'لوحة التحكم',
  Users: 'المستخدمون',
  Clients: 'العملاء',
  Matters: 'الملفات',
  'All Matters': 'جميع الملفات',
  'Invoice Requests': 'طلبات الفواتير',
  'Finance Operations': 'العمليات المالية',
  'HR System': 'نظام الموارد البشرية',
  'HR / Payroll': 'الموارد البشرية / الرواتب',
  'Team Chat': 'المحادثات الداخلية',
  'Email Service': 'خدمة البريد',
  Search: 'البحث',
  'Court Calendar': 'تقويم المحاكم',
  'Expert Missions': 'مهام الخبراء',
  'Daily Meetings': 'الاجتماعات اليومية',
  Audit: 'سجل المراجعة',
  Library: 'المكتبة',
  Tasks: 'المهام',
  Announcements: 'الإعلانات',
  'Create User': 'إنشاء مستخدم',
  'Create Client': 'إنشاء عميل',
  'Create Task': 'إنشاء مهمة',
  'Create Announcement': 'إنشاء إعلان',
  'Create Template': 'إنشاء نموذج',
  'Template Library': 'مكتبة النماذج',
  'Template Preview': 'معاينة النموذج',
  'All Tasks': 'جميع المهام',
  'Task title': 'عنوان المهمة',
  Owner: 'المسؤول',
  Due: 'الموعد',
  Priority: 'الأولوية',
  Status: 'الحالة',
  Action: 'الإجراء',
  Matter: 'الملف',
  Client: 'العميل',
  Name: 'الاسم',
  Email: 'البريد الإلكتروني',
  Phone: 'الهاتف',
  Role: 'الدور',
  Save: 'حفظ',
  Update: 'تحديث',
  Edit: 'تعديل',
  Done: 'تم',
  'In Progress': 'قيد التنفيذ',
  Pending: 'قيد الانتظار',
  Normal: 'عادي',
  High: 'مرتفع',
  Urgent: 'عاجل',
  Low: 'منخفض',
  Manager: 'مدير',
  'Law Firm User': 'مستخدم المكتب',
  'Finance User': 'مستخدم المالية',
  'HR User': 'مستخدم الموارد البشرية',
  'Client User': 'مستخدم العميل',
  Logout: 'تسجيل الخروج',
  'Full name': 'الاسم الكامل',
  'Temporary password': 'كلمة مرور مؤقتة',
  'Photo URL': 'رابط الصورة',
  'Existing client': 'عميل موجود',
  'New client name': 'اسم العميل الجديد',
  'Client type': 'نوع العميل',
  Individual: 'فرد',
  Company: 'شركة',
  'Good morning': 'صباح الخير',
  'Good afternoon': 'مساء الخير',
  'Good evening': 'مساء الخير',
  'Let’s start a great day.': 'لنبدأ يوماً رائعاً.',
  'Today’s focus': 'تركيز اليوم',
  'Active matters': 'الملفات النشطة',
  'Open invoice requests': 'طلبات الفواتير المفتوحة',
  'Upcoming hearings': 'الجلسات القادمة',
  'Open tasks': 'المهام المفتوحة',
  'Quick actions': 'إجراءات سريعة',
  Category: 'الفئة',
  Language: 'اللغة',
  Jurisdiction: 'الاختصاص',
  'Practice area': 'مجال الممارسة',
  Tags: 'وسوم',
  Body: 'النص',
  Title: 'العنوان',
  Message: 'الرسالة',
  Audience: 'الجمهور',
  Active: 'نشط',
  Internal: 'داخلي',
  General: 'عام',
  English: 'الإنجليزية',
  Arabic: 'العربية',
  Bilingual: 'ثنائي اللغة',
  'Client Update': 'تحديث عميل',
  'Legal Notice': 'إنذار قانوني',
  Contract: 'عقد',
  'Engagement Letter': 'خطاب تعاقد',
  'Settlement Agreement': 'اتفاقية تسوية',
  'Court Memo': 'مذكرة محكمة',
  'Expert Memo': 'مذكرة خبير',
  POA: 'وكالة',
  HR: 'الموارد البشرية',
  Finance: 'المالية',
  'Payment Reminder': 'تذكير بالدفع'
};

function tx(text, lang = 'en') {
  if (lang !== 'ar') return text;
  return arabicLabels[text] || text;
}

function greetingForHour(lang = 'en') {
  const hour = new Date().getHours();
  if (hour < 12) return tx('Good morning', lang);
  if (hour < 18) return tx('Good afternoon', lang);
  return tx('Good evening', lang);
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'OS';
}

function Avatar({ profile, size = 'normal' }) {
  const cls = size === 'large' ? 'avatar large' : 'avatar';
  if (profile?.avatar_url) {
    return <img className={cls} src={profile.avatar_url} alt={profile.full_name || 'User'} />;
  }
  return <div className={cls}>{initials(profile?.full_name)}</div>;
}


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
  const [hrEmployees, setHrEmployees] = useState([]);
  const [hrLeaveRequests, setHrLeaveRequests] = useState([]);
  const [hrAttendance, setHrAttendance] = useState([]);
  const [hrPayroll, setHrPayroll] = useState([]);
  const [hrDocuments, setHrDocuments] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [emailQueue, setEmailQueue] = useState([]);
  const [courtHearings, setCourtHearings] = useState([]);
  const [expertMissions, setExpertMissions] = useState([]);
  const [dailyMeetings, setDailyMeetings] = useState([]);
  const [meetingTasks, setMeetingTasks] = useState([]);
  const [libraryTemplates, setLibraryTemplates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newUser, setNewUser] = useState(initialCreateUser);
  const [newClient, setNewClient] = useState(initialClient);
  const [newInvoiceRequest, setNewInvoiceRequest] = useState(initialInvoiceRequest);
  const [newEngagementLetter, setNewEngagementLetter] = useState(initialEngagementLetter);
  const [newInvoice, setNewInvoice] = useState(initialInvoice);
  const [newEmployee, setNewEmployee] = useState(initialEmployee);
  const [newLeaveRequest, setNewLeaveRequest] = useState(initialLeaveRequest);
  const [newAttendance, setNewAttendance] = useState(initialAttendance);
  const [newPayrollItem, setNewPayrollItem] = useState(initialPayrollItem);
  const [newHrDocument, setNewHrDocument] = useState(initialHrDocument);
  const [newChatMessage, setNewChatMessage] = useState(initialChatMessage);
  const [newEmailDraft, setNewEmailDraft] = useState(initialEmailDraft);
  const [globalSearch, setGlobalSearch] = useState(initialSearch);
  const [newCourtHearing, setNewCourtHearing] = useState(initialCourtHearing);
  const [newExpertMission, setNewExpertMission] = useState(initialExpertMission);
  const [newDailyMeeting, setNewDailyMeeting] = useState(initialDailyMeeting);
  const [newMeetingTask, setNewMeetingTask] = useState(initialMeetingTask);
  const [editingTaskId, setEditingTaskId] = useState('');
  const [newLibraryTemplate, setNewLibraryTemplate] = useState(initialLibraryTemplate);
  const [selectedLibraryTemplateId, setSelectedLibraryTemplateId] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState(initialAnnouncement);
  const [lang, setLang] = useState(localStorage.getItem('oslegal_lang') || 'en');

  const isManager = profile?.role === 'manager';
  const isFinance = profile?.role === 'finance';
  const isHr = profile?.role === 'hr';
  const isLawFirm = profile?.role === 'manager' || profile?.role === 'lawfirm' || profile?.role === 'finance';
  const isClient = profile?.role === 'client';
  const canAccessHr = isManager || isHr || isFinance;
  const canUseInternalComms = isManager || isLawFirm || isFinance || isHr;
  const canUseOperations = isManager || isLawFirm || isFinance;
  const canUseLibrary = isManager || isLawFirm || isFinance || isHr;

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
      ['invoice-requests', 'Invoice Requests'],
      ['chat', 'Team Chat'],
      ['email', 'Email Service'],
      ['search', 'Search'],
      ['court-calendar', 'Court Calendar'],
      ['expert-missions', 'Expert Missions'],
      ['daily-meetings', 'Daily Meetings'],
      ['tasks', 'Tasks'],
      ['library', 'Library']
    ];

    if (profile.role === 'finance') return [
      ['dashboard', 'Dashboard'],
      ['clients', 'Clients'],
      ['matters', 'All Matters'],
      ['invoice-requests', 'Invoice Requests'],
      ['finance', 'Finance Operations'],
      ['hr', 'HR / Payroll'],
      ['chat', 'Team Chat'],
      ['email', 'Email Service'],
      ['search', 'Search'],
      ['court-calendar', 'Court Calendar'],
      ['expert-missions', 'Expert Missions'],
      ['daily-meetings', 'Daily Meetings'],
      ['tasks', 'Tasks'],
      ['library', 'Library']
    ];

    if (profile.role === 'hr') return [
      ['dashboard', 'Dashboard'],
      ['hr', 'HR System'],
      ['chat', 'Team Chat'],
      ['search', 'Search'],
      ['library', 'Library']
    ];

    return [
      ['dashboard', 'Dashboard'],
      ['users', 'Users'],
      ['clients', 'Clients'],
      ['matters', 'Matters'],
      ['invoice-requests', 'Invoice Requests'],
      ['finance', 'Finance Operations'],
      ['hr', 'HR System'],
      ['chat', 'Team Chat'],
      ['email', 'Email Service'],
      ['search', 'Search'],
      ['court-calendar', 'Court Calendar'],
      ['expert-missions', 'Expert Missions'],
      ['daily-meetings', 'Daily Meetings'],
      ['tasks', 'Tasks'],
      ['library', 'Library'],
      ['announcements', 'Announcements'],
      ['audit', 'Audit']
    ];
  }, [profile, isClient]);

  useEffect(() => {
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('oslegal_lang', lang);
  }, [lang]);

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
      .select('user_id, email, full_name, avatar_url, role, status, client_id, clients(name)')
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
      loadFinanceData(),
      loadHrData(),
      loadCommunicationData(),
      loadOperationsData(),
      loadLibraryAndAnnouncements()
    ]);
  }

  async function loadProfiles() {
    if (!isManager) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, avatar_url, role, status, client_id, clients(name)')
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


  async function loadHrData() {
    if (!canAccessHr) return;

    const [employeesRes, leaveRes, attendanceRes, payrollRes, docsRes] = await Promise.all([
      supabase
        .from('hr_employees')
        .select('id, full_name, email, phone, job_title, department, employee_type, start_date, basic_salary, total_salary, status, notes, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('hr_leave_requests')
        .select('id, employee_id, leave_type, start_date, end_date, days_count, reason, status, created_at, hr_employees(full_name, job_title)')
        .order('created_at', { ascending: false }),
      supabase
        .from('hr_attendance')
        .select('id, employee_id, attendance_date, status, check_in, check_out, notes, hr_employees(full_name)')
        .order('attendance_date', { ascending: false }),
      supabase
        .from('hr_payroll')
        .select('id, employee_id, payroll_month, basic_salary, allowances, deductions, net_salary, status, notes, hr_employees(full_name, job_title)')
        .order('payroll_month', { ascending: false }),
      supabase
        .from('hr_documents')
        .select('id, employee_id, document_type, title, expiry_date, status, notes, hr_employees(full_name)')
        .order('expiry_date', { ascending: true })
    ]);

    if (!employeesRes.error) setHrEmployees(employeesRes.data || []);
    if (!leaveRes.error) setHrLeaveRequests(leaveRes.data || []);
    if (!attendanceRes.error) setHrAttendance(attendanceRes.data || []);
    if (!payrollRes.error) setHrPayroll(payrollRes.data || []);
    if (!docsRes.error) setHrDocuments(docsRes.data || []);
  }


  async function loadCommunicationData() {
    if (!canUseInternalComms) return;

    const [chatRes, emailRes] = await Promise.all([
      supabase
        .from('team_chat_messages')
        .select('id, matter_id, channel, message, created_at, author_profile:profiles!team_chat_messages_author_id_fkey(full_name, email, role), matters(ref, title, clients(name))')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('email_queue')
        .select('id, matter_id, to_email, subject, body, email_type, status, created_at, sent_at, created_by_profile:profiles!email_queue_created_by_fkey(full_name, email), matters(ref, title, clients(name, email))')
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    if (!chatRes.error) setChatMessages(chatRes.data || []);
    if (!emailRes.error) setEmailQueue(emailRes.data || []);
  }


  async function loadOperationsData() {
    if (!canUseOperations) return;

    const [hearingsRes, expertsRes, meetingsRes, meetingTasksRes] = await Promise.all([
      supabase
        .from('court_hearings')
        .select('id, matter_id, court_name, case_number, hearing_date, hearing_time, courtroom, hearing_type, assigned_lawyer, client_attendance_required, lawyer_attendance_required, preparation_notes, documents_required, previous_result, next_purpose, judgment_expected_date, appeal_deadline, status, client_visible, created_at, matters(ref, title, clients(name, email))')
        .order('hearing_date', { ascending: true }),
      supabase
        .from('expert_missions')
        .select('id, matter_id, expert_name, expert_type, expert_contact, appointment_date, deposit_amount, deposit_deadline, deposit_paid, meeting_date, meeting_location, documents_submitted, documents_pending, court_questions, site_visit_date, preliminary_report_date, objection_deadline, final_report_date, status, notes, created_at, matters(ref, title, clients(name, email))')
        .order('created_at', { ascending: false }),
      supabase
        .from('daily_meetings')
        .select('id, meeting_date, meeting_time, meeting_type, attendees, agenda, decisions, followup_date, status, created_at, created_by_profile:profiles!daily_meetings_created_by_fkey(full_name, email)')
        .order('meeting_date', { ascending: false }),
      supabase
        .from('meeting_tasks')
        .select('id, meeting_id, matter_id, title, owner_name, due_date, priority, status, created_at, daily_meetings(meeting_date, meeting_type), matters(ref, title)')
        .order('due_date', { ascending: true })
    ]);

    if (!hearingsRes.error) setCourtHearings(hearingsRes.data || []);
    if (!expertsRes.error) setExpertMissions(expertsRes.data || []);
    if (!meetingsRes.error) setDailyMeetings(meetingsRes.data || []);
    if (!meetingTasksRes.error) setMeetingTasks(meetingTasksRes.data || []);
  }


  async function loadLibraryAndAnnouncements() {
    if (!canUseLibrary) return;

    const [libraryRes, announcementRes] = await Promise.all([
      supabase
        .from('library_templates')
        .select('id, title, category, language, jurisdiction, practice_area, status, tags, body, created_at, created_by_profile:profiles!library_templates_created_by_fkey(full_name, email)')
        .order('created_at', { ascending: false }),
      supabase
        .from('announcements')
        .select('id, title, message, audience, priority, active, created_at, created_by_profile:profiles!announcements_created_by_fkey(full_name, email)')
        .order('created_at', { ascending: false })
    ]);

    if (!libraryRes.error) setLibraryTemplates(libraryRes.data || []);
    if (!announcementRes.error) setAnnouncements(announcementRes.data || []);
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



  async function createEmployee(event) {
    event.preventDefault();
    setMessage('');

    if (!newEmployee.full_name.trim()) {
      setMessage('Employee full name is required.');
      return;
    }

    const { error } = await supabase.from('hr_employees').insert({
      full_name: newEmployee.full_name,
      email: newEmployee.email || null,
      phone: newEmployee.phone || null,
      job_title: newEmployee.job_title || null,
      department: newEmployee.department || 'Legal',
      employee_type: newEmployee.employee_type || 'Full-time',
      start_date: newEmployee.start_date || null,
      basic_salary: newEmployee.basic_salary ? Number(newEmployee.basic_salary) : null,
      total_salary: newEmployee.total_salary ? Number(newEmployee.total_salary) : null,
      status: newEmployee.status || 'active',
      notes: newEmployee.notes || null
    });

    if (error) {
      setMessage(error.message || 'Failed to create employee.');
      return;
    }

    setNewEmployee(initialEmployee);
    setMessage('Employee created successfully.');
    await loadDashboardData();
  }

  async function createLeaveRequest(event) {
    event.preventDefault();
    setMessage('');

    if (!newLeaveRequest.employee_id) {
      setMessage('Please select an employee.');
      return;
    }

    const { error } = await supabase.from('hr_leave_requests').insert({
      employee_id: newLeaveRequest.employee_id,
      leave_type: newLeaveRequest.leave_type,
      start_date: newLeaveRequest.start_date || null,
      end_date: newLeaveRequest.end_date || null,
      days_count: newLeaveRequest.days_count ? Number(newLeaveRequest.days_count) : null,
      reason: newLeaveRequest.reason || null,
      status: 'pending',
      requested_by: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to create leave request.');
      return;
    }

    setNewLeaveRequest(initialLeaveRequest);
    setMessage('Leave request created successfully.');
    await loadDashboardData();
  }

  async function updateLeaveStatus(id, status) {
    const { error } = await supabase
      .from('hr_leave_requests')
      .update({ status, approved_by: profile.user_id, approved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setMessage(error.message || 'Failed to update leave request.');
      return;
    }

    await loadDashboardData();
  }

  async function createAttendance(event) {
    event.preventDefault();
    setMessage('');

    if (!newAttendance.employee_id || !newAttendance.attendance_date) {
      setMessage('Employee and attendance date are required.');
      return;
    }

    const { error } = await supabase.from('hr_attendance').insert({
      employee_id: newAttendance.employee_id,
      attendance_date: newAttendance.attendance_date,
      status: newAttendance.status,
      check_in: newAttendance.check_in || null,
      check_out: newAttendance.check_out || null,
      notes: newAttendance.notes || null,
      recorded_by: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to record attendance.');
      return;
    }

    setNewAttendance(initialAttendance);
    setMessage('Attendance recorded successfully.');
    await loadDashboardData();
  }

  async function createPayrollItem(event) {
    event.preventDefault();
    setMessage('');

    if (!newPayrollItem.employee_id || !newPayrollItem.payroll_month) {
      setMessage('Employee and payroll month are required.');
      return;
    }

    const basic = Number(newPayrollItem.basic_salary || 0);
    const allowances = Number(newPayrollItem.allowances || 0);
    const deductions = Number(newPayrollItem.deductions || 0);
    const net = basic + allowances - deductions;

    const { error } = await supabase.from('hr_payroll').insert({
      employee_id: newPayrollItem.employee_id,
      payroll_month: newPayrollItem.payroll_month,
      basic_salary: basic,
      allowances,
      deductions,
      net_salary: net,
      status: 'draft',
      notes: newPayrollItem.notes || null,
      created_by: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to create payroll item.');
      return;
    }

    setNewPayrollItem(initialPayrollItem);
    setMessage('Payroll item created successfully.');
    await loadDashboardData();
  }

  async function updatePayrollStatus(id, status) {
    const { error } = await supabase
      .from('hr_payroll')
      .update({ status })
      .eq('id', id);

    if (error) {
      setMessage(error.message || 'Failed to update payroll.');
      return;
    }

    await loadDashboardData();
  }

  async function createHrDocument(event) {
    event.preventDefault();
    setMessage('');

    if (!newHrDocument.employee_id || !newHrDocument.title) {
      setMessage('Employee and document title are required.');
      return;
    }

    const { error } = await supabase.from('hr_documents').insert({
      employee_id: newHrDocument.employee_id,
      document_type: newHrDocument.document_type,
      title: newHrDocument.title,
      expiry_date: newHrDocument.expiry_date || null,
      status: newHrDocument.status,
      notes: newHrDocument.notes || null,
      created_by: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to create HR document.');
      return;
    }

    setNewHrDocument(initialHrDocument);
    setMessage('HR document created successfully.');
    await loadDashboardData();
  }


  async function sendChatMessage(event) {
    event.preventDefault();
    setMessage('');

    if (!newChatMessage.message.trim()) {
      setMessage('Message is required.');
      return;
    }

    const { error } = await supabase.from('team_chat_messages').insert({
      matter_id: newChatMessage.matter_id || null,
      channel: newChatMessage.channel || 'general',
      message: newChatMessage.message,
      author_id: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to send message.');
      return;
    }

    setNewChatMessage(initialChatMessage);
    await loadDashboardData();
  }

  function buildClientUpdateEmail(matterId) {
    const matter = matters.find((item) => item.id === matterId);
    if (!matter) return;

    const clientName = matter.clients?.name || 'Client';
    const clientEmail = matter.clients?.email || '';

    setNewEmailDraft({
      ...newEmailDraft,
      matter_id: matter.id,
      to_email: clientEmail,
      subject: `Update regarding ${matter.ref} — ${matter.title}`,
      body: [
        `Dear ${clientName},`,
        '',
        `We would like to update you regarding your matter ${matter.ref} — ${matter.title}.`,
        '',
        `Current stage: ${matter.stage}`,
        `Next deadline/date: ${matter.deadline || 'To be confirmed'}`,
        '',
        `Next step:`,
        matter.next_step || 'We will update you shortly.',
        '',
        'Best regards,',
        'OS Legal'
      ].join('\\n'),
      email_type: 'Client update',
      status: 'draft'
    });
  }

  async function createEmailDraft(event) {
    event.preventDefault();
    setMessage('');

    if (!newEmailDraft.to_email || !newEmailDraft.subject || !newEmailDraft.body) {
      setMessage('To, subject and body are required.');
      return;
    }

    const { error } = await supabase.from('email_queue').insert({
      matter_id: newEmailDraft.matter_id || null,
      to_email: newEmailDraft.to_email,
      subject: newEmailDraft.subject,
      body: newEmailDraft.body,
      email_type: newEmailDraft.email_type || 'Client update',
      status: newEmailDraft.status || 'draft',
      created_by: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to create email draft.');
      return;
    }

    setNewEmailDraft(initialEmailDraft);
    setMessage('Email draft created successfully.');
    await loadDashboardData();
  }

  async function sendQueuedEmail(emailItem) {
    setMessage('');

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await authHeader())
        },
        body: JSON.stringify({
          email_id: emailItem.id,
          to: emailItem.to_email,
          subject: emailItem.subject,
          body: emailItem.body
        })
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setMessage(result.error || 'Failed to send email. You can still open it manually.');
        return;
      }

      await supabase
        .from('email_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', emailItem.id);

      setMessage(result.demo ? 'Demo send completed. Configure email provider for real sending.' : 'Email sent successfully.');
      await loadDashboardData();
    } catch (error) {
      setMessage(error.message || 'Failed to send email.');
    }
  }

  function searchResults() {
    const query = globalSearch.query.trim().toLowerCase();
    if (!query) return [];

    const results = [];
    const include = (type) => globalSearch.type === 'All' || globalSearch.type === type;

    if (include('Matters')) {
      matters.forEach((matter) => {
        const haystack = [
          matter.ref,
          matter.title,
          matter.stage,
          matter.status,
          matter.opponent,
          matter.facts,
          matter.next_step,
          matter.clients?.name
        ].join(' ').toLowerCase();

        if (haystack.includes(query)) {
          results.push({
            type: 'Matter',
            title: `${matter.ref} — ${matter.title}`,
            subtitle: matter.clients?.name || '',
            detail: matter.stage || ''
          });
        }
      });
    }

    if (include('Clients')) {
      clients.forEach((client) => {
        const haystack = [client.name, client.email, client.phone, client.identity, client.address, client.notes].join(' ').toLowerCase();
        if (haystack.includes(query)) {
          results.push({
            type: 'Client',
            title: client.name,
            subtitle: client.email || client.phone || '',
            detail: client.type || ''
          });
        }
      });
    }

    if (include('Employees')) {
      hrEmployees.forEach((employee) => {
        const haystack = [employee.full_name, employee.email, employee.phone, employee.job_title, employee.department].join(' ').toLowerCase();
        if (haystack.includes(query)) {
          results.push({
            type: 'Employee',
            title: employee.full_name,
            subtitle: employee.job_title || '',
            detail: employee.department || ''
          });
        }
      });
    }

    if (include('Emails')) {
      emailQueue.forEach((email) => {
        const haystack = [email.to_email, email.subject, email.body, email.email_type, email.matters?.ref, email.matters?.title].join(' ').toLowerCase();
        if (haystack.includes(query)) {
          results.push({
            type: 'Email',
            title: email.subject,
            subtitle: email.to_email,
            detail: email.status
          });
        }
      });
    }

    if (include('Chat')) {
      chatMessages.forEach((chat) => {
        const haystack = [chat.message, chat.channel, chat.author_profile?.full_name, chat.matters?.ref, chat.matters?.title].join(' ').toLowerCase();
        if (haystack.includes(query)) {
          results.push({
            type: 'Chat',
            title: chat.message.slice(0, 80),
            subtitle: chat.author_profile?.full_name || '',
            detail: chat.channel
          });
        }
      });
    }

    return results;
  }


  async function createCourtHearing(event) {
    event.preventDefault();
    setMessage('');

    if (!newCourtHearing.matter_id || !newCourtHearing.hearing_date) {
      setMessage('Matter and hearing date are required.');
      return;
    }

    const { error } = await supabase.from('court_hearings').insert({
      matter_id: newCourtHearing.matter_id,
      court_name: newCourtHearing.court_name || null,
      case_number: newCourtHearing.case_number || null,
      hearing_date: newCourtHearing.hearing_date,
      hearing_time: newCourtHearing.hearing_time || null,
      courtroom: newCourtHearing.courtroom || null,
      hearing_type: newCourtHearing.hearing_type || null,
      assigned_lawyer: newCourtHearing.assigned_lawyer || null,
      client_attendance_required: String(newCourtHearing.client_attendance_required) === 'true',
      lawyer_attendance_required: String(newCourtHearing.lawyer_attendance_required) === 'true',
      preparation_notes: newCourtHearing.preparation_notes || null,
      documents_required: newCourtHearing.documents_required || null,
      previous_result: newCourtHearing.previous_result || null,
      next_purpose: newCourtHearing.next_purpose || null,
      judgment_expected_date: newCourtHearing.judgment_expected_date || null,
      appeal_deadline: newCourtHearing.appeal_deadline || null,
      status: newCourtHearing.status || 'Scheduled',
      client_visible: String(newCourtHearing.client_visible) === 'true',
      created_by: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to create court hearing.');
      return;
    }

    setNewCourtHearing(initialCourtHearing);
    setMessage('Court hearing created successfully.');
    await loadDashboardData();
  }

  async function updateCourtHearingStatus(id, status) {
    const { error } = await supabase.from('court_hearings').update({ status }).eq('id', id);
    if (error) {
      setMessage(error.message || 'Failed to update hearing.');
      return;
    }
    await loadDashboardData();
  }

  async function createExpertMission(event) {
    event.preventDefault();
    setMessage('');

    if (!newExpertMission.matter_id) {
      setMessage('Matter is required for expert mission.');
      return;
    }

    const { error } = await supabase.from('expert_missions').insert({
      matter_id: newExpertMission.matter_id,
      expert_name: newExpertMission.expert_name || null,
      expert_type: newExpertMission.expert_type,
      expert_contact: newExpertMission.expert_contact || null,
      appointment_date: newExpertMission.appointment_date || null,
      deposit_amount: newExpertMission.deposit_amount ? Number(newExpertMission.deposit_amount) : null,
      deposit_deadline: newExpertMission.deposit_deadline || null,
      deposit_paid: String(newExpertMission.deposit_paid) === 'true',
      meeting_date: newExpertMission.meeting_date || null,
      meeting_location: newExpertMission.meeting_location || null,
      documents_submitted: newExpertMission.documents_submitted || null,
      documents_pending: newExpertMission.documents_pending || null,
      court_questions: newExpertMission.court_questions || null,
      site_visit_date: newExpertMission.site_visit_date || null,
      preliminary_report_date: newExpertMission.preliminary_report_date || null,
      objection_deadline: newExpertMission.objection_deadline || null,
      final_report_date: newExpertMission.final_report_date || null,
      status: newExpertMission.status || 'Expert appointed',
      notes: newExpertMission.notes || null,
      created_by: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to create expert mission.');
      return;
    }

    setNewExpertMission(initialExpertMission);
    setMessage('Expert mission created successfully.');
    await loadDashboardData();
  }

  async function updateExpertStatus(id, status) {
    const { error } = await supabase.from('expert_missions').update({ status }).eq('id', id);
    if (error) {
      setMessage(error.message || 'Failed to update expert mission.');
      return;
    }
    await loadDashboardData();
  }

  async function createDailyMeeting(event) {
    event.preventDefault();
    setMessage('');

    if (!newDailyMeeting.meeting_date) {
      setMessage('Meeting date is required.');
      return;
    }

    const { error } = await supabase.from('daily_meetings').insert({
      meeting_date: newDailyMeeting.meeting_date,
      meeting_time: newDailyMeeting.meeting_time || null,
      meeting_type: newDailyMeeting.meeting_type,
      attendees: newDailyMeeting.attendees || null,
      agenda: newDailyMeeting.agenda || null,
      decisions: newDailyMeeting.decisions || null,
      followup_date: newDailyMeeting.followup_date || null,
      status: newDailyMeeting.status || 'Scheduled',
      created_by: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to create meeting.');
      return;
    }

    setNewDailyMeeting(initialDailyMeeting);
    setMessage('Daily meeting created successfully.');
    await loadDashboardData();
  }

  async function createMeetingTask(event) {
    event.preventDefault();
    setMessage('');

    if (!newMeetingTask.title.trim()) {
      setMessage('Task title is required.');
      return;
    }

    const { error } = await supabase.from('meeting_tasks').insert({
      meeting_id: newMeetingTask.meeting_id || null,
      matter_id: newMeetingTask.matter_id || null,
      title: newMeetingTask.title,
      owner_name: newMeetingTask.owner_name || null,
      due_date: newMeetingTask.due_date || null,
      priority: newMeetingTask.priority || 'Normal',
      status: newMeetingTask.status || 'Pending',
      created_by: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to create meeting task.');
      return;
    }

    setNewMeetingTask(initialMeetingTask);
    setMessage('Meeting task created successfully.');
    await loadDashboardData();
  }

  async function updateMeetingTaskStatus(id, status) {
    const { error } = await supabase.from('meeting_tasks').update({ status }).eq('id', id);
    if (error) {
      setMessage(error.message || 'Failed to update task.');
      return;
    }
    await loadDashboardData();
  }


  async function createLibraryTemplate(event) {
    event.preventDefault();
    setMessage('');

    if (!newLibraryTemplate.title.trim() || !newLibraryTemplate.body.trim()) {
      setMessage('Template title and body are required.');
      return;
    }

    const { error } = await supabase.from('library_templates').insert({
      title: newLibraryTemplate.title,
      category: newLibraryTemplate.category,
      language: newLibraryTemplate.language,
      jurisdiction: newLibraryTemplate.jurisdiction,
      practice_area: newLibraryTemplate.practice_area,
      status: newLibraryTemplate.status,
      tags: newLibraryTemplate.tags ? newLibraryTemplate.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      body: newLibraryTemplate.body,
      created_by: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to create template.');
      return;
    }

    setNewLibraryTemplate(initialLibraryTemplate);
    setMessage('Template added to library.');
    await loadDashboardData();
  }

  async function createAnnouncement(event) {
    event.preventDefault();
    setMessage('');

    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      setMessage('Announcement title and message are required.');
      return;
    }

    const { error } = await supabase.from('announcements').insert({
      title: newAnnouncement.title,
      message: newAnnouncement.message,
      audience: newAnnouncement.audience,
      priority: newAnnouncement.priority,
      active: String(newAnnouncement.active) === 'true',
      created_by: profile.user_id
    });

    if (error) {
      setMessage(error.message || 'Failed to create announcement.');
      return;
    }

    setNewAnnouncement(initialAnnouncement);
    setMessage('Announcement created.');
    await loadDashboardData();
  }

  async function updateMeetingTask(id, patch) {
    const { error } = await supabase.from('meeting_tasks').update(patch).eq('id', id);
    if (error) {
      setMessage(error.message || 'Failed to update task.');
      return;
    }
    await loadDashboardData();
  }

  function fillLibraryTemplate(template) {
    const matter = matters[0] || {};
    const clientName = matter.clients?.name || 'Client';
    return String(template?.body || '')
      .replaceAll('{client}', clientName)
      .replaceAll('{matter_ref}', matter.ref || '')
      .replaceAll('{matter_title}', matter.title || '')
      .replaceAll('{opponent}', matter.opponent || '')
      .replaceAll('{stage}', matter.stage || '')
      .replaceAll('{deadline}', matter.deadline || '')
      .replaceAll('{next_step}', matter.next_step || '')
      .replaceAll('{firm}', 'OS Legal');
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
            <button className="primary full">{tx('Login', lang)}</button>
          </form>
          <button className="full" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>{lang === 'ar' ? 'English' : 'العربية'}</button>

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
              {tx(label, lang)}
            </button>
          ))}
        </nav>

        <div className="userBox">
          <Avatar profile={profile} />
          <strong>{profile.full_name}</strong>
          <small>{profile.email}</small>
          <small>{tx(roles[profile.role], lang)}</small>
        </div>

        <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>{lang === 'ar' ? 'English' : 'العربية'}</button>
        <button onClick={logoutUser}>{tx('Logout', lang)}</button>
      </aside>

      <main className="main">
        <header className="topbar modernTopbar">
          <div className="topbarGreeting">
            <Avatar profile={profile} size="large" />
            <div>
              <h1>{greetingForHour(lang)}, {profile.full_name?.split(' ')[0]}</h1>
              <p>{tx('Let’s start a great day.', lang)} · {tx(nav.find(([key]) => key === page)?.[1] || 'Dashboard', lang)}</p>
            </div>
          </div>
        </header>

        {announcements.filter((item) => item.active).slice(0, 2).map((item) => (
          <div className={`announcementBar ${item.priority?.toLowerCase() || ''}`} key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.message}</span>
          </div>
        ))}

        <section className="content">
          {message && <div className="notice">{message}</div>}

          {page === 'dashboard' && (
            <div className="dashboardModern">
              <div className="heroPanel">
                <div>
                  <span className="eyebrow">{tx('Today’s focus', lang)}</span>
                  <h2>{greetingForHour(lang)}, {profile.full_name?.split(' ')[0]}</h2>
                  <p>{tx('Let’s start a great day.', lang)}</p>
                </div>
                <Avatar profile={profile} size="large" />
              </div>

              <div className="stats">
                <Stat label={tx('Active matters', lang)} value={matters.length} />
                <Stat label={tx('Open invoice requests', lang)} value={invoiceRequests.filter((item) => item.status === 'pending').length} />
                <Stat label={tx('Upcoming hearings', lang)} value={courtHearings.filter((item) => item.status === 'Scheduled').length} />
                <Stat label={tx('Open tasks', lang)} value={meetingTasks.filter((task) => task.status !== 'Done').length} />
              </div>

              <div className="grid three">
                <Card title={tx('Quick actions', lang)}>
                  <div className="quickActions">
                    {canUseOperations && <button onClick={() => setPage('court-calendar')}>{tx('Court Calendar', lang)}</button>}
                    {canUseOperations && <button onClick={() => setPage('expert-missions')}>{tx('Expert Missions', lang)}</button>}
                    {canUseInternalComms && <button onClick={() => setPage('chat')}>{tx('Team Chat', lang)}</button>}
                    {canUseLibrary && <button onClick={() => setPage('library')}>{tx('Library', lang)}</button>}
                  </div>
                </Card>

                <Card title={tx('Tasks', lang)}>
                  {meetingTasks.slice(0, 6).map((task) => (
                    <div className="miniItem" key={task.id}>
                      <strong>{task.title}</strong>
                      <small>{task.owner_name || '-'} · {task.due_date || '-'}</small>
                    </div>
                  ))}
                </Card>

                <Card title={tx('Announcements', lang)}>
                  {announcements.filter((item) => item.active).slice(0, 5).map((item) => (
                    <div className="miniItem" key={item.id}>
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {page === 'users' && isManager && (
            <div className="grid two">
              <Card title="Create User">
                <form onSubmit={createUser} className="formGrid">
                  <Field label={tx('Full name', lang)}>
                    <input value={newUser.full_name} onChange={(event) => setNewUser({ ...newUser, full_name: event.target.value })} />
                  </Field>
                  <Field label={tx('Photo URL', lang)}>
                    <input value={newUser.avatar_url} onChange={(event) => setNewUser({ ...newUser, avatar_url: event.target.value })} placeholder="https://..." />
                  </Field>
                  <Field label={tx('Email', lang)}>
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
                      <option value="hr">HR User</option>
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
                        <td><span className="userCell"><Avatar profile={item} /><strong>{item.full_name}</strong></span></td>
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


          {page === 'hr' && canAccessHr && (
            <div className="grid">
              <div className="stats">
                <Stat label="Employees" value={hrEmployees.length} />
                <Stat label="Pending leave" value={hrLeaveRequests.filter((item) => item.status === 'pending').length} />
                <Stat label="Payroll drafts" value={hrPayroll.filter((item) => item.status === 'draft').length} />
                <Stat label="Documents" value={hrDocuments.length} />
              </div>

              <div className="grid two">
                {(isManager || isHr) && (
                  <Card title="Create Employee">
                    <form onSubmit={createEmployee} className="formGrid">
                      <Field label="Full name">
                        <input value={newEmployee.full_name} onChange={(event) => setNewEmployee({ ...newEmployee, full_name: event.target.value })} />
                      </Field>
                      <Field label="Email">
                        <input value={newEmployee.email} onChange={(event) => setNewEmployee({ ...newEmployee, email: event.target.value })} />
                      </Field>
                      <Field label="Phone">
                        <input value={newEmployee.phone} onChange={(event) => setNewEmployee({ ...newEmployee, phone: event.target.value })} />
                      </Field>
                      <Field label="Job title">
                        <input value={newEmployee.job_title} onChange={(event) => setNewEmployee({ ...newEmployee, job_title: event.target.value })} />
                      </Field>
                      <Field label="Department">
                        <select value={newEmployee.department} onChange={(event) => setNewEmployee({ ...newEmployee, department: event.target.value })}>
                          <option>Legal</option>
                          <option>Corporate</option>
                          <option>Litigation</option>
                          <option>Finance</option>
                          <option>Operations</option>
                          <option>Admin</option>
                        </select>
                      </Field>
                      <Field label="Employee type">
                        <select value={newEmployee.employee_type} onChange={(event) => setNewEmployee({ ...newEmployee, employee_type: event.target.value })}>
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Intern</option>
                          <option>Consultant</option>
                        </select>
                      </Field>
                      <Field label="Start date">
                        <input type="date" value={newEmployee.start_date} onChange={(event) => setNewEmployee({ ...newEmployee, start_date: event.target.value })} />
                      </Field>
                      <Field label="Basic salary">
                        <input type="number" value={newEmployee.basic_salary} onChange={(event) => setNewEmployee({ ...newEmployee, basic_salary: event.target.value })} />
                      </Field>
                      <Field label="Total salary">
                        <input type="number" value={newEmployee.total_salary} onChange={(event) => setNewEmployee({ ...newEmployee, total_salary: event.target.value })} />
                      </Field>
                      <Field label="Notes">
                        <textarea value={newEmployee.notes} onChange={(event) => setNewEmployee({ ...newEmployee, notes: event.target.value })} />
                      </Field>
                      <button className="primary">Create Employee</button>
                    </form>
                  </Card>
                )}

                <Card title="Employees">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Start</th>
                        <th>Salary</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hrEmployees.map((employee) => (
                        <tr key={employee.id}>
                          <td><strong>{employee.full_name}</strong><br /><small>{employee.email || employee.phone || ''}</small></td>
                          <td>{employee.job_title || '-'}</td>
                          <td>{employee.department || '-'}</td>
                          <td>{employee.start_date || '-'}</td>
                          <td>{employee.total_salary ? `AED ${Number(employee.total_salary).toLocaleString()}` : '-'}</td>
                          <td><Pill>{employee.status}</Pill></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              <div className="grid two">
                {(isManager || isHr) && (
                  <Card title="Leave Request">
                    <form onSubmit={createLeaveRequest} className="formGrid">
                      <Field label="Employee">
                        <select value={newLeaveRequest.employee_id} onChange={(event) => setNewLeaveRequest({ ...newLeaveRequest, employee_id: event.target.value })}>
                          <option value="">Select employee</option>
                          {hrEmployees.map((employee) => (
                            <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Leave type">
                        <select value={newLeaveRequest.leave_type} onChange={(event) => setNewLeaveRequest({ ...newLeaveRequest, leave_type: event.target.value })}>
                          <option>Annual leave</option>
                          <option>Sick leave</option>
                          <option>Unpaid leave</option>
                          <option>Emergency leave</option>
                          <option>Other</option>
                        </select>
                      </Field>
                      <Field label="Start date">
                        <input type="date" value={newLeaveRequest.start_date} onChange={(event) => setNewLeaveRequest({ ...newLeaveRequest, start_date: event.target.value })} />
                      </Field>
                      <Field label="End date">
                        <input type="date" value={newLeaveRequest.end_date} onChange={(event) => setNewLeaveRequest({ ...newLeaveRequest, end_date: event.target.value })} />
                      </Field>
                      <Field label="Days">
                        <input type="number" value={newLeaveRequest.days_count} onChange={(event) => setNewLeaveRequest({ ...newLeaveRequest, days_count: event.target.value })} />
                      </Field>
                      <Field label="Reason">
                        <textarea value={newLeaveRequest.reason} onChange={(event) => setNewLeaveRequest({ ...newLeaveRequest, reason: event.target.value })} />
                      </Field>
                      <button className="primary">Submit Leave</button>
                    </form>
                  </Card>
                )}

                <Card title="Leave Requests">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Days</th>
                        <th>Status</th>
                        {(isManager || isHr) && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {hrLeaveRequests.map((request) => (
                        <tr key={request.id}>
                          <td>{request.hr_employees?.full_name || '-'}</td>
                          <td>{request.leave_type}</td>
                          <td>{request.start_date || '-'} to {request.end_date || '-'}</td>
                          <td>{request.days_count || '-'}</td>
                          <td><Pill>{request.status}</Pill></td>
                          {(isManager || isHr) && (
                            <td>
                              {request.status === 'pending' && <button onClick={() => updateLeaveStatus(request.id, 'approved')}>Approve</button>}
                              {request.status === 'pending' && <button onClick={() => updateLeaveStatus(request.id, 'rejected')}>Reject</button>}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              <div className="grid two">
                {(isManager || isHr) && (
                  <Card title="Attendance Record">
                    <form onSubmit={createAttendance} className="formGrid">
                      <Field label="Employee">
                        <select value={newAttendance.employee_id} onChange={(event) => setNewAttendance({ ...newAttendance, employee_id: event.target.value })}>
                          <option value="">Select employee</option>
                          {hrEmployees.map((employee) => (
                            <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Date">
                        <input type="date" value={newAttendance.attendance_date} onChange={(event) => setNewAttendance({ ...newAttendance, attendance_date: event.target.value })} />
                      </Field>
                      <Field label="Status">
                        <select value={newAttendance.status} onChange={(event) => setNewAttendance({ ...newAttendance, status: event.target.value })}>
                          <option>Present</option>
                          <option>Absent</option>
                          <option>Remote</option>
                          <option>Leave</option>
                          <option>Late</option>
                        </select>
                      </Field>
                      <Field label="Check in">
                        <input type="time" value={newAttendance.check_in} onChange={(event) => setNewAttendance({ ...newAttendance, check_in: event.target.value })} />
                      </Field>
                      <Field label="Check out">
                        <input type="time" value={newAttendance.check_out} onChange={(event) => setNewAttendance({ ...newAttendance, check_out: event.target.value })} />
                      </Field>
                      <Field label="Notes">
                        <textarea value={newAttendance.notes} onChange={(event) => setNewAttendance({ ...newAttendance, notes: event.target.value })} />
                      </Field>
                      <button className="primary">Record Attendance</button>
                    </form>
                  </Card>
                )}

                <Card title="Attendance">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Employee</th>
                        <th>Status</th>
                        <th>In / Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hrAttendance.map((item) => (
                        <tr key={item.id}>
                          <td>{item.attendance_date}</td>
                          <td>{item.hr_employees?.full_name || '-'}</td>
                          <td><Pill>{item.status}</Pill></td>
                          <td>{item.check_in || '-'} / {item.check_out || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              <div className="grid two">
                {(isManager || isFinance) && (
                  <Card title="Payroll Item">
                    <form onSubmit={createPayrollItem} className="formGrid">
                      <Field label="Employee">
                        <select value={newPayrollItem.employee_id} onChange={(event) => setNewPayrollItem({ ...newPayrollItem, employee_id: event.target.value })}>
                          <option value="">Select employee</option>
                          {hrEmployees.map((employee) => (
                            <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Payroll month">
                        <input type="month" value={newPayrollItem.payroll_month} onChange={(event) => setNewPayrollItem({ ...newPayrollItem, payroll_month: event.target.value })} />
                      </Field>
                      <Field label="Basic salary">
                        <input type="number" value={newPayrollItem.basic_salary} onChange={(event) => setNewPayrollItem({ ...newPayrollItem, basic_salary: event.target.value })} />
                      </Field>
                      <Field label="Allowances">
                        <input type="number" value={newPayrollItem.allowances} onChange={(event) => setNewPayrollItem({ ...newPayrollItem, allowances: event.target.value })} />
                      </Field>
                      <Field label="Deductions">
                        <input type="number" value={newPayrollItem.deductions} onChange={(event) => setNewPayrollItem({ ...newPayrollItem, deductions: event.target.value })} />
                      </Field>
                      <Field label="Notes">
                        <textarea value={newPayrollItem.notes} onChange={(event) => setNewPayrollItem({ ...newPayrollItem, notes: event.target.value })} />
                      </Field>
                      <button className="primary">Create Payroll Item</button>
                    </form>
                  </Card>
                )}

                <Card title="Payroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Employee</th>
                        <th>Net salary</th>
                        <th>Status</th>
                        {(isManager || isFinance) && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {hrPayroll.map((payroll) => (
                        <tr key={payroll.id}>
                          <td>{payroll.payroll_month}</td>
                          <td>{payroll.hr_employees?.full_name || '-'}</td>
                          <td>AED {Number(payroll.net_salary || 0).toLocaleString()}</td>
                          <td><Pill>{payroll.status}</Pill></td>
                          {(isManager || isFinance) && (
                            <td>
                              {payroll.status === 'draft' && <button onClick={() => updatePayrollStatus(payroll.id, 'approved')}>Approve</button>}
                              {payroll.status === 'approved' && <button onClick={() => updatePayrollStatus(payroll.id, 'paid')}>Mark Paid</button>}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              <div className="grid two">
                {(isManager || isHr) && (
                  <Card title="HR Document">
                    <form onSubmit={createHrDocument} className="formGrid">
                      <Field label="Employee">
                        <select value={newHrDocument.employee_id} onChange={(event) => setNewHrDocument({ ...newHrDocument, employee_id: event.target.value })}>
                          <option value="">Select employee</option>
                          {hrEmployees.map((employee) => (
                            <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Document type">
                        <select value={newHrDocument.document_type} onChange={(event) => setNewHrDocument({ ...newHrDocument, document_type: event.target.value })}>
                          <option>Employment Contract</option>
                          <option>NDA / Confidentiality</option>
                          <option>Passport</option>
                          <option>Emirates ID</option>
                          <option>Visa</option>
                          <option>Labour Card</option>
                          <option>Warning / Disciplinary</option>
                          <option>Other</option>
                        </select>
                      </Field>
                      <Field label="Title">
                        <input value={newHrDocument.title} onChange={(event) => setNewHrDocument({ ...newHrDocument, title: event.target.value })} />
                      </Field>
                      <Field label="Expiry date">
                        <input type="date" value={newHrDocument.expiry_date} onChange={(event) => setNewHrDocument({ ...newHrDocument, expiry_date: event.target.value })} />
                      </Field>
                      <Field label="Status">
                        <select value={newHrDocument.status} onChange={(event) => setNewHrDocument({ ...newHrDocument, status: event.target.value })}>
                          <option>pending</option>
                          <option>received</option>
                          <option>expired</option>
                          <option>not applicable</option>
                        </select>
                      </Field>
                      <Field label="Notes">
                        <textarea value={newHrDocument.notes} onChange={(event) => setNewHrDocument({ ...newHrDocument, notes: event.target.value })} />
                      </Field>
                      <button className="primary">Add HR Document</button>
                    </form>
                  </Card>
                )}

                <Card title="HR Documents">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Document</th>
                        <th>Expiry</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hrDocuments.map((doc) => (
                        <tr key={doc.id}>
                          <td>{doc.hr_employees?.full_name || '-'}</td>
                          <td><strong>{doc.title}</strong><br /><small>{doc.document_type}</small></td>
                          <td>{doc.expiry_date || '-'}</td>
                          <td><Pill>{doc.status}</Pill></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </div>
          )}


          {page === 'chat' && canUseInternalComms && (
            <div className="grid two">
              <Card title="Team Internal Chat">
                <form onSubmit={sendChatMessage} className="formGrid">
                  <Field label="Matter">
                    <select value={newChatMessage.matter_id} onChange={(event) => setNewChatMessage({ ...newChatMessage, matter_id: event.target.value })}>
                      <option value="">General / no matter</option>
                      {matters.map((matter) => (
                        <option key={matter.id} value={matter.id}>{matter.ref} — {matter.title}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Channel">
                    <select value={newChatMessage.channel} onChange={(event) => setNewChatMessage({ ...newChatMessage, channel: event.target.value })}>
                      <option>general</option>
                      <option>litigation</option>
                      <option>corporate</option>
                      <option>finance</option>
                      <option>hr</option>
                      <option>urgent</option>
                    </select>
                  </Field>

                  <Field label="Message">
                    <textarea value={newChatMessage.message} onChange={(event) => setNewChatMessage({ ...newChatMessage, message: event.target.value })} />
                  </Field>

                  <button className="primary">Send Message</button>
                </form>
              </Card>

              <Card title="Recent Messages">
                <div className="timeline">
                  {chatMessages.map((chat) => (
                    <div className="timelineItem" key={chat.id}>
                      <strong>{chat.author_profile?.full_name || 'User'} <small>#{chat.channel}</small></strong>
                      <p>{chat.message}</p>
                      <small>{chat.matters?.ref || 'General'} — {new Date(chat.created_at).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {page === 'email' && canUseInternalComms && (
            <div className="grid two">
              <Card title="Create Email Draft / Service">
                <div className="actions">
                  <select onChange={(event) => buildClientUpdateEmail(event.target.value)} defaultValue="">
                    <option value="">Generate from matter</option>
                    {matters.map((matter) => (
                      <option key={matter.id} value={matter.id}>{matter.ref} — {matter.title}</option>
                    ))}
                  </select>
                </div>

                <form onSubmit={createEmailDraft} className="formGrid">
                  <Field label="Matter">
                    <select value={newEmailDraft.matter_id} onChange={(event) => setNewEmailDraft({ ...newEmailDraft, matter_id: event.target.value })}>
                      <option value="">No matter</option>
                      {matters.map((matter) => (
                        <option key={matter.id} value={matter.id}>{matter.ref} — {matter.title}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Email type">
                    <select value={newEmailDraft.email_type} onChange={(event) => setNewEmailDraft({ ...newEmailDraft, email_type: event.target.value })}>
                      <option>Client update</option>
                      <option>Payment reminder</option>
                      <option>Document request</option>
                      <option>Internal notification</option>
                      <option>General</option>
                    </select>
                  </Field>

                  <Field label="To">
                    <input value={newEmailDraft.to_email} onChange={(event) => setNewEmailDraft({ ...newEmailDraft, to_email: event.target.value })} />
                  </Field>

                  <Field label="Subject">
                    <input value={newEmailDraft.subject} onChange={(event) => setNewEmailDraft({ ...newEmailDraft, subject: event.target.value })} />
                  </Field>

                  <Field label="Body">
                    <textarea value={newEmailDraft.body} onChange={(event) => setNewEmailDraft({ ...newEmailDraft, body: event.target.value })} />
                  </Field>

                  <button className="primary">Save Email Draft</button>
                </form>
              </Card>

              <Card title="Email Queue">
                <table>
                  <thead>
                    <tr>
                      <th>To</th>
                      <th>Subject</th>
                      <th>Matter</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailQueue.map((email) => (
                      <tr key={email.id}>
                        <td>{email.to_email}</td>
                        <td><strong>{email.subject}</strong><br /><small>{email.email_type}</small></td>
                        <td>{email.matters?.ref || '-'}</td>
                        <td><Pill>{email.status}</Pill></td>
                        <td>
                          <a className="button" href={`mailto:${encodeURIComponent(email.to_email)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`}>Open</a>
                          {email.status !== 'sent' && <button onClick={() => sendQueuedEmail(email)}>Send</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {page === 'search' && canUseInternalComms && (
            <div className="grid two">
              <Card title="Global Search Engine">
                <div className="formGrid">
                  <Field label="Search">
                    <input value={globalSearch.query} onChange={(event) => setGlobalSearch({ ...globalSearch, query: event.target.value })} placeholder="Search matters, clients, employees, emails, chat..." />
                  </Field>
                  <Field label="Type">
                    <select value={globalSearch.type} onChange={(event) => setGlobalSearch({ ...globalSearch, type: event.target.value })}>
                      <option>All</option>
                      <option>Matters</option>
                      <option>Clients</option>
                      <option>Employees</option>
                      <option>Emails</option>
                      <option>Chat</option>
                    </select>
                  </Field>
                </div>
              </Card>

              <Card title="Search Results">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Result</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults().map((result, index) => (
                      <tr key={`${result.type}-${index}`}>
                        <td><Pill>{result.type}</Pill></td>
                        <td><strong>{result.title}</strong><br /><small>{result.subtitle}</small></td>
                        <td>{result.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}


          {page === 'court-calendar' && canUseOperations && (
            <div className="grid">
              <div className="stats">
                <Stat label="Scheduled hearings" value={courtHearings.filter((item) => item.status === 'Scheduled').length} />
                <Stat label="Client attendance" value={courtHearings.filter((item) => item.client_attendance_required).length} />
                <Stat label="Judgment dates" value={courtHearings.filter((item) => item.judgment_expected_date).length} />
                <Stat label="Appeal deadlines" value={courtHearings.filter((item) => item.appeal_deadline).length} />
              </div>

              <div className="grid two">
                <Card title="Create Court Hearing">
                  <form onSubmit={createCourtHearing} className="formGrid">
                    <Field label="Matter">
                      <select value={newCourtHearing.matter_id} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, matter_id: event.target.value })}>
                        <option value="">Select matter</option>
                        {matters.map((matter) => (
                          <option key={matter.id} value={matter.id}>{matter.ref} — {matter.title}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Court">
                      <input value={newCourtHearing.court_name} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, court_name: event.target.value })} />
                    </Field>
                    <Field label="Case number">
                      <input value={newCourtHearing.case_number} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, case_number: event.target.value })} />
                    </Field>
                    <Field label="Hearing type">
                      <select value={newCourtHearing.hearing_type} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, hearing_type: event.target.value })}>
                        <option>First hearing</option>
                        <option>Submission hearing</option>
                        <option>Expert hearing</option>
                        <option>Judgment</option>
                        <option>Appeal</option>
                        <option>Cassation</option>
                        <option>Investigation</option>
                        <option>Other</option>
                      </select>
                    </Field>
                    <Field label="Hearing date">
                      <input type="date" value={newCourtHearing.hearing_date} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, hearing_date: event.target.value })} />
                    </Field>
                    <Field label="Hearing time">
                      <input type="time" value={newCourtHearing.hearing_time} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, hearing_time: event.target.value })} />
                    </Field>
                    <Field label="Court room / link">
                      <input value={newCourtHearing.courtroom} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, courtroom: event.target.value })} />
                    </Field>
                    <Field label="Assigned lawyer">
                      <input value={newCourtHearing.assigned_lawyer} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, assigned_lawyer: event.target.value })} />
                    </Field>
                    <Field label="Client attendance required">
                      <select value={newCourtHearing.client_attendance_required} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, client_attendance_required: event.target.value })}>
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </Field>
                    <Field label="Lawyer attendance required">
                      <select value={newCourtHearing.lawyer_attendance_required} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, lawyer_attendance_required: event.target.value })}>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </Field>
                    <Field label="Judgment expected date">
                      <input type="date" value={newCourtHearing.judgment_expected_date} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, judgment_expected_date: event.target.value })} />
                    </Field>
                    <Field label="Appeal deadline">
                      <input type="date" value={newCourtHearing.appeal_deadline} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, appeal_deadline: event.target.value })} />
                    </Field>
                    <Field label="Documents required">
                      <textarea value={newCourtHearing.documents_required} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, documents_required: event.target.value })} />
                    </Field>
                    <Field label="Preparation notes">
                      <textarea value={newCourtHearing.preparation_notes} onChange={(event) => setNewCourtHearing({ ...newCourtHearing, preparation_notes: event.target.value })} />
                    </Field>
                    <button className="primary">Create Hearing</button>
                  </form>
                </Card>

                <Card title="Court Calendar">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Matter</th>
                        <th>Court</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courtHearings.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.hearing_date}</strong><br /><small>{item.hearing_time || ''}</small></td>
                          <td>{item.matters?.ref || '-'}<br /><small>{item.matters?.clients?.name || ''}</small></td>
                          <td>{item.court_name}<br /><small>{item.case_number || ''}</small></td>
                          <td>{item.hearing_type}</td>
                          <td><Pill>{item.status}</Pill></td>
                          <td>
                            <button onClick={() => updateCourtHearingStatus(item.id, 'Attended')}>Attended</button>
                            <button onClick={() => updateCourtHearingStatus(item.id, 'Adjourned')}>Adjourned</button>
                            <button onClick={() => updateCourtHearingStatus(item.id, 'Reserved for judgment')}>Reserved</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </div>
          )}

          {page === 'expert-missions' && canUseOperations && (
            <div className="grid">
              <div className="stats">
                <Stat label="Expert missions" value={expertMissions.length} />
                <Stat label="Deposits pending" value={expertMissions.filter((item) => !item.deposit_paid).length} />
                <Stat label="Meetings scheduled" value={expertMissions.filter((item) => item.meeting_date).length} />
                <Stat label="Objection deadlines" value={expertMissions.filter((item) => item.objection_deadline).length} />
              </div>

              <div className="grid two">
                <Card title="Create Expert Mission">
                  <form onSubmit={createExpertMission} className="formGrid">
                    <Field label="Matter">
                      <select value={newExpertMission.matter_id} onChange={(event) => setNewExpertMission({ ...newExpertMission, matter_id: event.target.value })}>
                        <option value="">Select matter</option>
                        {matters.map((matter) => (
                          <option key={matter.id} value={matter.id}>{matter.ref} — {matter.title}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Expert name">
                      <input value={newExpertMission.expert_name} onChange={(event) => setNewExpertMission({ ...newExpertMission, expert_name: event.target.value })} />
                    </Field>
                    <Field label="Expert type">
                      <select value={newExpertMission.expert_type} onChange={(event) => setNewExpertMission({ ...newExpertMission, expert_type: event.target.value })}>
                        <option>Accounting</option>
                        <option>Engineering</option>
                        <option>Real estate</option>
                        <option>Technical</option>
                        <option>Medical</option>
                        <option>Other</option>
                      </select>
                    </Field>
                    <Field label="Expert contact">
                      <input value={newExpertMission.expert_contact} onChange={(event) => setNewExpertMission({ ...newExpertMission, expert_contact: event.target.value })} />
                    </Field>
                    <Field label="Appointment date">
                      <input type="date" value={newExpertMission.appointment_date} onChange={(event) => setNewExpertMission({ ...newExpertMission, appointment_date: event.target.value })} />
                    </Field>
                    <Field label="Deposit amount">
                      <input type="number" value={newExpertMission.deposit_amount} onChange={(event) => setNewExpertMission({ ...newExpertMission, deposit_amount: event.target.value })} />
                    </Field>
                    <Field label="Deposit deadline">
                      <input type="date" value={newExpertMission.deposit_deadline} onChange={(event) => setNewExpertMission({ ...newExpertMission, deposit_deadline: event.target.value })} />
                    </Field>
                    <Field label="Deposit paid">
                      <select value={newExpertMission.deposit_paid} onChange={(event) => setNewExpertMission({ ...newExpertMission, deposit_paid: event.target.value })}>
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </Field>
                    <Field label="Expert meeting date">
                      <input type="date" value={newExpertMission.meeting_date} onChange={(event) => setNewExpertMission({ ...newExpertMission, meeting_date: event.target.value })} />
                    </Field>
                    <Field label="Meeting location/link">
                      <input value={newExpertMission.meeting_location} onChange={(event) => setNewExpertMission({ ...newExpertMission, meeting_location: event.target.value })} />
                    </Field>
                    <Field label="Documents submitted">
                      <textarea value={newExpertMission.documents_submitted} onChange={(event) => setNewExpertMission({ ...newExpertMission, documents_submitted: event.target.value })} />
                    </Field>
                    <Field label="Documents pending">
                      <textarea value={newExpertMission.documents_pending} onChange={(event) => setNewExpertMission({ ...newExpertMission, documents_pending: event.target.value })} />
                    </Field>
                    <Field label="Court questions / issues">
                      <textarea value={newExpertMission.court_questions} onChange={(event) => setNewExpertMission({ ...newExpertMission, court_questions: event.target.value })} />
                    </Field>
                    <Field label="Objection deadline">
                      <input type="date" value={newExpertMission.objection_deadline} onChange={(event) => setNewExpertMission({ ...newExpertMission, objection_deadline: event.target.value })} />
                    </Field>
                    <button className="primary">Create Expert Mission</button>
                  </form>
                </Card>

                <Card title="Expert Missions">
                  <table>
                    <thead>
                      <tr>
                        <th>Matter</th>
                        <th>Expert</th>
                        <th>Deposit</th>
                        <th>Meeting</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expertMissions.map((item) => (
                        <tr key={item.id}>
                          <td>{item.matters?.ref || '-'}<br /><small>{item.matters?.clients?.name || ''}</small></td>
                          <td><strong>{item.expert_name || '-'}</strong><br /><small>{item.expert_type}</small></td>
                          <td>{item.deposit_amount ? `AED ${Number(item.deposit_amount).toLocaleString()}` : '-'}<br /><small>{item.deposit_paid ? 'paid' : 'pending'}</small></td>
                          <td>{item.meeting_date || '-'}<br /><small>{item.meeting_location || ''}</small></td>
                          <td><Pill>{item.status}</Pill></td>
                          <td>
                            <button onClick={() => updateExpertStatus(item.id, 'Documents submitted')}>Docs submitted</button>
                            <button onClick={() => updateExpertStatus(item.id, 'Meeting attended')}>Meeting attended</button>
                            <button onClick={() => updateExpertStatus(item.id, 'Final report issued')}>Final report</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </div>
          )}

          {page === 'daily-meetings' && canUseOperations && (
            <div className="grid">
              <div className="stats">
                <Stat label="Meetings" value={dailyMeetings.length} />
                <Stat label="Open action items" value={meetingTasks.filter((task) => task.status !== 'Done').length} />
                <Stat label="Urgent tasks" value={meetingTasks.filter((task) => task.priority === 'Urgent').length} />
                <Stat label="Completed tasks" value={meetingTasks.filter((task) => task.status === 'Done').length} />
              </div>

              <div className="grid two">
                <Card title="Create Daily Meeting">
                  <form onSubmit={createDailyMeeting} className="formGrid">
                    <Field label="Date">
                      <input type="date" value={newDailyMeeting.meeting_date} onChange={(event) => setNewDailyMeeting({ ...newDailyMeeting, meeting_date: event.target.value })} />
                    </Field>
                    <Field label="Time">
                      <input type="time" value={newDailyMeeting.meeting_time} onChange={(event) => setNewDailyMeeting({ ...newDailyMeeting, meeting_time: event.target.value })} />
                    </Field>
                    <Field label="Meeting type">
                      <select value={newDailyMeeting.meeting_type} onChange={(event) => setNewDailyMeeting({ ...newDailyMeeting, meeting_type: event.target.value })}>
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Litigation</option>
                        <option>Corporate</option>
                        <option>Finance</option>
                        <option>HR</option>
                        <option>Management</option>
                      </select>
                    </Field>
                    <Field label="Attendees">
                      <textarea value={newDailyMeeting.attendees} onChange={(event) => setNewDailyMeeting({ ...newDailyMeeting, attendees: event.target.value })} />
                    </Field>
                    <Field label="Agenda">
                      <textarea value={newDailyMeeting.agenda} onChange={(event) => setNewDailyMeeting({ ...newDailyMeeting, agenda: event.target.value })} />
                    </Field>
                    <Field label="Decisions">
                      <textarea value={newDailyMeeting.decisions} onChange={(event) => setNewDailyMeeting({ ...newDailyMeeting, decisions: event.target.value })} />
                    </Field>
                    <Field label="Follow-up date">
                      <input type="date" value={newDailyMeeting.followup_date} onChange={(event) => setNewDailyMeeting({ ...newDailyMeeting, followup_date: event.target.value })} />
                    </Field>
                    <button className="primary">Create Meeting</button>
                  </form>
                </Card>

                <Card title="Create Meeting Task">
                  <form onSubmit={createMeetingTask} className="formGrid">
                    <Field label="Meeting">
                      <select value={newMeetingTask.meeting_id} onChange={(event) => setNewMeetingTask({ ...newMeetingTask, meeting_id: event.target.value })}>
                        <option value="">No meeting</option>
                        {dailyMeetings.map((meeting) => (
                          <option key={meeting.id} value={meeting.id}>{meeting.meeting_date} — {meeting.meeting_type}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Matter">
                      <select value={newMeetingTask.matter_id} onChange={(event) => setNewMeetingTask({ ...newMeetingTask, matter_id: event.target.value })}>
                        <option value="">No matter</option>
                        {matters.map((matter) => (
                          <option key={matter.id} value={matter.id}>{matter.ref} — {matter.title}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Task title">
                      <input value={newMeetingTask.title} onChange={(event) => setNewMeetingTask({ ...newMeetingTask, title: event.target.value })} />
                    </Field>
                    <Field label="Owner">
                      <input value={newMeetingTask.owner_name} onChange={(event) => setNewMeetingTask({ ...newMeetingTask, owner_name: event.target.value })} />
                    </Field>
                    <Field label="Due date">
                      <input type="date" value={newMeetingTask.due_date} onChange={(event) => setNewMeetingTask({ ...newMeetingTask, due_date: event.target.value })} />
                    </Field>
                    <Field label="Priority">
                      <select value={newMeetingTask.priority} onChange={(event) => setNewMeetingTask({ ...newMeetingTask, priority: event.target.value })}>
                        <option>Low</option>
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                      </select>
                    </Field>
                    <button className="primary">Create Task</button>
                  </form>
                </Card>
              </div>

              <div className="grid two">
                <Card title="Daily Meetings">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Agenda</th>
                        <th>Decisions</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyMeetings.map((meeting) => (
                        <tr key={meeting.id}>
                          <td><strong>{meeting.meeting_date}</strong><br /><small>{meeting.meeting_time || ''}</small></td>
                          <td>{meeting.meeting_type}<br /><small>{meeting.attendees || ''}</small></td>
                          <td>{meeting.agenda || '-'}</td>
                          <td>{meeting.decisions || '-'}</td>
                          <td><Pill>{meeting.status}</Pill></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card title="Meeting Action Items">
                  <table>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Owner</th>
                        <th>Due</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meetingTasks.map((task) => (
                        <tr key={task.id}>
                          <td><strong>{task.title}</strong><br /><small>{task.matters?.ref || ''}</small></td>
                          <td>{task.owner_name || '-'}</td>
                          <td>{task.due_date || '-'}</td>
                          <td>{task.priority}</td>
                          <td><Pill>{task.status}</Pill></td>
                          <td>{task.status !== 'Done' && <button onClick={() => updateMeetingTaskStatus(task.id, 'Done')}>Done</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </div>
          )}


          {page === 'tasks' && canUseInternalComms && (
            <div className="grid two">
              <Card title={tx('Create Task', lang)}>
                <form onSubmit={createMeetingTask} className="formGrid">
                  <Field label={tx('Matter', lang)}>
                    <select value={newMeetingTask.matter_id} onChange={(event) => setNewMeetingTask({ ...newMeetingTask, matter_id: event.target.value })}>
                      <option value="">No matter</option>
                      {matters.map((matter) => (
                        <option key={matter.id} value={matter.id}>{matter.ref} — {matter.title}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={tx('Task title', lang)}>
                    <input value={newMeetingTask.title} onChange={(event) => setNewMeetingTask({ ...newMeetingTask, title: event.target.value })} />
                  </Field>
                  <Field label={tx('Owner', lang)}>
                    <input value={newMeetingTask.owner_name} onChange={(event) => setNewMeetingTask({ ...newMeetingTask, owner_name: event.target.value })} />
                  </Field>
                  <Field label={tx('Due', lang)}>
                    <input type="date" value={newMeetingTask.due_date} onChange={(event) => setNewMeetingTask({ ...newMeetingTask, due_date: event.target.value })} />
                  </Field>
                  <Field label={tx('Priority', lang)}>
                    <select value={newMeetingTask.priority} onChange={(event) => setNewMeetingTask({ ...newMeetingTask, priority: event.target.value })}>
                      <option>Low</option>
                      <option>Normal</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </Field>
                  <button className="primary">{tx('Create', lang)}</button>
                </form>
              </Card>

              <Card title={tx('All Tasks', lang)}>
                <table>
                  <thead>
                    <tr>
                      <th>{tx('Task title', lang)}</th>
                      <th>{tx('Owner', lang)}</th>
                      <th>{tx('Due', lang)}</th>
                      <th>{tx('Priority', lang)}</th>
                      <th>{tx('Status', lang)}</th>
                      <th>{tx('Action', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetingTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          {editingTaskId === task.id ? (
                            <input defaultValue={task.title} onBlur={(event) => updateMeetingTask(task.id, { title: event.target.value })} />
                          ) : (
                            <strong>{task.title}</strong>
                          )}
                          <br /><small>{task.matters?.ref || ''}</small>
                        </td>
                        <td>
                          {editingTaskId === task.id ? (
                            <input defaultValue={task.owner_name || ''} onBlur={(event) => updateMeetingTask(task.id, { owner_name: event.target.value })} />
                          ) : task.owner_name || '-'}
                        </td>
                        <td>
                          {editingTaskId === task.id ? (
                            <input type="date" defaultValue={task.due_date || ''} onBlur={(event) => updateMeetingTask(task.id, { due_date: event.target.value || null })} />
                          ) : task.due_date || '-'}
                        </td>
                        <td>
                          <select value={task.priority} onChange={(event) => updateMeetingTask(task.id, { priority: event.target.value })}>
                            <option>Low</option>
                            <option>Normal</option>
                            <option>High</option>
                            <option>Urgent</option>
                          </select>
                        </td>
                        <td>
                          <select value={task.status} onChange={(event) => updateMeetingTask(task.id, { status: event.target.value })}>
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Done</option>
                            <option>Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <button onClick={() => setEditingTaskId(editingTaskId === task.id ? '' : task.id)}>{editingTaskId === task.id ? tx('Done', lang) : tx('Edit', lang)}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {page === 'library' && canUseLibrary && (
            <div className="grid two">
              <Card title={tx('Create Template', lang)}>
                <form onSubmit={createLibraryTemplate} className="formGrid">
                  <Field label={tx('Title', lang)}>
                    <input value={newLibraryTemplate.title} onChange={(event) => setNewLibraryTemplate({ ...newLibraryTemplate, title: event.target.value })} />
                  </Field>
                  <Field label={tx('Category', lang)}>
                    <select value={newLibraryTemplate.category} onChange={(event) => setNewLibraryTemplate({ ...newLibraryTemplate, category: event.target.value })}>
                      <option>Client Update</option>
                      <option>Legal Notice</option>
                      <option>Contract</option>
                      <option>Engagement Letter</option>
                      <option>Settlement Agreement</option>
                      <option>Court Memo</option>
                      <option>Expert Memo</option>
                      <option>POA</option>
                      <option>HR</option>
                      <option>Finance</option>
                      <option>Payment Reminder</option>
                    </select>
                  </Field>
                  <Field label={tx('Language', lang)}>
                    <select value={newLibraryTemplate.language} onChange={(event) => setNewLibraryTemplate({ ...newLibraryTemplate, language: event.target.value })}>
                      <option>English</option>
                      <option>Arabic</option>
                      <option>Bilingual</option>
                    </select>
                  </Field>
                  <Field label={tx('Jurisdiction', lang)}>
                    <input value={newLibraryTemplate.jurisdiction} onChange={(event) => setNewLibraryTemplate({ ...newLibraryTemplate, jurisdiction: event.target.value })} />
                  </Field>
                  <Field label={tx('Practice area', lang)}>
                    <input value={newLibraryTemplate.practice_area} onChange={(event) => setNewLibraryTemplate({ ...newLibraryTemplate, practice_area: event.target.value })} />
                  </Field>
                  <Field label={tx('Tags', lang)}>
                    <input value={newLibraryTemplate.tags} onChange={(event) => setNewLibraryTemplate({ ...newLibraryTemplate, tags: event.target.value })} placeholder="comma, separated, tags" />
                  </Field>
                  <Field label={tx('Body', lang)}>
                    <textarea value={newLibraryTemplate.body} onChange={(event) => setNewLibraryTemplate({ ...newLibraryTemplate, body: event.target.value })} placeholder="Use variables: {client}, {matter_ref}, {matter_title}, {opponent}, {stage}, {deadline}, {next_step}, {firm}" />
                  </Field>
                  <button className="primary">{tx('Save', lang)}</button>
                </form>
              </Card>

              <Card title={tx('Template Library', lang)}>
                <table>
                  <thead>
                    <tr>
                      <th>{tx('Title', lang)}</th>
                      <th>{tx('Category', lang)}</th>
                      <th>{tx('Language', lang)}</th>
                      <th>{tx('Status', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {libraryTemplates.map((template) => (
                      <tr key={template.id} onClick={() => setSelectedLibraryTemplateId(template.id)}>
                        <td><strong>{template.title}</strong><br /><small>{template.tags?.join?.(', ') || ''}</small></td>
                        <td>{tx(template.category, lang)}</td>
                        <td>{tx(template.language, lang)}</td>
                        <td><Pill>{template.status}</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {selectedLibraryTemplateId && (
                  <div className="templatePreview">
                    <h3>{tx('Template Preview', lang)}</h3>
                    <textarea readOnly value={fillLibraryTemplate(libraryTemplates.find((item) => item.id === selectedLibraryTemplateId))} />
                    <button onClick={() => navigator.clipboard.writeText(fillLibraryTemplate(libraryTemplates.find((item) => item.id === selectedLibraryTemplateId)))}>{tx('Copy', lang)}</button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {page === 'announcements' && isManager && (
            <div className="grid two">
              <Card title={tx('Create Announcement', lang)}>
                <form onSubmit={createAnnouncement} className="formGrid">
                  <Field label={tx('Title', lang)}>
                    <input value={newAnnouncement.title} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, title: event.target.value })} />
                  </Field>
                  <Field label={tx('Message', lang)}>
                    <textarea value={newAnnouncement.message} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, message: event.target.value })} />
                  </Field>
                  <Field label={tx('Audience', lang)}>
                    <select value={newAnnouncement.audience} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, audience: event.target.value })}>
                      <option value="all">all</option>
                      <option value="internal">internal</option>
                      <option value="lawfirm">lawfirm</option>
                      <option value="finance">finance</option>
                      <option value="hr">hr</option>
                      <option value="client">client</option>
                    </select>
                  </Field>
                  <Field label={tx('Priority', lang)}>
                    <select value={newAnnouncement.priority} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, priority: event.target.value })}>
                      <option>Normal</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </Field>
                  <Field label={tx('Active', lang)}>
                    <select value={newAnnouncement.active} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, active: event.target.value })}>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </Field>
                  <button className="primary">{tx('Save', lang)}</button>
                </form>
              </Card>

              <Card title={tx('Announcements', lang)}>
                <table>
                  <thead>
                    <tr>
                      <th>{tx('Title', lang)}</th>
                      <th>{tx('Audience', lang)}</th>
                      <th>{tx('Priority', lang)}</th>
                      <th>{tx('Status', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.title}</strong><br /><small>{item.message}</small></td>
                        <td>{item.audience}</td>
                        <td>{item.priority}</td>
                        <td><Pill>{item.active ? 'Active' : 'Inactive'}</Pill></td>
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
