import { useEffect, useRef, useState } from "react";
import {
  Bot,
  LoaderCircle,
  Menu,
  Send,
  Sprout,
  UserRound,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { chatWithAgricultureAssistant } from "../services/api";
import { useLocation } from "react-router-dom";

const STARTER_QUESTIONS = [
  "How can I improve soil health?",
  "How should I prepare compost for my crops?",
  "What are good practices for crop rotation?",
];

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hello! I’m your agriculture assistant. Ask me about soil health, crop care, irrigation, or other farming topics.",
};

export default function AgricultureAssistant() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    const initialQuestion = location.state?.initialQuestion;
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [location.key, location.state]);

  async function sendQuestion(value = question) {
    const text = value.trim();
    if (!text || sending) return;

    const conversation = [...messages, { role: "user", content: text }];
    setMessages(conversation);
    setQuestion("");
    setError("");
    setSending(true);

    try {
      const history = conversation
        .slice(1, -1)
        .slice(-12)
        .map(({ role, content }) => ({ role, content }));
      const response = await chatWithAgricultureAssistant({
        question: text,
        history,
      });
      setMessages([
        ...conversation,
        { role: "assistant", content: response.answer },
      ]);
    } catch (requestError) {
      setError(
        requestError?.message ||
          "The assistant could not respond. Please try again."
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendQuestion();
    }
  }

  function startNewChat() {
    setMessages([INITIAL_MESSAGE]);
    setError("");
    setQuestion("");
  }

  return (
    <div className="min-h-screen bg-[#F3F5EF] text-[#203126]">
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="min-h-screen lg:pl-[240px]">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />

        <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl flex-col px-4 py-5 sm:px-8 sm:py-8">
          <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E5EFE1] px-3 py-1 text-xs font-semibold text-[#285C38]">
                <span className="h-2 w-2 rounded-full bg-[#4A9A5A]" />
                Local agriculture assistant
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ask AgriPredict
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6B786E]">
                Get practical answers about farming, soil, and crop care.
              </p>
            </div>
            <button
              type="button"
              onClick={startNewChat}
              className="rounded-xl border border-[#D9E1D6] bg-white px-4 py-2.5 text-sm font-semibold text-[#425248] transition hover:bg-[#F8FAF6]"
            >
              New conversation
            </button>
          </section>

          <section className="flex min-h-[560px] flex-1 flex-col overflow-hidden rounded-3xl border border-[#D9E1D6] bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#E8EDE5] px-5 py-4 sm:px-6">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#EAF3E6] text-[#285C38]">
                <Sprout size={21} />
              </div>
              <div>
                <p className="text-sm font-bold">Agriculture assistant</p>
                <p className="text-xs text-[#7A877F]">Answers grounded in the agriculture knowledge base</p>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                      message.role === "assistant"
                        ? "bg-[#EAF3E6] text-[#285C38]"
                        : "bg-[#285C38] text-white"
                    }`}
                  >
                    {message.role === "assistant" ? <Bot size={18} /> : <UserRound size={17} />}
                  </div>
                  <div
                    className={`max-w-[min(90%,720px)] rounded-2xl px-4 py-3 text-sm leading-7 sm:px-5 ${
                      message.role === "assistant"
                        ? "rounded-tl-md bg-[#F5F7F3] text-[#35443A]"
                        : "rounded-tr-md bg-[#285C38] text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#EAF3E6] text-[#285C38]">
                    <Bot size={18} />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-[#F5F7F3] px-4 py-3 text-sm text-[#6B786E]">
                    <LoaderCircle size={16} className="animate-spin" />
                    Thinking… the first reply may take longer while the model loads.
                  </div>
                </div>
              )}

              {error && (
                <div className="ml-12 rounded-xl border border-[#F0D5C8] bg-[#FFF7F3] px-4 py-3 text-sm text-[#9A4D2E]">
                  {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 px-4 pb-4 sm:px-8">
                {STARTER_QUESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={sending}
                    onClick={() => sendQuestion(item)}
                    className="rounded-full border border-[#D9E1D6] bg-white px-3.5 py-2 text-left text-xs font-medium text-[#526156] transition hover:border-[#A9C8A2] hover:bg-[#F7FAF5] disabled:opacity-50"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="border-t border-[#E8EDE5] p-4 sm:px-8 sm:py-5">
              <div className="flex items-end gap-3 rounded-2xl border border-[#D9E1D6] bg-[#FBFCFA] p-2 focus-within:border-[#8EBE80] focus-within:ring-2 focus-within:ring-[#8EBE80]/20">
                <textarea
                  ref={inputRef}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  maxLength={1000}
                  placeholder="Ask an agriculture question…"
                  aria-label="Your agriculture question"
                  className="max-h-32 min-h-11 flex-1 resize-y bg-transparent px-3 py-2.5 text-sm text-[#203126] outline-none placeholder:text-[#9AA69D]"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || sending}
                  aria-label="Send question"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#285C38] text-white transition hover:bg-[#214D2F] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {sending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-[#89958C]">
                Enter to send · Shift + Enter for a new line · Verify important crop-specific advice locally.
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}


