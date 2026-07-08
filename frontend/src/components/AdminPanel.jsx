import React, { useEffect, useState } from 'react';
import { portfolioData } from '../data';
import { fetchApi } from '../api';

const getEmptyProject = () => ({
  id: Date.now().toString(),
  title: '',
  description: '',
  longDescription: '',
  tags: [],
  github: '',
  demo: '',
  category: 'web',
  featured: false,
});

const getEmptySkill = () => ({
  name: '',
  level: 70,
  category: 'language',
  icon: '⚡',
});

const getEmptyEducation = () => ({
  id: Date.now().toString(),
  degree: '',
  institution: '',
  year: '',
  gpa: '',
  location: '',
  description: '',
});

const AdminPanel = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [adminData, setAdminData] = useState(portfolioData);
  const [activeTab, setActiveTab] = useState('projects');
  const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false);
  const CONTACT_MESSAGES_STORAGE_KEY = 'portfolioContactMessages';
  const DELETED_MESSAGE_IDS_STORAGE_KEY = 'portfolioDeletedMessageIds';

  const loadContactMessages = () => {
    try {
      const stored = localStorage.getItem(CONTACT_MESSAGES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load contact messages', error);
      return [];
    }
  };

  const saveContactMessages = (messages) => {
    try {
      localStorage.setItem(CONTACT_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save contact messages', error);
    }
  };

  const loadDeletedMessageIds = () => {
    try {
      const stored = localStorage.getItem(DELETED_MESSAGE_IDS_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored).map((id) => id?.toString())) : new Set();
    } catch (error) {
      console.error('Failed to load deleted message ids', error);
      return new Set();
    }
  };

  const saveDeletedMessageIds = (ids) => {
    try {
      localStorage.setItem(DELETED_MESSAGE_IDS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch (error) {
      console.error('Failed to save deleted message ids', error);
    }
  };
  const [projectDraft, setProjectDraft] = useState(getEmptyProject());
  const [skillDraft, setSkillDraft] = useState(getEmptySkill());
  const [editingSkillName, setEditingSkillName] = useState('');
  const [educationDraft, setEducationDraft] = useState(getEmptyEducation());
  const [faqDraft, setFaqDraft] = useState({ id: '', question: '', answer: '' });
  const [editingFaqId, setEditingFaqId] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadLocalData = () => {
      try {
        const stored = localStorage.getItem('portfolioAdminData');
        if (stored) {
          setAdminData(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to read saved admin data', error);
      }
    };

    const fetchServerPortfolio = async () => {
      try {
        const response = await fetchApi('/api/portfolio');
        const result = await response.json();
        if (response.ok && result.success && result.portfolio) {
          setAdminData(result.portfolio);
          localStorage.setItem('portfolioAdminData', JSON.stringify(result.portfolio));
          window.dispatchEvent(new Event('portfolioDataChanged'));
        }
      } catch (error) {
        console.warn('Unable to load portfolio from backend:', error);
      }
    };

    loadLocalData();
    fetchServerPortfolio();
  }, [isOpen]);

  const persistPortfolioData = async (data) => {
    if (!isAuthenticated) return;

    try {
      const response = await fetchApi('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        console.warn('Unable to persist portfolio data to backend:', result.message);
      }
    } catch (error) {
      console.warn('Failed to persist portfolio data to backend:', error);
    }
  };

  const saveAdminData = (data) => {
    setAdminData(data);
    try {
      localStorage.setItem('portfolioAdminData', JSON.stringify(data));
      window.dispatchEvent(new Event('portfolioDataChanged'));
    } catch (error) {
      console.error('Failed to save admin data', error);
    }

    persistPortfolioData(data);
  };

  const createBlobUrlFromDataUrl = (dataUrl, fallbackMime = 'application/octet-stream') => {
    if (!dataUrl) return null;
    const [prefix, base64] = dataUrl.split(',');
    const mime = prefix.match(/data:([^;]+);/)?.[1] || fallbackMime;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setStatus('Authenticating...');
    setIsLoading(true);

    try {
      const response = await fetchApi('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setStatus('Authenticated successfully. You can now access the dashboard.');
      } else {
        setStatus(data.message || 'ACCESS_DENIED: Invalid security credentials.');
      }
    } catch (error) {
      console.error(error);
      setStatus('Unable to reach auth server. Please verify backend configuration.');
    }

    setIsLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus('New password and confirm password must match.');
      return;
    }
    if (newPassword.length < 8) {
      setStatus('New password must be at least 8 characters.');
      return;
    }

    setStatus('Updating password...');
    setIsLoading(true);

    try {
      const response = await fetchApi('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('Password changed successfully.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatus(data.message || 'Unable to change password.');
      }
    } catch (error) {
      console.error(error);
      setStatus('Unable to reach auth server. Please verify backend configuration.');
    }

    setIsLoading(false);
  };

  const fetchMessages = async () => {
    setIsMessagesLoading(true);
    const deletedIds = loadDeletedMessageIds();

    try {
      const response = await fetchApi('/api/admin/messages');
      const data = await response.json();
      if (response.ok && data.success) {
        const messagesFromServer = (data.messages || []).filter(
          (msg) => !deletedIds.has(msg.id?.toString())
        );
        setMessages(messagesFromServer);
        saveContactMessages(data.messages || []);
      } else {
        throw new Error(data.message || 'Unable to load admin messages.');
      }
    } catch (error) {
      console.error(error);
      const stored = loadContactMessages().filter((msg) => !deletedIds.has(msg.id?.toString()));
      setMessages(stored);
      setStatus(stored.length > 0 ? 'Loaded saved messages locally.' : 'Unable to fetch messages from server.');
    }
    setIsMessagesLoading(false);
  };

  const handleMessageDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    setIsMessagesLoading(true);
    const idToRemove = messageId?.toString();

    const deleteLocally = () => {
      const updatedMessages = loadContactMessages().filter((msg) => msg.id?.toString() !== idToRemove);
      saveContactMessages(updatedMessages);
      const deletedIds = loadDeletedMessageIds();
      deletedIds.add(idToRemove);
      saveDeletedMessageIds(deletedIds);
      setMessages((prev) => prev.filter((msg) => msg.id?.toString() !== idToRemove));
    };

    try {
      const response = await fetchApi(`/api/admin/messages/${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        deleteLocally();
        setStatus('Message deleted.');
      } else {
        deleteLocally();
        setStatus(data.message || 'Message removed locally.');
      }
    } catch (error) {
      console.error(error);
      deleteLocally();
      setStatus('Message removed locally.');
    }
    setIsMessagesLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
    }
  }, [isAuthenticated]);

  const updateProfileField = (field, value) => {
    saveAdminData({
      ...adminData,
      profile: { ...adminData.profile, [field]: value },
    });
  };

  const handleProjectEdit = (project) => {
    setProjectDraft({ ...project, tags: project.tags || [] });
    setIsProjectEditorOpen(true);
    setActiveTab('projects');
    setStatus('');
  };

  const handleProjectDelete = (projectId) => {
    if (!window.confirm('Delete this project?')) return;
    saveAdminData({
      ...adminData,
      projects: adminData.projects.filter((project) => project.id !== projectId),
    });
    setStatus('Project deleted.');
  };

  const handleProjectSave = (event) => {
    event.preventDefault();
    if (!projectDraft.title.trim()) {
      setStatus('Project title is required.');
      return;
    }

    const project = {
      ...projectDraft,
      category: projectDraft.category?.trim().toLowerCase() || 'web',
      tags: typeof projectDraft.tags === 'string'
        ? projectDraft.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : projectDraft.tags,
    };

    const existingIndex = adminData.projects.findIndex((item) => item.id === project.id);
    const updatedProjects = existingIndex >= 0
      ? adminData.projects.map((item) => (item.id === project.id ? project : item))
      : [project, ...adminData.projects];

    saveAdminData({ ...adminData, projects: updatedProjects });
    setProjectDraft(getEmptyProject());
    setIsProjectEditorOpen(false);
    setStatus('Project saved successfully.');
  };

  const handleAddProject = () => {
    setProjectDraft(getEmptyProject());
    setIsProjectEditorOpen(true);
    setStatus('');
  };

  const handleSkillAdd = () => {
    if (!skillDraft.name.trim()) {
      setStatus('Skill name is required.');
      return;
    }

    saveAdminData({
      ...adminData,
      skills: [...adminData.skills, skillDraft],
    });
    setSkillDraft(getEmptySkill());
    setStatus('Skill added successfully.');
  };

  const handleSkillEdit = (skill) => {
    setSkillDraft({ ...skill });
    setEditingSkillName(skill.name);
    setStatus('Editing skill.');
    setActiveTab('skills');
  };

  const handleSkillSave = () => {
    if (!skillDraft.name.trim()) {
      setStatus('Skill name is required.');
      return;
    }

    const updatedSkills = adminData.skills.map((s) => (s.name === editingSkillName ? { ...skillDraft } : s));
    // If editingSkillName not found, append
    const exists = adminData.skills.some((s) => s.name === editingSkillName);
    const finalSkills = exists ? updatedSkills : [...adminData.skills, skillDraft];

    saveAdminData({ ...adminData, skills: finalSkills });
    setSkillDraft(getEmptySkill());
    setEditingSkillName('');
    setStatus('Skill saved successfully.');
  };

  const handleSkillCancelEdit = () => {
    setSkillDraft(getEmptySkill());
    setEditingSkillName('');
    setStatus('Edit canceled.');
  };

  const handleSkillDelete = (name) => {
    saveAdminData({
      ...adminData,
      skills: adminData.skills.filter((skill) => skill.name !== name),
    });
    setStatus('Skill removed.');
  };

  const handleEducationSave = () => {
    if (!educationDraft.degree.trim() || !educationDraft.institution.trim()) {
      setStatus('Degree and institution are required.');
      return;
    }

    const existingIndex = adminData.education.findIndex((item) => item.id === educationDraft.id);
    const updatedEducation = existingIndex >= 0
      ? adminData.education.map((item) => (item.id === educationDraft.id ? educationDraft : item))
      : [educationDraft, ...adminData.education];

    saveAdminData({ ...adminData, education: updatedEducation });
    setEducationDraft(getEmptyEducation());
    setStatus('Education entry saved.');
  };

  const handleEducationDelete = (entryId) => {
    saveAdminData({
      ...adminData,
      education: adminData.education.filter((item) => item.id !== entryId),
    });
    setStatus('Education entry deleted.');
  };

  const handleFaqAdd = () => {
    if (!faqDraft.question.trim() || !faqDraft.answer.trim()) {
      setStatus('Both Question and Answer are required.');
      return;
    }
    const newFaq = {
      id: Date.now().toString(),
      question: faqDraft.question.trim(),
      answer: faqDraft.answer.trim()
    };
    saveAdminData({
      ...adminData,
      faqs: [...(adminData.faqs || []), newFaq]
    });
    setFaqDraft({ id: '', question: '', answer: '' });
    setStatus('FAQ added successfully.');
  };

  const handleFaqEdit = (faq) => {
    setFaqDraft({ ...faq });
    setEditingFaqId(faq.id);
    setStatus('Editing FAQ.');
    setActiveTab('faq');
  };

  const handleFaqSave = () => {
    if (!faqDraft.question.trim() || !faqDraft.answer.trim()) {
      setStatus('Both Question and Answer are required.');
      return;
    }
    const updatedFaqs = (adminData.faqs || []).map((f) => 
      f.id === editingFaqId ? { ...f, question: faqDraft.question.trim(), answer: faqDraft.answer.trim() } : f
    );
    saveAdminData({ ...adminData, faqs: updatedFaqs });
    setFaqDraft({ id: '', question: '', answer: '' });
    setEditingFaqId('');
    setStatus('FAQ saved successfully.');
  };

  const handleFaqDelete = (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    saveAdminData({
      ...adminData,
      faqs: (adminData.faqs || []).filter((faq) => faq.id !== id)
    });
    setStatus('FAQ removed.');
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    setPassword('');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setStatus('');
    setMessages([]);
    setActiveTab('projects');
    setIsProjectEditorOpen(false);
    setProjectDraft(getEmptyProject());
    setSkillDraft(getEmptySkill());
    setEducationDraft(getEmptyEducation());
    setFaqDraft({ id: '', question: '', answer: '' });
    setEditingFaqId('');
    onClose();
  };

  const renderTabContent = () => {
    if (activeTab === 'profile') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Name', field: 'name', type: 'text' },
              { label: 'Title', field: 'title', type: 'text' },
              { label: 'Subtitle', field: 'subtitle', type: 'text' },
              { label: 'Email', field: 'email', type: 'email' },
              { label: 'Phone', field: 'phone', type: 'text' },
              { label: 'Location', field: 'location', type: 'text' },
              { label: 'GitHub URL', field: 'github', type: 'text' },
              { label: 'LinkedIn URL', field: 'linkedin', type: 'text' },
              { label: 'Instagram URL', field: 'instagram', type: 'text' },
              { label: 'Resume URL', field: 'resumeUrl', type: 'text' },
            ].map((item) => (
              <div key={item.field} className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                  {item.label}
                </label>
                <input
                  type={item.type}
                  value={adminData.profile[item.field] || ''}
                  onChange={(e) => updateProfileField(item.field, e.target.value)}
                  className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Bio</label>
            <textarea
              value={adminData.profile.bio || ''}
              onChange={(e) => updateProfileField('bio', e.target.value)}
              rows={4}
              className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Years Experience</label>
              <input
                type="number"
                min="0"
                value={adminData.profile.yearsExp || 0}
                onChange={(e) => updateProfileField('yearsExp', Number(e.target.value))}
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Projects Count</label>
              <input
                type="number"
                min="0"
                value={adminData.profile.projectsCount || 0}
                onChange={(e) => updateProfileField('projectsCount', Number(e.target.value))}
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Tech Count</label>
              <input
                type="number"
                min="0"
                value={adminData.profile.techCount || 0}
                onChange={(e) => updateProfileField('techCount', Number(e.target.value))}
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'skills') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Skill Name</label>
              <input
                type="text"
                value={skillDraft.name}
                onChange={(e) => setSkillDraft((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Category</label>
              <input
                list="skill-category-options"
                value={skillDraft.category}
                onChange={(e) => setSkillDraft((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Enter or choose a category"
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <datalist id="skill-category-options">
                <option value="language" />
                <option value="framework" />
                <option value="tool" />
                <option value="database" />
                <option value="design" />
                <option value="devops" />
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Level</label>
              <input
                type="number"
                min="0"
                max="100"
                value={skillDraft.level}
                onChange={(e) => setSkillDraft((prev) => ({ ...prev, level: Number(e.target.value) }))}
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Icon</label>
              <input
                type="text"
                value={skillDraft.icon}
                onChange={(e) => setSkillDraft((prev) => ({ ...prev, icon: e.target.value }))}
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {editingSkillName ? (
              <>
                <button
                  type="button"
                  onClick={handleSkillSave}
                  className="py-3 px-5 bg-cyan-500 text-gray-950 font-bold font-mono uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-300"
                >
                  Save Skill
                </button>
                <button
                  type="button"
                  onClick={handleSkillCancelEdit}
                  className="py-3 px-5 border border-gray-800 text-gray-400 font-mono uppercase tracking-[0.2em] hover:border-cyan-500 hover:text-cyan-400 transition-all duration-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSkillAdd}
                className="py-3 px-5 bg-cyan-500 text-gray-950 font-bold font-mono uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-300"
              >
                Add Skill
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminData.skills.map((skill) => (
              <div key={`${skill.name}-${skill.category}`} className="p-4 border border-gray-800 bg-gray-900/40 rounded-md">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <div className="text-lg">{skill.icon}</div>
                    <div className="text-sm font-bold text-white">{skill.name}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest">{skill.category}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSkillEdit(skill)}
                      className="text-cyan-400 text-xs font-mono hover:text-cyan-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSkillDelete(skill.name)}
                      className="text-red-400 text-xs font-mono hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-400">Level: {skill.level}%</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'education') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Degree</label>
              <input
                type="text"
                value={educationDraft.degree}
                onChange={(e) => setEducationDraft((prev) => ({ ...prev, degree: e.target.value }))}
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Institution</label>
              <input
                type="text"
                value={educationDraft.institution}
                onChange={(e) => setEducationDraft((prev) => ({ ...prev, institution: e.target.value }))}
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Year</label>
              <input
                type="text"
                value={educationDraft.year}
                onChange={(e) => setEducationDraft((prev) => ({ ...prev, year: e.target.value }))}
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">GPA / Grade</label>
              <input
                type="text"
                value={educationDraft.gpa}
                onChange={(e) => setEducationDraft((prev) => ({ ...prev, gpa: e.target.value }))}
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Location</label>
              <input
                type="text"
                value={educationDraft.location}
                onChange={(e) => setEducationDraft((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Description</label>
            <textarea
              value={educationDraft.description}
              onChange={(e) => setEducationDraft((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleEducationSave}
              className="py-3 px-5 bg-cyan-500 text-gray-950 font-bold font-mono uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-300"
            >
              Save Education
            </button>
            <button
              type="button"
              onClick={() => setEducationDraft(getEmptyEducation())}
              className="py-3 px-5 border border-gray-800 text-gray-400 font-mono uppercase tracking-[0.2em] hover:border-cyan-500 hover:text-cyan-400 transition-all duration-300"
            >
              New Entry
            </button>
          </div>

          <div className="space-y-4">
            {adminData.education.map((entry) => (
              <div key={entry.id} className="p-4 border border-gray-800 bg-gray-900/40 rounded-md">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <div className="text-sm font-bold text-white">{entry.degree}</div>
                    <div className="text-xs text-gray-400">{entry.institution} • {entry.year}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEducationDraft(entry); setStatus('Editing education entry.'); }}
                    className="text-cyan-400 text-xs font-mono hover:text-cyan-300"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-xs text-gray-500 mb-3">{entry.gpa} • {entry.location}</div>
                <p className="text-sm text-gray-400">{entry.description}</p>
                <button
                  type="button"
                  onClick={() => handleEducationDelete(entry.id)}
                  className="mt-4 text-red-400 text-xs font-mono hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'resume') {
      const resumeUrl = adminData.profile?.resumeUrl || '';
      const resumeFilename = adminData.profile?.resumeFileName || 'Resume.pdf';

      return (
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-300">Resume Management</p>
            <p className="text-[10px] text-gray-500">Upload a PDF or DOCX resume here and remove it when you want to refresh portfolio content.</p>
          </div>

          <div className="p-6 border border-gray-800 bg-gray-900/40 rounded-3xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Upload Resume</label>
              <input
                type="file"
                accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    saveAdminData({
                      ...adminData,
                      profile: {
                        ...adminData.profile,
                        resumeUrl: reader.result,
                        resumeFileName: file.name,
                        resumeMimeType: file.type || (file.name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf'),
                      },
                    });
                    setStatus(`Uploaded resume: ${file.name}`);
                  };
                  reader.readAsDataURL(file);
                }}
                className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-cyan-500/30 file:bg-cyan-500/10 file:text-cyan-200 hover:file:bg-cyan-500/20"
              />
            </div>

            {resumeUrl ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-4 border border-cyan-500/20 rounded-2xl bg-gray-950/70">
                  <div>
                    <p className="text-sm font-mono text-white">Current Resume</p>
                    <p className="text-xs text-gray-400">{resumeFilename}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const url = createBlobUrlFromDataUrl(resumeUrl, adminData.profile?.resumeMimeType || 'application/octet-stream');
                        if (url) {
                          // Open in new tab via anchor to avoid same-tab fallback
                          const a = document.createElement('a');
                          a.href = url;
                          a.target = '_blank';
                          a.rel = 'noopener noreferrer';
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                        }
                      }}
                      className="px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] bg-cyan-500 text-gray-950 hover:bg-cyan-400 transition-all duration-200"
                    >
                      View
                    </button>
                    <a
                      href={resumeUrl}
                      download={resumeFilename}
                      className="px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] border border-gray-800 text-gray-300 hover:border-cyan-500 hover:text-cyan-200 transition-all duration-200"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        saveAdminData({
                          ...adminData,
                          profile: {
                            ...adminData.profile,
                            resumeUrl: '',
                            resumeFileName: '',
                            resumeMimeType: '',
                          },
                        });
                        setStatus('Resume removed.');
                      }}
                      className="px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] border border-red-500 text-red-300 hover:text-white hover:border-red-400 transition-all duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-xs text-gray-400 border border-dashed border-gray-700 rounded">No resume uploaded yet.</div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'projects') {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-cyan-300">Manage project items and upload new entries.</p>
              <p className="text-[10px] text-gray-500">Saved data is stored in your browser and applied to the portfolio display.</p>
            </div>
            <button
              type="button"
              onClick={handleAddProject}
              className="py-3 px-5 bg-cyan-500 text-gray-950 font-bold font-mono uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-300"
            >
              + New Project
            </button>
          </div>

          {isProjectEditorOpen && (
            <form onSubmit={handleProjectSave} className="border border-gray-800 bg-gray-900/40 p-6 rounded-md space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Title</label>
                  <input
                    type="text"
                    value={projectDraft.title}
                    onChange={(e) => setProjectDraft((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Category</label>
                  <input
                    type="text"
                    placeholder="Enter category (e.g. web, ml, data)"
                    value={projectDraft.category}
                    onChange={(e) => setProjectDraft((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Short Description</label>
                  <input
                    type="text"
                    value={projectDraft.description}
                    onChange={(e) => setProjectDraft((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">GitHub URL</label>
                  <input
                    type="text"
                    value={projectDraft.github}
                    onChange={(e) => setProjectDraft((prev) => ({ ...prev, github: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Long Description</label>
                <textarea
                  rows={4}
                  value={projectDraft.longDescription}
                  onChange={(e) => setProjectDraft((prev) => ({ ...prev, longDescription: e.target.value }))}
                  className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Demo URL</label>
                  <input
                    type="text"
                    value={projectDraft.demo}
                    onChange={(e) => setProjectDraft((prev) => ({ ...prev, demo: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(projectDraft.tags) ? projectDraft.tags.join(', ') : projectDraft.tags}
                    onChange={(e) => setProjectDraft((prev) => ({ ...prev, tags: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
                <label className="inline-flex items-center gap-2 text-xs font-mono text-gray-400">
                  <input
                    type="checkbox"
                    checked={projectDraft.featured}
                    onChange={(e) => setProjectDraft((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="accent-cyan-500"
                  />
                  Featured
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="py-3 px-5 bg-cyan-500 text-gray-950 font-bold font-mono uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-300"
                >
                  Save Project
                </button>
                <button
                  type="button"
                  onClick={() => { setIsProjectEditorOpen(false); setProjectDraft(getEmptyProject()); }}
                  className="py-3 px-5 border border-gray-800 text-gray-400 font-mono uppercase tracking-[0.2em] hover:border-cyan-500 hover:text-cyan-400 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {adminData.projects.map((project) => (
              <div key={project.id} className="border border-gray-800 bg-gray-900/40 p-4 rounded-md">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-mono text-gray-400 uppercase tracking-widest">{project.category}</p>
                    <h4 className="text-lg font-bold font-mono text-white">{project.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleProjectEdit(project)}
                      className="px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] bg-cyan-500 text-gray-950 hover:bg-cyan-400 transition-all duration-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProjectDelete(project.id)}
                      className="px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] border border-red-600 text-red-300 hover:text-white transition-all duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {project.image && (
                  <div className="mb-4 overflow-hidden rounded-lg border border-gray-800 bg-black/40">
                    <img
                      src={project.image}
                      alt={`${project.title} preview`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-gray-300 mb-3">{project.description}</p>
                <p className="text-xs text-gray-500 mb-3">{project.tags?.join(', ')}</p>
                <div className="flex flex-wrap gap-2">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noreferrer" className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 hover:text-cyan-200">
                      GitHub
                    </a>
                  )}
                  {project.demo && (
                    <a href={project.demo} target="_blank" rel="noreferrer" className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 hover:text-cyan-200">
                      Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'messages') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-cyan-300">Admin Messages</p>
              <p className="text-[10px] text-gray-500">Review contact submissions from the portfolio site.</p>
            </div>
            <button
              type="button"
              onClick={fetchMessages}
              disabled={isMessagesLoading}
              className="px-3 py-2 text-xs font-mono uppercase tracking-[0.3em] text-white bg-cyan-500 hover:bg-cyan-400 transition-all duration-200 disabled:opacity-50"
            >
              {isMessagesLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {messages.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-700 rounded">
              No messages yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div key={msg.id} className="p-3 border border-gray-800 bg-gray-950/80 rounded-md">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 uppercase tracking-[0.3em]">
                        <span>{new Date(msg.receivedAt).toLocaleString()}</span>
                        <span>•</span>
                        <span>{msg.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMessageDelete(msg.id)}
                        className="text-red-400 text-xs font-mono uppercase tracking-[0.2em] hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="text-sm font-bold text-white">{msg.subject}</div>
                    <div className="text-xs text-gray-400">From: {msg.name}</div>
                    <p className="mt-2 text-sm text-gray-200 whitespace-pre-line">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'password') {
      return (
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest">Change the admin password here.</p>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-cyan-500 text-gray-950 font-bold font-mono uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'CHANGE PASSWORD'}
          </button>
        </form>
      );
    }

    if (activeTab === 'faq') {
      const faqsList = adminData.faqs || [];
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 border border-gray-800 bg-gray-900/40 p-6 rounded-md">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Question</label>
              <input
                type="text"
                placeholder="How long have you been coding?"
                value={faqDraft.question}
                onChange={(e) => setFaqDraft((prev) => ({ ...prev, question: e.target.value }))}
                className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Answer</label>
              <textarea
                rows={3}
                placeholder="I started coding in 2020..."
                value={faqDraft.answer}
                onChange={(e) => setFaqDraft((prev) => ({ ...prev, answer: e.target.value }))}
                className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3">
              {editingFaqId ? (
                <>
                  <button
                    type="button"
                    onClick={handleFaqSave}
                    className="py-3 px-5 bg-cyan-500 text-gray-950 font-bold font-mono uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-300"
                  >
                    Save FAQ
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFaqDraft({ id: '', question: '', answer: '' }); setEditingFaqId(''); setStatus(''); }}
                    className="py-3 px-5 border border-gray-800 text-gray-400 font-mono uppercase tracking-[0.2em] hover:border-cyan-500 hover:text-cyan-400 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleFaqAdd}
                  className="py-3 px-5 bg-cyan-500 text-gray-950 font-bold font-mono uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-300"
                >
                  Add FAQ
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {faqsList.length === 0 ? (
              <div className="p-4 text-xs text-gray-400 border border-dashed border-gray-700 rounded">No custom Q&A pairs added yet.</div>
            ) : (
              faqsList.map((faq) => (
                <div key={faq.id} className="p-4 border border-gray-800 bg-gray-900/40 rounded-md">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="space-y-1">
                      <div className="text-xs font-mono uppercase tracking-widest text-cyan-300">Question</div>
                      <div className="text-sm font-bold text-white">{faq.question}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleFaqEdit(faq)}
                        className="text-cyan-400 text-xs font-mono hover:text-cyan-300"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFaqDelete(faq.id)}
                        className="text-red-400 text-xs font-mono hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-mono uppercase tracking-widest text-gray-500">Answer</div>
                    <p className="text-sm text-gray-300">{faq.answer}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  const panelWidthClass = isAuthenticated ? 'w-full max-w-6xl' : 'w-50% max-w-md';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 ">
      <div className={`${panelWidthClass} border border-cyan-500/20 bg-gray-950 p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto reveal animate-page-fade rounded-xl`}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-cyan-400 font-mono text-sm"
        >
          [X]
        </button>

        <h3 className="text-lg font-bold font-mono tracking-widest text-white uppercase mb-6">
          {isAuthenticated ? 'Admin Panel' : 'Admin Authentication'}
        </h3>

        {!isAuthenticated && (
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">
            Enter the admin password to access the dashboard.
          </p>
        )}

        {isAuthenticated ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-800 pb-4">
              {['projects', 'profile', 'skills', 'education', 'resume', 'faq', 'messages', 'password'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-mono uppercase tracking-[0.3em] transition-all duration-200 ${activeTab === tab ? 'bg-cyan-500 text-gray-950' : 'text-gray-400 border border-gray-800 hover:border-cyan-500 hover:text-cyan-300'}`}
                >
                  {tab === 'projects'
                    ? 'Projects'
                    : tab === 'profile'
                    ? 'Profile'
                    : tab === 'skills'
                    ? 'Skills'
                    : tab === 'education'
                    ? 'Education'
                    : tab === 'resume'
                    ? 'Resume'
                    : tab === 'faq'
                    ? 'FAQ'
                    : tab === 'messages'
                    ? 'Messages'
                    : 'Password'}
                </button>
              ))}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => { saveAdminData(adminData); setStatus('All changes saved.'); }}
                  className="px-3 py-2 text-xs font-mono uppercase tracking-[0.3em] bg-cyan-600 text-white hover:bg-cyan-500 transition-all duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {renderTabContent()}
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Security Token</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full bg-gray-900/40 border border-gray-800 px-4 py-3 text-sm font-mono text-white placeholder-gray-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-cyan-500 text-gray-950 font-bold font-mono text-base tracking-[0.2em] uppercase hover:bg-cyan-400 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 rounded-xl"
            >
              {isLoading ? 'Authenticating...' : 'AUTHENTICATE'}
            </button>
          </form>
        )}

        {status && (
          <div className={`p-3 text-center border ${isAuthenticated ? 'border-green-500/20 bg-green-950/20 text-green-400' : 'border-red-500/20 bg-red-950/20 text-red-400'} text-xs font-mono mt-4`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
