import { useState } from "react";
import { portfolioData } from "../data";
import { usePortfolioData } from '../hooks/usePortfolioData';

const Projects = () => {
  const [filter, setFilter] = useState("all");
  const savedData = usePortfolioData();

  const projects = savedData.projects || portfolioData.projects;
  const categories = [
    { id: "all", name: "All Work" },
    ...Array.from(
      new Set(
        projects
          .map((project) => (project.category || "").toLowerCase())
          .filter(Boolean),
      ),
    ).map((category) => ({
      id: category,
      name: category
        .split(/[-\s]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    })),
  ];

  const filteredProjects =
    filter === "all"
      ? projects
      : projects.filter((p) => (p.category || "").toLowerCase() === filter);

  return (
    <section
      id="projects"
      className="py-24 relative overflow-hidden bg-gray-950/40 reveal"
    >
      <div className="absolute inset-0 bg-radial-cyan opacity-5 z-0 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Header tag decorations */}
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-5xl font-bold font-mono tracking-wider text-white uppercase">
            Projects
          </h3>
          <div className="w-16 h-1 bg-cyan-500 mx-auto mt-4"></div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-5 py-2 font-mono text-xs tracking-widest uppercase transition-all duration-300 rounded-none ${
                filter === cat.id
                  ? "border border-cyan-500 bg-cyan-500 text-gray-950 font-bold"
                  : "border border-gray-700 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 bg-gray-900/10"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glow-card  reveal flex flex-col h-full border border-gray-900 bg-gray-950/40 hover:border-cyan-500/30 transition-all duration-300 relative group overflow-hidden"
            >
              {/* Card Banner */}
              <div className="relative h-44 border-b border-gray-900 overflow-hidden bg-gray-900">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={`${project.title} preview`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
                    <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-500">
                      {project.category === "data"
                        ? "📊"
                        : project.category === "ml"
                          ? "🧠"
                          : "💻"}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/25"></div>
                {project.featured && (
                  <span className="absolute top-4 right-4 bg-cyan-500 text-gray-950 text-[9px] font-bold font-mono px-2 py-0.5 uppercase tracking-wider">
                    Featured
                  </span>
                )}
              </div>

              {/* Card Content */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold font-mono tracking-wide text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300 text-glow">
                    {project.title}
                  </h4>
                  <p className="text-xs font-mono text-gray-500 mb-4">
                    // {(project.category || "general").toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-400 mb-1 leading-relaxed  line-clamp-4">
                    {project.longDescription || project.description}
                  </p>
                </div>




                <div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {project.tags?.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono border border-gray-800 bg-gray-900/30 px-2 py-0.5 text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags?.length > 4 && (
                      <span className="text-[10px] font-mono border border-gray-800 bg-gray-900/30 px-2 py-0.5 text-cyan-400">
                        +{project.tags.length - 4} More
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {project.github ? (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glow-button px-4 py-2.5 border border-cyan-400 text-cyan-400 text-xs font-mono tracking-widest uppercase hover:bg-cyan-400 hover:text-gray-950 transition-all duration-300 text-center block w-full"
                    >
                      GITHUB
                    </a>
                  ) : (
                    <span className="glow-button px-4 py-2.5 border border-gray-800 text-gray-500 text-xs font-mono tracking-widest uppercase bg-gray-900/30 block w-full text-center">
                      No GitHub link
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
