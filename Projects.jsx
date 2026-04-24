import React, { useState, useRef } from 'react';
import { TODAY } from '../utils';
import { uploadMeetingFile, deleteMeetingFile } from '../firebase';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTS = [
  { value: 'upcoming',  label: 'Geplant',        color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
  { value: 'done',      label: 'Abgeschlossen',  color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  { value: 'cancelled', label: 'Abgesagt',       color: '#A1A1AA', bg: '#F4F4F5', border: '#E4E4E7' },
];

const statusOf  = (v) => STATUS_OPTS.find(o => o.value === v) || STATUS_OPTS[0];
const EMPTY_FORM = { title: '', date: '', time: '', location: '', attendees: '', status: 'upcoming', agenda: '', notes: '' };

const FILE_ICONS = {
  'application/pdf':                              '📄',
  'application/msword':                          '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel':                    '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint':               '📑',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📑',
  'image/png': '🖼', 'image/jpeg': '🖼', 'image/gif': '🖼', 'image/webp': '🖼',
};
const fileIcon = (type) => FILE_ICONS[type] || '📎';
const fmtSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1024/1024).toFixed(1)} MB`;

// Shared input style
const INP = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
  borderRadius: '8px', background: 'var(--bg)', color: 'var(--text)',
  fontSize: '13px', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, small }) {
  const s = statusOf(status);
  return (
    <span style={{
      fontSize: small ? '10px' : '11px', fontWeight: 500,
      padding: small ? '1px 6px' : '2px 8px', borderRadius: '6px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>{s.label}</span>
  );
}

function AutoSaveTextarea({ initialValue, readOnly, placeholder, minHeight = '120px', onSave }) {
  const [val, setVal] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const save = (v) => { onSave(v); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  return (
    <div>
      <textarea
        value={val}
        readOnly={readOnly}
        onChange={e => !readOnly && setVal(e.target.value)}
        onBlur={() => !readOnly && save(val)}
        placeholder={readOnly ? (val ? '' : 'Keine Einträge.') : placeholder}
        style={{
          ...INP, resize: readOnly ? 'none' : 'vertical', lineHeight: 1.7,
          minHeight, cursor: readOnly ? 'default' : 'text',
          background: readOnly ? 'var(--bg)' : 'var(--surface)',
          color: readOnly ? 'var(--text-3)' : 'var(--text)',
          border: `1px solid ${readOnly ? 'var(--border)' : 'var(--border-strong)'}`,
        }}
      />
      {!readOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '12px', color: 'var(--green)' }}>✓ Gespeichert</span>}
          <button onClick={() => save(val)} style={{ padding: '5px 12px', background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Speichern
          </button>
        </div>
      )}
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function OverviewTab({ meetings, onSelectMeeting, onAdd }) {
  const upcoming = meetings.filter(m => m.status === 'upcoming').sort((a, b) => a.date > b.date ? 1 : -1);
  const done     = meetings.filter(m => m.status === 'done').sort((a, b) => a.date > b.date ? -1 : 1);
  const today    = meetings.filter(m => m.date === TODAY && m.status === 'upcoming');
  const thisWeek = (() => {
    const d = new Date(); const day = d.getDay();
    const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const toDs = (x) => `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
    return meetings.filter(m => m.date >= toDs(mon) && m.date <= toDs(sun) && m.status === 'upcoming');
  })();
  const withNotes = meetings.filter(m => m.notes && m.notes.trim().length > 0);

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '28px' }}>
        {[
          { label: 'Gesamt', n: meetings.length, color: 'var(--text)' },
          { label: 'Geplant', n: upcoming.length, color: '#4F46E5' },
          { label: 'Diese Woche', n: thisWeek.length, color: '#D97706' },
          { label: 'Mit Notizen', n: withNotes.length, color: '#16A34A' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: 300, color: s.n > 0 ? s.color : 'var(--text-3)', letterSpacing: '-.02em' }}>{s.n}</div>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Upcoming meetings */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>📅 Nächste Meetings</div>
            <button onClick={onAdd} style={{ fontSize: '12px', color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>+ Neu</button>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              Keine geplanten Meetings.<br />
              <button onClick={onAdd} style={{ marginTop: '8px', color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: "'Inter', sans-serif" }}>Jetzt anlegen →</button>
            </div>
          ) : upcoming.slice(0, 6).map(m => (
            <div key={m.id} onClick={() => onSelectMeeting(m.id)}
              style={{ background: 'var(--surface)', border: `1px solid ${m.date === TODAY ? '#C7D2FE' : 'var(--border)'}`, borderLeft: `3px solid ${m.date === TODAY ? '#4F46E5' : 'var(--border-strong)'}`, borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', cursor: 'pointer', transition: 'border-color .15s' }}>
              <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text)', marginBottom: '4px' }}>{m.title}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: m.date === TODAY ? '#4F46E5' : 'var(--text-2)' }}>
                  {m.date === TODAY ? '📅 Heute' : m.date}{m.time ? ` · ${m.time}` : ''}
                </span>
                {m.location && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>📍 {m.location}</span>}
                {(m.docs || []).length > 0 && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>📎 {m.docs.length}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Recent notes */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '12px' }}>📝 Letzte Notizen</div>
          {withNotes.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              Noch keine Meeting-Notizen vorhanden.
            </div>
          ) : withNotes.slice(0, 5).map(m => (
            <div key={m.id} onClick={() => onSelectMeeting(m.id)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', cursor: 'pointer', transition: 'border-color .15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text)' }}>{m.title}</div>
                <StatusBadge status={m.status} small />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {m.notes}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '6px' }}>{m.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NOTES OVERVIEW TAB ───────────────────────────────────────────────────────

function AllNotesTab({ meetings, onSelectMeeting }) {
  const [search, setSearch] = useState('');
  const withNotes = meetings
    .filter(m => m.notes && m.notes.trim())
    .filter(m => !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.notes.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.date > b.date ? -1 : 1);

  return (
    <div>
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
        <input
          placeholder="Notizen durchsuchen…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...INP, paddingLeft: '36px', border: '1px solid var(--border-strong)' }}
        />
      </div>
      {withNotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: '13px', lineHeight: 1.7 }}>
          {search ? 'Keine passenden Notizen gefunden.' : 'Noch keine Meeting-Notizen vorhanden.\nErstelle ein Meeting und füge Notizen hinzu.'}
        </div>
      ) : withNotes.map(m => (
        <div key={m.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text)' }}>{m.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{m.date}{m.time ? ` · ${m.time}` : ''}{m.location ? ` · ${m.location}` : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              <StatusBadge status={m.status} small />
              <button onClick={() => onSelectMeeting(m.id)}
                style={{ fontSize: '12px', color: '#4F46E5', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                Öffnen
              </button>
            </div>
          </div>
          {/* Notes body */}
          <div style={{ padding: '14px 18px' }}>
            {m.agenda && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px' }}>📋 Agenda</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{m.agenda}</div>
              </div>
            )}
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px' }}>📝 Notizen</div>
            <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.notes}</div>
            {(m.docs || []).length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {m.docs.map(d => (
                  <a key={d.path} href={d.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-2)', textDecoration: 'none' }}>
                    {fileIcon(d.type)} {d.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DOCUMENT PANEL ───────────────────────────────────────────────────────────

function DocumentPanel({ meeting, userId, onUpdateDocs }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const docs = meeting.docs || [];

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setError('Maximale Dateigröße: 20 MB.'); return; }
    setError(''); setUploading(true); setProgress(0);
    try {
      const meta = await uploadMeetingFile(userId, String(meeting.id), file, setProgress);
      onUpdateDocs([...docs, meta]);
    } catch (err) {
      setError('Upload fehlgeschlagen: ' + err.message);
    } finally {
      setUploading(false); setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm(`„${doc.name}" löschen?`)) return;
    await deleteMeetingFile(doc.path);
    onUpdateDocs(docs.filter(d => d.path !== doc.path));
  };

  const isDone = meeting.status === 'done';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          📎 Dokumente ({docs.length})
        </div>
        {!isDone && (
          <>
            <button onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{ fontSize: '12px', fontWeight: 500, padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              {uploading ? `${progress}%` : '+ Hochladen'}
            </button>
            <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif,.webp,.zip" />
          </>
        )}
      </div>

      {uploading && (
        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#4F46E5', borderRadius: '2px', transition: 'width .2s' }} />
        </div>
      )}
      {error && <div style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '8px' }}>{error}</div>}

      {docs.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
          {isDone ? 'Keine Dokumente.' : 'Noch keine Dokumente — klicke auf „+ Hochladen".'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {docs.map(d => (
            <div key={d.path} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{fileIcon(d.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={d.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: 'var(--text)', textDecoration: 'none', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {d.name}
                </a>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '1px' }}>{fmtSize(d.size)}</div>
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer" download
                style={{ fontSize: '13px', color: 'var(--text-3)', padding: '4px', borderRadius: '4px', textDecoration: 'none' }} title="Herunterladen">⬇</a>
              {!isDone && (
                <button onClick={() => handleDelete(d)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px', padding: '2px', lineHeight: 1 }}
                  onMouseOver={e => e.target.style.color = 'var(--red)'}
                  onMouseOut={e => e.target.style.color = 'var(--text-3)'}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────

function DetailPanel({ meeting, userId, meetings, setMeetings, onEdit, onClose }) {
  const isDone = meeting.status === 'done';

  const update = (patch) => setMeetings(meetings.map(m => m.id === meeting.id ? { ...m, ...patch } : m));
  const saveField = (field) => (val) => update({ [field]: val });
  const updateDocs = (docs) => update({ docs });

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', position: 'sticky', top: '20px' }}>
      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', background: isDone ? 'var(--green-bg)' : 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '19px', fontWeight: 400, lineHeight: 1.25, marginBottom: '4px' }}>{meeting.title}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
              {meeting.date}{meeting.time ? ` · ${meeting.time}` : ''}{meeting.location ? ` · 📍${meeting.location}` : ''}
            </div>
            {meeting.attendees && <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '3px' }}>👥 {meeting.attendees}</div>}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button onClick={onEdit} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-2)' }}>✎</button>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-3)' }}>✕</button>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
        {/* Agenda */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>📋 Agenda</div>
            {isDone && <span style={{ fontSize: '10px', color: 'var(--text-3)', fontStyle: 'italic' }}>Nur-Lesen</span>}
          </div>
          <AutoSaveTextarea key={`a-${meeting.id}`} initialValue={meeting.agenda || ''} readOnly={isDone} placeholder="Agenda-Punkte, Themen, Vorbereitung…" minHeight="80px" onSave={saveField('agenda')} />
        </div>

        {/* Notes */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '8px' }}>📝 Notizen</div>
          <AutoSaveTextarea key={`n-${meeting.id}`} initialValue={meeting.notes || ''} readOnly={false} placeholder="Notizen, Beschlüsse, Aufgaben aus dem Meeting…" minHeight="140px" onSave={saveField('notes')} />
        </div>

        {/* Documents */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <DocumentPanel meeting={meeting} userId={userId} onUpdateDocs={updateDocs} />
        </div>

        {/* Status */}
        <div style={{ padding: '12px 18px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-3)', marginRight: '4px' }}>Status:</span>
          {STATUS_OPTS.map(s => (
            <button key={s.value} onClick={() => update({ status: s.value })}
              style={{ fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', border: `1px solid ${meeting.status === s.value ? s.border : 'var(--border)'}`, background: meeting.status === s.value ? s.bg : 'transparent', color: meeting.status === s.value ? s.color : 'var(--text-3)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all .12s' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ADD/EDIT MODAL ───────────────────────────────────────────────────────────

function MeetingModal({ editId, meetings, onSave, onClose }) {
  const init = editId ? meetings.find(m => m.id === editId) : null;
  const [form, setForm] = useState(init ? {
    title: init.title, date: init.date, time: init.time || '', location: init.location || '',
    attendees: init.attendees || '', status: init.status || 'upcoming', agenda: init.agenda || '',
  } : { ...EMPTY_FORM, date: TODAY });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="modal-title">{editId ? 'Meeting bearbeiten' : 'Neues Meeting'}</div>
        <div className="modal-field">
          <div className="modal-label">Titel *</div>
          <input style={INP} placeholder="z.B. Wochenplanung, Kundengespräch…" value={form.title} onChange={f('title')} />
        </div>
        <div className="modal-grid">
          <div className="modal-field" style={{ marginBottom: 0 }}>
            <div className="modal-label">Datum</div>
            <input style={INP} type="date" value={form.date} onChange={f('date')} />
          </div>
          <div className="modal-field" style={{ marginBottom: 0 }}>
            <div className="modal-label">Uhrzeit</div>
            <input style={INP} type="time" value={form.time} onChange={f('time')} />
          </div>
        </div>
        <div className="modal-field" style={{ marginTop: '12px' }}>
          <div className="modal-label">Ort / Link</div>
          <input style={INP} placeholder="z.B. Konferenzraum A, Zoom-Link…" value={form.location} onChange={f('location')} />
        </div>
        <div className="modal-field">
          <div className="modal-label">Teilnehmer</div>
          <input style={INP} placeholder="z.B. Max, Anna, Team Marketing…" value={form.attendees} onChange={f('attendees')} />
        </div>
        <div className="modal-field">
          <div className="modal-label">Status</div>
          <select style={{ ...INP, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }} value={form.status} onChange={f('status')}>
            {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="modal-field">
          <div className="modal-label">Agenda / Themen</div>
          <textarea style={{ ...INP, resize: 'none', lineHeight: 1.65, minHeight: '80px' }} placeholder="Themen, Punkte, Vorbereitung…" value={form.agenda} onChange={f('agenda')} />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Abbrechen</button>
          <button className="btn-save" onClick={() => form.title.trim() && onSave(form, editId)}>Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Meetings({ meetings, setMeetings, userId }) {
  const [view, setView]       = useState('overview'); // 'overview' | 'list' | 'notes'
  const [filter, setFilter]   = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]     = useState(null);

  const openAdd  = () => { setEditId(null); setShowModal(true); };
  const openEdit = (id) => { setEditId(id); setShowModal(true); setView('list'); };

  const handleSave = (form, eid) => {
    if (eid) {
      setMeetings(meetings.map(m => m.id === eid ? { ...m, ...form, updated: TODAY } : m));
    } else {
      setMeetings([{ ...form, id: Date.now(), docs: [], updated: TODAY }, ...meetings]);
      setView('list');
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Meeting löschen?')) return;
    setMeetings(meetings.filter(m => m.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const selected = meetings.find(m => m.id === activeId);
  const todayCount = meetings.filter(m => m.date === TODAY && m.status === 'upcoming').length;
  const upcomingCount = meetings.filter(m => m.status === 'upcoming').length;

  const TABS = [
    { id: 'overview', label: '📊 Übersicht' },
    { id: 'list',     label: '📋 Alle Meetings' },
    { id: 'notes',    label: '📝 Alle Notizen' },
  ];

  const filtered = meetings
    .filter(m => filter === 'all' || m.status === filter)
    .sort((a, b) => {
      if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
      if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
      return a.date > b.date ? 1 : -1;
    });

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '26px', fontWeight: 400 }}>Meetings</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
            {upcomingCount} geplant{todayCount > 0 ? ` · ${todayCount} heute` : ''}
          </div>
        </div>
        <button onClick={openAdd}
          style={{ padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
          + Neues Meeting
        </button>
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            style={{ padding: '8px 18px', border: 'none', borderBottom: view === t.id ? '2px solid var(--text)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: view === t.id ? 500 : 400, color: view === t.id ? 'var(--text)' : 'var(--text-3)', fontFamily: "'Inter', sans-serif", transition: 'all .15s', marginBottom: '-1px', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {view === 'overview' && (
        <OverviewTab meetings={meetings} onSelectMeeting={(id) => { setActiveId(id); setView('list'); }} onAdd={openAdd} />
      )}

      {/* ── ALL MEETINGS (list + detail) ── */}
      {view === 'list' && (
        <>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
            {[['all', 'Alle'], ['upcoming', 'Geplant'], ['done', 'Abgeschlossen'], ['cancelled', 'Abgesagt']].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ padding: '5px 14px', border: `1px solid ${filter === k ? 'var(--text)' : 'var(--border)'}`, borderRadius: '20px', background: filter === k ? 'var(--text)' : 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: filter === k ? 500 : 400, color: filter === k ? '#fff' : 'var(--text-2)', fontFamily: "'Inter', sans-serif", transition: 'all .15s' }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: activeId && selected ? '1fr 1.1fr' : '1fr', gap: '16px', alignItems: 'start' }}>
            {/* Meeting list */}
            <div>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontSize: '13px' }}>
                  Keine Meetings.<br />
                  <button onClick={openAdd} style={{ marginTop: '12px', color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>Jetzt anlegen →</button>
                </div>
              )}
              {filtered.map(m => {
                const isActive = m.id === activeId;
                const isToday  = m.date === TODAY;
                const isPast   = m.date < TODAY && m.status === 'upcoming';
                return (
                  <div key={m.id} onClick={() => setActiveId(isActive ? null : m.id)}
                    style={{ background: isActive ? 'var(--text)' : 'var(--surface)', border: `1px solid ${isActive ? 'var(--text)' : isToday ? '#C7D2FE' : 'var(--border)'}`, borderRadius: '12px', padding: '13px 16px', marginBottom: '8px', cursor: 'pointer', transition: 'all .15s' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: isActive ? '#fff' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: isActive ? 'rgba(255,255,255,.7)' : isToday ? '#4F46E5' : isPast ? 'var(--red)' : 'var(--text-2)' }}>
                            {isToday ? '📅 Heute' : m.date}{m.time ? ` · ${m.time}` : ''}
                          </span>
                          {m.location && <span style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,.6)' : 'var(--text-3)' }}>📍 {m.location}</span>}
                          <span style={{ fontSize: '11px', fontWeight: 500, padding: '1px 7px', borderRadius: '6px', ...(isActive ? { background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.2)' } : { background: statusOf(m.status).bg, color: statusOf(m.status).color, border: `1px solid ${statusOf(m.status).border}` }) }}>
                            {statusOf(m.status).label}
                          </span>
                          {(m.docs || []).length > 0 && <span style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,.5)' : 'var(--text-3)' }}>📎 {m.docs.length} Dok.</span>}
                          {m.notes && <span style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,.5)' : 'var(--text-3)' }}>📝</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(m.id)} style={{ background: isActive ? 'rgba(255,255,255,.15)' : 'none', border: `1px solid ${isActive ? 'rgba(255,255,255,.2)' : 'var(--border)'}`, borderRadius: '6px', cursor: 'pointer', padding: '5px 8px', fontSize: '13px', color: isActive ? '#fff' : 'var(--text-2)' }}>✎</button>
                        <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: `1px solid ${isActive ? 'rgba(255,255,255,.2)' : 'var(--border)'}`, borderRadius: '6px', cursor: 'pointer', padding: '5px 8px', fontSize: '13px', color: isActive ? 'rgba(255,255,255,.6)' : 'var(--text-3)' }}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail panel */}
            {activeId && selected && (
              <DetailPanel
                meeting={selected}
                userId={userId}
                meetings={meetings}
                setMeetings={setMeetings}
                onEdit={() => openEdit(selected.id)}
                onClose={() => setActiveId(null)}
              />
            )}
          </div>
        </>
      )}

      {/* ── ALL NOTES ── */}
      {view === 'notes' && (
        <AllNotesTab meetings={meetings} onSelectMeeting={(id) => { setActiveId(id); setView('list'); }} />
      )}

      {/* Modal */}
      {showModal && (
        <MeetingModal editId={editId} meetings={meetings} onSave={handleSave} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
