import React, { useState } from 'react';
import { TODAY, isOverdue, isToday, dateStr, addDays, catStyle } from '../utils';
import { isDueToday } from './RecurringTasks';

const HOUR = new Date().getHours();
const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function getGreeting() {
  if (HOUR < 11) return 'Guten Morgen';
  if (HOUR < 17) return 'Guten Tag';
  return 'Guten Abend';
}

function Section({ title, count, color, children, emptyText }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
      <div style={{ padding: '12px 16px', borderBottom: count > 0 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: color || 'var(--text-3)' }}>{title}</div>
        {count > 0 && <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '10px', background: color ? color + '18' : 'var(--bg)', color: color || 'var(--text-3)', border: `1px solid ${color ? color + '33' : 'var(--border)'}` }}>{count}</span>}
      </div>
      {count === 0 ? (
        <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-3)' }}>{emptyText}</div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}

function TodoRow({ t, onToggle }) {
  const od = isOverdue(t);
  const pL = { high: 'Hoch', mid: 'Mittel', low: 'Niedrig' };
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 16px', borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => onToggle(t.id)}
        style={{ width: '18px', height: '18px', minWidth: '18px', borderRadius: '50%', border: `1.5px solid ${t.done ? 'var(--text)' : 'var(--border-strong)'}`, background: t.done ? 'var(--text)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
        {t.done && <svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', color: od ? 'var(--red)' : 'var(--text)', opacity: t.done ? 0.4 : 1, textDecoration: t.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.text}</div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
          <span className={`tag tag-${t.prio}`}>{pL[t.prio]}</span>
          {(() => { const s = catStyle(t.cat); return <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{t.cat}</span>; })()}
        </div>
      </div>
    </div>
  );
}

function RecRow({ r, done, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', borderBottom: '1px solid var(--border)', opacity: done ? 0.5 : 1 }}>
      <button onClick={() => onToggle(r.id)}
        style={{ width: '18px', height: '18px', minWidth: '18px', borderRadius: '50%', border: `1.5px solid ${done ? 'var(--text)' : 'var(--border-strong)'}`, background: done ? 'var(--text)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {done && <svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', color: 'var(--text)', textDecoration: done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, padding: '1px 6px', borderRadius: '4px', background: 'var(--green-bg)', color: 'var(--green)' }}>Routine</span>
          {(() => { const s = catStyle(r.category); return <span style={{ fontSize: '10px', fontWeight: 500, padding: '1px 7px', borderRadius: '4px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{r.category}</span>; })()}
        </div>
      </div>
    </div>
  );
}

function WeekPanel({ todos, reminders, recurring, completedToday }) {
  const [mode, setMode] = useState('week');
  const days = mode === 'week' ? 7 : 10;
  const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  const daysList = Array.from({ length: days }, (_, i) => {
    const d = addDays(new Date(), i);
    const ds = dateStr(d);
    const dayTodos = todos.filter(t => t.date === ds && !t.done);
    const dayReminders = reminders.filter(r => r.from <= ds && r.to >= ds);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    return { d, ds, dayTodos, dayReminders, isWeekend, isToday: ds === TODAY };
  });

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Ausblick</div>
        <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)' }}>
          {[['week', '7 Tage'], ['10days', '10 Tage']].map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)}
              style={{ padding: '3px 10px', borderRadius: '4px', border: 'none', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif", background: mode === k ? 'var(--surface)' : 'transparent', color: mode === k ? 'var(--text)' : 'var(--text-3)', boxShadow: mode === k ? '0 1px 3px rgba(0,0,0,.08)' : 'none', transition: 'all .12s' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowY: 'auto', maxHeight: '480px' }}>
        {daysList.map(({ d, ds, dayTodos, dayReminders, isWeekend, isToday }) => {
          const total = dayTodos.length + dayReminders.length;
          return (
            <div key={ds} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: isToday ? 'var(--indigo-bg)' : isWeekend ? 'var(--bg)' : 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: total > 0 ? '6px' : 0 }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: isToday ? 'var(--indigo)' : isWeekend ? 'var(--text-3)' : 'var(--text)' }}>
                    {WEEKDAY_SHORT[d.getDay()]}
                  </span>
                  <span style={{ fontSize: '12px', color: isToday ? 'var(--indigo)' : 'var(--text-2)', marginLeft: '6px' }}>
                    {d.getDate()}. {MONTH_SHORT[d.getMonth()]}
                    {isToday && <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--indigo)', marginLeft: '6px', letterSpacing: '.05em' }}>HEUTE</span>}
                  </span>
                </div>
                {total > 0 && <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>{total}</span>}
              </div>
              {total === 0 && <div style={{ fontSize: '11px', color: 'var(--border-strong)', fontStyle: 'italic' }}>Frei</div>}
              {dayTodos.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.prio === 'high' ? 'var(--red)' : t.prio === 'mid' ? 'var(--amber)' : 'var(--green)', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.text}</span>
                </div>
              ))}
              {dayReminders.slice(0, 2).map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '2px', background: 'var(--indigo)', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--indigo)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DailyView({ todos, setTodos, reminders, recurring, completedToday, setCompletedToday, completedThisWeek, setCompletedThisWeek }) {
  const [aiSummary, setAiSummary] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const todayTodos     = todos.filter(isToday);
  const overdueTodos   = todos.filter(isOverdue);
  const todayReminders = reminders.filter(r => r.from <= TODAY && r.to >= TODAY);
  const recurringToday = recurring.filter(isDueToday);

  const isRecDone = (r) => r.frequency === 'weekonce'
    ? (completedThisWeek || []).includes(r.id)
    : completedToday.includes(r.id);

  const recurringPending = recurringToday.filter(r => !isRecDone(r));
  const recurringDone    = recurringToday.filter(r => isRecDone(r));
  const totalHeuteCount  = todayTodos.length + recurringToday.length;

  const toggleTodo = (id) => setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const toggleRec = (r) => {
    if (r.frequency === 'weekonce') {
      setCompletedThisWeek(prev => prev.includes(r.id) ? prev.filter(i => i !== r.id) : [...prev, r.id]);
    } else {
      setCompletedToday(prev => prev.includes(r.id) ? prev.filter(i => i !== r.id) : [...prev, r.id]);
    }
  };

  const now = new Date();
  const dayStr = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  const generateAIBriefing = async () => {
    const key = localStorage.getItem('anthropic_key');
    if (!key) {
      setAiSummary('Kein Anthropic API-Key hinterlegt. Bitte im Tab "Aufgaben" → KI-Assistent → ⚙ API-Key eintragen.');
      return;
    }

    setIsAiLoading(true);
    setAiSummary(null);

    const lists = [];
    if (overdueTodos.length) lists.push('ÜBERFÄLLIG:\n' + overdueTodos.map(t => `- [${t.prio}] ${t.text} (${t.cat})`).join('\n'));
    if (todayTodos.length)   lists.push('HEUTE FÄLLIG:\n' + todayTodos.filter(t => !t.done).map(t => `- [${t.prio}] ${t.text} (${t.cat})`).join('\n'));
    if (recurringPending.length) lists.push('ROUTINEN:\n' + recurringPending.map(r => `- ${r.title}`).join('\n'));
    if (todayReminders.length)   lists.push('TERMINE:\n' + todayReminders.map(r => `- ${r.text}`).join('\n'));

    const prompt = `Erstelle mir ein kurzes, motivierendes Morning Briefing auf Deutsch für Lucas Hepberger, Head of Subscription Business Management bei Russmedia (Vorarlberger Nachrichten, NEUE Magazin, VOL.AT+).

Heute ist der ${TODAY}.
Offene Aufgaben: ${todayTodos.filter(t=>!t.done).length + recurringPending.length}, Überfällig: ${overdueTodos.length}, Termine: ${todayReminders.length}

Details:
${lists.join('\n\n')}

Professioneller, aufmunternder Ton. Hebe die wichtigsten Prioritäten hervor.
Formatiere in einfachem HTML (<b>, <br>, <ul>, <li>). Kein Markdown, keine html/body Tags.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      if (data.error) {
        setAiSummary('Fehler: ' + data.error.message);
      } else {
        setAiSummary(data.content?.map(b => b.text || '').join('') || 'Keine Antwort.');
      }
    } catch (e) {
      setAiSummary('Fehler: ' + e.message);
    }
    setIsAiLoading(false);
  };

  return (
    <div className="daily-view-grid">
      <div>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '5px' }}>{dayStr}</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 400, color: 'var(--text)', lineHeight: 1.1 }}>{getGreeting()} 👋</div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '6px' }}>
              {overdueTodos.length > 0
                ? `${overdueTodos.length} überfällige Aufgabe${overdueTodos.length > 1 ? 'n' : ''} — lass uns das angehen.`
                : totalHeuteCount > 0
                  ? `${totalHeuteCount} Aufgabe${totalHeuteCount > 1 ? 'n' : ''} stehen heute an.`
                  : 'Keine Aufgaben für heute — gut gemacht! 🎉'}
            </div>
          </div>
          <button onClick={generateAIBriefing} disabled={isAiLoading}
            style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: 500, cursor: isAiLoading ? 'wait' : 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 2px 4px rgba(0,0,0,0.03)', whiteSpace: 'nowrap' }}>
            {isAiLoading ? '⏳ Generiere...' : '✨ KI Morning Briefing'}
          </button>
        </div>

        {aiSummary && (
          <div style={{ background: 'var(--blue-bg)', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', position: 'relative' }}>
            <button onClick={() => setAiSummary(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '10px' }}>✨ Dein KI-Briefing</div>
            <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: aiSummary }} />
          </div>
        )}

        <div className="daily-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
          {[
            { label: 'Heute',     n: todayTodos.filter(t => !t.done).length + recurringPending.length, color: 'var(--amber)' },
            { label: 'Überfällig',n: overdueTodos.length, color: 'var(--red)' },
            { label: 'Routinen',  n: recurringPending.length, color: 'var(--indigo)' },
            { label: 'Erledigt',  n: todos.filter(t => t.done).length, color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 300, color: s.n > 0 ? s.color : 'var(--text-3)', letterSpacing: '-.02em' }}>{s.n}</div>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {overdueTodos.length > 0 && (
          <Section title="⚠ Überfällig" count={overdueTodos.length} color="var(--red)" emptyText="">
            {overdueTodos.map(t => <TodoRow key={t.id} t={t} onToggle={toggleTodo} />)}
          </Section>
        )}

        <Section title="Heute fällig" count={totalHeuteCount} color="var(--amber)" emptyText="Keine Aufgaben für heute geplant.">
          {todayTodos.map(t => <TodoRow key={t.id} t={t} onToggle={toggleTodo} />)}
          {todayTodos.length > 0 && recurringToday.length > 0 && (
            <div style={{ padding: '6px 16px', fontSize: '10px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              🔄 Routinen
            </div>
          )}
          {recurringPending.map(r => <RecRow key={r.id} r={r} done={false} onToggle={() => toggleRec(r)} />)}
          {recurringDone.map(r => <RecRow key={r.id} r={r} done={true} onToggle={() => toggleRec(r)} />)}
        </Section>

        <Section title="Heutige Erinnerungen" count={todayReminders.length} color="var(--indigo)" emptyText="Keine Erinnerungen für heute.">
          {todayReminders.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--indigo)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text}</div>
                {r.note && <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{r.note}</div>}
              </div>
            </div>
          ))}
        </Section>
      </div>

      <div>
        <WeekPanel todos={todos} reminders={reminders} recurring={recurring} completedToday={completedToday} />
      </div>
    </div>
  );
}
