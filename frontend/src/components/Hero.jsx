import React, { useState } from 'react';
import { portfolioData } from '../data';
import { usePortfolioData } from '../hooks/usePortfolioData';

const Hero = () => {
  const savedData = usePortfolioData();

  const profile = savedData.profile || portfolioData.profile;

  return (
    <section
      id="home"
      className="relative overflow-hidden animate-page-fade"
      style={{ background: 'linear-gradient(to bottom, #030712, #060c1a, #030712)' }}
    >
      {/* Ambient glow blobs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none z-0 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none z-0 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* pt-20 clears ~64px fixed navbar on mobile; pt-32 gives breathing room on desktop */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24 md:pt-32 pb-16 mt-24">
        {/* Available Pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 mb-8 mt-12 md:mt-16"
          style={{ background: 'rgba(8,51,68,0.6)', backdropFilter: 'blur(20px)' }}
        >
          <span
            className="w-2 h-2 rounded-full bg-cyan-400"
            style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
          />
          <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
            Available for Opportunities
          </span>
        </div>

        {/* Hello Open Tag */}
        <span className="text-gray-500 font-mono text-sm block mb-2">&lt; Hello, I'm &gt;</span>

        {/* Name Title */}
        <h1
          className="animate-slide-text text-glow text-5xl md:text-7xl font-extrabold tracking-tight mb-4"
          style={{
            background: 'linear-gradient(to right, #ffffff, #d1d5db, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {profile.name}
        </h1>

        {/* Hello Close Tag */}
        <span className="text-gray-500 font-mono text-sm block mb-8">&lt;/ Hello &gt;</span>

        {/* Subtitle */}
        <h2 className="text-lg md:text-xl font-mono text-cyan-400 mb-6 font-semibold">
          {profile.title}
        </h2>

        <p className="text-gray-400 text-base md:text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
          {profile.subtitle} • {profile.bio}
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-16">
          <a
            href="#projects"
            className="glow-button px-8 md:px-10 py-3 md:py-5 bg-cyan-500 text-gray-950 font-bold font-mono tracking-[0.25em] uppercase text-sm md:text-base transition-all duration-300 hover:bg-cyan-400 hover:shadow-cyan-500/30 hover:shadow-xl hover:-translate-y-1 w-full sm:w-auto text-center rounded-md"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="glow-button px-8 md:px-10 py-3 md:py-5 border border-cyan-500/50 text-cyan-400 font-bold font-mono tracking-[0.25em] uppercase text-sm md:text-base hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-cyan-500/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto text-center rounded-md"
          >
            Get In Touch
          </a>
        </div>

        {/* Stats block */}
        <div className="border-t border-gray-800/80 pt-10 max-w-4xl mx-auto grid grid-cols-3 gap-4 font-mono">
          <div className="text-center">
            <div className="text-2xl mt-6 sm:text-4xl font-bold text-white tracking-tight">{profile.projectsCount}+</div>
            <div className="text-[10px] sm:text-xs text-cyan-500/70 uppercase tracking-widest mt-1">Projects</div>
          </div>
          <div className="text-center border-x border-gray-800/80">
            <div className="text-2xl sm:text-4xl font-bold text-white tracking-tight">{profile.techCount}+</div>
            <div className="text-[10px] sm:text-xs text-cyan-500/70 uppercase tracking-widest mt-1">Technologies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-4xl font-bold text-white tracking-tight">{profile.yearsExp}+</div>
            <div className="text-[10px] sm:text-xs text-cyan-500/70 uppercase tracking-widest mt-1 mb-16">Years Exp</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
