import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-900 bg-gray-950 py-12 relative overflow-hidden reveal animate-page-fade">
      <div className="max-w-5xl mx-auto px-6 text-center space-y-4 relative z-10">
        {/* Brand logo footer block */}
        <div className="text-cyan-400 font-bold font-mono tracking-widest text-lg mb-2">&lt;Aks/&gt;</div>

        <p className="text-xs text-gray-500 font-mono">
          &copy; {currentYear} Achyutam Sharma. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
