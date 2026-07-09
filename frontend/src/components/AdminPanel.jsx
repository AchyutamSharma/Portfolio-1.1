import { useEffect, useState } from 'react';
import { portfolioData } from '../data';
import { fetchApi } from '../api';

// Lightweight admin panel focused on editing certificates and saving the portfolio
const AdminPanel = ({ isOpen, onClose }) => {
  const [adminData, setAdminData] = useState(portfolioData);
  const [activeTab, setActiveTab] = useState('certificates');
  const [certificateDraft, setCertificateDraft] = useState({ id: '', title: '', issuer: '', date: '', url: '', description: '' });
  const [editingCertificateId, setEditingCertificateId] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // try to fetch persisted portfolio from server
    (async () => {
      try {
        const res = await fetchApi('/api/portfolio');
        if (res && res.portfolio) setAdminData(res.portfolio);
      } catch {
        // ignore, keep local defaults
      }
    })();
  }, []);

  const saveAdminData = async (data) => {
    setStatus('Saving...');
    try {
      await fetchApi('/api/portfolio', { method: 'POST', body: data });
      setAdminData(data);
      setStatus('Saved.');
    } catch {
      setStatus('Save failed.');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const getEmptyCertificate = () => ({ id: Date.now().toString(), title: '', issuer: '', date: '', url: '', description: '' });

  const handleCertAdd = () => {
    const cert = { ...certificateDraft, id: certificateDraft.id || Date.now().toString() };
    const next = { ...(adminData || {}), certificates: [...(adminData.certificates || []), cert] };
    saveAdminData(next);
    setCertificateDraft(getEmptyCertificate());
  };

  const handleCertEdit = (cert) => {
    setCertificateDraft(cert);
    setEditingCertificateId(cert.id);
    setActiveTab('certificates');
  };

  const handleCertSave = () => {
    if (!editingCertificateId) return handleCertAdd();
    const list = (adminData.certificates || []).map((c) => (c.id === editingCertificateId ? { ...c, ...certificateDraft } : c));
    const next = { ...(adminData || {}), certificates: list };
    saveAdminData(next);
    setEditingCertificateId('');
    setCertificateDraft(getEmptyCertificate());
  };

  const handleCertDelete = (id) => {
    const list = (adminData.certificates || []).filter((c) => c.id !== id);
    const next = { ...(adminData || {}), certificates: list };
    saveAdminData(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-3xl bg-gray-950 p-6 rounded-lg border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Admin Panel</h3>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">{status}</div>
            <button onClick={onClose} className="text-gray-400">Close</button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('certificates')} className={`px-3 py-1 text-xs ${activeTab === 'certificates' ? 'bg-cyan-500 text-black' : 'text-gray-400 border border-gray-800'}`}>Certificates</button>
            <button onClick={() => setActiveTab('projects')} className={`px-3 py-1 text-xs ${activeTab === 'projects' ? 'bg-cyan-500 text-black' : 'text-gray-400 border border-gray-800'}`}>Projects</button>
          </div>
        </div>

        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input placeholder="Title" value={certificateDraft.title} onChange={(e) => setCertificateDraft((p) => ({ ...p, title: e.target.value }))} className="p-2 bg-gray-900 border border-gray-800" />
              <input placeholder="Issuer" value={certificateDraft.issuer} onChange={(e) => setCertificateDraft((p) => ({ ...p, issuer: e.target.value }))} className="p-2 bg-gray-900 border border-gray-800" />
              <input placeholder="Date" value={certificateDraft.date} onChange={(e) => setCertificateDraft((p) => ({ ...p, date: e.target.value }))} className="p-2 bg-gray-900 border border-gray-800" />
              <input placeholder="URL" value={certificateDraft.url} onChange={(e) => setCertificateDraft((p) => ({ ...p, url: e.target.value }))} className="p-2 bg-gray-900 border border-gray-800" />
              <textarea placeholder="Description" value={certificateDraft.description} onChange={(e) => setCertificateDraft((p) => ({ ...p, description: e.target.value }))} className="p-2 bg-gray-900 border border-gray-800 md:col-span-2" />
            </div>

            <div className="flex gap-2">
              {editingCertificateId ? (
                <>
                  <button onClick={handleCertSave} className="px-4 py-2 bg-cyan-500 text-black">Save</button>
                  <button onClick={() => { setEditingCertificateId(''); setCertificateDraft(getEmptyCertificate()); }} className="px-4 py-2 border">Cancel</button>
                </>
              ) : (
                <button onClick={handleCertAdd} className="px-4 py-2 bg-cyan-500 text-black">Add Certificate</button>
              )}
            </div>

            <div className="space-y-2">
              {(adminData.certificates || []).length === 0 ? (
                <div className="text-sm text-gray-400">No certificates yet</div>
              ) : (
                (adminData.certificates || []).map((c) => (
                  <div key={c.id} className="p-3 border border-gray-800 rounded flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{c.title}</div>
                      <div className="text-xs text-gray-400">{c.issuer} • {c.date}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleCertEdit(c)} className="text-xs px-2 py-1 border">Edit</button>
                      <button onClick={() => handleCertDelete(c.id)} className="text-xs px-2 py-1 border text-red-400">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-3">
            <div className="text-sm text-gray-400">Projects list (read-only in this simplified panel)</div>
            {(adminData.projects || []).map((p) => (
              <div key={p.id} className="p-2 border border-gray-800 rounded">{p.title}</div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => saveAdminData(adminData)} className="px-4 py-2 bg-cyan-600 text-black">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
