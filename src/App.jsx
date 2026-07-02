import { useState, useEffect, useRef } from "react";

const ratingColor = (r) => {
  if (r >= 8) return "#22D07A";
  if (r >= 6) return "#F7C948";
  return "#F75B5B";
};

function ChargeMeter({ rating, max = 10 }) {
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setFilled(rating / max), 200);
    return () => clearTimeout(t);
  }, [rating, max]);

  const color = ratingColor(rating);
  const segments = 10;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: segments }).map((_, i) => {
          const active = filled >= (i + 1) / segments;
          return (
            <div key={i} style={{
              width: 18, height: 32, borderRadius: 3,
              background: active ? color : "#1E2235",
              transition: `background 0.05s ease ${i * 0.04}s`,
              boxShadow: active ? `0 0 8px ${color}80` : "none",
            }} />
          );
        })}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>
        {rating.toFixed(1)} <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 500 }}>/ 10.0</span>
      </div>
    </div>
  );
}

function StarRow({ rating }) {
  const stars = Math.round(rating / 2);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: 14, color: i <= stars ? "#F7C948" : "#1E2235" }}>★</span>
      ))}
    </div>
  );
}

function PillTag({ label, color }) {
  return (
    <span style={{
      background: `${color}18`, color,
      border: `1px solid ${color}40`,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
    }}>{label}</span>
  );
}

