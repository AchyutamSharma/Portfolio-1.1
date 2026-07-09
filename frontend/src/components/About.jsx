import { portfolioData } from '../data';
import { usePortfolioData } from '../hooks/usePortfolioData';
import Certificates from './Certificates';

const About = () => {
  const savedData = usePortfolioData();

  const profile = savedData.profile || portfolioData.profile;

  const highlights = [
    { icon: '🎓', label: 'Education', value: 'MCA — KIIT University' },
    { icon: '📍', label: 'Location', value: profile.location },
    { icon: '💼', label: 'Focus', value: 'Data Analytics & Full-Stack' },
    { icon: '🚀', label: 'Status', value: 'Open to Opportunities' },
  ];

  return (
    <section id="about" className="py-24 relative overflow-hidden reveal glow-card">
      {/* Subtle background accent */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-5xl font-bold font-mono tracking-wider text-white uppercase">
            About Me
          </h3>
          <div className="w-16 h-1 bg-cyan-500 mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left — Bio Text */}
          <div className="space-y-6">
            <p className="text-gray-300 text-base leading-relaxed">
              I'm <span className="text-cyan-400 font-semibold">Achyutam Sharma</span>, a
              data-focused developer with a Master's in Computer Applications from KIIT University.
              I blend analytical thinking with full-stack engineering to build solutions that
              turn complex data into real-world impact.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
            I specialize in data analysis, AI-driven applications, and scalable web development with a focus on building practical and efficient solutions. I’m passionate about creating systems that combine strong functionality, clean design, and meaningful user interaction.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Outside of development, I enjoy researching new AI tools, discovering modern technologies, and working on visualization concepts that make information more engaging and accessible.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4 pt-2">
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-800 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 text-xs font-mono tracking-widest uppercase transition-all duration-300"
              >
                GitHub ↗
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-800 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 text-xs font-mono tracking-widest uppercase transition-all duration-300"
              >
                LinkedIn ↗
              </a>
            </div>
          </div>

          {/* Right — Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="p-5 border border-gray-900 bg-gray-950 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300 group glow-card"
              >
                <div className="text-2xl mb-3  text-white ">{item.icon}</div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                  {item.label}
                </div>
                <div className="text-sm font-mono text-white group-hover:text-cyan-400 transition-colors duration-300">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Certificates section (DB-backed) */}
        <div className="col-span-1 md:col-span-2">
          <Certificates />
        </div>
      </div>
    </section>
  );
};

export default About;
