import { useState, useEffect, useRef } from "react";
import { usePortfolioData } from '../hooks/usePortfolioData';
import { fetchApi } from '../api';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pData = usePortfolioData();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am Achyutam's AI Assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [limit, setLimit] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [topicHits, setTopicHits] = useState({
    projects: 0,
    skills: 0,
    contact: 0,
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    document.documentElement.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [messages, isTyping]);

  const fetchCsrfToken = async () => {
    const result = await fetchApi('/api/csrf-token', {
      credentials: "include",
    });
    if (!result.ok) {
      throw new Error("Unable to obtain CSRF token");
    }
    const data = await result.json();
    return data.csrfToken;
  };

  const handleSend = async (e, textOverride = "") => {
    if (e) e.preventDefault();
    const queryText = (textOverride || input).trim();
    if (!queryText) return;

    if (limit >= 10) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: queryText },
        {
          role: "assistant",
          content: `You have reached the session AI query limit! Let's connect directly instead. You can email me at ${pData.profile?.email || "akshubusiness187@gmail.com"} or find me on LinkedIn.`,
          isRateLimitCard: true,
        },
      ]);
      setInput("");
      return;
    }

    const userMessage = { role: "user", content: queryText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLimit((prev) => prev + 1);
    setIsTyping(true);

    const lowerQuery = queryText.toLowerCase();
    let updatedHits = { ...topicHits };
    if (lowerQuery.includes("project")) updatedHits.projects += 1;
    if (lowerQuery.includes("skill") || lowerQuery.includes("tech"))
      updatedHits.skills += 1;
    if (
      lowerQuery.includes("contact") ||
      lowerQuery.includes("email") ||
      lowerQuery.includes("reach")
    )
      updatedHits.contact += 1;
    setTopicHits(updatedHits);

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetchApi('/api/chat', {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          message: queryText,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        throw new Error(errorText);
      }
      const data = await response.json();
      if (response.ok && data.success) {
        let reply = data.reply;

        if (lowerQuery.includes("project") && updatedHits.projects > 1) {
          reply += `\n\n💡 Shortcut: You can browse all my repositories on GitHub: ${pData.profile?.github || "https://github.com/AchyutamSharma"}`;
        } else if (
          (lowerQuery.includes("skill") || lowerQuery.includes("tech")) &&
          updatedHits.skills > 1
        ) {
          reply += `\n\n💡 Tip: Scroll down to the Skills section on this page to see interactive level charts!`;
        } else if (
          (lowerQuery.includes("contact") || lowerQuery.includes("email")) &&
          updatedHits.contact > 1
        ) {
          reply += `\n\n💡 Connect Directly: Email me at ${pData.profile?.email || "akshubusiness187@gmail.com"} or message me on LinkedIn.`;
        }

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } else {
        throw new Error(data.message || "Failed to fetch response");
      }
    } catch (error) {
      console.error("Chat request failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I ran into an issue connecting to the chat helper. Feel free to connect via the contact form above!",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const triggerSuggestion = (text) => {
    handleSend(null, text);
  };

  return (
    <div
      className="fixed bottom-6 right-6 md:right-8 z-[9999] font-mono animate-page-fade"
      style={{ zIndex: 9999 }}
    >
      {/* Floating Trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="glow-button w-16 h-16 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 flex items-center justify-center shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:scale-110"
        >
          <span className="text-3xl">🤖</span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div
          className="relative animate-chat-scale border border-cyan-500/20 rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          style={{
            backgroundColor: "#05060f",
            boxShadow: "0 25px 50px -12px rgba(8, 145, 178, 0.6)",
            width: "min(24rem, calc(100vw - 2rem))",
            maxWidth: "30rem",
            height: "60vh",
            maxHeight: "600px",
            minHeight: "450px",
            zIndex: 10000,
          }}
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-900 flex justify-between items-center bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-3.5 w-3.5 rounded-full bg-cyan-400 ${isTyping ? "animate-ping" : "animate-pulse"}`}
              ></span>
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                AI Assistant
              </span>
            </div>
            <div className="flex items-center gap-3 text-right">
              <span className="text-[11px] text-gray-500">
                {limit}/10 queries
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white text-2xl font-bold hover:text-cyan-400 transition-colors z-50 px-2"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/60"
            style={{ overscrollBehavior: "contain" }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 text-sm leading-relaxed rounded-xl whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-cyan-500 text-gray-950 font-semibold shadow-lg shadow-cyan-500/10"
                      : m.isRateLimitCard
                        ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 font-semibold"
                        : "border border-gray-800 bg-gray-900/70 text-gray-300"
                  }`}
                >
                  {m.content}

                  {m.isRateLimitCard && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`mailto:${pData.profile?.email || "akshubusiness187@gmail.com"}`}
                        className="px-3 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold transition-all duration-200"
                      >
                        Email Me
                      </a>
                      {pData.profile?.linkedin && (
                        <a
                          href={pData.profile.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs border border-cyan-500/30 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 transition-all duration-200"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Bouncing Typing Dots */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="border border-gray-800 bg-gray-900/70 text-gray-400 px-4 py-3.5 rounded-xl flex items-center gap-2">
                  <span className="text-xs">AI is thinking</span>
                  <span className="flex gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </span>
                </div>
              </div>
            )}

            {/* Suggestion Chips */}
            {messages.length === 1 && !isTyping && (
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { label: "🔍 Skills", text: "What are your core skills?" },
                  { label: "💼 Projects", text: "Tell me about your projects" },
                  {
                    label: "🎓 Education",
                    text: "What studies have you completed?",
                  },
                  { label: "✉️ Contact Info", text: "How can I contact you?" },
                ].map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => triggerSuggestion(chip.text)}
                    className="px-3 py-1.5 text-xs border border-cyan-500/30 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 rounded-full transition-all duration-200"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form
            onSubmit={(e) => handleSend(e)}
            className="p-4 border-t border-gray-900 bg-gray-900/30 flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={limit >= 10}
              placeholder={
                limit >= 10 ? "Query limit reached" : "Type query..."
              }
              className="flex-1 bg-black/40 border border-cyan-500/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={limit >= 10}
              className="glow-button px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-all duration-300 disabled:opacity-50"
            >
              SEND
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
