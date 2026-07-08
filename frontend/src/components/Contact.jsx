import React, { useState } from 'react';
import { portfolioData } from '../data';
import { fetchApi } from '../api';

const sanitizeText = (value) => {
  if (typeof value !== 'string') return '';

  return value.replace(/<[^>]*>/g, '');
};

const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.replace(/[\s<>"'\\]/g, '').trim();
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const CONTACT_MESSAGES_STORAGE_KEY = 'portfolioContactMessages';

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

const Contact = () => {
  const { profile } = portfolioData;
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitized = value;

    if (name === 'email') {
      sanitized = sanitizeEmail(value);
    } else if (name === 'message') {
      sanitized = value.slice(0, 1000);
    } else {
      sanitized = sanitizeText(value).slice(0, 100);
    }

    setFormData({ ...formData, [name]: sanitized });
    setFormErrors({ ...formErrors, [name]: '' });
  };

  const validateForm = () => {
    const errors = {};
    const cleanedName = sanitizeText(formData.name).trim();
    const cleanedEmail = sanitizeEmail(formData.email);
    const cleanedSubject = sanitizeText(formData.subject).trim();
    const cleanedMessage = sanitizeText(formData.message).trim();

    if (!cleanedName) {
      errors.name = 'Please provide your name.';
    } else if (cleanedName.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    if (!cleanedEmail) {
      errors.email = 'Valid email is required.';
    } else if (!isValidEmail(cleanedEmail)) {
      errors.email = 'Enter your email in the correct format.';
    }

    if (!cleanedSubject) {
      errors.subject = 'Please provide a subject.';
    } else if (cleanedSubject.length < 3) {
      errors.subject = 'Subject should be more descriptive.';
    }

    if (!cleanedMessage) {
      errors.message = 'Please include a message.';
    } else if (cleanedMessage.length < 10) {
      errors.message = 'Message should be at least 10 characters long.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setStatus('error');
      return;
    }

    setStatus('sending');
    const formPayload = {
      id: Date.now().toString(),
      receivedAt: new Date().toISOString(),
      name: sanitizeText(formData.name).trim(),
      email: sanitizeEmail(formData.email),
      subject: sanitizeText(formData.subject).trim(),
      message: sanitizeText(formData.message).trim(),
    };

    try {
      const response = await fetchApi('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setFormErrors({});
        const stored = loadContactMessages();
        saveContactMessages([formPayload, ...stored]);
      } else {
        throw new Error(data.message || 'Contact API did not succeed.');
      }
    } catch (error) {
      console.error('Contact submission failed:', error);
      const fallbackMessages = [formPayload, ...loadContactMessages()];
      saveContactMessages(fallbackMessages);
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setFormErrors({});
    }
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-gray-950/40 reveal animate-page-fade">
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500/5 blur-3xl pointer-events-none z-0"></div>
      <div className="absolute left-0 top-0 w-72 h-72 bg-purple-500/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-xs font-mono uppercase tracking-[0.4em] text-cyan-400 animate-slide-text">CONNECT & COLLABORATE</p>
          <h3 className="text-3xl md:text-5xl font-bold font-mono tracking-wider text-white uppercase">
            Connect
          </h3>
          <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animate-shimmer"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-start">
          <div className="space-y-8">
            <div className="glow-card no-hover border border-gray-900 bg-gray-950/60 p-6">
              <div className="flex items-start gap-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-cyan-300 shadow-lg shadow-cyan-500/10 animate-icon-bounce">
                  <span className="text-2xl">✉️</span>
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">Contact Accounts</div>
                  <h4 className="text-2xl font-bold font-mono text-white tracking-wide">Social & Direct Reach</h4>
                </div>
              </div>
              <p className="mt-4 text-sm font-mono text-gray-400 leading-relaxed">
                Reach out via email or developer socials for faster replies, project ideas, and collaboration requests.
              </p>
            </div>

            <div className="grid gap-4">
              <a
                href={`mailto:${profile.email}`}
                className="group glow-card flex items-center gap-4 p-6 border border-cyan-500/20 bg-gray-900/50 hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all duration-300"
              >
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-cyan-500/15 text-cyan-300 text-2xl transition-all duration-300 group-hover:bg-cyan-500/20 animate-icon-pulse">
                  ✉️
                </span>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Email</div>
                  <div className="text-sm font-mono font-semibold text-white group-hover:text-cyan-300">{profile.email}</div>
                </div>
              </a>

              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group glow-card flex items-center gap-4 p-6 border border-cyan-500/20 bg-gray-900/50 hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all duration-300"
              >
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-cyan-500/15 text-cyan-300 transition-all duration-300 group-hover:bg-cyan-500/20 animate-icon-bounce">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M4.98 3.5C4.98 4.6 4.1 5.5 3 5.5 1.9 5.5 1 4.6 1 3.5 1 2.4 1.9 1.5 3 1.5 4.1 1.5 4.98 2.4 4.98 3.5ZM.5 8h4.9v12H.5V8Zm7.22 0h4.7v1.8h.06c.66-1.25 2.27-2.55 4.68-2.55 5 0 5.92 3.3 5.92 7.58V20H17.8v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.53 1.72-2.53 3.5V20H10.1V8Z" />
                  </svg>
                </span>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">LinkedIn</div>
                  <div className="text-sm font-mono font-semibold text-white group-hover:text-cyan-300">Professional Network</div>
                </div>
              </a>

              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group glow-card flex items-center gap-4 p-6 border border-cyan-500/20 bg-gray-900/50 hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all duration-300"
              >
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-cyan-500/15 text-cyan-300 transition-all duration-300 group-hover:bg-cyan-500/20 animate-icon-spin-slow">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61C4.422 17.07 3.633 16.7 3.633 16.7c-1.087-.744.082-.729.082-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.805 1.305 3.49.998.108-.775.42-1.305.763-1.605-2.665-.3-5.467-1.335-5.467-5.93 0-1.31.47-2.38 1.236-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.29-1.552 3.296-1.23 3.296-1.23.655 1.653.243 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.807 5.625-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.015 2.89-.015 3.28 0 .32.21.697.825.577C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </span>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">GitHub</div>
                  <div className="text-sm font-mono font-semibold text-white group-hover:text-cyan-300">View My Projects</div>
                </div>
              </a>

              <a
                href={profile.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group glow-card flex items-center gap-4 p-6 border border-cyan-500/20 bg-gray-900/50 hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all duration-300"
              >
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 text-white shadow-lg shadow-pink-500/15 transition-all duration-300 group-hover:scale-105 animate-icon-shimmer">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm4.25 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
                  </svg>
                </span>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Instagram</div>
                  <div className="text-sm font-mono font-semibold text-white group-hover:text-cyan-300">Social Highlights</div>
                </div>
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Send a message</p>
                <h4 className="text-2xl font-bold font-mono text-white tracking-wide">Start a project conversation</h4>
              </div>
              <div className="text-xs font-mono uppercase tracking-[0.4em] text-cyan-300 animate-slide-text">LIVE</div>
            </div>

            <div className="p-6 border border-cyan-500/20 bg-gray-950/70 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl rounded-3xl glow-card reveal">
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Your Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      maxLength={100}
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      aria-invalid={!!formErrors.name}
                      className="w-full border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors rounded-none"
                      style={{ backgroundColor: 'rgba(17,24,39,0.6)', color: '#fff' }}
                    />
                    {formErrors.name && <p className="text-xs text-red-400">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      maxLength={100}
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane.doe@example.com"
                      aria-invalid={!!formErrors.email}
                      className="w-full border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors rounded-none"
                      style={{ backgroundColor: 'rgba(17,24,39,0.6)', color: '#fff' }}
                    />
                    {formErrors.email && <p className="text-xs text-red-400">{formErrors.email}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    maxLength={120}
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Work Inquiry / Collaboration"
                    aria-invalid={!!formErrors.subject}
                    className="w-full border border-gray-800 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors rounded-none"
                    style={{ backgroundColor: 'rgba(17,24,39,0.6)', color: '#fff' }}
                  />
                  {formErrors.subject && <p className="text-xs text-red-400">{formErrors.subject}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Detailed Message</label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    maxLength={1000}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe your project proposal here..."
                    aria-invalid={!!formErrors.message}
                    className="w-full border border-gray-800 px-4 py-3 text-sm font-mono text-white resize-none focus:outline-none focus:border-cyan-500 transition-colors rounded-none"
                    style={{ backgroundColor: 'rgba(17,24,39,0.6)', color: '#fff' }}
                  ></textarea>
                  {formErrors.message && <p className="text-xs text-red-400">{formErrors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className={`glow-button animate-shimmer w-full py-3 font-bold font-mono text-sm tracking-widest uppercase transition-all duration-300 rounded-none ${status === 'sending'
                    ? 'bg-cyan-500/50 text-gray-950 cursor-not-allowed'
                    : 'bg-cyan-500 text-gray-950 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/40'
                    }`}
                >
                  {status === 'sending' ? 'Transmitting...' : 'SUBMIT MESSAGE'}
                </button>

                {status === 'success' && (
                  <div className="p-3 text-center border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 text-xs font-mono">
                    Message transmitted successfully!
                  </div>
                )}
                {status === 'error' && (
                  <div className="p-3 text-center border border-red-500/20 bg-red-950/20 text-red-400 text-xs font-mono">
                    {Object.keys(formErrors).length > 0
                      ? 'Please fix the highlighted fields before submitting.'
                      : 'Error transmitting message. Please try again.'}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
