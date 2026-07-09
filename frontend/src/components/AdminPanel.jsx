import { useEffect, useState } from 'react';
import { portfolioData } from '../data';
import { fetchApi } from '../api';

const STORAGE_KEY = 'portfolioAdminData';
const ADMIN_SESSION_KEY = 'portfolioAdminAuthenticated';

const emptyProject = () => ({
  id: Date.now().toString(),
  title: '',
  description: '',
  longDescription: '',
  tags: [],
  github: '',
  demo: '',
  category: '',
  featured: false,
});

const emptyCertificate = () => ({
  id: Date.now().toString(),
  title: '',
  issuer: '',
  date: '',
  url: '',
  description: '',
});

const emptySkill = () => ({
  name: '',
  level: 50,
  category: 'language',
  icon: '',
});

const emptyEducation = () => ({
  id: Date.now().toString(),
  degree: '',
  institution: '',
  year: '',
  gpa: '',
  description: '',
  location: '',
});

const getStoredPortfolio = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to read portfolio data:', error);
    return null;
  }
};

const storePortfolio = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('portfolioDataChanged'));
  } catch (error) {
    console.error('Failed to store portfolio data:', error);
  }
};

const tagString = (tags = []) => (Array.isArray(tags) ? tags.join(', ') : tags || '');
const parseTags = (value) => value.split(',').map((tag) => tag.trim()).filter(Boolean);

