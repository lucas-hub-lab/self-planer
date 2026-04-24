import React, { useState } from 'react';
import { getKW } from '../utils';
import { reviewLoad, reviewSave } from '../firebase';

const PROMPTS = [
  { key: 'wentWell', label: '✅ Was lief gut diese Woche?', placeholder: 'Erfolge, Durchbrüche, positive Momente…' },
  { key: 'challenges', label: '🧩 Was war schwierig?', placeholder: 'Herausforderungen, Hindernisse, Frustrationen…' },
  { key: 'accomplished', label: '📋 Was habe ich erledigt?', placeholder: 'Abgeschlossene Aufgaben, Meilensteine…' },
  { key: 'openItems', label: '📌 Was bleibt offen?', placeholder: 'Unerledigte Punkte, die nächste Woche angegangen werden…' },
  { key: 'nextFocus', label: '🎯 Top 3 Fokus nächste Woche', placeholder: '1. …\n2. …\n3. …' },
  { key: 'ideas', label: '💡 Ideen & sonstiges', placeholder: 'Gedanken, Ideen, Erkenntnisse…' },
];

function getWeekKey(monday) {
  return `KW-${monday.getFullYear()}-${String(getKW(monday)).padStart(2, '0')}`;
}

function getMonday(offset = 0) {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function WeeklyReview({ userId, todos, completedThisWeek }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadedKey, setLoadedKey] = useState(null);

  const monday = getMonday(weekOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekKey = getWeekKey(monday);
  const kw = getKW(monday);

  const rangeStr = `${monday.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const loadReview = async () => {
    if (loadedKey === weekKey) return;
    setLoading(true);
    const data = await reviewLoad(userId, weekKey);
    setForm(data ? { ...data } : {});
    setLoadedKey(weekKey);
    setLoading(false);
  };

  React.useEffect(() => { loadReview(); }, [weekKey]);

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    await reviewSave(userId, weekKey, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Completed todos this week (auto-populate accomplished)
  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = sunday.toISOString().split('T')[0];
  const doneThisWeek = todos.filter(t => t.done && t.created >= mondayStr && t.created <= sundayStr);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px' }}>Wochen-Review</div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', fontWeight: 400 }}>KW {kw}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>{rangeStr}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setWeekOffset(w => w - 1)} className="cal-nav-btn">←</button>
          <button onClick={() => setWeekOffset(0)} className="cal-today-btn" style={{ margin: 0, fontSize: '12px', display: 'inline-block' }}>Diese Woche</button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="cal-nav-btn">→</button>
        </div>
      </div>

      {/* Auto-completed todos hint */}
      {doneThisWeek.length > 0 && !form.accomplished && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '14px' }}>💡</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)', marginBottom: '4px' }}>
              {doneThisWeek.length} Aufgabe{doneThisWeek.length > 1 ? 'n' : ''} diese Woche erledigt
            </div>
            <div style={{ fontSize: '12px', color: '#166534' }}>{doneThisWeek.map(t => t.text).join(' · ')}</div>
            <button onClick={() => handleChange('accomplished', doneThisWeek.map(t => `• ${t.text}`).join('\n'))}
              style={{ marginTop: '8px', fontSize: '11px', fontWeight: 500, color: 'var(--green)', background: 'none', border: '1px solid #BBF7D0', borderRadius: '6px', cursor: 'pointer', padding: '3px 10px', fontFamily: "'Inter', sans-serif" }}>
              In Review übernehmen
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>Wird geladen…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {PROMPTS.map(p => (
            <div key={p.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{p.label}</div>
              <textarea
                style={{ width: '100%', padding: '14px 18px', border: 'none', background: 'transparent', color: 'var(--text)', fontSize: '13px', lineHeight: '1.7', resize: 'none', outline: 'none', fontFamily: "'Inter', sans-serif", minHeight: p.key === 'nextFocus' ? '90px' : '80px', boxSizing: 'border-box' }}
                placeholder={p.placeholder}
                value={form[p.key] || ''}
                onChange={e => handleChange(p.key, e.target.value)}
              />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            {saved && <span style={{ fontSize: '13px', color: 'var(--green)', alignSelf: 'center' }}>✓ Gespeichert</span>}
            <button onClick={handleSave}
              style={{ padding: '10px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              Review speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
