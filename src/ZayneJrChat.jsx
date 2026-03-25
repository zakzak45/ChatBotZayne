import { useEffect, useMemo, useRef, useState } from "react";
import Zaynejr from './zaynejr.json'
import './Zaynejr.css'

const STORAGE_KEY = "zaynejr_chat_history";
const LEARNED_KEY = "zaynejr_learned";
const THEME_KEY = "zaynejr_theme";

const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (text) => (text ? normalize(text).split(" ") : []);

const scoreEntry = (entry, inputText, inputTokens) => {
  const questionText = normalize(entry.question || "");
  const keywordTokens = (entry.keywords || []).flatMap((kw) => tokenize(kw));
  const questionTokens = tokenize(questionText);
  const allTokens = [...new Set([...questionTokens, ...keywordTokens])];

  let score = 0;
  if (!questionText) return score;

  if (inputText.includes(questionText)) score += 6;

  const tokenMatches = inputTokens.filter((token) => allTokens.includes(token)).length;
  score += tokenMatches * 2;

  const partialMatches = allTokens.filter((token) =>
    inputTokens.some((inputToken) =>
      inputToken.length >= 4 && (inputToken.includes(token) || token.includes(inputToken))
    )
  ).length;
  score += partialMatches;

  return score;
};

const Chat = () => {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map((msg) => ({
            ...msg,
            time: msg.time || Date.now()
          }));
        }
      } catch {
        return [{ sender: "bot", text: "Hey, I'm ZayneJr! Ask me something.", time: Date.now() }];
      }
    }
    return [{ sender: "bot", text: "Hey, I'm ZayneJr! Ask me something.", time: Date.now() }];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [learnedEntries, setLearnedEntries] = useState(() => {
    const stored = localStorage.getItem(LEARNED_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const messagesEndRef = useRef(null);

  const entries = useMemo(() => [...Zaynejr, ...learnedEntries], [learnedEntries]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMessage = { sender: "user", text: input, time: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    if (pendingQuestion) {
      const trimmed = input.trim();
      const lower = trimmed.toLowerCase();

      if (lower === "/skip" || lower === "skip") {
        const response = "Got it. Ask me something else anytime.";
        window.setTimeout(() => {
          const botMessage = { sender: "bot", text: response, time: Date.now() };
          setMessages((prev) => [...prev, botMessage]);
          setIsTyping(false);
          setPendingQuestion(null);
        }, 600);
        return;
      }

      const newEntry = {
        question: pendingQuestion,
        keywords: [],
        answer: trimmed
      };
      const updated = [...learnedEntries, newEntry];
      setLearnedEntries(updated);
      localStorage.setItem(LEARNED_KEY, JSON.stringify(updated));

      const response = "Nice, I learned that. Ask me again anytime.";
      window.setTimeout(() => {
        const botMessage = { sender: "bot", text: response, time: Date.now() };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
        setPendingQuestion(null);
      }, 700);
      return;
    }

    const inputText = normalize(input);
    const inputTokens = tokenize(inputText);

    let bestMatch = null;
    let bestScore = 0;

    for (const entry of entries) {
      const score = scoreEntry(entry, inputText, inputTokens);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    const response = bestMatch && bestScore >= 3
      ? bestMatch.answer
      : "I do not know that yet. Want to teach me? Reply with the answer or type /skip.";

    if (!bestMatch || bestScore < 3) {
      setPendingQuestion(input);
    }

    const delay = Math.min(800 + response.length * 10, 1600);
    window.setTimeout(() => {
      const botMessage = { sender: "bot", text: response, time: Date.now() };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, delay);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div className="chat-shell">
        <header className="chat-header">
          <div className="chat-brand">
            <div className="chat-avatar">
              <img src="/Pikachu.png" alt="Zayne profile" />
            </div>
            <div>
              <h1 className="chat-title">ZayneJr</h1>
              <p className="chat-status">Online and ready</p>
            </div>
          </div>
          <div className="chat-actions">
            <button
              className="ghost-button"
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              type="button"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button
              className="ghost-button"
              onClick={() => {
                setMessages([{ sender: "bot", text: "Hey, I'm ZayneJr! Ask me something.", time: Date.now() }]);
                setPendingQuestion(null);
              }}
              type="button"
              aria-label="Clear conversation"
            >
              Clear
            </button>
          </div>
        </header>

        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message ${msg.sender === "bot" ? "bot" : "user"}`}
              >
                <p>{msg.text}</p>
                {msg.time ? <span className="chat-time">{formatTime(msg.time)}</span> : null}
              </div>
            ))}
            {isTyping && (
              <div className="chat-message bot">
                <div className="typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              aria-label="Chat message"
            />
            <button onClick={handleSend} type="button">Send</button>
          </div>
        </div>
      </div>
    </>
  );
}
 
export default Chat;