const AdminPanel = ({ isOpen, onClose }) => {
  const [adminData, setAdminData] = useState(() => getStoredPortfolio() || portfolioData);
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  const [activeTab, setActiveTab] = useState('projects');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [status, setStatus] = useState('');
  const [messages, setMessages] = useState([]);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [projectDraft, setProjectDraft] = useState(emptyProject);
  const [projectTags, setProjectTags] = useState('');
  const [editingProjectId, setEditingProjectId] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [certificateDraft, setCertificateDraft] = useState(emptyCertificate);
  const [editingCertificateId, setEditingCertificateId] = useState('');
  const [showCertificateForm, setShowCertificateForm] = useState(false);

  const updateData = (updater) => {
    setAdminData((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      storePortfolio(next);
      return next;
    });
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    let active = true;

    const loadPortfolio = async () => {
      try {
        const response = await fetchApi('/api/portfolio');
        const result = await response.json();
        if (active && response.ok && result.success && result.portfolio) {
          setAdminData(result.portfolio);
          storePortfolio(result.portfolio);
        }
      } catch (error) {
        console.warn('Unable to load portfolio data:', error);
      }
    };

    loadPortfolio();

    return () => {
      active = false;
    };
  }, [isOpen, isAuthenticated]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginStatus('AUTHENTICATING...');

    try {
      const response = await fetchApi('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'INVALID SECURITY TOKEN');
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsAuthenticated(true);
      setPassword('');
      setLoginStatus('');
    } catch (error) {
      setLoginStatus(error.message || 'AUTHENTICATION FAILED');
    }
  };

  const saveAdminData = async () => {
    setStatus('SAVING...');
    storePortfolio(adminData);

    try {
      const response = await fetchApi('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Save failed');
      }
      setStatus('SAVED');
    } catch (error) {
      console.error('Portfolio save failed:', error);
      setStatus('SAVED LOCALLY');
    }

    setTimeout(() => setStatus(''), 2500);
  };

  const startNewProject = () => {
    setProjectDraft(emptyProject());
    setProjectTags('');
    setEditingProjectId('');
    setShowProjectForm(true);
  };

  const editProject = (project) => {
    setProjectDraft({ ...emptyProject(), ...project });
    setProjectTags(tagString(project.tags));
    setEditingProjectId(project.id);
    setShowProjectForm(true);
  };

  const saveProject = () => {
    const project = { ...projectDraft, tags: parseTags(projectTags) };
    updateData((current) => ({
      ...current,
      projects: editingProjectId
        ? (current.projects || []).map((item) => (item.id === editingProjectId ? project : item))
        : [...(current.projects || []), project],
    }));
    setShowProjectForm(false);
    setEditingProjectId('');
    setProjectDraft(emptyProject());
    setProjectTags('');
  };

  const deleteProject = (id) => {
    updateData((current) => ({
      ...current,
      projects: (current.projects || []).filter((project) => project.id !== id),
    }));
  };

  const startNewCertificate = () => {
    setCertificateDraft(emptyCertificate());
    setEditingCertificateId('');
    setShowCertificateForm(true);
  };

  const editCertificate = (certificate) => {
    setCertificateDraft({ ...emptyCertificate(), ...certificate });
    setEditingCertificateId(certificate.id);
    setShowCertificateForm(true);
  };

  const saveCertificate = () => {
    updateData((current) => ({
      ...current,
      certificates: editingCertificateId
        ? (current.certificates || []).map((item) => (item.id === editingCertificateId ? certificateDraft : item))
        : [...(current.certificates || []), certificateDraft],
    }));
    setShowCertificateForm(false);
    setEditingCertificateId('');
    setCertificateDraft(emptyCertificate());
  };

  const deleteCertificate = (id) => {
    updateData((current) => ({
      ...current,
      certificates: (current.certificates || []).filter((certificate) => certificate.id !== id),
    }));
  };

  const updateProfile = (field, value) => {
    updateData((current) => ({
      ...current,
      profile: { ...(current.profile || {}), [field]: value },
    }));
  };

  const updateSkill = (index, field, value) => {
    updateData((current) => ({
      ...current,
      skills: (current.skills || []).map((skill, skillIndex) =>
        skillIndex === index ? { ...skill, [field]: field === 'level' ? Number(value) : value } : skill,
      ),
    }));
  };

  const addSkill = () => {
    updateData((current) => ({ ...current, skills: [...(current.skills || []), emptySkill()] }));
  };

  const deleteSkill = (index) => {
    updateData((current) => ({ ...current, skills: (current.skills || []).filter((_, skillIndex) => skillIndex !== index) }));
  };

  const updateEducation = (id, field, value) => {
    updateData((current) => ({
      ...current,
      education: (current.education || []).map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const addEducation = () => {
    updateData((current) => ({ ...current, education: [...(current.education || []), emptyEducation()] }));
  };

  const deleteEducation = (id) => {
    updateData((current) => ({ ...current, education: (current.education || []).filter((item) => item.id !== id) }));
  };

  const loadMessages = async () => {
    setStatus('LOADING MESSAGES...');
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
      setStatus('MESSAGE LOAD FAILED');
    }
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated || activeTab !== 'messages') return;
    const timeoutId = window.setTimeout(loadMessages, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isAuthenticated, activeTab]);

  const deleteMessage = async (id) => {
    setStatus('DELETING...');
    try {
      const response = await fetchApi(`/api/admin/messages/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to delete message');
      }
      setMessages((current) => current.filter((message) => message.id !== id));
      setStatus('DELETED');
    } catch (error) {
      console.error('Message delete failed:', error);
      setStatus('DELETE FAILED');
    }
    setTimeout(() => setStatus(''), 2500);
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setStatus('UPDATING PASSWORD...');
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
      setStatus('PASSWORD UPDATED');
    } catch (error) {
      setStatus((error.message || 'PASSWORD UPDATE FAILED').toUpperCase());
    }
    setTimeout(() => setStatus(''), 2500);
  };

  const tabs = [
    ['projects', 'PROJECTS'],
    ['profile', 'PROFILE'],
    ['skills', 'SKILLS'],
    ['education', 'EDUCATION'],
    ['resume', 'RESUME'],
    ['certificates', 'CERTIFICATES'],
    ['messages', 'MESSAGES'],
    ['password', 'PASSWORD'],
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020713]/75 p-4 font-mono backdrop-blur-md">
      {!isAuthenticated ? (
        <div className="relative w-full max-w-[715px] border border-cyan-500/20 bg-[#030813]/95 px-12 py-14 shadow-2xl shadow-cyan-500/10">
          <button onClick={onClose} className="absolute right-7 top-6 text-2xl text-gray-500 hover:text-cyan-300">
            [X]
          </button>
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-9">
              <h3 className="text-3xl font-bold uppercase tracking-[0.22em] text-white">Admin Authentication</h3>
              <p className="text-base uppercase tracking-[0.22em] text-gray-500">Enter the admin password to access the dashboard.</p>
            </div>
            <div className="space-y-4">
              <label className="block text-xl uppercase tracking-[0.28em] text-gray-600">Security Token</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
                className="h-[68px] w-full border border-gray-800 bg-[#070d1a] px-7 text-lg tracking-[0.35em] text-white outline-none focus:border-cyan-500"
                placeholder="............"
              />
            </div>
            <button type="submit" className="h-[72px] w-full bg-cyan-500 text-2xl font-bold uppercase tracking-wider text-black hover:bg-cyan-400">
              Authenticate
            </button>
            {loginStatus && <div className="text-sm uppercase tracking-widest text-red-400">{loginStatus}</div>}
          </form>
        </div>
      ) : (
        <div className="relative h-[90vh] w-full max-w-[1720px] overflow-y-auto border border-cyan-500/20 bg-[#030813]/95 px-12 py-12 shadow-2xl shadow-cyan-500/10">
          <button onClick={onClose} className="absolute right-7 top-6 text-2xl text-gray-500 hover:text-cyan-300">
            [X]
          </button>

          <div className="mb-10 flex items-start justify-between gap-6">
            <h3 className="text-3xl font-bold uppercase tracking-[0.22em] text-white">Admin Panel</h3>
            <div className="flex items-center gap-8 pr-12">
              <span className="min-w-28 text-right text-sm uppercase tracking-widest text-cyan-300">{status}</span>
              <button onClick={saveAdminData} className="text-base font-bold uppercase tracking-widest text-white hover:text-cyan-300">
                Save Changes
              </button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-3 border-b border-gray-800 pb-6">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`h-[50px] border px-6 text-base uppercase tracking-wider ${
                  activeTab === id ? 'border-cyan-500 bg-cyan-500 text-black' : 'border-gray-800 bg-transparent text-gray-400 hover:border-cyan-500 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'projects' && (
            <section className="space-y-9">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-lg font-bold uppercase tracking-[0.22em] text-white">Manage project items and upload new entries.</p>
                  <p className="mt-2 text-xl text-gray-500">Saved data is stored in your browser and applied to the portfolio display.</p>
                </div>
                <button onClick={startNewProject} className="h-[68px] bg-cyan-500 px-8 text-xl font-bold uppercase tracking-wider text-black hover:bg-cyan-400">
                  + New Project
                </button>
              </div>

              {showProjectForm && (
                <div className="grid gap-4 border border-gray-800 bg-[#070d1a] p-6 md:grid-cols-2">
                  <input placeholder="Title" value={projectDraft.title} onChange={(e) => setProjectDraft((p) => ({ ...p, title: e.target.value }))} className="admin-input" />
                  <input placeholder="Category" value={projectDraft.category} onChange={(e) => setProjectDraft((p) => ({ ...p, category: e.target.value }))} className="admin-input" />
                  <input placeholder="GitHub URL" value={projectDraft.github} onChange={(e) => setProjectDraft((p) => ({ ...p, github: e.target.value }))} className="admin-input" />
                  <input placeholder="Demo URL" value={projectDraft.demo} onChange={(e) => setProjectDraft((p) => ({ ...p, demo: e.target.value }))} className="admin-input" />
                  <textarea placeholder="Short description" value={projectDraft.description} onChange={(e) => setProjectDraft((p) => ({ ...p, description: e.target.value }))} className="admin-input min-h-24 md:col-span-2" />
                  <textarea placeholder="Long description" value={projectDraft.longDescription} onChange={(e) => setProjectDraft((p) => ({ ...p, longDescription: e.target.value }))} className="admin-input min-h-24 md:col-span-2" />
                  <input placeholder="Tags, comma separated" value={projectTags} onChange={(e) => setProjectTags(e.target.value)} className="admin-input md:col-span-2" />
                  <div className="flex gap-3 md:col-span-2">
                    <button onClick={saveProject} className="bg-cyan-500 px-6 py-3 font-bold uppercase text-black">Save Project</button>
                    <button onClick={() => setShowProjectForm(false)} className="border border-gray-700 px-6 py-3 uppercase text-white">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {(adminData.projects || []).map((project) => (
                  <article key={project.id} className="border border-gray-800 bg-[#070d1a]/60 p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0 space-y-4">
                        <p className="text-xl uppercase tracking-[0.28em] text-gray-400">{project.category || 'Project'}</p>
                        <h4 className="text-3xl font-bold text-white">{project.title || 'Untitled Project'}</h4>
                        <p className="text-xl leading-relaxed text-white">{project.longDescription || project.description}</p>
                        <p className="text-lg text-gray-600">{tagString(project.tags)}</p>
                        <div className="flex gap-4 text-base font-bold uppercase tracking-wider text-cyan-400">
                          {project.github && <a href={project.github} target="_blank" rel="noreferrer">Github</a>}
                          {project.demo && <a href={project.demo} target="_blank" rel="noreferrer">Demo</a>}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <button onClick={() => editProject(project)} className="bg-cyan-500 px-5 py-3 text-base uppercase text-black">Edit</button>
                        <button onClick={() => deleteProject(project.id)} className="border border-gray-300 px-5 py-3 text-base uppercase text-white">Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'profile' && (
            <section className="grid gap-4 md:grid-cols-2">
              {['name', 'title', 'subtitle', 'email', 'phone', 'location', 'github', 'linkedin', 'instagram'].map((field) => (
                <input key={field} placeholder={field.toUpperCase()} value={adminData.profile?.[field] || ''} onChange={(e) => updateProfile(field, e.target.value)} className="admin-input" />
              ))}
              <textarea placeholder="BIO" value={adminData.profile?.bio || ''} onChange={(e) => updateProfile('bio', e.target.value)} className="admin-input min-h-32 md:col-span-2" />
            </section>
          )}

          {activeTab === 'skills' && (
            <section className="space-y-4">
              <button onClick={addSkill} className="bg-cyan-500 px-6 py-3 font-bold uppercase text-black">+ New Skill</button>
              {(adminData.skills || []).map((skill, index) => (
                <div key={`${skill.name}-${index}`} className="grid gap-3 border border-gray-800 bg-[#070d1a]/60 p-4 md:grid-cols-[1fr_1fr_140px_80px_auto]">
                  <input placeholder="Name" value={skill.name} onChange={(e) => updateSkill(index, 'name', e.target.value)} className="admin-input" />
                  <input placeholder="Category" value={skill.category} onChange={(e) => updateSkill(index, 'category', e.target.value)} className="admin-input" />
                  <input type="number" min="0" max="100" value={skill.level} onChange={(e) => updateSkill(index, 'level', e.target.value)} className="admin-input" />
                  <input placeholder="Icon" value={skill.icon} onChange={(e) => updateSkill(index, 'icon', e.target.value)} className="admin-input" />
                  <button onClick={() => deleteSkill(index)} className="border border-gray-300 px-5 py-3 uppercase text-white">Delete</button>
                </div>
              ))}
            </section>
          )}

          {activeTab === 'education' && (
            <section className="space-y-4">
              <button onClick={addEducation} className="bg-cyan-500 px-6 py-3 font-bold uppercase text-black">+ New Education</button>
              {(adminData.education || []).map((item) => (
                <div key={item.id} className="grid gap-3 border border-gray-800 bg-[#070d1a]/60 p-4 md:grid-cols-2">
                  <input placeholder="Degree" value={item.degree} onChange={(e) => updateEducation(item.id, 'degree', e.target.value)} className="admin-input" />
                  <input placeholder="Institution" value={item.institution} onChange={(e) => updateEducation(item.id, 'institution', e.target.value)} className="admin-input" />
                  <input placeholder="Year" value={item.year} onChange={(e) => updateEducation(item.id, 'year', e.target.value)} className="admin-input" />
                  <input placeholder="GPA" value={item.gpa} onChange={(e) => updateEducation(item.id, 'gpa', e.target.value)} className="admin-input" />
                  <input placeholder="Location" value={item.location} onChange={(e) => updateEducation(item.id, 'location', e.target.value)} className="admin-input" />
                  <button onClick={() => deleteEducation(item.id)} className="border border-gray-300 px-5 py-3 uppercase text-white">Delete</button>
                  <textarea placeholder="Description" value={item.description} onChange={(e) => updateEducation(item.id, 'description', e.target.value)} className="admin-input min-h-24 md:col-span-2" />
                </div>
              ))}
            </section>
          )}

          {activeTab === 'resume' && (
            <section className="max-w-3xl space-y-4">
              <p className="text-lg font-bold uppercase tracking-[0.22em] text-white">Resume URL</p>
              <input placeholder="Resume URL" value={adminData.profile?.resumeUrl || ''} onChange={(e) => updateProfile('resumeUrl', e.target.value)} className="admin-input w-full" />
              <input placeholder="Resume file name" value={adminData.profile?.resumeFileName || ''} onChange={(e) => updateProfile('resumeFileName', e.target.value)} className="admin-input w-full" />
            </section>
          )}

          {activeTab === 'certificates' && (
            <section className="space-y-9">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-lg font-bold uppercase tracking-[0.22em] text-white">Manage certificates and credentials.</p>
                  <p className="mt-2 text-xl text-gray-500">This replaces the old FAQ section in the admin dashboard.</p>
                </div>
                <button onClick={startNewCertificate} className="h-[68px] bg-cyan-500 px-8 text-xl font-bold uppercase tracking-wider text-black hover:bg-cyan-400">
                  + New Certificate
                </button>
              </div>

              {showCertificateForm && (
                <div className="grid gap-4 border border-gray-800 bg-[#070d1a] p-6 md:grid-cols-2">
                  <input placeholder="Title" value={certificateDraft.title} onChange={(e) => setCertificateDraft((p) => ({ ...p, title: e.target.value }))} className="admin-input" />
                  <input placeholder="Issuer" value={certificateDraft.issuer} onChange={(e) => setCertificateDraft((p) => ({ ...p, issuer: e.target.value }))} className="admin-input" />
                  <input placeholder="Date" value={certificateDraft.date} onChange={(e) => setCertificateDraft((p) => ({ ...p, date: e.target.value }))} className="admin-input" />
                  <input placeholder="Credential URL" value={certificateDraft.url} onChange={(e) => setCertificateDraft((p) => ({ ...p, url: e.target.value }))} className="admin-input" />
                  <textarea placeholder="Description" value={certificateDraft.description} onChange={(e) => setCertificateDraft((p) => ({ ...p, description: e.target.value }))} className="admin-input min-h-24 md:col-span-2" />
                  <div className="flex gap-3 md:col-span-2">
                    <button onClick={saveCertificate} className="bg-cyan-500 px-6 py-3 font-bold uppercase text-black">Save Certificate</button>
                    <button onClick={() => setShowCertificateForm(false)} className="border border-gray-700 px-6 py-3 uppercase text-white">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {(adminData.certificates || []).length === 0 ? (
                  <div className="border border-gray-800 bg-[#070d1a]/60 p-8 text-xl text-gray-500">No certificates added yet.</div>
                ) : (
                  (adminData.certificates || []).map((certificate) => (
                    <article key={certificate.id} className="border border-gray-800 bg-[#070d1a]/60 p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0 space-y-4">
                          <p className="text-xl uppercase tracking-[0.28em] text-gray-400">{certificate.issuer || 'Issuer'}</p>
                          <h4 className="text-3xl font-bold text-white">{certificate.title || 'Untitled Certificate'}</h4>
                          <p className="text-xl leading-relaxed text-white">{certificate.description}</p>
                          <p className="text-lg text-gray-600">{certificate.date}</p>
                          {certificate.url && <a href={certificate.url} target="_blank" rel="noreferrer" className="text-base font-bold uppercase tracking-wider text-cyan-400">Credential</a>}
                        </div>
                        <div className="flex shrink-0 gap-3">
                          <button onClick={() => editCertificate(certificate)} className="bg-cyan-500 px-5 py-3 text-base uppercase text-black">Edit</button>
                          <button onClick={() => deleteCertificate(certificate.id)} className="border border-gray-300 px-5 py-3 text-base uppercase text-white">Delete</button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {activeTab === 'messages' && (
            <section className="space-y-4">
              <button onClick={loadMessages} className="bg-cyan-500 px-6 py-3 font-bold uppercase text-black">Refresh Messages</button>
              {messages.length === 0 ? (
                <div className="border border-gray-800 bg-[#070d1a]/60 p-8 text-xl text-gray-500">No messages found.</div>
              ) : (
                messages.map((message) => (
                  <article key={message.id} className="space-y-3 border border-gray-800 bg-[#070d1a]/60 p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <h4 className="text-2xl font-bold text-white">{message.name}</h4>
                        <a href={`mailto:${message.email}`} className="text-cyan-400">{message.email}</a>
                      </div>
                      <button onClick={() => deleteMessage(message.id)} className="border border-gray-300 px-5 py-3 uppercase text-white">Delete</button>
                    </div>
                    <p className="text-xl text-white">{message.subject}</p>
                    <p className="text-lg text-gray-500">{message.message}</p>
                    <p className="text-sm text-gray-600">{message.receivedAt || message.received_at}</p>
                  </article>
                ))
              )}
            </section>
          )}

          {activeTab === 'password' && (
            <form onSubmit={changePassword} className="max-w-xl space-y-4">
              <input type="password" placeholder="Current password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))} className="admin-input w-full" />
              <input type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} className="admin-input w-full" />
              <button type="submit" className="bg-cyan-500 px-6 py-3 font-bold uppercase text-black">Change Password</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