function ProConList({ items, type }) {
  const color = type === "pro" ? "#22D07A" : "#F75B5B";
  const icon = type === "pro" ? "↑" : "↓";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ color, fontWeight: 700, fontSize: 13, marginTop: 1 }}>{icon}</span>
          <span style={{ color: "#E8EAF0", fontSize: 13, lineHeight: 1.5 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function AlternativeCard({ alt }) {
  return (
    <div style={{
      background: "#13161F", border: "1px solid #1E2235",
      borderRadius: 12, padding: 16,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontWeight: 700, color: "#E8EAF0", fontSize: 14, lineHeight: 1.3 }}>{alt.name}</div>
        <div style={{ color: "#4F8EF7", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", marginLeft: 8 }}>{alt.price}</div>
      </div>
      <StarRow rating={alt.rating} />
      <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{alt.reason}</div>
    </div>
  );
}

function LoadingPulse({ label }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 0" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: "3px solid #1E2235", borderTop: "3px solid #4F8EF7",
        animation: "spin 0.8s linear infinite",
      }} />
      <div style={{ color: "#6B7280", fontSize: 14 }}>{label}{dots}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const API_BASE = "https://techverdict.onrender.com";

function ChatBot({ product }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: `Ask me anything about the ${product}!` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text,
      }));

      const response = await fetch(`${API_BASE}/api/anthropic/v1/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          system: `You are a helpful tech expert assistant who knows everything about the ${product}. Answer follow-up questions concisely and helpfully. Keep responses under 150 words unless the question requires more detail.`,
          messages: [
            ...history,
            { role: "user", content: userMsg }
          ],
        }),
      });

      const data = await response.json();
      const textBlock = data.content?.find(b => b.type === "text");
      const reply = textBlock?.text || "Sorry, I couldn't get a response.";
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#13161F", border: "1px solid #1E2235", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #1E2235", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>💬</span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#E8EAF0" }}>Ask a follow-up</span>
      </div>

      <div style={{ height: 280, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%",
              background: m.role === "user" ? "linear-gradient(135deg, #4F8EF7, #3B6FD4)" : "#0A0C12",
              color: "#E8EAF0",
              borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              padding: "10px 14px",
              fontSize: 13,
              lineHeight: 1.6,
              border: m.role === "assistant" ? "1px solid #1E2235" : "none",
            }}>
              {m.text.split('\n').map((line, j) => (
  <span key={j}>
    {line.split(/\*\*(.*?)\*\*/g).map((part, k) =>
      k % 2 === 1 ? <strong key={k}>{part}</strong> : part
    )}
    {j < m.text.split('\n').length - 1 && <br />}
  </span>
))}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "#0A0C12", border: "1px solid #1E2235", borderRadius: "12px 12px 12px 2px", padding: "10px 14px" }}>
              <span style={{ color: "#6B7280", fontSize: 13 }}>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid #1E2235", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask anything about this product..."
          style={{
            flex: 1, background: "#0A0C12", border: "1px solid #1E2235",
            borderRadius: 8, color: "#E8EAF0", fontSize: 13, padding: "10px 14px",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            background: "linear-gradient(135deg, #4F8EF7, #3B6FD4)",
            border: "none", color: "#fff", fontWeight: 700,
            fontSize: 13, padding: "0 18px", borderRadius: 8,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >Send</button>
      </div>
    </div>
  );
}

export default function TechVerdict() {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const examples = ["Samsung Galaxy S25 Ultra", "Sony WH-1000XM5", "MacBook Air M3", "RTX 4070 Ti", "iPad Pro 13"];

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setLoadingStep("Scouring the web for reviews");

    try {
      const budgetText = budget ? ` with a budget of ${budget}` : "";
      const prompt = `You are TechVerdict AI. Provide a comprehensive, structured review analysis summary for: "${query}"${budgetText}. 
      Search the web for up-to-date real-world usage details and community consensus. You must respond with ONLY a raw, valid JSON object following this exact format (no markdown wrappers, no backticks, no trailing text):
      {
        "product": "Full product name",
        "category": "Smartphones / Laptops / Earbuds / GPU / etc",
        "price": "Approx retail price",
        "rating": 8.5,
        "verdict": "A 2-3 sentence overall definitive verdict summary.",
        "pros": ["Pro 1", "Pro 2", "Pro 3"],
        "cons": ["Con 1", "Con 2", "Con 3"],
        "reviewSources": ["Source 1", "Source 2"],
        "tags": ["Best in class", "Value pick"],
        "alternatives": [
          { "name": "Alternative Name", "price": "$$$", "rating": 8.2, "reason": "Short reason why it competes" }
        ]
      }
      IMPORTANT: rating must be a number between 1.0 and 10.0 (out of 10, not out of 5). Alternatives ratings must also be out of 10.`;

      const response = await fetch(`${API_BASE}/api/anthropic/v1/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }],
        }),
      });

      setLoadingStep("Analyzing and rating");

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const textBlocks = data.content?.filter((b) => b.type === "text");
      const textBlock = textBlocks?.[textBlocks.length - 1];
      if (!textBlock) throw new Error("No text content returned from AI.");

      const cleanJson = JSON.parse(textBlock.text.trim().replace(/```json|```/g, "").trim());
      setResult(cleanJson);

    } catch (e) {
      setError(`Something went wrong: ${e.message}. Try again.`);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0C12",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#E8EAF0", padding: "0 16px 48px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #4B5563; }
        input:focus { outline: none; }
        button { cursor: pointer; }
        button:disabled { cursor: not-allowed; opacity: 0.5; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A0C12; }
        ::-webkit-scrollbar-thumb { background: #1E2235; border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ paddingTop: 48, paddingBottom: 32, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #4F8EF7, #7C3AED)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>⚡</div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>TechVerdict</span>
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800, fontSize: 32, letterSpacing: -1.5,
            margin: "0 0 8px", lineHeight: 1.15,
          }}>
            One verdict.<br />
            <span style={{ color: "#4F8EF7" }}>No more tab hopping.</span>
          </h1>
          <p style={{ color: "#6B7280", fontSize: 15, margin: 0 }}>
            AI-powered reviews aggregated from across the web — rated, summarized, compared.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", background: "#13161F", border: "1px solid #1E2235", borderRadius: 14, overflow: "hidden" }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search any phone, laptop, GPU, earbuds..."
              style={{ flex: 1, background: "transparent", border: "none", color: "#E8EAF0", fontSize: 15, padding: "14px 16px" }}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              style={{
                background: "linear-gradient(135deg, #4F8EF7, #3B6FD4)",
                border: "none", color: "#fff", fontWeight: 700,
                fontSize: 14, padding: "0 24px",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >{loading ? "..." : "Analyze"}</button>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>Budget:</span>
            <input
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="e.g. $500 (optional)"
              style={{ flex: 1, background: "#13161F", border: "1px solid #1E2235", borderRadius: 8, color: "#E8EAF0", fontSize: 13, padding: "8px 12px" }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {examples.map(ex => (
              <button key={ex} onClick={() => { setQuery(ex); setTimeout(() => inputRef.current?.focus(), 0); }}
                style={{ background: "#1E2235", border: "1px solid #2A2D3E", borderRadius: 20, color: "#6B7280", fontSize: 12, padding: "4px 12px" }}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        {loading && <LoadingPulse label={loadingStep} />}

        {error && (
          <div style={{ marginTop: 24, padding: 16, background: "rgba(247,91,91,0.1)", border: "1px solid rgba(247,91,91,0.3)", borderRadius: 12, color: "#F75B5B", fontSize: 14 }}>
            {error}
          </div>
        )}

        {result && !loading && (
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#13161F", border: "1px solid #1E2235", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{result.category}</div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: -0.5 }}>{result.product}</h2>
                  <div style={{ color: "#4F8EF7", fontWeight: 600, fontSize: 14, marginTop: 4 }}>{result.price}</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.tags?.slice(0, 3).map(tag => <PillTag key={tag} label={tag} color="#4F8EF7" />)}
                </div>
              </div>

              <div style={{ background: "#0A0C12", borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>TechVerdict Score</div>
                <ChargeMeter rating={result.rating} />
              </div>

              <p style={{ fontSize: 15, lineHeight: 1.7, color: "#E8EAF0", margin: "0 0 20px", fontStyle: "italic", borderLeft: "3px solid #4F8EF7", paddingLeft: 14 }}>
                {result.verdict}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                <div>
                  <div style={{ color: "#22D07A", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>What's good</div>
                  <ProConList items={result.pros} type="pro" />
                </div>
                <div>
                  <div style={{ color: "#F75B5B", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Watch out for</div>
                  <ProConList items={result.cons} type="con" />
                </div>
              </div>

              {result.reviewSources?.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1E2235" }}>
                  <div style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Sources reviewed</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.reviewSources.map(s => <PillTag key={s} label={s} color="#6B7280" />)}
                  </div>
                </div>
              )}
            </div>

            {result.alternatives?.length > 0 && (
              <div>
                <div style={{ color: "#6B7280", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                  {budget ? `Alternatives near ${budget}` : "Similar alternatives"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {result.alternatives.map((alt, i) => <AlternativeCard key={i} alt={alt} />)}
                </div>
              </div>
            )}

            <ChatBot product={result.product} />

            <div style={{ textAlign: "center", paddingTop: 8 }}>
              <button
                onClick={() => { setResult(null); setQuery(""); inputRef.current?.focus(); }}
                style={{ background: "none", border: "1px solid #1E2235", borderRadius: 8, color: "#6B7280", fontSize: 13, padding: "8px 20px" }}
              >Search another product</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
