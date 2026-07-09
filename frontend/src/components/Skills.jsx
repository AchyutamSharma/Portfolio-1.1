import { useEffect, useState } from 'react';
import { portfolioData } from '../data';
import { usePortfolioData } from '../hooks/usePortfolioData';

const Skills = () => {
  const savedData = usePortfolioData();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const skillCards = document.querySelectorAll('.skills-card.reveal');
    skillCards.forEach((card) => card.classList.add('reveal-visible'));
  }, [activeTab]);

  const skills = savedData.skills || portfolioData.skills;

  const categories = [
    { id: 'all', name: 'All Stack' },
    { id: 'language', name: 'Languages' },
    { id: 'framework', name: 'Frameworks' },
    { id: 'database', name: 'Databases' },
    { id: 'tool', name: 'Tools / Vis' },
  ];

  const filteredSkills = activeTab === 'all'
    ? skills
    : skills.filter(s => s.category === activeTab);

  return (
    <section id="skills" className="py-24 relative overflow-hidden bg-gray-950/20 reveal">
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-cyan-500/5 blur-3xl pointer-events-none z-0"></div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Section Heading with Typewriter element tags */}
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-5xl font-bold font-mono tracking-wider text-white uppercase">
            Tech Stack
          </h3>
          <div className="w-16 h-1 bg-cyan-500 mx-auto mt-4"></div>
        </div>

        {/* Tab Controls (Exact class styling) */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-4 py-2.5 text-xs font-mono tracking-widest uppercase transition-all duration-300 rounded-none border border-transparent ${activeTab === cat.id
                  ? 'bg-cyan-500 text-gray-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-cyan-400 border-gray-800 bg-gray-900/30'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => (
            <div
              key={skill.name}
              className="skills-card glow-card p-6 border border-gray-900 bg-gray-950/60 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300 group reveal"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-2xl ${skill.category === 'language' ? 'text-white opacity-100' : 'text-gray-200 opacity-90'}`} role="img" aria-label={skill.name}>{skill.icon}</span>
                <h4 className="text-sm font-semibold font-mono tracking-wider text-white group-hover:text-cyan-400 transition-colors duration-300">
                  {skill.name}
                </h4>
              </div>

              {/* Progress Level slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-gray-500">
                  <span>Proficiency</span>
                  <span className="text-cyan-400">{skill.level}%</span>
                </div>
                <div className="h-1 w-full bg-gray-900 rounded-none overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-out ${skill.category === 'language' ? 'skill-bar-language' : skill.category === 'framework' ? 'skill-bar-framework' : skill.category === 'database' ? 'skill-bar-database' : 'skill-bar-tool'}`}
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
