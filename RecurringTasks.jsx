import React, { useState, useEffect, useRef } from 'react';
import { deriveKey, generateSalt, encrypt, decrypt, generatePassword, passwordStrength } from '../crypto';
import { vaultLoad, vaultSave } from '../firebase';

const CATEGORIES = ['Alle', 'E-Mail', 'Banking', 'Soziale Medien', 'Arbeit', 'Shopping', 'Sonstiges'];
const STRENGTH_LABELS = ['Sehr schwach', 'Schwach', 'Mittel', 'Stark', 'Sehr stark'];
const STRENGTH_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#16A34A'];

function StrengthBar({ pw }) {
  const score = passwordStrength(pw);
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= score ? STRENGTH_COLORS[score] : 'var(--border)', transition: 'background .3s' }} />
        ))}
      </div>
      {pw && <div style={{ fontSize: '10px', color: STRENGTH_COLORS[score] }}>{STRENGTH_LABELS[score]}</div>}
    </div>
  );
}

export default function PasswordVault({ userId }) {
  const [vaultState, setVaultState] = useState('loading'); // loading | locked | setup | unlocked
  const [masterPw, setMasterPw] = useState('');
  const [masterPwConfirm, setMasterPwConfirm] = useState('');
  const [masterError, setMasterError] = useState('');
  const [cryptoKey, setCryptoKey] = useState(null);
  const [salt, setSalt] = useState(null);
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fName, setFName] = useState('');
  const [fUser, setFUser] = useState('');
  const [fPw, setFPw] = useState('');
  const [fUrl, setFUrl] = useState('');
  const [fNote, setFNote] = useState('');
  const [fCat, setFCat] = useState('Sonstiges');
  const [showFormPw, setShowFormPw] = useState(false);

  useEffect(() => {
    const loadVault = async () => {
      const data = await vaultLoad(userId);
      if (!data) {
        setVaultState('setup');
      } else {
        setSalt(data.salt);
        setVaultState('locked');
      }
    };
    if (userId) loadVault();
  }, [userId]);

  const handleSetup = async (e) => {
    e.preventDefault();
    if (masterPw.length < 8) { setMasterError('Master-Passwort muss mindestens 8 Zeichen haben.'); return; }
    if (masterPw !== masterPwConfirm) { setMasterError('Passwörter stimmen nicht überein.'); return; }
    const newSalt = generateSalt();
    const key = await deriveKey(masterPw, newSalt);
    // Save empty vault with salt
    const testEncrypted = await encrypt('VAULT_OK', key);
    await vaultSave(userId, JSON.stringify({ test: testEncrypted, entries: [] }), newSalt);
    setSalt(newSalt);
    setCryptoKey(key);
    setEntries([]);
    setVaultState('unlocked');
    setMasterPw('');
    setMasterPwConfirm('');
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setMasterError('');
    try {
      const data = await vaultLoad(userId);
      if (!data) { setMasterError('Vault nicht gefunden.'); return; }
      const key = await deriveKey(masterPw, data.salt);
      const parsed = JSON.parse(data.entries);
      // Verify key by decrypting test value
      await decrypt(parsed.test, key);
      // Decrypt all entries
      const decrypted = await Promise.all(
        (parsed.entries || []).map(async (enc) => JSON.parse(await decrypt(enc, key)))
      );
      setCryptoKey(key);
      setSalt(data.salt);
      setEntries(decrypted);
      setVaultState('unlocked');
      setMasterPw('');
    } catch {
      setMasterError('Falsches Master-Passwort.');
    }
  };

  const saveEntries = async (newEntries, key, s) => {
    setSaving(true);
    const k = key || cryptoKey;
    const sl = s || salt;
    const encrypted = await Promise.all(newEntries.map(e => encrypt(JSON.stringify(e), k)));
    // Re-encrypt test value too
    const testEncrypted = await encrypt('VAULT_OK', k);
    await vaultSave(userId, JSON.stringify({ test: testEncrypted, entries: encrypted }), sl);
    setSaving(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setFName(''); setFUser(''); setFPw(''); setFUrl(''); setFNote(''); setFCat('Sonstiges');
    setShowModal(true);
  };

  const openEdit = (entry) => {
    setEditingId(entry.id);
    setFName(entry.name); setFUser(entry.username); setFPw(entry.password);
    setFUrl(entry.url || ''); setFNote(entry.note || ''); setFCat(entry.category || 'Sonstiges');
    setShowModal(true);
  };

  const handleSaveEntry = async () => {
    if (!fName.trim() || !fPw.trim()) return;
    let newEntries;
    if (editingId) {
      newEntries = entries.map(e => e.id === editingId
        ? { ...e, name: fName.trim(), username: fUser.trim(), password: fPw, url: fUrl.trim(), note: fNote.trim(), category: fCat, updated: new Date().toLocaleDateString('de-DE') }
        : e
      );
    } else {
      newEntries = [{ id: Date.now(), name: fName.trim(), username: fUser.trim(), password: fPw, url: fUrl.trim(), note: fNote.trim(), category: fCat, created: new Date().toLocaleDateString('de-DE') }, ...entries];
    }
    setEntries(newEntries);
    setShowModal(false);
    await saveEntries(newEntries);
  };

  const handleDelete = async (id) => {
    if (!confirm('Eintrag löschen?')) return;
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    await saveEntries(newEntries);
  };

  const copyToClipboard = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePwVisible = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const genPw = () => setFPw(generatePassword(20));

  const filtered = entries
    .filter(e => activeCategory === 'Alle' || e.category === activeCategory)
    .filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.username || '').toLowerCase().includes(search.toLowerCase()) || (e.url || '').toLowerCase().includes(search.toLowerCase()));

  // --- Render states ---

  if (vaultState === 'loading') {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>Vault wird geladen…</div>;
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: "'Inter', sans-serif",
    outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
  };

  if (vaultState === 'setup' || vaultState === 'locked') {
    const isSetup = vaultState === 'setup';
    return (
      <div style={{ maxWidth: '380px', margin: '40px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔐</div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '26px', fontWeight: 400 }}>
            {isSetup ? 'Vault einrichten' : 'Vault entsperren'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px', lineHeight: 1.6 }}>
            {isSetup
              ? 'Legen Sie ein Master-Passwort fest. Es wird niemals gespeichert — merken Sie es sich gut.'
              : 'Geben Sie Ihr Master-Passwort ein, um den Vault zu entsperren.'}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
          <form onSubmit={isSetup ? handleSetup : handleUnlock}>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px' }}>Master-Passwort</div>
              <input type="password" style={inputStyle} placeholder="••••••••" value={masterPw} onChange={e => setMasterPw(e.target.value)} required autoFocus
                onFocus={e => e.target.style.borderColor = 'var(--text)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              {isSetup && <StrengthBar pw={masterPw} />}
            </div>
            {isSetup && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px' }}>Bestätigen</div>
                <input type="password" style={inputStyle} placeholder="••••••••" value={masterPwConfirm} onChange={e => setMasterPwConfirm(e.target.value)} required
                  onFocus={e => e.target.style.borderColor = 'var(--text)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
            )}
            {masterError && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--red)', marginBottom: '14px' }}>
                {masterError}
              </div>
            )}
            <button type="submit" style={{ width: '100%', padding: '11px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, fontFamily: "'Inter', sans-serif", cursor: 'pointer' }}>
              {isSetup ? 'Vault erstellen' : 'Entsperren'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Unlocked vault view
  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '13px', pointerEvents: 'none' }}>⌕</span>
            <input
              style={{ ...inputStyle, paddingLeft: '30px' }}
              placeholder="Suchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            {saving ? '⟳ Speichern…' : `${entries.length} Einträge`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setVaultState('locked')} style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: '6px 12px', fontFamily: "'Inter', sans-serif" }}>
            🔒 Sperren
          </button>
          <button onClick={openAdd} style={{ fontSize: '13px', fontWeight: 500, color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '8px 16px', fontFamily: "'Inter', sans-serif" }}>
            + Neuer Eintrag
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${activeCategory === cat ? 'var(--text)' : 'transparent'}`, fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif", background: activeCategory === cat ? 'var(--text)' : 'transparent', color: activeCategory === cat ? '#fff' : 'var(--text-2)', transition: 'all .15s' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Entries list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: '13px', lineHeight: 1.7 }}>
          {entries.length === 0 ? <>Noch keine Passwörter gespeichert.<br />Klicken Sie auf „+ Neuer Eintrag".</> : 'Keine Einträge gefunden.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(entry => (
            <div key={entry.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'border-color .15s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>

              {/* Icon */}
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {entry.url ? <img src={`https://www.google.com/s2/favicons?domain=${entry.url}&sz=32`} alt="" width="20" height="20" style={{ borderRadius: '4px' }} onError={e => e.target.style.display = 'none'} /> : '🔑'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {entry.name}
                  <span style={{ fontSize: '10px', fontWeight: 500, padding: '1px 7px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>{entry.category}</span>
                </div>
                {entry.username && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '2px' }}>{entry.username}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-2)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {visiblePasswords[entry.id] ? entry.password : '•'.repeat(Math.min(entry.password.length, 16))}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => togglePwVisible(entry.id)} title={visiblePasswords[entry.id] ? 'Verbergen' : 'Anzeigen'}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: '5px 8px', fontSize: '13px', transition: 'all .15s' }}>
                  {visiblePasswords[entry.id] ? '🙈' : '👁'}
                </button>
                <button onClick={() => copyToClipboard(entry.password, entry.id)} title="Passwort kopieren"
                  style={{ background: copiedId === entry.id ? 'var(--green-bg)' : 'none', border: `1px solid ${copiedId === entry.id ? '#BBF7D0' : 'var(--border)'}`, borderRadius: '6px', cursor: 'pointer', padding: '5px 8px', fontSize: '12px', color: copiedId === entry.id ? 'var(--green)' : 'var(--text-2)', fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: 'all .15s' }}>
                  {copiedId === entry.id ? '✓' : '⎘'}
                </button>
                {entry.username && (
                  <button onClick={() => copyToClipboard(entry.username, `u-${entry.id}`)} title="Benutzername kopieren"
                    style={{ background: copiedId === `u-${entry.id}` ? 'var(--indigo-bg)' : 'none', border: `1px solid ${copiedId === `u-${entry.id}` ? '#C7D2FE' : 'var(--border)'}`, borderRadius: '6px', cursor: 'pointer', padding: '5px 8px', fontSize: '11px', color: copiedId === `u-${entry.id}` ? 'var(--indigo)' : 'var(--text-2)', fontWeight: 500, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                    {copiedId === `u-${entry.id}` ? '✓' : '@'}
                  </button>
                )}
                <button onClick={() => openEdit(entry)} title="Bearbeiten"
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: '5px 8px', fontSize: '13px', transition: 'all .15s' }}>✎</button>
                <button onClick={() => handleDelete(entry.id)} title="Löschen"
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: '5px 8px', fontSize: '13px', color: 'var(--text-3)', transition: 'all .15s' }}
                  onMouseOver={e => { e.target.style.color = 'var(--red)'; e.target.style.borderColor = '#FECACA'; }}
                  onMouseOut={e => { e.target.style.color = 'var(--text-3)'; e.target.style.borderColor = 'var(--border)'; }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-title">{editingId ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div className="modal-field" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <div className="modal-label">Service / Name *</div>
                <input className="modal-inp" type="text" placeholder="z.B. Gmail, Netflix, Bank…" value={fName} onChange={e => setFName(e.target.value)} />
              </div>
              <div className="modal-field" style={{ marginBottom: 0 }}>
                <div className="modal-label">Benutzername / E-Mail</div>
                <input className="modal-inp" type="text" placeholder="name@beispiel.de" value={fUser} onChange={e => setFUser(e.target.value)} />
              </div>
              <div className="modal-field" style={{ marginBottom: 0 }}>
                <div className="modal-label">Kategorie</div>
                <select className="modal-inp" style={{ cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }} value={fCat} onChange={e => setFCat(e.target.value)}>
                  {CATEGORIES.filter(c => c !== 'Alle').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-field">
              <div className="modal-label">Passwort *</div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input className="modal-inp" type={showFormPw ? 'text' : 'password'} placeholder="Passwort eingeben" value={fPw} onChange={e => setFPw(e.target.value)} style={{ paddingRight: '36px' }} />
                  <button onClick={() => setShowFormPw(v => !v)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '2px' }}>{showFormPw ? '🙈' : '👁'}</button>
                </div>
                <button onClick={genPw} title="Sicheres Passwort generieren"
                  style={{ padding: '9px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap', color: 'var(--text-2)', transition: 'all .15s' }}
                  onMouseOver={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.color = 'var(--text)'; }}
                  onMouseOut={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-2)'; }}>
                  🎲 Generieren
                </button>
              </div>
              {fPw && <StrengthBar pw={fPw} />}
            </div>
            <div className="modal-field">
              <div className="modal-label">Website URL</div>
              <input className="modal-inp" type="url" placeholder="https://…" value={fUrl} onChange={e => setFUrl(e.target.value)} />
            </div>
            <div className="modal-field">
              <div className="modal-label">Notizen</div>
              <textarea className="modal-inp" rows="2" style={{ resize: 'none', lineHeight: '1.55' }} placeholder="Sicherheitsfragen, PIN, Hinweise…" value={fNote} onChange={e => setFNote(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Abbrechen</button>
              <button className="btn-save" onClick={handleSaveEntry} disabled={!fName.trim() || !fPw.trim()}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
