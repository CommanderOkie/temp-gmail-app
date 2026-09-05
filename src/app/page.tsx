'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [emailData, setEmailData] = useState<{ email: string; inbox_id: string; tok: string } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  
  const [savedInboxes, setSavedInboxes] = useState<any[]>([]);
  const [showVault, setShowVault] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const router = useRouter();

  // 1. Fetch user session
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login');
        } else {
          setUser(data.user);
          fetchVault();
        }
        setLoadingUser(false);
      });
  }, []);

  const fetchVault = async () => {
    try {
      const res = await fetch('/api/vault');
      const data = await res.json();
      if (data.savedInboxes) {
        // kv.lrange returns an array. Depending on how it's stored, it might be objects or JSON strings.
        // If they are JSON strings, parse them.
        const parsed = data.savedInboxes.map((i: any) => typeof i === 'string' ? JSON.parse(i) : i);
        setSavedInboxes(parsed);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const generateEmail = async () => {
    setLoading(true);
    setMessages([]);
    try {
      const res = await fetch('/api/generate', { method: 'POST' });
      const data = await res.json();
      if (data.email) {
        setEmailData(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const saveToVault = async () => {
    if (!emailData) return;
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });
      if (res.ok) {
        fetchVault();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFromVault = async (inbox_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/vault?inbox_id=${inbox_id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVault();
        if (emailData?.inbox_id === inbox_id) {
          setEmailData(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSavedInbox = (inbox: any) => {
    setEmailData(inbox);
    setMessages([]);
    setShowVault(false);
  };

  const copyToClipboard = () => {
    if (emailData) {
      navigator.clipboard.writeText(emailData.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (!emailData) return;

    let interval = setInterval(async () => {
      setPolling(true);
      try {
        const res = await fetch(`/api/messages?inbox_id=${emailData.inbox_id}&tok=${encodeURIComponent(emailData.tok)}`);
        const data = await res.json();
        if (data.messages) {
          setMessages(prev => {
            const newMsgs = [...prev];
            for (const m of data.messages) {
              if (!newMsgs.find(existing => existing.id === m.id)) {
                newMsgs.push(m);
              }
            }
            return newMsgs.sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
          });
        }
      } catch (err) {
        console.error(err);
      }
      setPolling(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [emailData]);

  if (loadingUser) {
    return <div style={{ textAlign: 'center', marginTop: '20vh' }}><span className="spinner"></span></div>;
  }

  const isSaved = emailData && savedInboxes.some(i => i.inbox_id === emailData.inbox_id);

  return (
    <div className="container" style={{ position: 'relative' }}>
      
      {/* Top Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Hi, {user?.username}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowVault(!showVault)}>
            🗄️ Vault ({savedInboxes.length})
          </button>
          <button className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Vault Dropdown */}
      {showVault && (
        <div className="glass-card" style={{ position: 'absolute', top: '4rem', right: '0', width: '350px', zIndex: 10, padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Saved Inboxes</h3>
          {savedInboxes.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No saved inboxes yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {savedInboxes.map(inbox => (
                <div key={inbox.inbox_id} 
                  onClick={() => loadSavedInbox(inbox)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', cursor: 'pointer', border: emailData?.inbox_id === inbox.inbox_id ? '1px solid var(--primary)' : '1px solid transparent' }}>
                  <div style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inbox.email}</div>
                  <button onClick={(e) => deleteFromVault(inbox.inbox_id, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <header>
        <h1>Inbox Nexus</h1>
        <p className="subtitle">Premium Temporary Gmail Generator</p>
      </header>

      <div className="glass-card">
        {!emailData ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <button className="btn" onClick={generateEmail} disabled={loading} style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
              {loading ? <span className="spinner"></span> : '✨ Generate New Gmail'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Your Temporary Address</div>
              {isSaved ? (
                <div style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 'bold' }}>⭐ Saved</div>
              ) : (
                <button onClick={saveToVault} style={{ background: 'transparent', border: 'none', color: '#fbbf24', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  ☆ Save to Vault
                </button>
              )}
            </div>
            
            <div className="email-display">
              <span className="email-text">{emailData.email}</span>
              <button className="btn-icon" onClick={copyToClipboard} title="Copy to clipboard" style={{ border: 'none', color: '#fff', cursor: 'pointer' }}>
                {copied ? '✅' : '📋'}
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button className="btn" onClick={generateEmail} disabled={loading} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {loading ? <span className="spinner" style={{ width: '16px', height: '16px' }}></span> : 'Generate Another'}
              </button>
            </div>
          </div>
        )}
      </div>

      {emailData && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Inbox</h2>
            <div className="status-indicator">
              <div className="dot"></div>
              {polling ? 'Syncing...' : 'Auto-refreshing'}
            </div>
          </div>

          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <div>Waiting for incoming emails...</div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>They will appear here automatically.</div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="message-item">
                  <div className="msg-header">
                    <div>
                      <div className="msg-subject">{msg.subject || msg.Subject || 'No Subject'}</div>
                      <div className="msg-from">{msg.from || msg.sender || JSON.stringify(msg)}</div>
                    </div>
                    <div className="msg-date">
                      {msg.date || msg.created_at || msg.createdAt || msg.time || 'Unknown Date'}
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
                        Keys: {Object.keys(msg).join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="msg-body" style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', padding: 0 }}>
                    <iframe 
                      srcDoc={msg.body || msg.html || msg.body_html || msg.text || msg.body_text || JSON.stringify(msg, null, 2)}
                      style={{ width: '100%', height: '500px', border: 'none', display: 'block' }}
                      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                      title="Email Content"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
