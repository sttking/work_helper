import React, { useState, useRef } from "react";
import servicesData from "../data/services.json";
import graphData from "../data/graph.json";

// JARVIS: Futuristic AI Chat UI with animated orb and GPT API integration

// API 키 환경변수에서 가져오기
const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

// 서비스 정보를 JSON 문자열로 변환
const servicesJson = JSON.stringify(servicesData, null, 2);
const graphJson = JSON.stringify(graphData, null, 2);

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function Mainpage3() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Send message to GPT API
  async function sendMessage() {
    if (!input.trim() || loading) return;

    // API 키 확인
    if (!openaiApiKey) {
      setError(
        "OpenAI API 키가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 추가해주세요."
      );
      return;
    }

    setError(null);
    const userMsg = input.trim();
    setMessages((msgs) => [...msgs, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      // Compose prompt with .env info
      const prompt = `다음은 서비스 및 DB 정보입니다.\n${servicesJson}\n\n서비스별 워크플로우(노드) 정보입니다.\n${graphJson}\n\n아래 질문에 답변해 주세요:\n${userMsg}`;
      // --- GPT API call (replace with your endpoint/key as needed) ---
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Replace with your OpenAI API key or proxy
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are JARVIS, a helpful AI assistant.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        }),
      });
      if (!res.ok) throw new Error("AI 응답 실패: " + res.status);
      const data = await res.json();
      const aiMsg =
        data.choices?.[0]?.message?.content?.trim() || "(AI 응답 없음)";
      setMessages((msgs) => [...msgs, { role: "ai", content: aiMsg }]);
    } catch (e: any) {
      setError(e.message || "알 수 없는 오류");
      setMessages((msgs) => [
        ...msgs,
        { role: "ai", content: "[AI 오류] 답변을 가져오지 못했습니다." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  // --- UI ---
  return (
    <section
      className="w-full h-screen min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-mono"
      style={{
        fontFamily: "Orbitron, Roboto Mono, monospace",
        background:
          "radial-gradient(ellipse at 30% 20%, #0a3a5a 0%, #011C2D 80%)",
        backgroundColor: "#011C2D",
      }}
    >
      {/* Futuristic animated background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[900px] h-[900px] bg-cyan-300 opacity-10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-blue-200 opacity-10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[900px] h-[900px] bg-cyan-100 opacity-10 rounded-full blur-2xl animate-spin-slow3" />
      </div>
      {/* JARVIS SVG HUD as background (inline SVG) */}
      <div
        className="absolute z-0 select-none pointer-events-none"
        style={{
          top: 120, // HUD가 위로 삐져나오지 않게
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.18,
          filter: "blur(1.5px) drop-shadow(0 0 80px #B4F6FB)",
          width: "60vw",
          minWidth: 400,
          maxWidth: 900,
          height: 600,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 210 210"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="light-circle">
              <feGaussianBlur
                result="blurred"
                in="SourceGraphic"
                stdDeviation="1"
              />
            </filter>
          </defs>
          <circle
            cx="105"
            cy="105"
            r="100"
            style={{
              fill: "transparent",
              stroke: "#B4F6FB",
              strokeWidth: 2,
              strokeDasharray: "50, 5",
            }}
          />
          <circle
            cx="105"
            cy="105"
            r="95"
            style={{ fill: "transparent", stroke: "#64E6EF", strokeWidth: 1.5 }}
          />
          <circle
            cx="105"
            cy="105"
            r="80"
            style={{
              fill: "transparent",
              stroke: "#B4F6FB",
              strokeWidth: 10,
              strokeDasharray: "2,2.29",
            }}
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 105 105"
              to="360 105 105"
              dur="10s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="105"
            cy="105"
            r="61"
            style={{
              fill: "transparent",
              stroke: "#B4F6FB",
              strokeWidth: 2,
              strokeDasharray: "50, 25",
            }}
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 105 105"
              to="-360 105 105"
              dur="10s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="105"
            cy="105"
            r="50"
            style={{
              fill: "transparent",
              stroke: "#64E6EF",
              strokeWidth: 15,
              filter: "url(#light-circle)",
            }}
          />
          <circle
            cx="105"
            cy="105"
            r="40"
            style={{ fill: "transparent", stroke: "#64E6EF", strokeWidth: 2 }}
          />
          <path
            d="M 105 120 L 130 95 L 80 95 z"
            style={{ fill: "#D1FBFC", stroke: "#B4F6FB", strokeWidth: 5 }}
          />
        </svg>
      </div>
      {/* Chat container */}
      <div
        className="relative flex flex-col items-center justify-center z-20"
        style={{
          width: "60vw",
          minWidth: 400,
          maxWidth: 900,
          marginTop: 60,
        }}
      >
        {/* JARVIS Title */}
        <div
          className="w-full text-center mb-6 z-30"
          style={{ maxWidth: "100%" }}
        >
          <h1
            className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-400 tracking-widest select-none"
            style={{
              fontFamily: "Orbitron, monospace",
              textShadow:
                "0 0 30px #00e0ff, 0 0 60px #00e0ff, 0 0 90px #00e0ff",
              filter: "drop-shadow(0 0 20px #00e0ff)",
            }}
          >
            JARVIS
          </h1>
        </div>
        {/* Chat area - between JARVIS title and fixed input */}
        <div
          className="w-full flex flex-col gap-6 pr-2 custom-scrollbar"
          style={{
            overflowY: "auto",
            paddingBottom: 24,
            width: "100%",
            maxWidth: "100%",
            height: "calc(100vh - 320px)", // Leave space for JARVIS title and fixed input
            minHeight: 200,
          }}
        >
          {messages.length === 0 && !loading && (
            <div className="text-center text-cyan-200/70 py-16 text-2xl select-none tracking-widest">
              AI에게 궁금한 점을 물어보세요.
              <br />
              서비스/DB 정보도 함께 참고합니다.
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`w-full flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`relative w-full px-8 py-5 rounded-2xl text-lg whitespace-pre-line break-words shadow-xl transition-all duration-300
                  ${
                    msg.role === "user"
                      ? "bg-cyan-400/10 text-cyan-100 border border-cyan-400/40 neon-user"
                      : "bg-white/10 text-cyan-200 border border-cyan-200/30 neon-ai"
                  }
                `}
                style={{
                  fontFamily:
                    msg.role === "user"
                      ? "'Orbitron', 'Roboto Mono', monospace"
                      : "'Roboto Mono', monospace",
                  boxShadow:
                    msg.role === "user"
                      ? "0 0 16px 2px #00e0ff88, 0 0 32px 8px #00e0ff33"
                      : "0 0 24px 2px #00e0ff33, 0 0 48px 8px #a5b4fc22",
                  borderRadius: 24,
                  borderWidth: 1.5,
                  borderStyle: "solid",
                  borderColor: msg.role === "user" ? "#00e0ff55" : "#a5b4fc55",
                  background:
                    msg.role === "user"
                      ? "linear-gradient(90deg, rgba(0,224,255,0.08) 0%, rgba(0,224,255,0.03) 100%)"
                      : "linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(0,224,255,0.06) 100%)",
                  width: "100%",
                  maxWidth: "100%",
                  color: msg.role === "ai" ? "#e0f7ff" : "#b3f0ff",
                  textShadow:
                    msg.role === "ai"
                      ? "0 0 2px #00e0ff, 0 0 8px #00e0ff"
                      : "none",
                  fontSize: msg.role === "ai" ? 20 : 18,
                  lineHeight: 1.7,
                  letterSpacing: 0.2,
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex w-full justify-start mb-3">
              <div
                className="relative w-full px-8 py-5 rounded-2xl text-lg bg-white/10 text-cyan-200 border border-cyan-200/30 neon-ai animate-pulse"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  color: "#e0f7ff",
                  textShadow: "0 0 2px #00e0ff, 0 0 8px #00e0ff",
                  fontSize: 20,
                  lineHeight: 1.7,
                }}
              >
                AI가 답변을 생성 중입니다...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        {/* Fixed Input area at bottom */}
        <form
          className="w-full flex items-center gap-4 bg-white/10 border border-cyan-200/20 rounded-2xl shadow-lg px-8 py-6 backdrop-blur-md neon-input"
          style={{
            position: "fixed",
            left: "calc(50% + 135px)",
            bottom: 20,
            transform: "translateX(-50%)",
            zIndex: 30,
            width: "60vw",
            minWidth: 700,
            maxWidth: 1200,
          }}
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <textarea
            ref={inputRef as any}
            className="flex-1 bg-transparent outline-none text-cyan-100 text-xl px-2 py-4 placeholder:text-cyan-300/60 resize-none"
            placeholder="질문을 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading}
            autoFocus
            maxLength={2000}
            rows={2}
            style={{
              fontFamily: "Orbitron, Roboto Mono, monospace",
              minHeight: 48,
              maxHeight: 120,
              lineHeight: 1.6,
            }}
          />
          <button
            type="submit"
            className={`px-10 py-4 rounded-2xl font-bold text-cyan-50 bg-gradient-to-tr from-cyan-500 to-blue-400 shadow-md transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-300 text-lg neon-btn ${
              loading || !input.trim() ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading || !input.trim()}
            style={{
              boxShadow: "0 0 16px 2px #00e0ff88, 0 0 32px 8px #00e0ff33",
            }}
          >
            보내기
          </button>
        </form>
        {/* Error message */}
        {error && (
          <div className="w-full text-center text-red-400 mb-2">{error}</div>
        )}
      </div>
      {/* Custom slow spin animation and neon effects */}
      <style>{`
        .animate-spin-slow2 {
          animation: spin2 8s linear infinite;
        }
        .animate-spin-slow3 {
          animation: spin3 32s linear infinite;
        }
        @keyframes spin2 {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin3 {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        .neon-user {
          box-shadow: 0 0 16px 2px #00e0ff88, 0 0 32px 8px #00e0ff33 !important;
          border-color: #00e0ff88 !important;
        }
        .neon-ai {
          box-shadow: 0 0 24px 2px #00e0ff55, 0 0 48px 8px #a5b4fc33 !important;
          border-color: #a5b4fc55 !important;
        }
        .neon-input {
          box-shadow: 0 0 24px 2px #00e0ff33, 0 0 48px 8px #00e0ff11 !important;
          border-color: #00e0ff33 !important;
        }
        .neon-btn {
          text-shadow: 0 0 8px #00e0ffcc;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4fd1e7cc #0a3a5a44;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(120deg, #4fd1e7cc 30%, #2563eb88 100%);
          border-radius: 8px;
          border: 2px solid #0a3a5a44;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a3a5a22;
          border-radius: 8px;
        }
      `}</style>
    </section>
  );
}
