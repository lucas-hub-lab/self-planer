import React, { useState, useEffect } from 'react';
import { TODAY, CATEGORIES } from './utils';
import TodoList from './components/TodoList';
import CalendarReminders from './components/CalendarReminders';
import QuickNotes from './components/QuickNotes';
import GeneralNotes from './components/GeneralNotes';
import AIAssistant from './components/AIAssistant';
import LoginPage from './components/LoginPage';
import PasswordVault from './components/PasswordVault';
import DailyView from './components/DailyView';
import RecurringTasks from './components/RecurringTasks';
import MonthView from './components/MonthView';
import WeeklyReview from './components/WeeklyReview';
import Meetings from './components/Meetings';
import Projects from './components/Projects';
import { fbLoad, fbSave, onAuthStateChanged, signOut, routinesLoad, routinesSave } from './firebase';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');

  const [todos, setTodos] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [quickNotes, setQuickNotes] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [completedToday, setCompletedToday] = useState([]);
  const [completedThisWeek, setCompletedThisWeek] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingRemId, setEditingRemId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);

  const [todoText, setTodoText] = useState('');
  const [todoPrio, setTodoPrio] = useState('mid');
  const [todoCat, setTodoCat] = useState('VN');
  const [todoDate, setTodoDate] = useState('');
  const [todoNote, setTodoNote] = useState('');

  const [eTodoText, setETodoText] = useState('');
  const [eTodoPrio, setETodoPrio] = useState('mid');
  const [eTodoCat, setETodoCat] = useState('VN');
  const [eTodoDate, setETodoDate] = useState('');
  const [eTodoNote, setETodoNote] = useState('');

  const [eRemText, setERemText] = useState('');
  const [eRemFrom, setERemFrom] = useState('');
  const [eRemTo, setERemTo] = useState('');
  const [eRemNote, setERemNote] = useState('');

  const [eNoteTitle, setENoteTitle] = useState('');
  const [eNoteBody, setENoteBody] = useState('');

  const [savedDot, setSavedDot] = useState(false);
  const [syncBadge, setSyncBadge] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setTodos([]); setReminders([]); setNotes([]); setQuickNotes([]); setLoaded(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const uid = user.uid;
      const [t, r, n, q, rec, mtg, prj, cRout] = await Promise.all([
        fbLoad(uid, 'todos'),
        fbLoad(uid, 'reminders'),
        fbLoad(uid, 'notes'),
        fbLoad(uid, 'quicknotes'),
        fbLoad(uid, 'recurring'),
        fbLoad(uid, 'meetings'),
        fbLoad(uid, 'projects'),
        routinesLoad(uid)
      ]);
      setTodos(t ?? []);
      setReminders(r ?? []);
      setNotes(n ?? []);
      setQuickNotes(q ?? []);
      setRecurring(rec ?? []);
      setMeetings(mtg ?? []);
      setProjects(prj ?? []);

      const getWeekKey = () => {
        const d = new Date(); const day = d.getDay();
        const mon = new Date(d);
        mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
        return `${mon.getFullYear()}-W${String(mon.getMonth()+1).padStart(2,'0')}${String(mon.getDate()).padStart(2,'0')}`;
      };
      const weekKey = getWeekKey();
      let tToday = [], tWeek = [];

      if (cRout) {
        if (cRout.todayDate === TODAY) tToday = cRout.today || [];
        if (cRout.weekKey === weekKey) tWeek = cRout.week || [];
      } else {
        if (localStorage.getItem('completed_today_date') === TODAY) {
          try { tToday = JSON.parse(localStorage.getItem('completed_today') || '[]'); } catch {}
        }
        if (localStorage.getItem('completed_week_key') === weekKey) {
          try { tWeek = JSON.parse(localStorage.getItem('completed_this_week') || '[]'); } catch {}
        }
      }

      setCompletedToday(tToday);
      setCompletedThisWeek(tWeek);
      localStorage.setItem('completed_today_date', TODAY);
      localStorage.setItem('completed_today', JSON.stringify(tToday));
      localStorage.setItem('completed_week_key', weekKey);
      localStorage.setItem('completed_this_week', JSON.stringify(tWeek));
      setLoaded(true);
    };
    loadData();
  }, [user]);

  const flashSaved = () => {
    setSavedDot(true); setTimeout(() => setSavedDot(false), 1600);
    setSyncBadge(true); setTimeout(() => setSyncBadge(false), 2000);
  };

  useEffect(() => { if (!loaded || !user) return; fbSave(user.uid, 'todos', todos); flashSaved(); }, [todos, loaded]);
  useEffect(() => { if (!loaded || !user) return; fbSave(user.uid, 'reminders', reminders); flashSaved(); }, [reminders, loaded]);
  useEffect(() => { if (!loaded || !user) return; fbSave(user.uid, 'notes', notes); flashSaved(); }, [notes, loaded]);
  useEffect(() => { if (!loaded || !user) return; fbSave(user.uid, 'quicknotes', quickNotes); flashSaved(); }, [quickNotes, loaded]);
  useEffect(() => { if (!loaded || !user) return; fbSave(user.uid, 'recurring', recurring); }, [recurring, loaded]);
  useEffect(() => { if (!loaded || !user) return; fbSave(user.uid, 'meetings', meetings); flashSaved(); }, [meetings, loaded]);
  useEffect(() => { if (!loaded || !user) return; fbSave(user.uid, 'projects', projects); flashSaved(); }, [projects, loaded]);

  useEffect(() => {
    if (!loaded || !user) return;
    localStorage.setItem('completed_today', JSON.stringify(completedToday));
    localStorage.setItem('completed_this_week', JSON.stringify(completedThisWeek));
    const getWeekKey = () => {
      const d = new Date(); const day = d.getDay();
      const mon = new Date(d);
      mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      return `${mon.getFullYear()}-W${String(mon.getMonth()+1).padStart(2,'0')}${String(mon.getDate()).padStart(2,'0')}`;
    };
    routinesSave(user.uid, {
      todayDate: TODAY, today: completedToday,
      weekKey: getWeekKey(), week: completedThisWeek
    });
  }, [completedToday, completedThisWeek, loaded]);

  const handleAddTodo = () => {
    const txt = todoText.trim();
    if (!txt) return;
    setTodos([{ id: Date.now(), text: txt, prio: todoPrio, cat: todoCat, date: todoDate, note: todoNote.trim(), done: false, created: TODAY }, ...todos]);
    setTodoText(''); setTodoDate(''); setTodoNote('');
  };

  const openTodoEdit = (id) => {
    const t = todos.find(x => x.id === id);
    if (!t) return;
    setEditingTodoId(id);
    setETodoText(t.text); setETodoPrio(t.prio); setETodoCat(t.cat); setETodoDate(t.date || ''); setETodoNote(t.note || '');
  };

  const saveTodoEdit = () => {
    const txt = eTodoText.trim();
    if (!txt || !editingTodoId) return;
    setTodos(todos.map(t => t.id === editingTodoId ? { ...t, text: txt, prio: eTodoPrio, cat: eTodoCat, date: eTodoDate, note: eTodoNote.trim() } : t));
    setEditingTodoId(null);
  };

  const openRemEdit = (id) => {
    const r = reminders.find(x => x.id === id);
    if (!r) return;
    setEditingRemId(id);
    setERemText(r.text); setERemFrom(r.from); setERemTo(r.to); setERemNote(r.note || '');
  };

  const saveRemEdit = () => {
    const txt = eRemText.trim();
    if (!txt || !editingRemId) return;
    setReminders(reminders.map(r => r.id === editingRemId ? { ...r, text: txt, from: eRemFrom, to: (eRemTo && eRemTo >= eRemFrom) ? eRemTo : eRemFrom, note: eRemNote.trim() } : r));
    setEditingRemId(null);
  };

  const openNoteEdit = (id) => {
    setEditingNoteId(id || 'new');
    if (id) {
      const n = notes.find(x => x.id === id);
      setENoteTitle(n.title); setENoteBody(n.body || '');
    } else {
      setENoteTitle(''); setENoteBody('');
    }
  };

  const saveNoteEdit = () => {
    const title = eNoteTitle.trim();
    if (!title) return;
    if (editingNoteId === 'new') {
      setNotes([{ id: Date.now(), title, body: eNoteBody.trim(), created: TODAY, updated: TODAY }, ...notes]);
    } else {
      setNotes(notes.map(n => n.id === editingNoteId ? { ...n, title, body: eNoteBody.trim(), updated: TODAY } : n));
    }
    setEditingNoteId(null);
  };

  const handleTransferProjectTask = (taskText, projectName, type = 'todo') => {
    const text = `[${projectName || 'Projekt'}] ${taskText}`;
    setActiveTab('tasks');
    setTimeout(() => {
      if (type === 'reminder') handleQuickToReminder(text);
      else handleQuickToTodo(text);
    }, 150);
  };

  const handleQuickToTodo = (text) => {
    setTodoText(text);
    const inp = document.getElementById('inp-text');
    if (inp) { inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); inp.focus(); inp.style.borderColor = 'var(--indigo)'; setTimeout(() => inp.style.borderColor = '', 1500); }
  };
  const handleQuickToReminder = (text) => {
    window.dispatchEvent(new CustomEvent('set-reminder-text', { detail: text }));
  };
  const handleQuickToNote = (text) => {
    setEditingNoteId('new'); setENoteTitle(''); setENoteBody(text);
  };

  const dayStr = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  const weekdayStr = new Date().toLocaleDateString('de-DE', { weekday: 'long' });

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="dots">
          <div className="dot"></div><div className="dot"></div><div className="dot"></div>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <div className="topbar-kicker">{dayStr}</div>
          <div className="topbar-title">{{
            today: 'Heute',
            tasks: 'Aufgaben',
            recurring: 'Routinen',
            meetings: 'Meetings',
            projects: 'Projekte',
            calendar: 'Kalender',
            review: 'Review',
            notes: 'Allgemeines',
            vault: 'Passwörter',
          }[activeTab] || 'Aufgaben'}</div>
        </div>
        <div className="topbar-right">
          <div className="topbar-date">{weekdayStr}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeTab === 'tasks' && <span className={`sync-badge ${syncBadge ? 'show' : ''}`}>Synchronisiert ✓</span>}
            {activeTab === 'tasks' && <div className={`saved-dot ${savedDot ? 'show' : ''}`}></div>}
            <span className="topbar-email" style={{ fontSize: '12px', color: 'var(--text-3)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </span>
            <button onClick={signOut}
              style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: '4px 10px', transition: 'all .15s', fontFamily: "'Inter', sans-serif" }}
              onMouseOver={e => { e.target.style.color = 'var(--red)'; e.target.style.borderColor = '#FECACA'; }}
              onMouseOut={e => { e.target.style.color = 'var(--text-3)'; e.target.style.borderColor = 'var(--border)'; }}>
              Abmelden
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0', padding: '8px 0 0', borderBottom: '1px solid var(--border)', marginBottom: '-1px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {[
          { id: 'today',     label: '☀ Heute' },
          { id: 'tasks',     label: '✓ Aufgaben' },
          { id: 'recurring', label: '🔄 Routinen' },
          { id: 'meetings',  label: '🗓 Meetings' },
          { id: 'projects',  label: '🗂 Projekte' },
          { id: 'calendar',  label: '📅 Kalender' },
          { id: 'review',    label: '📊 Review' },
          { id: 'notes',     label: '📝 Allgemeines' },
          { id: 'vault',     label: '🔐 Passwörter' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '8px 16px', border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--text)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.id ? 500 : 400, color: activeTab === tab.id ? 'var(--text)' : 'var(--text-3)', fontFamily: "'Inter', sans-serif", transition: 'all .15s', marginBottom: '-1px', whiteSpace: 'nowrap' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'vault'     && <div style={{ marginTop: '28px' }}><PasswordVault userId={user.uid} /></div>}
      {activeTab === 'today'     && <div style={{ marginTop: '24px' }}><DailyView todos={todos} setTodos={setTodos} reminders={reminders} recurring={recurring} completedToday={completedToday} setCompletedToday={setCompletedToday} completedThisWeek={completedThisWeek} setCompletedThisWeek={setCompletedThisWeek} /></div>}
      {activeTab === 'recurring' && <div style={{ marginTop: '24px' }}><RecurringTasks recurring={recurring} setRecurring={setRecurring} completedToday={completedToday} setCompletedToday={setCompletedToday} completedThisWeek={completedThisWeek} setCompletedThisWeek={setCompletedThisWeek} /></div>}
      {activeTab === 'calendar'  && <div style={{ marginTop: '24px' }}><MonthView todos={todos} reminders={reminders} recurring={recurring} /></div>}
      {activeTab === 'review'    && <div style={{ marginTop: '24px' }}><WeeklyReview userId={user.uid} todos={todos} /></div>}
      {activeTab === 'meetings'  && <div style={{ marginTop: '24px' }}><Meetings meetings={meetings} setMeetings={setMeetings} userId={user.uid} /></div>}
      {activeTab === 'projects'  && <div style={{ marginTop: '24px' }}><Projects projects={projects} setProjects={setProjects} userId={user.uid} onTransferTask={handleTransferProjectTask} /></div>}

      {activeTab === 'notes' && (
        <div style={{ marginTop: '24px', maxWidth: '800px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '26px', fontWeight: 400 }}>Allgemeines</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>Notizen, Ideen, Informationen</div>
            </div>
            <button className="add-submit" onClick={() => openNoteEdit(null)}>+ Neuer Beitrag</button>
          </div>
          <GeneralNotes notes={notes} setNotes={setNotes} onOpenNoteModal={openNoteEdit} />
        </div>
      )}

      {activeTab === 'tasks' && (<>
        <div className="stats">
          <div className="stat"><div className="stat-n">{todos.filter(t => !t.done).length}</div><div className="stat-l">Offen</div></div>
          <div className="stat"><div className="stat-n" style={{ color: 'var(--amber)' }}>{todos.filter(t => !t.done && t.date === TODAY).length}</div><div className="stat-l">Heute</div></div>
          <div className="stat"><div className="stat-n" style={{ color: 'var(--red)' }}>{todos.filter(t => !t.done && t.date && t.date < TODAY).length}</div><div className="stat-l">Überfällig</div></div>
          <div className="stat"><div className="stat-n" style={{ color: 'var(--green)' }}>{todos.filter(t => t.done).length}</div><div className="stat-l">Erledigt</div></div>
        </div>

        <div className="section-label">Neue Aufgabe</div>
        <div className="add-main">
          <input id="inp-text" className="add-input" placeholder="Was steht an?" value={todoText} onChange={e => setTodoText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTodo()} />
          <button className="add-submit" onClick={handleAddTodo}>Hinzufügen</button>
        </div>
        <div className="add-meta">
          <select className="meta-sel" value={todoPrio} onChange={e => setTodoPrio(e.target.value)}>
            <option value="high">Hoch</option><option value="mid">Mittel</option><option value="low">Niedrig</option>
          </select>
          <select className="meta-sel" value={todoCat} onChange={e => setTodoCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" className="meta-sel" style={{ color: 'var(--text-2)' }} value={todoDate} onChange={e => setTodoDate(e.target.value)} />
        </div>
        <textarea className="note-inp" rows="2" placeholder="Notizen (optional)…" value={todoNote} onChange={e => setTodoNote(e.target.value)}></textarea>

        <div className="two-col">
          <div className="col-left"><TodoList todos={todos} setTodos={setTodos} onOpenEdit={openTodoEdit} /></div>
          <div className="col-right"><CalendarReminders reminders={reminders} setReminders={setReminders} onOpenRemEdit={openRemEdit} /></div>
          <div className="col-quick">
            <QuickNotes quickNotes={quickNotes} setQuickNotes={setQuickNotes} onAddTodo={handleQuickToTodo} onAddReminder={handleQuickToReminder} onAddNote={handleQuickToNote} />
          </div>
          <AIAssistant todos={todos} />
        </div>
      </>)}

      {/* Todo Edit Modal */}
      {editingTodoId && (
        <div className="modal-backdrop open" onClick={(e) => e.target === e.currentTarget && setEditingTodoId(null)}>
          <div className="modal">
            <div className="modal-title">Aufgabe bearbeiten</div>
            <div className="modal-field"><div className="modal-label">Aufgabe</div><input className="modal-inp" type="text" value={eTodoText} onChange={e => setETodoText(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveTodoEdit()} /></div>
            <div className="modal-grid">
              <div className="modal-field" style={{ marginBottom: 0 }}><div className="modal-label">Priorität</div>
                <select className="modal-inp" style={{ cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }} value={eTodoPrio} onChange={e => setETodoPrio(e.target.value)}>
                  <option value="high">Hoch</option><option value="mid">Mittel</option><option value="low">Niedrig</option>
                </select>
              </div>
              <div className="modal-field" style={{ marginBottom: 0 }}><div className="modal-label">Kategorie</div>
                <select className="modal-inp" style={{ cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }} value={eTodoCat} onChange={e => setETodoCat(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-field"><div className="modal-label">Fälligkeitsdatum</div><input className="modal-inp" type="date" value={eTodoDate} onChange={e => setETodoDate(e.target.value)} /></div>
            <div className="modal-field"><div className="modal-label">Notizen</div><textarea className="modal-inp" rows="3" style={{ resize: 'none', lineHeight: '1.55' }} value={eTodoNote} onChange={e => setETodoNote(e.target.value)}></textarea></div>
            <div className="modal-actions"><button className="btn-cancel" onClick={() => setEditingTodoId(null)}>Abbrechen</button><button className="btn-save" onClick={saveTodoEdit}>Speichern</button></div>
          </div>
        </div>
      )}

      {/* Reminder Edit Modal */}
      {editingRemId && (
        <div className="modal-backdrop open" onClick={(e) => e.target === e.currentTarget && setEditingRemId(null)}>
          <div className="modal">
            <div className="modal-title">Erinnerung bearbeiten</div>
            <div className="modal-field"><div className="modal-label">Titel</div><input className="modal-inp" type="text" placeholder="Erinnerung…" value={eRemText} onChange={e => setERemText(e.target.value)} /></div>
            <div className="modal-grid">
              <div className="modal-field" style={{ marginBottom: 0 }}><div className="modal-label">Von</div><input className="modal-inp" type="date" value={eRemFrom} onChange={e => setERemFrom(e.target.value)} /></div>
              <div className="modal-field" style={{ marginBottom: 0 }}><div className="modal-label">Bis</div><input className="modal-inp" type="date" value={eRemTo} onChange={e => setERemTo(e.target.value)} /></div>
            </div>
            <div className="modal-field" style={{ marginTop: '12px' }}><div className="modal-label">Notizen</div><textarea className="modal-inp" rows="3" style={{ resize: 'none', lineHeight: '1.55' }} value={eRemNote} onChange={e => setERemNote(e.target.value)}></textarea></div>
            <div className="modal-actions"><button className="btn-cancel" onClick={() => setEditingRemId(null)}>Abbrechen</button><button className="btn-save" onClick={saveRemEdit}>Speichern</button></div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {editingNoteId && (
        <div className="modal-backdrop open" onClick={(e) => e.target === e.currentTarget && setEditingNoteId(null)}>
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div className="modal-title">{editingNoteId === 'new' ? 'Neuer Beitrag' : 'Beitrag bearbeiten'}</div>
            <div className="modal-field"><div className="modal-label">Titel</div><input className="modal-inp" type="text" placeholder="Titel eingeben…" value={eNoteTitle} onChange={e => setENoteTitle(e.target.value)} /></div>
            <div className="modal-field"><div className="modal-label">Notizen</div><textarea className="modal-inp" rows="7" style={{ resize: 'vertical', lineHeight: '1.6', minHeight: '120px' }} value={eNoteBody} onChange={e => setENoteBody(e.target.value)}></textarea></div>
            <div className="modal-actions"><button className="btn-cancel" onClick={() => setEditingNoteId(null)}>Abbrechen</button><button className="btn-save" onClick={saveNoteEdit}>Speichern</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
