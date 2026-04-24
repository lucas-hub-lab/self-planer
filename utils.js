import React, { useState } from 'react';
import { TODAY, catStyle } from '../utils';

const FREQ_LABELS = {
  daily:     'Täglich',
  weekdays:  'Werktags',
  weekly:    'Wöchentlich',
  weekonce:  'Einmal pro Woche',
  monthly:   'Monatlich',
};
const WEEKDAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

// Returns true if this recurring task is due today
export function isDueToday(r) {
  const d = new Date();
  const day = d.getDay(); // 0=Sun ... 6=Sat
  if (!r.active) return false;
  if (r.frequency === 'daily')    return true;
  if (r.frequency === 'weekdays') return day >= 1 && day <= 5;
  if (r.frequency === 'weekly')   return r.dayOfWeek === day;
  if (r.frequency === 'monthly')  return r.dayOfMonth === d.getDate();
  // weekonce: show every day — visibility handled by completedThisWeek
  if (r.frequency === 'weekonce') return true;
  return false;
}

// Returns badge label for frequency
function freqBadge(r) {
  if (r.frequency === 'weekonce') return 'Einmal/Woche';
  if (r.frequency === 'weekly') return `${WEEKDAY_NAMES[r.dayOfWeek]}`;
  if (r.frequency === 'monthly') return `Am ${r.dayOfMonth}.`;
  return FREQ_LABELS[r.frequency] || r.frequency;
}

