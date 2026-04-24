import React, { useState, useEffect } from 'react';
import { TODAY } from '../utils';

// Lucas's Anthropic API Key ist hier voreingestellt
// Du kannst ihn jederzeit über ⚙ ändern
const DEFAULT_API_KEY = '';

export default function AIAssistant({ todos }) {
  const [apiKey, setApiKey] = useState('');
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [aiBoxContent, setAiBoxContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const k = localStorage.getItem('anthropic_key') || DEFAULT_API_KEY;
    if (k) setApiKey(k);
  }, []);

  const saveKey = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('anthropic_key', apiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const execAiAction = async (type) => {
    const key = localStorage.getItem('anthropic_key') || DEFAULT_API_KEY;
    if (!key) {
      setAiBoxContent('<span style="color:var(--red);font-size:13px">Bitte zuerst den API-Key unter ⚙ eintragen.</span>');
      setShowKeyPanel(true);
      return;
    }

    const open = todos.filter(t => !t.done);
    if (!open.length) {
      setAiBoxContent('<span style="font-size:13px;color:var(--text-2)">Keine offenen Aufgaben — du bist auf dem neuesten Stand.</span>');
      return;
    }

    const list = open.map((t, i) =>
      `${i + 1}. [${t.prio === 'high' ? 'HOCH' : t.prio === 'mid' ? 'MITTEL' : 'NIEDRIG'}] ${t.text}${t.date ? ` (Fällig: ${t.date})` : ''} – ${t.cat}`
    ).join('\n');

    const prompts = {
      prio: `Hier sind meine offenen Arbeitsaufgaben im Bereich Subscription Business Management bei Russmedia:\n\n${list}\n\nBitte analysiere und priorisiere diese für mich. Was soll ich zuerst angehen und warum? Antworte kurz und klar auf Deutsch.`,
      plan: `Meine offenen Aufgaben für heute (${TODAY}):\n\n${list}\n\nErstelle mir einen realistischen Tagesplan mit Zeitblöcken. Antworte auf Deutsch.`,
      focus: `Ich habe ${open.length} offene Aufgaben. Welche EINE soll ich jetzt sofort angehen? Begründe kurz auf Deutsch.\n\n${list}`,
      status: `Erstelle eine kurze professionelle Status-E-Mail für mein Team basierend auf diesen ${open.length} offenen Aufgaben:\n\n${list}\n\nKurz, sachlich, professionell. Auf Deutsch.`,
    };

    setIsLoading(true);
    setAiBoxContent(null);

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
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompts[type] }]
        })
      });
      const data = await res.json();
      if (data.error) {
        setAiBoxContent('Fehler: ' + data.error.message);
      } else {
        setAiBoxContent(data.content?.map(b => b.text || '').join('') || 'Keine Antwort.');
      }
    } catch (e) {
      setAiBoxContent('Fehler: ' + e.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="ai-head">
        <div className="section-label" style={{ margin: 0 }}>KI-Assistent</div>
        <button className="key-toggle" onClick={() => setShowKeyPanel(!showKeyPanel)}>⚙ API-Key</button>
      </div>

      <div className="ai-btns">
        <button className="ai-btn" onClick={() => execAiAction('prio')} disabled={isLoading}>Priorisieren</button>
        <button className="ai-btn" onClick={() => execAiAction('plan')} disabled={isLoading}>Tagesplan</button>
        <button className="ai-btn" onClick={() => execAiAction('focus')} disabled={isLoading}>Was zuerst?</button>
        <button className="ai-btn" onClick={() => execAiAction('status')} disabled={isLoading}>Status-E-Mail</button>
      </div>

      {(isLoading || aiBoxContent) && (
        <div id="ai-box">
          {isLoading ? (
            <div className="ai-result">
              <div className="ai-result-kicker">Assistent denkt nach</div>
              <div className="dots">
                <div className="dot"></div><div className="dot"></div><div className="dot"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="ai-result">
                <div className="ai-result-kicker">Antwort</div>
                <div className="ai-result-text" dangerouslySetInnerHTML={{ __html: aiBoxContent }}></div>
              </div>
              <button className="ai-close" onClick={() => setAiBoxContent(null)}>Schließen</button>
            </>
          )}
        </div>
      )}

      {showKeyPanel && (
        <div className="key-panel">
          <div className="key-desc">
            Anthropic API-Key von <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a> — API Keys → Create Key
          </div>
          <div className="key-row">
            <input
              className="key-input"
              type="password"
              placeholder="sk-ant-api03-…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button className="key-save" onClick={saveKey}>Speichern</button>
          </div>
          {keySaved && <div className="key-ok" style={{ display: 'block' }}>Gespeichert ✓</div>}
        </div>
      )}
    </div>
  );
}
