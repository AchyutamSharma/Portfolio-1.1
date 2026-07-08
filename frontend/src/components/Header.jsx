import React, { useState, useEffect } from 'react';

const Header = ({ onAdminClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Projects', href: '#projects' },
    { name: 'Skills', href: '#skills' },
    { name: 'Education', href: '#education' },
    { name: 'Connect', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 nav-blur backdrop-blur-xl border-b transition-all duration-300 ${
        scrolled
          ? 'border-cyan-500/20 bg-gray-950/95 shadow-lg shadow-black/40'
          : 'border-transparent bg-gray-950/70'
      }`}
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between py-3">
        {/* Brand Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-bold font-mono tracking-widest text-xl text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
        >
          &lt;Aks/&gt;
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="relative px-4 py-2 text-sm font-mono tracking-widest uppercase text-gray-400 hover:text-cyan-300 hover:-translate-y-1 transition-all duration-300 group"
              >
                {item.name}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-cyan-400 group-hover:w-3/4 transition-all duration-300" />
              </a>
            ))}
          </nav>

          <button
            onClick={onAdminClick}
            className="pl-4 border-l border-gray-800 text-gray-600 hover:text-cyan-400 transition-colors duration-200 text-sm font-mono"
            title="Admin Panel"
          >
            ⚙
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-gray-400 hover:text-cyan-400 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-cyan-500/10 py-6 px-6 flex flex-col gap-4 bg-gray-950/98"
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-mono tracking-widest uppercase text-gray-400 hover:text-cyan-300 transition-colors duration-200"
            >
              {item.name}
            </a>
          ))}
          <div className="pt-4 border-t border-gray-800 flex justify-end">
            <button
              onClick={() => { setMobileMenuOpen(false); onAdminClick(); }}
              className="text-gray-600 hover:text-cyan-400 text-xs font-mono transition-colors duration-200"
            >
              Admin Panel ⚙
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
