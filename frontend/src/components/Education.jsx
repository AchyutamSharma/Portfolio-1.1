import React, { useState, useEffect } from 'react';
import { portfolioData } from '../data';
import { usePortfolioData } from '../hooks/usePortfolioData';

const Education = () => {
  const savedData = usePortfolioData();

  const currentEducation = savedData.education || education;
  const currentProfile = savedData.profile || profile;

  const handleOpenResume = () => {
    if (!currentProfile.resumeUrl) return;
    const [prefix, base64] = currentProfile.resumeUrl.split(',');
    const mime = currentProfile.resumeMimeType || prefix.match(/data:([^;]+);/)?.[1] || 'application/octet-stream';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    // Open in a new tab using an anchor to avoid fallback to same-tab assignment
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke URL after short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section id="education" className="py-24 relative overflow-hidden bg-gray-950/20 reveal glow-card">
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-blue-500/5 blur-3xl pointer-events-none z-0"></div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-5xl font-bold font-mono tracking-wider text-white uppercase">
            Education
          </h3>
          <div className="w-16 h-1 bg-cyan-500 mx-auto mt-4"></div>
        </div>

        {/* Action Buttons: View Resume and Download Resume */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
          <button
            type="button"
            onClick={handleOpenResume}
            disabled={!currentProfile.resumeUrl}
            className={`group flex items-center justify-center gap-3 px-6 py-3 border border-cyan-500/50 text-cyan-400 font-mono tracking-widest uppercase text-xs transition-all duration-300 rounded-xl w-full sm:w-auto text-center ${currentProfile.resumeUrl ? 'hover:border-cyan-400 hover:bg-cyan-500/10' : 'opacity-50 cursor-not-allowed'}`}
          >
            <span>📄</span> View Resume
          </button>
          <a
            href={currentProfile.resumeUrl || '#'}
            download={currentProfile.resumeFileName || 'Resume.pdf'}
            className={`group flex items-center justify-center gap-3 px-6 py-3 bg-cyan-500 text-gray-950 font-bold font-mono tracking-widest uppercase text-xs transition-all duration-300 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/40 rounded-xl w-full sm:w-auto text-center ${currentProfile.resumeUrl ? '' : 'opacity-50 cursor-not-allowed'}`}
            aria-disabled={!currentProfile.resumeUrl}
          >
            <span>📥</span> Download Resume
          </a>
        </div>

        {/* Timeline (Original style) */}
        <div className="relative max-w-3xl mx-auto pl-8 sm:pl-10 space-y-12 timeline-path border-l border-cyan-500/20">
          {currentEducation.map((edu) => (
            <div key={edu.id} className="relative group">
              {/* Glowing Indicator Dot */}
              <div className="absolute -left-[37px] sm:-left-[45px] top-1.5 size-3.5 rounded-full border border-cyan-500 bg-gray-950 group-hover:bg-cyan-400 transition-all duration-300 shadow-md shadow-cyan-500/30"></div>

              <div className="p-6 border border-gray-900 bg-gray-950/40 hover:border-cyan-500/20 transition-all duration-300 group">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-lg font-bold font-mono text-white group-hover:text-cyan-400 transition-colors duration-300">
                      {edu.degree}
                    </h4>
                    <span className="text-xs font-mono text-cyan-500/70 block mt-1">
                      {edu.institution}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="inline-block px-3 py-1 bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
                      {edu.year}
                    </span>
                    <div className="text-[10px] text-gray-500 font-mono mt-1.5">
                      {edu.gpa} • {edu.location}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-400 font-mono leading-relaxed">
                  {edu.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Education;
