import React, { useState, useRef } from 'react';
import { uploadFile, deleteFile } from '../firebase';

// ─── Constants ───────────────────────────────────────────────────────────────

const PROJECT_COLORS = [
  { label: 'Indigo',  value: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
  { label: 'Blau',    value: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { label: 'Grün',    value: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  { label: 'Amber',   value: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { label: 'Rot',     value: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  { label: 'Violett', value: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { label: 'Rose',    value: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' },
  { label: 'Grau',    value: '#475569', bg: '#F8FAFC', border: '#CBD5E1' },
];

const STATUS_OPTS = [
  { value: 'active',   label: 'Aktiv',      color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  { value: 'paused',   label: 'Pausiert',   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { value: 'done',     label: 'Abgeschlossen', color: '#475569', bg: '#F8FAFC', border: '#CBD5E1' },
  { value: 'archived', label: 'Archiviert', color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB' },
];

const PRIO_LABELS = {
  high: { label: 'Hoch', color: 'var(--red)' },
  mid:  { label: 'Mittel', color: 'var(--orange)' },
  low:  { label: 'Niedrig', color: 'var(--green)' },
};

const statusOf = (v) => STATUS_OPTS.find(o => o.value === v) || STATUS_OPTS[0];
const colorOf  = (v) => PROJECT_COLORS.find(c => c.value === v) || PROJECT_COLORS[0];

const FILE_ICONS = {
  'application/pdf': '📄', 'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint': '📑',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📑',
  'image/png': '🖼', 'image/jpeg': '🖼', 'image/gif': '🖼', 'image/webp': '🖼',
  'text/plain': '📃',
};
const fileIcon = (type) => FILE_ICONS[type] || '📎';
const fmtSize  = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

const fmtTs = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};
const fmtDateStr = (str) => {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const INP = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
  borderRadius: '8px', background: 'var(--bg)', color: 'var(--text)',
  fontSize: '13px', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
};

const EMPTY_PROJECT = {
  name: '', description: '', status: 'active', color: '#4F46E5', priority: 'mid',
  startDate: '', endDate: '', owner: '', team: '',
  currentStatus: '', statusUpdatedAt: null, statusHistory: [],
  notes: '', docs: [], tasks: [], risks: []
};

// ─── Small UI Helpers ───────────────────────────────────────────────────────────

function ProgressBar({ tasks }) {
  if (!tasks || tasks.length === 0) return null;
  const done = tasks.filter(t => t.done).length;
  const pct = Math.round((done / tasks.length) * 100);
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase' }}>
        <span>Fortschritt</span><span>{pct}%</span>
      </div>
      <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'currentColor', borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// ─── Document upload panel ────────────────────────────────────────────────────

function DocPanel({ project, userId, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState('');
  const inputRef = useRef();
  const docs = project.docs || [];

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { setError('Max. 30 MB pro Datei.'); return; }
    setError(''); setUploading(true); setProgress(0);
    try {
      const meta = await uploadFile(userId, 'projects', String(project.id), file, setProgress);
      onUpdate({ docs: [...docs, meta] });
    } catch (err) {
      setError('Upload fehlgeschlagen: ' + err.message);
    } finally {
      setUploading(false); setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm(`„${doc.name}" löschen?`)) return;
    await deleteFile(doc.path);
    onUpdate({ docs: docs.filter(d => d.path !== doc.path) });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          📎 Dokumente ({docs.length})
        </div>
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          style={{ fontSize: '12px', fontWeight: 500, padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          {uploading ? `${progress}% …` : '+ Hochladen'}
        </button>
        <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleFile}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif,.webp,.zip,.csv" />
      </div>

      {uploading && (
        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: project.color || '#4F46E5', borderRadius: '2px', transition: 'width .2s' }} />
        </div>
      )}
      {error && <div style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '8px' }}>{error}</div>}

      {docs.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
          Noch keine Dokumente — klicke auf „+ Hochladen".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {docs.map(d => (
            <div key={d.path} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{fileIcon(d.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={d.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: 'var(--text)', textDecoration: 'none', fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.name}
                </a>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '1px' }}>{fmtSize(d.size)}</div>
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '14px', color: 'var(--text-3)', padding: '4px 6px', textDecoration: 'none', borderRadius: '4px' }} title="Herunterladen">⬇</a>
              <button onClick={() => handleDelete(d)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px', padding: '2px', lineHeight: 1 }}
                onMouseOver={e => e.target.style.color = 'var(--red)'}
                onMouseOut={e => e.target.style.color = 'var(--text-3)'}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Status Update Panel ──────────────────────────────────────────────────────

function CurrentStatusPanel({ project, onUpdate }) {
  const [val, setVal] = useState(project.currentStatus || '');
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    const ts = new Date().toISOString();
    const newHistory = [{ text: val, ts }, ...(project.statusHistory || [])].slice(0, 10); // Keep last 10 entries
    onUpdate({ currentStatus: val, statusUpdatedAt: ts, statusHistory: newHistory });
    setEditing(false);
  };

  const ts = project.statusUpdatedAt;
  const accentColor = project.color || '#4F46E5';
  const history = project.statusHistory || [];

  return (
    <div style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderLeft: `3px solid ${accentColor}`, borderRadius: '10px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>📌 Aktueller Stand</div>
          </div>
          {ts && !editing && (
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>
              Zuletzt aktualisiert: {fmtTs(ts)}
            </div>
          )}
        </div>
        {!editing ? (
          <button onClick={() => { setVal(''); setEditing(true); }}
            style={{ fontSize: '12px', fontWeight: 500, padding: '5px 12px', borderRadius: '6px', border: `1px solid ${accentColor}33`, background: colorOf(accentColor).bg, color: accentColor, cursor: 'pointer', fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
            Neuen Stand eintragen
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button onClick={() => { setEditing(false); setVal(project.currentStatus || ''); }}
              style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              Abbrechen
            </button>
            <button onClick={handleSave} disabled={!val.trim()}
              style={{ fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '6px', border: 'none', background: val.trim() ? accentColor : 'var(--border)', color: '#fff', cursor: val.trim() ? 'pointer' : 'default', fontFamily: "'Inter', sans-serif" }}>
              Stand sichern
            </button>
          </div>
        )}
      </div>
      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        {editing ? (
          <textarea
            autoFocus value={val} onChange={e => setVal(e.target.value)}
            placeholder="Was ist der aktuelle Stand? Was wurde erledigt, was fehlt, was sind die nächsten Schritte?"
            style={{ ...INP, minHeight: '120px', lineHeight: 1.7, resize: 'vertical', border: `1px solid ${accentColor}66` }}
          />
        ) : project.currentStatus ? (
          <>
            <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{project.currentStatus}</div>
          </>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.6 }}>
            Noch kein Stand eingetragen.<br />
            <button onClick={() => setEditing(true)} style={{ color: accentColor, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: "'Inter', sans-serif", fontStyle: 'normal', marginTop: '4px' }}>
              Jetzt eintragen →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tasks / Checklist Panel ──────────────────────────────────────────────────

function TasksPanel({ project, onUpdate, onTransferTask }) {
  const [tasks, setTasks] = useState(project.tasks || []);
  const [newTask, setNewTask] = useState('');

  const sync = (newTasks) => {
    setTasks(newTasks);
    onUpdate({ tasks: newTasks });
  };

  const handleAdd = (e) => {
    if (e.key === 'Enter' && newTask.trim()) {
      sync([...tasks, { id: Date.now(), text: newTask.trim(), done: false }]);
      setNewTask('');
    }
  };

  const toggle = (id) => sync(tasks.map(t => t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : null } : t));
  const remove = (id) => sync(tasks.filter(t => t.id !== id));

  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          ✅ Aufgaben / Meilensteine
        </div>
        {tasks.length > 0 && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{doneCount}/{tasks.length} erledigt</div>}
      </div>

      <input
        style={{ ...INP, marginBottom: '12px', background: 'var(--bg)' }}
        placeholder="Neue Aufgabe eintragen & Enter drücken..."
        value={newTask}
        onChange={e => setNewTask(e.target.value)}
        onKeyDown={handleAdd}
      />

      {tasks.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
          Unterteile dein Projekt in kleinere Aufgaben.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: project.color || '#4F46E5' }} />
              <div style={{ flex: 1, fontSize: '13px', color: t.done ? 'var(--text-3)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>
                {t.text}
              </div>
              {!t.done && onTransferTask && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => onTransferTask(t.text, project.name, 'todo')} 
                    title="Als Aufgabe einfügen" 
                    style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '6px', fontSize: '11px', fontWeight: 500, padding: '3px 8px', color: 'var(--text)', cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--border)'}
                    onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
                  >
                    📥 Aufgabe
                  </button>
                  <button onClick={() => onTransferTask(t.text, project.name, 'reminder')} 
                    title="Als Erinnerung/Termin eintragen" 
                    style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '6px', fontSize: '11px', fontWeight: 500, padding: '3px 8px', color: 'var(--text)', cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--border)'}
                    onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
                  >
                    📥 Termin
                  </button>
                </div>
              )}
              <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Risks Panel ──────────────────────────────────────────────────────────────

function RiskLogPanel({ project, onUpdate }) {
  const [risks, setRisks] = useState(project.risks || []);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: '', impact: 'mid', protection: '' });

  const sync = (newRisks) => {
    setRisks(newRisks);
    onUpdate({ risks: newRisks });
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    sync([...risks, { id: Date.now(), ...form }]);
    setForm({ title: '', impact: 'mid', protection: '' });
    setFormOpen(false);
  };

  const remove = (id) => sync(risks.filter(r => r.id !== id));

  const impColor = { high: 'var(--red)', mid: 'var(--orange)', low: 'var(--green)' };
  const impLabel = { high: 'Hohes Risiko', mid: 'Mittleres R.', low: 'Geringes R.' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          ⚠️ Risiko-Log
        </div>
        <button onClick={() => setFormOpen(!formOpen)} style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          {formOpen ? 'Abbrechen' : '+ Risiko erfassen'}
        </button>
      </div>

      {formOpen && (
        <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-strong)', marginBottom: '12px' }}>
          <input style={{ ...INP, marginBottom: '8px' }} placeholder="Risiko/Problem (z.B. Budget überschritten)..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select style={{ ...INP, flex: 1 }} value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value })}>
              <option value="high">Hohe Auswirkung/Wkt.</option>
              <option value="mid">Mittlere Auswirkung/Wkt.</option>
              <option value="low">Geringe Auswirkung/Wkt.</option>
            </select>
          </div>
          <input style={{ ...INP, marginBottom: '8px' }} placeholder="Gegenmaßnahme (Plan B)..." value={form.protection} onChange={e => setForm({ ...form, protection: e.target.value })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} style={{ padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Speichern</button>
          </div>
        </div>
      )}

      {risks.length === 0 && !formOpen ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
          Bisher keine Risiken dokumentiert.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {risks.map(r => (
            <div key={r.id} style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: `3px solid ${impColor[r.impact]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{r.title}</div>
                <button onClick={() => remove(r.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '12px' }}>✕</button>
              </div>
              <div style={{ fontSize: '11px', color: impColor[r.impact], marginBottom: '4px' }}>{impLabel[r.impact]}</div>
              {r.protection && <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>↳ Maßnahme: {r.protection}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Timeline / Activity Feed ─────────────────────────────────────────────────

function TimelinePanel({ project }) {
  const history = project.statusHistory || [];
  const completedTasks = (project.tasks || []).filter(t => t.done && t.completedAt);

  const events = [
    // Include the current status as a timeline event if there's no history but there is a current status
    ...(history.length > 0 ? history : (project.currentStatus ? [{ ts: project.statusUpdatedAt || new Date().toISOString(), text: project.currentStatus }] : [])).map(h => ({ type: 'status', ts: h.ts, text: h.text })),
    ...completedTasks.map(t => ({ type: 'task', ts: t.completedAt, text: t.text }))
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts));

  if (events.length === 0) return null;

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '16px', paddingLeft: '8px' }}>
        ⏳ Projekt-Timeline
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '8px' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '15px', width: '2px', background: 'var(--border)' }} />
        
        {events.map((ev, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: ev.type === 'task' ? 'var(--green)' : (project.color || '#4F46E5'), flexShrink: 0, marginTop: '2px', border: '3px solid var(--bg)', outline: '1px solid var(--border)' }} />
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', width: '100%' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px', fontWeight: 500 }}>
                {fmtTs(ev.ts)}{ev.type === 'task' ? ' — Aufgabe erledigt' : ' — Stand aktualisiert'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {ev.type === 'task' ? <span style={{ textDecoration: 'line-through', color: 'var(--text-3)' }}>{ev.text}</span> : ev.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Project Log Notes Panel (Quick Notes) ────────────────────────────────────

function ProjectLogNotesPanel({ project, onUpdate }) {
  const [logs, setLogs] = useState(project.logNotes || []);
  const [text, setText] = useState('');

  const sync = (newLogs) => {
    setLogs(newLogs);
    onUpdate({ logNotes: newLogs });
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    sync([{ id: Date.now(), text: text.trim(), ts: new Date().toISOString() }, ...logs]);
    setText('');
  };

  const remove = (id) => sync(logs.filter(l => l.id !== id));

  return (
    <div style={{ padding: '14px 18px' }}>
      <div style={{ marginBottom: '16px' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Schnellnotiz, Gedanke oder Update festhalten..."
          style={{ ...INP, minHeight: '60px', resize: 'vertical', background: 'var(--bg)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={handleAdd}
            style={{ padding: '6px 14px', background: 'var(--text)', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Hinzufügen
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {logs.map(lg => (
            <div key={lg.id} style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative' }}>
               <button onClick={() => remove(lg.id)} title="Löschen" style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
               <div style={{ fontSize: '13px', color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.5, paddingRight: '16px' }}>{lg.text}</div>
               <div style={{ fontSize: '10px', color: 'var(--text-3)', fontStyle: 'italic', marginTop: '6px' }}>{new Date(lg.ts).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Project Detail View ──────────────────────────────────────────────────────

function ProjectDetail({ project, userId, onUpdate, onBack, onEdit, onTransferTask }) {
  const [notes, setNotes] = useState(project.notes || '');
  const [notesSaved, setNotesSaved] = useState(false);
  const s = statusOf(project.status);

  const saveNotes = () => {
    onUpdate({ notes });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1500);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontFamily: "'Inter', sans-serif", fontSize: '13px', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Alle Projekte
        </button>
        <span style={{ color: 'var(--border-strong)' }}>/</span>
        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{project.name}</span>
      </div>

      {/* Project header */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ height: '6px', background: project.color || '#4F46E5' }} />
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '26px', fontWeight: 400 }}>{project.name}</div>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '6px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
              {PRIO_LABELS[project.priority] && (
                <span style={{ fontSize: '11px', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 9px', color: PRIO_LABELS[project.priority].color }}>{PRIO_LABELS[project.priority].label} Prio</span>
              )}
            </div>
            {project.description && (
              <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, maxWidth: '700px', marginBottom: '12px' }}>{project.description}</div>
            )}
            
            {/* Meta Info Row */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-3)' }}>
              {project.startDate && project.endDate && <span>📅 {fmtDateStr(project.startDate)} - {fmtDateStr(project.endDate)}</span>}
              {project.owner && <span>👤 Owner: <strong style={{ color: 'var(--text-2)', fontWeight: 500 }}>{project.owner}</strong></span>}
              {project.team && <span>👥 Team: {project.team}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={onEdit}
              style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}>
              ⚙️ Projekt bearbeiten
            </button>
          </div>
        </div>
      </div>

      <div className="project-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <CurrentStatusPanel project={project} onUpdate={onUpdate} />

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <TasksPanel project={project} onUpdate={onUpdate} onTransferTask={onTransferTask} />
          </div>
          
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <RiskLogPanel project={project} onUpdate={onUpdate} />
          </div>

          <TimelinePanel project={project} />
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Notes */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>📝 Allgemeine Notizen & Ressourcen</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="Projektziele, Links, Zugangsdaten..."
                style={{ ...INP, minHeight: '160px', lineHeight: 1.7, resize: 'vertical', background: 'var(--bg)', border: '1px solid var(--border-strong)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                {notesSaved && <span style={{ fontSize: '12px', color: 'var(--green)' }}>✓ Gespeichert</span>}
                <button onClick={saveNotes}
                  style={{ padding: '6px 14px', background: project.color || '#4F46E5', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  Speichern
                </button>
              </div>
            </div>
          </div>

          {/* Quick Log Notes */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>⚡ Einzel-Notizen & Updates</div>
            </div>
            <ProjectLogNotesPanel project={project} onUpdate={onUpdate} />
          </div>

          {/* Documents */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>📁 Dokumente</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <DocPanel project={project} userId={userId} onUpdate={onUpdate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card (in the list) ───────────────────────────────────────────────

function ProjectCard({ project, onClick, onDelete }) {
  const s = statusOf(project.status);
  const hasStatus = project.currentStatus && project.currentStatus.trim();
  const ts = project.statusUpdatedAt;
  const prio = PRIO_LABELS[project.priority];

  return (
    <div onClick={onClick} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .15s, border-color .15s', color: 'var(--text)' }}
      onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.06)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ height: '4px', background: project.color || '#4F46E5' }} />
      <div style={{ padding: '16px 18px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
              {prio && <span style={{ fontSize: '10px', color: prio.color, border: `1px solid ${prio.color}44`, borderRadius: '4px', padding: '2px 6px' }}>Prio: {prio.label}</span>}
              {project.startDate && project.endDate && <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{fmtDateStr(project.startDate)} - {fmtDateStr(project.endDate)}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '4px 7px', fontSize: '13px', color: 'var(--text-3)' }}
              onMouseOver={e => { e.target.style.color = 'var(--red)'; e.target.style.background = '#FEF2F2'; }}
              onMouseOut={e => { e.target.style.color = 'var(--text-3)'; e.target.style.background = 'none'; }}>✕</button>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.description}</div>
        )}

        {/* Progress Bar from Tasks */}
        {(project.tasks && project.tasks.length > 0) && (
          <div style={{ color: project.color || '#4F46E5', marginBottom: '12px' }}>
            <ProgressBar tasks={project.tasks} />
          </div>
        )}

        {/* Current status preview */}
        {hasStatus && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--surface)', border: `1px solid var(--border)`, borderLeft: `3px solid ${project.color || '#4F46E5'}`, marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '4px', letterSpacing: '.05em', textTransform: 'uppercase' }}>Letzter Stand</div>
            <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.currentStatus}</div>
            {ts && <div style={{ fontSize: '9px', color: 'var(--text-3)', fontStyle: 'italic', marginTop: '4px' }}>{fmtTs(ts)}</div>}
          </div>
        )}

        {/* Footer Meta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {project.owner && <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>👤 {project.owner}</span>}
            {(project.docs || []).length > 0 && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>📎 {project.docs.length}</span>}
            {(project.risks || []).length > 0 && <span style={{ fontSize: '11px', color: 'var(--red)' }}>⚠️ {project.risks.length}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

function ProjectModal({ editId, projects, onSave, onClose }) {
  const init = editId ? projects.find(p => p.id === editId) : null;
  const [form, setForm] = useState(init
    ? { ...EMPTY_PROJECT, ...init }
    : { ...EMPTY_PROJECT });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

  return (
    <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-title">{editId ? 'Projekt bearbeiten' : 'Neues Projekt'}</div>

        <div className="modal-field">
          <div className="modal-label">Projektname *</div>
          <input style={INP} placeholder="z.B. Morning Briefing Relaunch, Q2 Kampagne…" value={form.name} onChange={f('name')} autoFocus />
        </div>

        <div className="modal-field">
          <div className="modal-label">Ziel & Scope (Beschreibung)</div>
          <textarea style={{ ...INP, minHeight: '60px', resize: 'vertical', lineHeight: 1.6 }}
            placeholder="Was genau soll erreicht werden? Was ist nicht im Scope?" value={form.description} onChange={f('description')} />
        </div>

        <div className="modal-grid">
          <div className="modal-field">
            <div className="modal-label">Priorität</div>
            <select style={{ ...INP, cursor: 'pointer' }} value={form.priority} onChange={f('priority')}>
              {Object.entries(PRIO_LABELS).map(([v, p]) => <option key={v} value={v}>{p.label}</option>)}
            </select>
          </div>
          <div className="modal-field">
            <div className="modal-label">Status</div>
            <select style={{ ...INP, cursor: 'pointer' }} value={form.status} onChange={f('status')}>
              {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="modal-grid">
          <div className="modal-field">
            <div className="modal-label">Startdatum</div>
            <input type="date" style={INP} value={form.startDate} onChange={f('startDate')} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Enddatum (Deadline)</div>
            <input type="date" style={INP} value={form.endDate} onChange={f('endDate')} />
          </div>
        </div>

        <div className="modal-grid">
          <div className="modal-field">
            <div className="modal-label">Projektleiter (Owner)</div>
            <input style={INP} placeholder="z.B. Du, Anna..." value={form.owner} onChange={f('owner')} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Team / Beteiligte</div>
            <input style={INP} placeholder="z.B. IT, Max, Agentur X..." value={form.team} onChange={f('team')} />
          </div>
        </div>

        <div className="modal-field" style={{ marginBottom: 0 }}>
          <div className="modal-label">Projektfarbe</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            {PROJECT_COLORS.map(c => (
              <button key={c.value} onClick={() => setForm(p => ({ ...p, color: c.value }))}
                title={c.label}
                style={{ width: '26px', height: '26px', borderRadius: '50%', background: c.value, border: form.color === c.value ? `2px solid var(--text)` : '2px solid transparent', cursor: 'pointer', outline: form.color === c.value ? `2px solid ${c.value}44` : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '24px' }}>
          <button className="btn-cancel" onClick={onClose}>Abbrechen</button>
          <button className="btn-save" onClick={() => form.name.trim() && onSave(form, editId, today)}>Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Projects({ projects, setProjects, userId, onTransferTask }) {
  const [activeId,  setActiveId]  = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [filter,    setFilter]    = useState('all');

  const selected = projects.find(p => p.id === activeId);

  const openAdd  = () => { setEditId(null);  setShowModal(true); };
  const openEdit = (id) => { setEditId(id); setShowModal(true); };

  const handleSave = (form, eid, today) => {
    if (eid) {
      setProjects(projects.map(p => p.id === eid ? { ...p, ...form } : p));
    } else {
      const newP = { ...form, id: Date.now(), created: today };
      setProjects([newP, ...projects]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Projekt löschen? Alle Checklisten, Risiken und Dokument-Links gehen unwiderruflich verloren.')) return;
    setProjects(projects.filter(p => p.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const handleUpdate = (id, patch) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  // Stats
  const activeCount   = projects.filter(p => p.status === 'active').length;
  const highPrioCount = projects.filter(p => p.priority === 'high' && p.status === 'active').length;
  const totalTasks    = projects.reduce((s, p) => s + (p.tasks || []).filter(t => !t.done).length, 0);

  const FILTER_OPTS = [
    { id: 'all',      label: 'Alle' },
    { id: 'active',   label: 'Aktiv' },
    { id: 'paused',   label: 'Pausiert' },
    { id: 'done',     label: 'Abgeschlossen' },
  ];

  const filtered = projects
    .filter(p => filter === 'all' || p.status === filter)
    .sort((a, b) => {
      const order = { active: 0, paused: 1, done: 2, archived: 3 };
      const prioOrder = { high: 0, mid: 1, low: 2 };
      const sA = order[a.status] ?? 9; const sB = order[b.status] ?? 9;
      if (sA !== sB) return sA - sB;
      const pA = prioOrder[a.priority] ?? 1; const pB = prioOrder[b.priority] ?? 1;
      if (pA !== pB) return pA - pB;
      return a.name.localeCompare(b.name);
    });

  // ── Detail view ──
  if (activeId && selected) {
    return (
      <>
        <ProjectDetail
          project={selected}
          userId={userId}
          onUpdate={(patch) => handleUpdate(selected.id, patch)}
          onBack={() => setActiveId(null)}
          onEdit={() => openEdit(selected.id)}
          onTransferTask={onTransferTask}
        />
        {showModal && (
          <ProjectModal
            editId={editId}
            projects={projects}
            onSave={handleSave}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // ── List view ──
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '26px', fontWeight: 400 }}>Project Manager</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
            Die Schaltzentrale für alle laufenden Initiativen
          </div>
        </div>
        <button onClick={openAdd}
          style={{ padding: '9px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
          + Neues Projekt
        </button>
      </div>

      {/* Stats */}
      {projects.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Gesamt',       n: projects.length,  color: 'var(--text)' },
            { label: 'Aktiv',        n: activeCount,       color: '#16A34A' },
            { label: 'Hohe Prio',    n: highPrioCount,     color: '#DC2626' },
            { label: 'Offene Tasks', n: totalTasks,        color: '#4F46E5' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 300, color: s.n > 0 ? s.color : 'var(--text-3)', letterSpacing: '-.02em' }}>{s.n}</div>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      {projects.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {FILTER_OPTS.map(o => (
            <button key={o.id} onClick={() => setFilter(o.id)}
              style={{ padding: '5px 14px', borderRadius: '20px', border: `1px solid ${filter === o.id ? 'var(--text)' : 'var(--border)'}`, background: filter === o.id ? 'var(--text)' : 'transparent', color: filter === o.id ? '#fff' : 'var(--text-2)', fontSize: '12px', fontWeight: filter === o.id ? 500 : 400, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all .15s' }}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* Cards grid */}
      {filtered.length === 0 && projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)', lineHeight: 2 }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗂</div>
          <div style={{ fontSize: '16px', fontFamily: "'Instrument Serif', serif", color: 'var(--text)', marginBottom: '6px' }}>Das Project Management Center</div>
          <div style={{ fontSize: '13px' }}>Behalte Risiken, Checklisten, Meilensteine und Updates übersichtlich an einem Ort.</div>
          <button onClick={openAdd}
            style={{ marginTop: '20px', padding: '10px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Erstes Projekt starten
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: '13px' }}>
          Keine Projekte in dieser Kategorie.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => setActiveId(p.id)}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ProjectModal
          editId={editId}
          projects={projects}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
