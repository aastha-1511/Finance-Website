import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

const useDark = () => {
    const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
    useEffect(() => {
        const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
        obs.observe(document.documentElement, { attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);
    return dark;
};

// Simple markdown → HTML converter (bold, bullets, headers)
const renderMarkdown = (text) => {
    let html = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^### (.+)$/gm, '<h4 style="margin:12px 0 4px;font-size:13px;font-weight:700;">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="margin:14px 0 6px;font-size:14px;font-weight:800;">$1</h3>')
        .replace(/^- (.+)$/gm, '<li style="margin:3px 0;padding-left:4px;">$1</li>')
        .replace(/(<li.*<\/li>\n?)+/gs, '<ul style="margin:6px 0;padding-left:16px;list-style:disc;">$&</ul>')
        .replace(/\n\n/g, '<br/>')
        .replace(/⚠️/g, '<span style="color:#f59e0b">⚠️</span>');
    return html;
};

const SUGGESTIONS = [
    'Analyze my Portfolio',
    'What are my risks?',
    'How can I diversify?',
    'Which stocks to hold?',
    'Any buy opportunities?',
];

const AIAssistant = ({ onClose }) => {
    const dark = useDark();
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: "Hi! I'm your FinanceHub AI powered by Gemini.\n\nI can see your live portfolio and give you personalized insights. Ask me anything about your investments!"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [portfolioSnapshot, setPortfolioSnapshot] = useState(null);
    const bottomRef = useRef(null);
    const token = localStorage.getItem('token');

    // Fetch portfolio data once on mount
    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const [portRes, priceRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/portfolio', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/stocks/prices')
                ]);
                const positions = portRes.data.positions || [];
                const orders = portRes.data.orders || [];
                const bal = portRes.data.availableBalance || 0;
                const liveMap = {};
                priceRes.data.forEach(s => { liveMap[s.symbol] = s.price; });
                setPortfolioSnapshot({ positions, orders, availableBalance: bal, livePrices: liveMap });
            } catch { }
        };
        fetchPortfolio();
    }, [token]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const send = useCallback(async (text) => {
        const msg = (text || input).trim();
        if (!msg) return;
        setInput('');
        setMessages(m => [...m, { role: 'user', text: msg }]);
        setLoading(true);
        try {
            const { data } = await axios.post('http://localhost:5000/api/ai/insights',
                { message: msg, portfolioSnapshot },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessages(m => [...m, { role: 'assistant', text: data.reply }]);
        } catch (e) {
            const status = e.response?.status;
            const errMsg = e.response?.data?.message || '';
            let reply;
            if (status === 429 || errMsg === 'quota_exceeded') {
                reply = 'Your Gemini API free tier daily quota is exhausted (limit: 0 requests remaining).\n\nTo fix this:\n1. Go to https://aistudio.google.com/app/apikey\n2. Create a new API key from a different Google account\n3. Replace GEMINI_API_KEY in backend/.env and restart the backend.';
            } else if (errMsg.includes('API key') || errMsg.includes('API_KEY')) {
                reply = 'The Gemini API key is invalid. Please get a valid key from https://aistudio.google.com/app/apikey and update backend/.env';
            } else {
                reply = 'Sorry, I encountered an error. Please try again.';
            }
            setMessages(m => [...m, { role: 'assistant', text: reply }]);
        }
        setLoading(false);
    }, [input, portfolioSnapshot, token]);

    // Colors
    const bg = dark ? '#0f172a' : '#ffffff';
    const header = dark ? '#1e293b' : '#6366f1';
    const panel = dark ? '#1e293b' : '#f8fafc';
    const border = dark ? '#334155' : '#e5e7eb';
    const userBg = dark ? '#3730a3' : '#6366f1';
    const aiBg = dark ? '#1e293b' : '#f1f5f9';
    const txt = dark ? '#f1f5f9' : '#111827';
    const mute = dark ? '#94a3b8' : '#6b7280';
    const inputBg = dark ? '#0f172a' : '#ffffff';

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', maxWidth: '95vw',
            background: bg, borderLeft: `1px solid ${border}`, zIndex: 1500,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 48px rgba(0,0,0,0.2)', fontFamily: 'system-ui, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                background: header, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                        fontWeight: '800', color: '#fff'
                    }}>AI</div>
                    <div>
                        <p style={{ margin: 0, fontWeight: '800', color: '#fff', fontSize: '15px' }}>Portfolio Insights</p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                            {portfolioSnapshot
                                ? `${portfolioSnapshot.positions.length} positions loaded`
                                : 'Loading portfolio…'}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                    width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>×</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        {m.role === 'assistant' && (
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '8px', background: '#6366f1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: '800', color: '#fff',
                                marginRight: '8px', flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px'
                            }}>AI</div>
                        )}
                        <div style={{
                            maxWidth: '85%', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: m.role === 'user' ? userBg : aiBg,
                            color: m.role === 'user' ? '#fff' : txt,
                            fontSize: '13px', lineHeight: '1.6',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                        }}>
                            {m.role === 'assistant'
                                ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} />
                                : m.text
                            }
                        </div>
                    </div>
                ))}

                {loading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '8px', background: '#6366f1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: '800', color: '#fff'
                        }}>AI</div>
                        <div style={{ background: aiBg, padding: '10px 14px', borderRadius: '14px 14px 14px 4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {[0, 1, 2].map(d => (
                                <div key={d} style={{
                                    width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1',
                                    animation: 'bounce 1.2s ease infinite',
                                    animationDelay: `${d * 0.2}s`
                                }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick suggestions — only show when no conversation yet */}
            {messages.length === 1 && (
                <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {SUGGESTIONS.map(s => (
                        <button key={s} onClick={() => send(s)} style={{
                            padding: '6px 12px', borderRadius: '20px', border: `1px solid ${border}`,
                            background: panel, color: dark ? '#a5b4fc' : '#6366f1',
                            fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s'
                        }}>
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, background: panel }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                        placeholder="Ask about your portfolio… (Enter to send)"
                        rows={2}
                        style={{
                            flex: 1, padding: '10px 14px', borderRadius: '12px', border: `1.5px solid ${border}`,
                            background: inputBg, color: txt, fontSize: '13px', resize: 'none',
                            outline: 'none', fontFamily: 'inherit', lineHeight: '1.5'
                        }}
                    />
                    <button onClick={() => send()} disabled={loading || !input.trim()} style={{
                        width: '40px', height: '40px', borderRadius: '12px', border: 'none',
                        background: loading || !input.trim() ? (dark ? '#334155' : '#e5e7eb') : '#6366f1',
                        color: '#fff', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s', flexShrink: 0
                    }}>↑</button>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '10px', color: mute, textAlign: 'center' }}>
                    Powered by Gemini 1.5 Flash · For informational purposes only
                </p>
            </div>

            <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
        </div>
    );
};

export default AIAssistant;
