import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const categories = ['Classroom', 'Laboratory', 'Wi-Fi / IT', 'Electrical', 'Cleanliness', 'Furniture', 'Water / Plumbing', 'Safety', 'Other'];
const blankForm = { title: '', category: 'Classroom', location: '', description: '', reporterName: '', reporterEmail: '', priority: 'Medium' };
const API = '/api/issues';

function App() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error('The server returned an error while loading reports.');
      const data = await response.json();
      setIssues(Array.isArray(data) ? data : []);
    } catch {
      setError('Unable to connect to the CampusFix API. Start MongoDB and the backend server, then retry.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!modal) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setModal(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [modal]);

  const filtered = useMemo(() => issues.filter((issue) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [issue.title, issue.location, issue.reporterName, issue.category, issue.description].some((value) => String(value || '').toLowerCase().includes(q));
    return matchesSearch && (statusFilter === 'All statuses' || issue.status === statusFilter) && (categoryFilter === 'All categories' || issue.category === categoryFilter);
  }), [issues, search, statusFilter, categoryFilter]);

  const counts = {
    total: issues.length,
    open: issues.filter((x) => x.status === 'Open').length,
    progress: issues.filter((x) => x.status === 'In Progress').length,
    resolved: issues.filter((x) => x.status === 'Resolved').length,
    urgent: issues.filter((x) => x.priority === 'Urgent' && x.status !== 'Resolved').length,
  };

  function openNew() { setEditing(null); setForm({ ...blankForm }); setError(''); setModal(true); }
  function openEdit(issue) { setEditing(issue._id); setForm({ ...blankForm, ...issue }); setError(''); setModal(true); }
  function updateField(event) { const { name, value } = event.target; setForm((current) => ({ ...current, [name]: value })); }

  async function save(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const response = await fetch(editing ? `${API}/${editing}` : API, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not save this report. Please try again.');
      setModal(false);
      setNotice(editing ? 'Issue report updated successfully.' : 'Your issue has been reported successfully.');
      await load();
    } catch (err) { setError(err.message || 'Could not save the report.'); }
    finally { setSaving(false); }
  }

  async function changeStatus(issue, status) {
    try {
      const response = await fetch(`${API}/${issue._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...issue, status }) });
      if (!response.ok) throw new Error('Could not update issue status.');
      setNotice('Issue status updated.'); await load();
    } catch (err) { setError(err.message); }
  }

  async function remove(issue) {
    if (!window.confirm(`Delete report “${issue.title}”? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${API}/${issue._id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete this report.');
      setNotice('Issue report deleted.'); await load();
    } catch (err) { setError(err.message); }
  }

  function exportCSV() {
    const columns = ['title', 'category', 'location', 'priority', 'status', 'reporterName', 'reporterEmail', 'description', 'createdAt'];
    const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [columns.join(','), ...filtered.map((item) => columns.map((column) => escapeCell(item[column])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'campusfix-issue-reports.csv'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" aria-label="CampusFix dashboard">
          <span className="brand-mark"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4 35 12.5v15L20 36 5 27.5v-15L20 4Z"/><path d="m12 20 5 5 11-12"/></svg></span>
          <span className="brand-copy"><strong>campus<span>fix</span></strong><small>Campus care, connected</small></span>
        </a>
        <div className="nav-caption">WORKSPACE</div>
        <a className="nav-link selected" href="#dashboard"><span className="nav-icon">◫</span><span>Overview</span><span className="nav-arrow">›</span></a>
        <button className="nav-link" type="button" onClick={() => { setStatusFilter('All statuses'); document.getElementById('reports')?.scrollIntoView({ behavior: 'smooth' }); }}><span className="nav-icon">▤</span><span>Issue reports</span><span className="nav-count">{issues.length}</span></button>
        <div className="sidebar-bottom">
          <div className="sidebar-promo"><div className="promo-spark">✳</div><strong>Better spaces start here.</strong><p>Every report is a step toward a safer, smarter campus.</p><button type="button" onClick={openNew}>Report a problem <span>↗</span></button></div>
          <div className="team-profile"><div className="team-avatar">CF</div><div><strong>Campus team</strong><small>Issue management</small></div><span className="profile-dots">•••</span></div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="crumb-sep">/</span><strong>Overview</strong></div><div className="topbar-actions"><span className="system-status"><i></i> CampusFix workspace</span><button className="button button-primary" type="button" onClick={openNew}><span className="button-plus">＋</span> Report an issue</button></div></header>
        <section className="page-heading"><div><div className="overline"><span className="overline-line"></span> CAMPUS OPERATIONS</div><h1>Good things happen<br className="mobile-break"/> when we <span>fix things.</span></h1><p>One clear place to raise campus issues, track progress, and make everyday spaces better.</p></div><div className="heading-date"><div className="date-icon">◷</div><div><strong>Stay in the loop</strong><span>Track every report to resolution</span></div></div></section>
        <section className="hero-strip"><div className="hero-copy"><span className="hero-tag"><span></span> A BETTER CAMPUS, TOGETHER</span><h2>Your report makes<br/>a real difference.</h2><p>See a problem? Tell us what’s happening. The campus team will take it from there.</p><button type="button" className="hero-button" onClick={openNew}>Create a new report <span>↗</span></button></div><div className="hero-visual" aria-hidden="true"><div className="orb orb-one"></div><div className="orb orb-two"></div><div className="visual-grid"></div><div className="campus-building"><div className="building-roof"></div><div className="building-top"><i></i><i></i><i></i><i></i></div><div className="building-base"><i></i><i></i><i></i><i></i><i></i></div><div className="building-door"></div></div><div className="floating-card card-check"><span>✓</span><div><b>Issue resolved</b><small>Campus is improving</small></div></div><div className="floating-card card-spark"><span>✦</span><div><b>Community powered</b><small>One fix at a time</small></div></div></div></section>

        {notice && <div className="toast success-toast" role="status"><span>✓</span>{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></div>}
        {error && <div className="alert-banner" role="alert"><span className="alert-symbol">!</span><div><strong>Something needs attention</strong><p>{error}</p></div><button type="button" onClick={load}>Retry</button><button type="button" className="dismiss-alert" aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}

        <section className="stats-grid" aria-label="Issue summary">
          <Stat label="TOTAL REPORTS" value={counts.total} note="All reports received" icon="▤" tone="blue" />
          <Stat label="OPEN ISSUES" value={counts.open} note="Waiting for action" icon="◷" tone="amber" />
          <Stat label="IN PROGRESS" value={counts.progress} note="Being worked on" icon="↗" tone="violet" />
          <Stat label="RESOLVED" value={counts.resolved} note="Successfully fixed" icon="✓" tone="green" />
        </section>

        <section className="workspace-grid" id="reports"><div className="reports-card surface-card"><div className="section-heading"><div><div className="section-kicker">LIVE TRACKER</div><h2>Issue reports <span className="heading-count">{issues.length}</span></h2><p>Manage campus requests from submission to resolution.</p></div><button type="button" className="button button-outline" onClick={exportCSV}><span>↓</span> Export CSV</button></div>
          <div className="toolbar"><label className="search-box"><span className="search-icon">⌕</span><input aria-label="Search issue reports" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports, locations, people..."/><kbd>⌕</kbd></label><select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option></select><select aria-label="Filter by category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
          {loading ? <div className="empty-state"><div className="loader"></div><strong>Loading your reports</strong><p>Connecting to the campus issue tracker…</p></div> : filtered.length === 0 ? <div className="empty-state"><div className="empty-illustration">⌕</div><strong>{issues.length ? 'No matching reports' : 'Your campus story starts here'}</strong><p>{issues.length ? 'Try changing your search or filters.' : 'Be the first to report an issue and help improve your campus.'}</p><button type="button" className="button button-primary" onClick={openNew}>＋ Report an issue</button></div> : <div className="table-scroll"><table className="issues-table"><thead><tr><th>ISSUE DETAILS</th><th>LOCATION</th><th>PRIORITY</th><th>STATUS</th><th>DATE</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((issue) => <tr key={issue._id}><td><div className="issue-cell"><span className={`category-symbol ${categoryTone(issue.category)}`}>{categoryIcon(issue.category)}</span><div><strong>{issue.title}</strong><small>{issue.category} <span>·</span> {issue.reporterName}</small></div></div></td><td><span className="location-cell">⌖ {issue.location}</span></td><td><span className={`priority-pill ${String(issue.priority || 'Medium').toLowerCase()}`}><i></i>{issue.priority || 'Medium'}</span></td><td><select aria-label={`Status for ${issue.title}`} className={`status-pill ${statusClass(issue.status)}`} value={issue.status || 'Open'} onChange={(e) => changeStatus(issue, e.target.value)}><option>Open</option><option>In Progress</option><option>Resolved</option></select></td><td><span className="date-cell">{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span></td><td><div className="row-actions"><button type="button" title="Edit report" aria-label={`Edit ${issue.title}`} onClick={() => openEdit(issue)}>✎</button><button type="button" title="Delete report" aria-label={`Delete ${issue.title}`} onClick={() => remove(issue)}>×</button></div></td></tr>)}</tbody></table></div>}
          <div className="table-footer"><span>Showing <strong>{filtered.length}</strong> of <strong>{issues.length}</strong> reports</span><button type="button" onClick={load}>↻ Refresh data</button></div>
        </div>

        <aside className="insights-column"><div className="surface-card attention-card"><div className="insight-heading"><div><div className="section-kicker">PRIORITY WATCH</div><h3>Needs attention</h3></div><span className="attention-icon">!</span></div><p className="insight-subtitle">Urgent issues that are still unresolved.</p>{counts.urgent > 0 ? <div className="attention-content urgent-content"><div className="attention-number">{counts.urgent}</div><div><strong>Urgent {counts.urgent === 1 ? 'issue' : 'issues'}</strong><span>Need a closer look</span></div><button type="button" onClick={() => { setStatusFilter('All statuses'); setSearch(''); setCategoryFilter('All categories'); document.getElementById('reports')?.scrollIntoView({ behavior: 'smooth' }); }}>Review ↗</button></div> : <div className="attention-content calm-content"><span className="calm-check">✓</span><div><strong>All clear for now</strong><span>No urgent unresolved reports.</span></div></div>}</div>
          <div className="surface-card category-card"><div className="insight-heading"><div><div className="section-kicker">CAMPUS PULSE</div><h3>Reports by category</h3></div><span className="pulse-icon">◌</span></div><p className="insight-subtitle">What your campus community is reporting.</p>{categories.filter((category) => issues.some((issue) => issue.category === category)).length === 0 ? <div className="category-empty"><span>▦</span><p>Category insights will appear here once reports come in.</p></div> : categories.filter((category) => issues.some((issue) => issue.category === category)).map((category) => { const count = issues.filter((issue) => issue.category === category).length; return <div className="category-row" key={category}><div className="category-row-label"><span>{category}</span><strong>{count}</strong></div><div className="progress-track"><span style={{ width: `${Math.max(7, (count / issues.length) * 100)}%` }}></span></div></div>; })}</div>
          <div className="help-card"><span className="help-icon">✳</span><div><strong>Help us help you</strong><p>Add a clear location and description so the right team can fix the issue faster.</p></div></div>
        </aside></section>
        <footer className="app-footer"><span>© {new Date().getFullYear()} CampusFix</span><span>Made for a better campus <b>✳</b></span></footer>
      </main>

      {modal && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModal(false); }}><section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title"><div className="modal-banner"><div className="modal-brand-icon">✳</div><button type="button" className="modal-close" aria-label="Close report form" onClick={() => !saving && setModal(false)} disabled={saving}>×</button><div className="modal-eyebrow">CAMPUSFIX · ISSUE DESK</div><h2 id="report-modal-title">{editing ? 'Update your report' : 'Let’s fix that.'}</h2><p>{editing ? 'Make changes to this campus issue.' : 'Tell us what needs attention. We’ll make sure it gets to the right team.'}</p></div><form className="report-form" onSubmit={save}><div className="form-progress"><span></span><span></span><span></span><small>ISSUE DETAILS</small></div><div className="form-grid"><label className="field-full">Issue title <em>*</em><input name="title" required maxLength={120} value={form.title} onChange={updateField} placeholder="e.g. Projector not working in Lab 2" autoFocus /></label><label>Category <em>*</em><select name="category" required value={form.category} onChange={updateField}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Priority <em>*</em><select name="priority" required value={form.priority} onChange={updateField}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label><label className="field-full">Location <em>*</em><input name="location" required maxLength={180} value={form.location} onChange={updateField} placeholder="Building, floor, room number or area" /></label><label className="field-full">Description <em>*</em><textarea name="description" required rows={4} maxLength={1200} value={form.description} onChange={updateField} placeholder="What happened? Include any details that could help resolve it." /></label><div className="field-divider field-full"><span>YOUR DETAILS</span><i></i></div><label>Your name <em>*</em><input name="reporterName" required maxLength={100} value={form.reporterName} onChange={updateField} placeholder="Full name" /></label><label>Email address <em>*</em><input name="reporterEmail" type="email" required maxLength={180} value={form.reporterEmail} onChange={updateField} placeholder="you@college.edu" /></label></div>{error && <div className="form-error" role="alert">{error}</div>}<div className="modal-actions"><span><em>*</em> Required fields</span><button type="button" className="button button-outline" onClick={() => !saving && setModal(false)} disabled={saving}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? <><span className="button-spinner"></span> Submitting…</> : <>{editing ? 'Save changes' : 'Submit report'} <span>↗</span></>}</button></div></form></section></div>}
    </div>
  );
}

function Stat({ label, value, note, icon, tone }) { return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value.toLocaleString()}</div><div className="stat-note"><span className="note-dot"></span>{note}</div><div className={`stat-accent ${tone}`}></div></article>; }
function statusClass(status) { return String(status || 'Open').toLowerCase().replaceAll(' ', '-'); }
function categoryTone(category) { return ({ Classroom: 'tone-blue', Laboratory: 'tone-violet', 'Wi-Fi / IT': 'tone-cyan', Electrical: 'tone-amber', Cleanliness: 'tone-green', Furniture: 'tone-rose', 'Water / Plumbing': 'tone-cyan', Safety: 'tone-rose', Other: 'tone-violet' })[category] || 'tone-blue'; }
function categoryIcon(category) { return ({ Classroom: '▦', Laboratory: '⚗', 'Wi-Fi / IT': '⌁', Electrical: 'ϟ', Cleanliness: '✳', Furniture: '▤', 'Water / Plumbing': '≈', Safety: '盾', Other: '◈' })[category] || '◈'; }
export default App;
