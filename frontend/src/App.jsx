import React, { Suspense, lazy, useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ErrorBoundary from './components/ErrorBoundary';

const About = lazy(() => import('./components/About'));
const Projects = lazy(() => import('./components/Projects'));
const Skills = lazy(() => import('./components/Skills'));
const Education = lazy(() => import('./components/Education'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const ChatbotWidget = lazy(() => import('./components/ChatbotWidget'));

function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const observeRevealElements = () => {
      document.querySelectorAll('.reveal:not(.reveal-visible)').forEach((el) => {
        if (!el.dataset.revealObserved) {
          el.dataset.revealObserved = 'true';
          observer.observe(el);
        }
      });
    };

    observeRevealElements();

    const mutationObserver = new MutationObserver(() => {
      observeRevealElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative overflow-x-hidden min-h-screen bg-gray-950 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="animated-bg-overlay"></div>
      <ErrorBoundary>
        <div className="relative z-10 animate-page-fade">
          <Header onAdminClick={() => setIsAdminOpen(true)} />
          <main>
            <Hero />
            <Suspense fallback={<div className="max-w-5xl mx-auto px-6 py-24 text-center text-sm text-gray-400">Loading content...</div>}>
              <About />
              <Projects />
              <Skills />
              <Education />
              <Contact />
            </Suspense>
          </main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
          <ChatbotWidget />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;
