import React, { useState } from 'react';
import { TODAY, getKW } from '../utils';

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const DAY_NAMES   = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const EV_COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#F97316'];

function localDs(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function getDays(y, m)   { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y, m) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

function fmtDate(ds) {
  if (!ds) return '';
  const [y, m, d] = ds.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

/* ─── Day Detail Panel ────────────────────────────────────────────────────────── */
function DayDetail({ ds, todos, reminders, onClose }) {
  const isToday = ds === TODAY;
  const isPast  = ds < TODAY;
  const dayTodos = todos.filter(t => t.date === ds);
  const dayRems  = reminders.filter(r => r.from <= ds && r.to >= ds);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '12px', overflow: 'hidden', marginBottom: '12px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        background: isToday ? 'var(--indigo-bg)' : 'var(--bg)',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: isToday ? 'var(--indigo)' : 'var(--text)' }}>
            {fmtDate(ds)}
          </div>
          {isToday && <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--indigo)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: '2px' }}>Heute</div>}
          {isPast && !isToday && <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>Vergangenheit</div>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-3)', lineHeight: 1, padding: '0 4px', minHeight: '36px', minWidth: '36px' }}>×</button>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {dayTodos.length === 0 && dayRems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-3)', fontSize: '12px' }}>
            Keine Einträge für diesen Tag
          </div>
        )}

        {dayRems.length > 0 && (
          <div style={{ marginBottom: dayTodos.length > 0 ? '12px' : 0 }}>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px' }}>
              Termine / Erinnerungen
            </div>
            {dayRems.map((r, i) => {
              const col = EV_COLORS[i % EV_COLORS.length];
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '7px 10px', borderRadius: '7px', background: col + '15', borderLeft: `3px solid ${col}`, marginBottom: '5px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{r.text}</div>
                    {r.from !== r.to && <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '1px' }}>{r.from} – {r.to}</div>}
                    {r.note && <div style={{ fontSize: '10px', color: col, marginTop: '2px' }}>{r.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {dayTodos.length > 0 && (
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px' }}>
              Aufgaben ({dayTodos.length})
            </div>
            {dayTodos.map(t => {
              const overdue = !t.done && t.date < TODAY;
              const dot = t.done ? '#16A34A' : overdue ? '#DC2626' : '#D97706';
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: dot, flexShrink: 0, marginTop: '4px' }} />
                  <span style={{ fontSize: '12px', color: overdue ? 'var(--red)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.5 : 1, lineHeight: 1.5 }}>
                    {t.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Upcoming Sidebar ─────────────────────────────────────────────────────────── */
function UpcomingPanel({ todos, reminders }) {
  const upcoming = todos
    .filter(t => !t.done && t.date && t.date >= TODAY)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);
  const upRems = reminders
    .filter(r => r.to >= TODAY)
    .sort((a, b) => a.from.localeCompare(b.from))
    .slice(0, 6);

  const all = [
    ...upRems.map(r => ({ type: 'rem', key: 'r' + r.id, label: r.text, date: r.from, isToday: r.from <= TODAY && r.to >= TODAY })),
    ...upcoming.map(t => ({ type: 'task', key: 't' + t.id, label: t.text, date: t.date, isToday: t.date === TODAY })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 12);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', fontSize: '9px', fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        📋 Anstehend
      </div>
      {all.length === 0 && (
        <div style={{ padding: '16px 14px', fontSize: '12px', color: 'var(--text-3)' }}>Keine anstehenden Einträge</div>
      )}
      {all.map(item => {
        const dot = item.type === 'rem' ? '#6366F1' : item.isToday ? '#6366F1' : '#D97706';
        return (
          <div key={item.key} style={{ display: 'flex', gap: '10px', padding: '9px 14px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: item.type === 'rem' ? '2px' : '50%', background: dot, flexShrink: 0, marginTop: '4px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: item.isToday ? dot : 'var(--text-3)', marginTop: '1px', fontWeight: item.isToday ? 600 : 400 }}>
                {item.isToday ? 'Heute' : fmtDate(item.date)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Calendar ────────────────────────────────────────────────────────────── */
export default function MonthView({ todos, reminders }) {
  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [selectedDs, setSelDs] = useState(null);

  const days     = getDays(year, month);
  const firstDow = getFirstDow(year, month);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };
  const goToday   = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  const todosForDay = ds => todos.filter(t => t.date === ds);
  const remsForDay  = ds => reminders.filter(r => r.from <= ds && r.to >= ds);

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', fontWeight: 400 }}>
            {MONTH_NAMES[month]} <span style={{ color: 'var(--text-3)', fontWeight: 300 }}>{year}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
            KW {getKW(new Date(year, month, 1))} – KW {getKW(new Date(year, month, days))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button onClick={prevMonth} className="cal-nav-btn">←</button>
          <button onClick={goToday} className="cal-today-btn" style={{ margin: 0, display: 'inline-block' }}>Heute</button>
          <button onClick={nextMonth} className="cal-nav-btn">→</button>
        </div>
      </div>

      {/* Main layout: Calendar left, Sidebar right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: '20px', alignItems: 'start' }}>

        {/* ── Calendar grid (left) ── */}
        <div style={{ minWidth: 0, overflow: 'hidden' }}>

          {/* Day name headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
            {DAY_NAMES.map((d, i) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: '10px', fontWeight: 700,
                letterSpacing: '.07em', textTransform: 'uppercase',
                color: i >= 5 ? 'var(--indigo)' : 'var(--text-3)', padding: '6px 0',
              }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} style={{ minHeight: '74px' }} />;

              const ds         = localDs(year, month, day);
              const isToday    = ds === TODAY;
              const isSel      = ds === selectedDs;
              const isPast     = ds < TODAY;
              const isWeekend  = (i % 7) >= 5;

              const dayTodos   = todosForDay(ds);
              const dayRems    = remsForDay(ds);
              const openTodos  = dayTodos.filter(t => !t.done);
              const overdueC   = openTodos.filter(t => isPast).length;

              // max 2 event chips to fit in the cell
              const chips = [
                ...dayRems.map((r, ri) => ({ label: r.text, color: EV_COLORS[ri % EV_COLORS.length] })),
                ...openTodos.map(t => ({ label: t.text, color: isPast ? '#EF4444' : '#D97706' })),
              ].slice(0, 2);
              const extra = (dayRems.length + openTodos.length) - chips.length;

              let bg = 'var(--surface)';
              let bord = '1px solid var(--border)';
              if (isToday) { bg = 'var(--indigo-bg)'; bord = '2px solid var(--indigo)'; }
              if (isSel)   { bg = '#EEF2FF';           bord = '2px solid #6366F1'; }
              if (isWeekend && !isToday && !isSel) bg = 'var(--bg)';

              return (
                <div
                  key={ds}
                  onClick={() => setSelDs(p => p === ds ? null : ds)}
                  style={{
                    minHeight: '74px', padding: '5px 6px', cursor: 'pointer',
                    borderRadius: '7px', border: bord, background: bg,
                    boxSizing: 'border-box', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    transition: 'box-shadow .12s',
                  }}
                  onMouseOver={e => { if (!isSel) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.08)'; }}
                  onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Day number row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: isToday ? 700 : 400, flexShrink: 0,
                      background: isToday ? 'var(--indigo)' : 'transparent',
                      color: isToday ? '#fff' : isWeekend ? '#6366F1' : isPast ? 'var(--text-3)' : 'var(--text)',
                    }}>{day}</div>
                    {overdueC > 0 && (
                      <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--red)', background: '#FEF2F2', borderRadius: '3px', padding: '1px 3px', lineHeight: 1.4 }}>
                        {overdueC}!
                      </span>
                    )}
                  </div>

                  {/* Event chips */}
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {chips.map((chip, ci) => (
                      <div key={ci} style={{
                        fontSize: '9px', fontWeight: 500, lineHeight: '13px',
                        padding: '0 4px', borderRadius: '3px',
                        background: chip.color + (isPast ? '25' : '20'),
                        color: isPast ? chip.color + 'aa' : chip.color,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{chip.label}</div>
                    ))}
                    {extra > 0 && (
                      <div style={{ fontSize: '8px', color: 'var(--text-3)', paddingLeft: '2px' }}>+{extra} mehr</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Heute', color: 'var(--indigo)' },
              { label: 'Termin', color: '#6366F1', sq: true },
              { label: 'Aufgabe', color: '#D97706' },
              { label: 'Überfällig', color: '#EF4444' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: l.sq ? '2px' : '50%', background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          {selectedDs && (
            <DayDetail
              ds={selectedDs}
              todos={todos}
              reminders={reminders}
              onClose={() => setSelDs(null)}
            />
          )}
          <UpcomingPanel todos={todos} reminders={reminders} />
        </div>

      </div>
    </div>
  );
}
