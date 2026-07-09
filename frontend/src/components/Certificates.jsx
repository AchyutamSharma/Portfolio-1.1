import { portfolioData } from '../data';
import { usePortfolioData } from '../hooks/usePortfolioData';

const Certificates = () => {
  const savedData = usePortfolioData();
  const certificates = (savedData && savedData.certificates) || portfolioData.certificates || [];

  if (!certificates || certificates.length === 0) return null;

  return (
    <section id="certificates" className="mt-12">
      <h4 className="text-xl font-bold font-mono text-white mb-4">Certificates</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {certificates.map((cert) => (
          <div key={cert.id || cert.title} className="p-4 border border-gray-900 bg-gray-950 rounded-md">
            <div className="text-sm font-bold text-white">{cert.title}</div>
            <div className="text-xs text-gray-400 mt-1">{cert.issuer} · {cert.year}</div>
            {cert.link && (
              <a
                href={cert.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs text-cyan-400 hover:text-cyan-300"
              >
                View Certificate ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Certificates;
