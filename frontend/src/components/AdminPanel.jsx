import { useEffect, useMemo, useState } from 'react';
import { portfolioData } from '../data';
import { fetchApi } from '../api';

const STORAGE_KEY = 'portfolioAdminData';
const ADMIN_SESSION_KEY = 'portfolioAdminAuthenticated';

const getEmptyCertificate = () => ({
  id: Date.now().toString(),
  title: '',
  issuer: '',
  date: '',
  url: '',
  description: '',
});

const readStoredPortfolio = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to read portfolio data:', error);
    return null;
  }
};

const writeStoredPortfolio = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('portfolioDataChanged'));
  } catch (error) {
    console.error('Failed to store portfolio data:', error);
  }
};

const AdminPanel = ({ isOpen, onClose }) => {
  const [adminData, setAdminData] = useState(() => readStoredPortfolio() || portfolioData);
  const [activeTab, setActiveTab] = useState('certificates');
  const [certificateDraft, setCertificateDraft] = useState(getEmptyCertificate);
  const [editingCertificateId, setEditingCertificateId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [status, setStatus] = useState('');
  const [messages, setMessages] = useState([]);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });

  const certificateCount = useMemo(() => (adminData.certificates || []).length, [adminData]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    let active = true;

    const loadPortfolio = async () => {
      setStatus('Loading...');
      try {
        const response = await fetchApi('/api/portfolio');
        const result = await response.json();
        if (active && response.ok && result.success && result.portfolio) {
          setAdminData(result.portfolio);
          writeStoredPortfolio(result.portfolio);
        }
        if (active) setStatus('');
      } catch (error) {
        console.warn('Unable to load portfolio data:', error);
        if (active) setStatus('Using local data.');
      }
    };

    loadPortfolio();

    return () => {
      active = false;
    };
  }, [isOpen, isAuthenticated]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginStatus('Checking...');

    try {
      const response = await fetchApi('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Invalid password');
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsAuthenticated(true);
      setPassword('');
      setLoginStatus('');
    } catch (error) {
      setLoginStatus(error.message || 'Login failed.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setPassword('');
    setLoginStatus('');
  };

  const saveAdminData = async (data) => {
    setStatus('Saving...');
    writeStoredPortfolio(data);

    try {
      const response = await fetchApi('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Save failed');
      }

      setAdminData(result.portfolio || data);
      writeStoredPortfolio(result.portfolio || data);
      setStatus('Saved.');
    } catch (error) {
      console.error('Portfolio save failed:', error);
      setAdminData(data);
      setStatus('Saved locally. Backend unavailable.');
    }

    setTimeout(() => setStatus(''), 3000);
  };

  const handleCertAdd = () => {
    const cert = { ...certificateDraft, id: certificateDraft.id || Date.now().toString() };
    const next = { ...(adminData || {}), certificates: [...(adminData.certificates || []), cert] };
    saveAdminData(next);
    setCertificateDraft(getEmptyCertificate());
  };

  const handleCertEdit = (cert) => {
    setCertificateDraft({ ...getEmptyCertificate(), ...cert });
    setEditingCertificateId(cert.id);
    setActiveTab('certificates');
  };

  const handleCertSave = () => {
    if (!editingCertificateId) {
      handleCertAdd();
      return;
    }

    const list = (adminData.certificates || []).map((cert) =>
      cert.id === editingCertificateId ? { ...cert, ...certificateDraft } : cert,
    );
    const next = { ...(adminData || {}), certificates: list };
    saveAdminData(next);
    setEditingCertificateId('');
    setCertificateDraft(getEmptyCertificate());
  };

  const handleCertDelete = (id) => {
    const list = (adminData.certificates || []).filter((cert) => cert.id !== id);
    const next = { ...(adminData || {}), certificates: list };
    saveAdminData(next);
  };

  const loadMessages = async () => {
    setStatus('Loading messages...');
    try {
      const response = await fetchApi('/api/admin/messages');
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to load messages');
      }
      setMessages(result.messages || []);
      setStatus('');
    } catch (error) {
      console.error('Message load failed:', error);
      setStatus('Unable to load messages.');
    }
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated || activeTab !== 'messages') return;
    const timeoutId = window.setTimeout(loadMessages, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isAuthenticated, activeTab]);

  const deleteMessage = async (id) => {
    setStatus('Deleting message...');
    try {
      const response = await fetchApi(`/api/admin/messages/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to delete message');
      }
      setMessages((current) => current.filter((message) => message.id !== id));
      setStatus('Message deleted.');
    } catch (error) {
      console.error('Message delete failed:', error);
      setStatus('Delete failed.');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setStatus('Updating password...');
    try {
      const response = await fetchApi('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Password update failed');
      }

      setPasswordForm({ oldPassword: '', newPassword: '' });
      setStatus('Password updated.');
    } catch (error) {
      setStatus(error.message || 'Password update failed.');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-950 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 rounded-lg p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-cyan-400">Secure Area</p>
            <h3 className="text-xl font-bold font-mono text-white uppercase tracking-wide">Admin Panel</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="min-h-5 text-xs font-mono text-gray-400">{status}</div>
            {isAuthenticated && (
              <button onClick={handleLogout} className="px-3 py-2 text-xs font-mono border border-gray-800 text-gray-300 hover:border-cyan-500">
                Logout
              </button>
            )}
            <button onClick={onClose} className="px-3 py-2 text-xs font-mono border border-gray-800 text-gray-300 hover:border-cyan-500">
              Close
            </button>
          </div>
        </div>

        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="max-w-sm mx-auto py-10 space-y-4">
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              className="w-full p-3 bg-gray-900 border border-gray-800 text-white font-mono focus:outline-none focus:border-cyan-500"
              placeholder="Enter password"
            />
            <button type="submit" className="w-full px-4 py-3 bg-cyan-500 text-gray-950 font-bold font-mono uppercase tracking-widest">
              Login
            </button>
            {loginStatus && <div className="text-sm font-mono text-red-400">{loginStatus}</div>}
          </form>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap gap-2">
              {[
                ['certificates', `Certificates (${certificateCount})`],
                ['projects', 'Projects'],
                ['messages', 'Messages'],
                ['settings', 'Settings'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`px-3 py-2 text-xs font-mono uppercase tracking-wider border ${
                    activeTab === id ? 'bg-cyan-500 text-gray-950 border-cyan-500' : 'text-gray-400 border-gray-800 hover:border-cyan-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'certificates' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input placeholder="Title" value={certificateDraft.title} onChange={(e) => setCertificateDraft((p) => ({ ...p, title: e.target.value }))} className="p-3 bg-gray-900 border border-gray-800 text-white font-mono" />
                  <input placeholder="Issuer" value={certificateDraft.issuer} onChange={(e) => setCertificateDraft((p) => ({ ...p, issuer: e.target.value }))} className="p-3 bg-gray-900 border border-gray-800 text-white font-mono" />
                  <input placeholder="Date" value={certificateDraft.date} onChange={(e) => setCertificateDraft((p) => ({ ...p, date: e.target.value }))} className="p-3 bg-gray-900 border border-gray-800 text-white font-mono" />
                  <input placeholder="URL" value={certificateDraft.url} onChange={(e) => setCertificateDraft((p) => ({ ...p, url: e.target.value }))} className="p-3 bg-gray-900 border border-gray-800 text-white font-mono" />
                  <textarea placeholder="Description" value={certificateDraft.description} onChange={(e) => setCertificateDraft((p) => ({ ...p, description: e.target.value }))} className="p-3 bg-gray-900 border border-gray-800 text-white font-mono md:col-span-2 min-h-24" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={handleCertSave} className="px-4 py-2 bg-cyan-500 text-gray-950 font-bold font-mono">
                    {editingCertificateId ? 'Save Certificate' : 'Add Certificate'}
                  </button>
                  {editingCertificateId && (
                    <button onClick={() => { setEditingCertificateId(''); setCertificateDraft(getEmptyCertificate()); }} className="px-4 py-2 border border-gray-800 text-gray-300 font-mono">
                      Cancel
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {(adminData.certificates || []).length === 0 ? (
                    <div className="text-sm text-gray-400">No certificates yet.</div>
                  ) : (
                    (adminData.certificates || []).map((cert) => (
                      <div key={cert.id} className="p-3 border border-gray-800 rounded flex flex-wrap items-center justify-between gap-3 bg-gray-900/40">
                        <div>
                          <div className="text-sm font-bold text-white">{cert.title || 'Untitled Certificate'}</div>
                          <div className="text-xs text-gray-400">{cert.issuer} - {cert.date}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleCertEdit(cert)} className="text-xs px-3 py-2 border border-gray-700 text-gray-200">Edit</button>
                          <button onClick={() => handleCertDelete(cert.id)} className="text-xs px-3 py-2 border border-red-500/40 text-red-300">Delete</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-3">
                <div className="text-sm text-gray-400">Projects are shown here for quick review.</div>
                {(adminData.projects || []).map((project) => (
                  <div key={project.id} className="p-3 border border-gray-800 rounded bg-gray-900/40">
                    <div className="font-bold text-white">{project.title}</div>
                    <div className="text-xs text-gray-400">{project.description}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-3">
                <button onClick={loadMessages} className="px-4 py-2 bg-cyan-500 text-gray-950 font-bold font-mono">Refresh Messages</button>
                {messages.length === 0 ? (
                  <div className="text-sm text-gray-400">No messages found.</div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="p-4 border border-gray-800 rounded bg-gray-900/40 space-y-2">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <div className="font-bold text-white">{message.name}</div>
                          <a href={`mailto:${message.email}`} className="text-xs text-cyan-300">{message.email}</a>
                        </div>
                        <button onClick={() => deleteMessage(message.id)} className="text-xs px-3 py-2 border border-red-500/40 text-red-300">Delete</button>
                      </div>
                      <div className="text-sm text-gray-200">{message.subject}</div>
                      <div className="text-sm text-gray-400">{message.message}</div>
                      <div className="text-xs text-gray-500">{message.receivedAt || message.received_at}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <form onSubmit={changePassword} className="max-w-md space-y-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={passwordForm.oldPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, oldPassword: event.target.value }))}
                  className="w-full p-3 bg-gray-900 border border-gray-800 text-white font-mono"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  className="w-full p-3 bg-gray-900 border border-gray-800 text-white font-mono"
                />
                <button type="submit" className="px-4 py-2 bg-cyan-500 text-gray-950 font-bold font-mono">Change Password</button>
              </form>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={() => saveAdminData(adminData)} className="px-4 py-2 bg-cyan-600 text-gray-950 font-bold font-mono">
                Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
