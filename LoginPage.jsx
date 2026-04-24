import React, { useState, useEffect } from 'react';
import { getMonday, addDays, getKW, dateStr, TODAY } from '../utils';

const DAYNAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const EV_COLORS = 7;

export default function CalendarReminders({ reminders, setReminders, onOpenRemEdit }) {
  const [calWeekOffset, setCalWeekOffset] = useState(0);
  const [remText, setRemText] = useState('');
  const [remFrom, setRemFrom] = useState('');
  const [remTo, setRemTo] = useState('');

  useEffect(() => {
    const handler = (e) => {
      setRemText(e.detail);
      setTimeout(() => {
        const inp = document.querySelector('.rem-text-inp');
        if (inp) {
          inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
          inp.focus();
          inp.style.borderColor = 'var(--indigo)';
          setTimeout(() => inp.style.borderColor = '', 1500);
        }
      }, 50);
    };
    window.addEventListener('set-reminder-text', handler);
    return () => window.removeEventListener('set-reminder-text', handler);
  }, []);

  const shiftWeek = (dir) => setCalWeekOffset(prev => prev + dir);
  const goToToday = () => setCalWeekOffset(0);

  const handleAdd = () => {
    const txt = remText.trim();
    const from = remFrom;
    const to = remTo || from;
    if (!txt || !from) return;
    const colorIdx = reminders.length % EV_COLORS;
    setReminders([...reminders, { id: Date.now(), text: txt, from, to: to < from ? from : to, note: '', color: colorIdx }]);
    setRemText('');
    setRemFrom('');
    setRemTo('');
  };

  const deleteReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  // derived data
  const monday = getMonday(new Date());
  monday.setDate(monday.getDate() + calWeekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const sunday = days[6];

  const wStart = dateStr(monday);
  const wEnd = dateStr(sunday);
  const visible = reminders.filter(r => r.from <= wEnd && r.to >= wStart);
  
  // packing logic
  const rows = [];
  visible.forEach(r => {
    const evStart = r.from < wStart ? wStart : r.from;
    const evEnd = r.to > wEnd ? wEnd : r.to;
    const colStart = days.findIndex(d => dateStr(d) === evStart);
    const colEnd = days.findIndex(d => dateStr(d) === evEnd);
    const cs = colStart < 0 ? 0 : colStart;
    const ce = colEnd < 0 ? 6 : colEnd;

    let placed = false;
    for (let ri = 0; ri < rows.length; ri++) {
      const occupied = rows[ri].some(ev => !(ev.ce < cs || ev.cs > ce));
      if (!occupied) {
        rows[ri].push({ ...r, cs, ce });
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([{ ...r, cs, ce }]);
  });

  const todayRems = reminders.filter(r => r.from <= TODAY && r.to >= TODAY);

  return (
    <div className="reminder-section">
      <div className="section-label" style={{ marginTop: '32px' }}>Neue Erinnerung anlegen</div>
      
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
        <input className="rem-text-inp" placeholder="Titel der Erinnerung / Termin…" value={remText} onChange={e => setRemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} 
               style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--text)', outline: 'none', marginBottom: '12px', transition: 'border-color .15s' }}
               onFocus={e => e.target.style.borderColor = 'var(--indigo)'}
               onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Von</span>
          <input type="date" value={remFrom} onChange={e => setRemFrom(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text)', fontSize: '12px', outline: 'none' }} />
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginLeft: '4px' }}>Bis</span>
          <input type="date" value={remTo} onChange={e => setRemTo(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text)', fontSize: '12px', outline: 'none' }} />
          <button onClick={handleAdd} style={{ marginLeft: 'auto', background: 'var(--text)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>Eintragen</button>
        </div>
      </div>

      <div className="section-label">Kalender & Termine</div>

      {todayRems.length > 0 && (
        <div className="reminder-today">
          <div className="reminder-today-label">Heute — {todayRems.length} Erinnerung{todayRems.length > 1 ? 'en' : ''}</div>
          <div className="reminder-today-list">
            {todayRems.map(r => (
              <div key={r.id} className="reminder-today-item">
                <div>
                  <span className="reminder-today-text">{r.text}</span>
                  {r.note && <div style={{ fontSize: '11px', color: '#6366F1', marginTop: '2px' }}>{r.note}</div>}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button className="reminder-today-del" onClick={() => onOpenRemEdit(r.id)} style={{ fontSize: '13px' }}>✎</button>
                  <button className="reminder-today-del" onClick={() => deleteReminder(r.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={() => shiftWeek(-1)}>←</button>
        <div>
          <div className="cal-kw">KW {getKW(monday)} · {monday.getFullYear()}</div>
          <div className="cal-kw-range">{monday.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – {sunday.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</div>
        </div>
        <button className="cal-nav-btn" onClick={() => shiftWeek(1)}>→</button>
      </div>
      <button className="cal-today-btn" onClick={goToToday}>Aktuelle Woche</button>

      <div className="cal-grid-wrap">
        <div className="cal-header">
          {days.map(d => (
            <div key={dateStr(d)} className={`cal-header-day ${dateStr(d) === TODAY ? 'is-today' : ''}`}>
              <div className="cal-header-dayname">{DAYNAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]}</div>
              <div className="cal-header-daynum">{d.getDate()}</div>
              <div className="cal-header-month">{d.toLocaleDateString('de-DE', { month: 'short' })}</div>
            </div>
          ))}
        </div>
        
        <div className="cal-events">
          {!visible.length ? (
            <div className="cal-empty">Keine Erinnerungen diese Woche</div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {days.map(d => (
                  <div key={dateStr(d)} style={{ borderRight: '1px solid var(--border)', background: dateStr(d) === TODAY ? 'rgba(99,102,241,.03)' : '' }}></div>
                ))}
              </div>
              <div style={{ padding: '8px 0', position: 'relative' }}>
                {rows.map((row, ri) => {
                  let cursor = 0;
                  const sorted = [...row].sort((a, b) => a.cs - b.cs);
                  const items = [];
                  sorted.forEach(ev => {
                    if (ev.cs > cursor) items.push(<div key={`gap-${cursor}`} style={{ gridColumn: `${cursor + 1} / ${ev.cs + 1}` }}></div>);
                    const span = ev.ce - ev.cs + 1;
                    items.push(
                      <div key={ev.id} style={{ gridColumn: `${ev.cs + 1} / ${ev.cs + span + 1}`, padding: '0 2px' }}>
                        <div className={`cal-event ev-${ev.color}`} title={ev.text + (ev.note ? '\n' + ev.note : '')}>
                          <span className="cal-event-label">{ev.text}</span>
                          <span className="cal-event-actions">
                            <button className="cal-event-btn" onClick={() => onOpenRemEdit(ev.id)} title="Bearbeiten">✎</button>
                            <button className="cal-event-btn" onClick={() => deleteReminder(ev.id)} title="Löschen">×</button>
                          </span>
                        </div>
                        {ev.note && <div style={{ fontSize: '10px', color: 'var(--text-3)', padding: '2px 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.note}</div>}
                      </div>
                    );
                    cursor = ev.ce + 1;
                  });
                  if (cursor < 7) items.push(<div key={`gap-${cursor}`} style={{ gridColumn: `${cursor + 1} / 8` }}></div>);
                  
                  return <div key={`row-${ri}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px', minHeight: '26px' }}>{items}</div>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