export default function RecurringTasks({
  recurring, setRecurring,
  completedToday, setCompletedToday,
  completedThisWeek, setCompletedThisWeek,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [fTitle, setFTitle]     = useState('');
  const [fFreq, setFFreq]       = useState('daily');
  const [fDow, setFDow]         = useState(1);
  const [fDom, setFDom]         = useState(1);
  const [fCat, setFCat]         = useState('VN');
  const [fNote, setFNote]       = useState('');

  const openAdd = () => {
    setEditId(null); setFTitle(''); setFFreq('daily'); setFDow(1); setFDom(1); setFCat('VN'); setFNote('');
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditId(r.id); setFTitle(r.title); setFFreq(r.frequency); setFDow(r.dayOfWeek ?? 1);
    setFDom(r.dayOfMonth ?? 1); setFCat(r.category ?? 'Allgemein'); setFNote(r.note ?? '');
    setShowForm(true);
  };

  const handleSave = () => {
    if (!fTitle.trim()) return;
    const entry = {
      id: editId ?? Date.now(),
      title: fTitle.trim(),
      frequency: fFreq,
      dayOfWeek: fDow,
      dayOfMonth: fDom,
      category: fCat,
      note: fNote.trim(),
      active: true,
    };
    if (editId) {
      setRecurring(recurring.map(r => r.id === editId ? { ...r, ...entry } : r));
    } else {
      setRecurring([...recurring, entry]);
    }
    setShowForm(false);
  };

  const toggleActive  = (id) => setRecurring(recurring.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const deleteRec     = (id) => { if (!confirm('Wiederkehrende Aufgabe löschen?')) return; setRecurring(recurring.filter(r => r.id !== id)); };

  // Toggle completion — weekonce uses completedThisWeek, others use completedToday
  const toggleDone = (r) => {
    if (r.frequency === 'weekonce') {
      setCompletedThisWeek(prev => prev.includes(r.id) ? prev.filter(i => i !== r.id) : [...prev, r.id]);
    } else {
      setCompletedToday(prev => prev.includes(r.id) ? prev.filter(i => i !== r.id) : [...prev, r.id]);
    }
  };

  const isDone = (r) => {
    if (r.frequency === 'weekonce') return completedThisWeek.includes(r.id);
    return completedToday.includes(r.id);
  };

  const dueToday = recurring.filter(isDueToday);
  const notToday = recurring.filter(r => r.active && !isDueToday(r));
  const inactive = recurring.filter(r => !r.active);

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' };

  const RecRow = ({ r }) => {
    const done = isDone(r);
    const isWeekOnce = r.frequency === 'weekonce';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)', opacity: !r.active ? 0.4 : 1 }}>
        <button onClick={() => toggleDone(r)}
          style={{ width: '18px', height: '18px', minWidth: '18px', borderRadius: '50%', border: `1.5px solid ${done ? 'var(--text)' : 'var(--border-strong)'}`, background: done ? 'var(--text)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', color: 'var(--text)', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.5 : 1 }}>{r.title}</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 500, padding: '1px 7px', borderRadius: '4px', background: isWeekOnce ? 'var(--amber-bg)' : 'var(--indigo-bg)', color: isWeekOnce ? 'var(--amber)' : 'var(--indigo)' }}>
              {FREQ_LABELS[r.frequency] || r.frequency}
            </span>
            {r.frequency === 'weekly' && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{WEEKDAY_NAMES[r.dayOfWeek]}</span>}
            {r.frequency === 'monthly' && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>am {r.dayOfMonth}.</span>}
            {r.frequency === 'weekonce' && (
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                {done ? '✓ Diese Woche erledigt' : 'Jeden Tag bis erledigt'}
              </span>
            )}
            {(() => { const s = catStyle(r.category); return <span style={{ fontSize: '11px', fontWeight: 500, padding: '1px 7px', borderRadius: '4px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderLeft: '1px solid var(--border)', paddingLeft: '6px' }}>{r.category}</span>; })()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button onClick={() => toggleActive(r.id)} title={r.active ? 'Pausieren' : 'Aktivieren'}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', color: 'var(--text-3)' }}>
            {r.active ? '⏸' : '▶'}
          </button>
          <button onClick={() => openEdit(r)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: '4px 8px', fontSize: '13px' }}>✎</button>
          <button onClick={() => deleteRec(r.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: '4px 8px', fontSize: '13px', color: 'var(--text-3)' }}
            onMouseOver={e => { e.target.style.color = 'var(--red)'; e.target.style.borderColor = '#FECACA'; }}
            onMouseOut={e => { e.target.style.color = 'var(--text-3)'; e.target.style.borderColor = 'var(--border)'; }}>✕</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', fontWeight: 400 }}>Wiederkehrende Aufgaben</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>Routinen die sich täglich, wöchentlich oder monatlich wiederholen</div>
        </div>
        <button onClick={openAdd} style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          + Neue Routine
        </button>
      </div>

      {dueToday.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>Heute fällig — {dueToday.length}</div>
          {dueToday.map(r => <RecRow key={r.id} r={r} />)}
        </div>
      )}

      {notToday.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>Andere Tage</div>
          {notToday.map(r => <RecRow key={r.id} r={r} />)}
        </div>
      )}

      {inactive.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>Pausiert</div>
          {inactive.map(r => <RecRow key={r.id} r={r} />)}
        </div>
      )}

      {recurring.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: '13px', lineHeight: 1.7 }}>
          Noch keine Routinen.<br />Klicken Sie auf „+ Neue Routine".
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal-title">{editId ? 'Routine bearbeiten' : 'Neue Routine'}</div>
            <div className="modal-field">
              <div className="modal-label">Titel *</div>
              <input style={inputStyle} type="text" placeholder="z.B. E-Mails checken, Sport, Standup…" value={fTitle} onChange={e => setFTitle(e.target.value)} />
            </div>
            <div className="modal-grid">
              <div className="modal-field" style={{ marginBottom: 0 }}>
                <div className="modal-label">Kategorie</div>
                <select className="modal-inp" style={{ cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }} value={fCat} onChange={e => setFCat(e.target.value)}>
                  <option value="VN">VN</option>
                  <option value="NEUE">NEUE</option>
                  <option value="VOL.AT+">VOL.AT+</option>
                  <option value="Ländlepunkte">Ländlepunkte</option>
                  <option value="VOL.AT">VOL.AT</option>
                </select>
              </div>
              <div className="modal-field" style={{ marginBottom: 0 }}>
                <div className="modal-label">Häufigkeit</div>
                <select className="modal-inp" style={{ cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }} value={fFreq} onChange={e => setFFreq(e.target.value)}>
                  <option value="daily">Täglich</option>
                  <option value="weekdays">Werktags (Mo–Fr)</option>
                  <option value="weekonce">Einmal pro Woche (tägl. bis erledigt)</option>
                  <option value="weekly">Wöchentlich (fixer Tag)</option>
                  <option value="monthly">Monatlich</option>
                </select>
              </div>
            </div>

            {/* Hint for weekonce */}
            {fFreq === 'weekonce' && (
              <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--amber-bg)', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '12px', color: '#92400E', lineHeight: 1.6 }}>
                💡 Diese Routine erscheint <strong>jeden Tag</strong> in der Tagesansicht, bis sie für die aktuelle Woche als erledigt markiert wird. Montags wird sie automatisch zurückgesetzt.
              </div>
            )}

            {fFreq === 'weekly' && (
              <div className="modal-field" style={{ marginTop: '10px' }}>
                <div className="modal-label">Wochentag</div>
                <select className="modal-inp" style={{ cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }} value={fDow} onChange={e => setFDow(Number(e.target.value))}>
                  {WEEKDAY_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
                </select>
              </div>
            )}
            {fFreq === 'monthly' && (
              <div className="modal-field" style={{ marginTop: '10px' }}>
                <div className="modal-label">Tag im Monat</div>
                <input className="modal-inp" type="number" min="1" max="31" value={fDom} onChange={e => setFDom(Number(e.target.value))} />
              </div>
            )}
            <div className="modal-field" style={{ marginTop: fFreq === 'weekonce' ? '10px' : '0' }}>
              <div className="modal-label">Notizen</div>
              <textarea className="modal-inp" rows="2" style={{ resize: 'none', lineHeight: '1.55' }} value={fNote} onChange={e => setFNote(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowForm(false)}>Abbrechen</button>
              <button className="btn-save" onClick={handleSave}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
