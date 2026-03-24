import { useEffect, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { API_URL } from "../config";


const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export default function FinanceChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hi 👋 I’m your finance chatbot. How can I help you today?",
        },
      ]);
    }
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userText },
    ]);

    try {
      const res = await api.post("/api/chat", {
        message: userText,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch (error) {
      console.error("Axios error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn’t connect to the server. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#2563eb",
          color: "#fff",
          fontSize: 24,
          border: "none",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        💬
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 320,
            height: 420,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 0 20px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
          }}
        >
          <div style={{ padding: 10, fontWeight: "bold" }}>
            Finance Assistant
          </div>

          <div style={{ flex: 1, padding: 10, overflowY: "auto" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  textAlign: msg.role === "user" ? "right" : "left",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: msg.role === "user" ? "#2563eb" : "#e5e7eb",
                    color: msg.role === "user" ? "#fff" : "#000",
                    display: "inline-block",
                    maxWidth: "90%",
                  }}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </span>
              </div>
            ))}
            {loading && <div>Typing...</div>}
          </div>

          <div style={{ display: "flex", padding: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a finance question..."
              style={{
                flex: 1,
                padding: 6,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                marginLeft: 6,
                padding: "6px 10px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 4,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
