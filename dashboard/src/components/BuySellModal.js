import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { GeneralContext } from "./GeneralContext";
import { API_URL } from "../config";

// NSE 2026 holidays (YYYY-MM-DD in IST)
const NSE_HOLIDAYS = new Set([
    '2026-01-15', '2026-01-26', '2026-03-03', '2026-03-26', '2026-03-31',
    '2026-04-03', '2026-04-14', '2026-05-01', '2026-05-28', '2026-06-26',
    '2026-09-14', '2026-10-02', '2026-10-20', '2026-11-10', '2026-11-24', '2026-12-25'
]);

const getMarketStatus = () => {
    const istMs = Date.now() + (5 * 60 + 30) * 60000;
    const ist = new Date(istMs);
    const dow = ist.getUTCDay();
    const h = ist.getUTCHours();
    const m = ist.getUTCMinutes();
    const dateStr = `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`;
    const mins = h * 60 + m;
    if (dow === 0 || dow === 6) return { open: false, reason: 'Market closed — trading only Mon–Fri' };
    if (NSE_HOLIDAYS.has(dateStr)) return { open: false, reason: 'Market closed today (NSE Holiday)' };
    if (mins < 9 * 60 + 15) return { open: false, reason: `Pre-market — opens at 9:15 AM IST (now ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} IST)` };
    if (mins >= 15 * 60 + 30) return { open: false, reason: 'After-hours — market closed at 3:30 PM IST' };
    return { open: true, reason: '' };
};

const useDark = () => {
    const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
    useEffect(() => {
        const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
        obs.observe(document.documentElement, { attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);
    return dark;
};

const BuySellModal = () => {
    const { isBuyModalOpen, isSellModalOpen, closeBuyModal, closeSellModal, selectedStock } = useContext(GeneralContext);
    const [quantity, setQuantity] = useState(1);
    const [livePrice, setLivePrice] = useState(null);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [marketStatus, setMarketStatus] = useState(getMarketStatus);
    const dark = useDark();

    const isOpen = isBuyModalOpen || isSellModalOpen;
    const isBuy = isBuyModalOpen;
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!isOpen || !selectedStock) return;
        setMessage("");
        setQuantity(1);
        setMarketStatus(getMarketStatus());

        axios.get(`${API_URL}/api/stocks/quote/${selectedStock}`)
            .then(r => setLivePrice(r.data.price))
            .catch(() => setLivePrice(null));

        axios.get(`${API_URL}/api/portfolio`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setBalance(r.data.balance || 0))
            .catch(() => { });
    }, [isOpen, selectedStock, token]);

    const close = () => { isBuy ? closeBuyModal() : closeSellModal(); setMessage(""); };

    const handleOrder = async () => {
        const status = getMarketStatus();
        if (!status.open) { setMessage(status.reason); return; }
        if (!livePrice) { setMessage("Price not available. Try again."); return; }
        setLoading(true);
        setMessage("");
        try {
            const endpoint = isBuy ? "/api/portfolio/buy" : "/api/portfolio/sell";
            const { data } = await axios.post(`${API_URL}${endpoint}`, {
                symbol: selectedStock, quantity: Number(quantity), price: livePrice
            }, { headers: { Authorization: `Bearer ${token}` } });
            setBalance(data.balance || 0);
            setMessage(`${isBuy ? "Bought" : "Sold"} ${quantity} shares of ${selectedStock.replace(".NS", "")} at \u20b9${livePrice.toFixed(2)}`);
            setTimeout(close, 2000);
        } catch (err) {
            setMessage(err.response?.data?.message || "Order failed.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const total = livePrice ? (livePrice * quantity).toFixed(2) : "\u2014";
    const mktClosed = !marketStatus.open;
    const isSuccess = message.includes("Bought") || message.includes("Sold");

    // Dark-mode aware colours — all explicitly high-contrast
    const modalBg   = dark ? "#1e293b" : "#ffffff";
    const panelBg   = dark ? "#0f172a" : "#f8fafc";
    const borderCol = dark ? "#475569" : "#d1d5db";   /* brighter border */
    const txt       = dark ? "#f8fafc" : "#0f172a";   /* near-white / near-black */
    const muteTxt   = dark ? "#e2e8f0" : "#1e293b";   /* clearly readable label */
    const inputBg   = dark ? "#0f172a" : "#ffffff";

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div className="buysell-modal-inner" style={{
                background: modalBg,
                borderRadius: "16px",
                width: "min(420px, 90vw)",   /* compact dialog on all screen sizes */
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "24px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                border: `1px solid ${borderCol}`,
                boxSizing: "border-box"
            }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: isBuy ? "#16a34a" : "#dc2626" }}>
                            {isBuy ? "Buy" : "Sell"} {selectedStock?.replace(".NS", "")}
                        </h2>
                        <span style={{
                            display: "inline-block", marginTop: "4px",
                            fontSize: "11px", fontWeight: "700", padding: "2px 10px", borderRadius: "20px",
                            background: mktClosed ? (dark ? "#451a03" : "#fef3c7") : (dark ? "#14532d" : "#dcfce7"),
                            color: mktClosed ? (dark ? "#fbbf24" : "#92400e") : (dark ? "#4ade80" : "#15803d")
                        }}>
                            {mktClosed ? "Market Closed" : "Market Open"}
                        </span>
                    </div>
                    {/* Close button — always red, always visible in any mode */}
                    <button onClick={close} aria-label="Close" style={{
                        width: "34px", height: "34px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#ef4444",
                        color: "#ffffff",
                        fontSize: "16px", fontWeight: "900",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, lineHeight: 1
                    }}>✕</button>
                </div>

                {/* Market Closed Banner */}
                {mktClosed && (
                    <div style={{
                        background: dark ? "#451a0322" : "#fffbeb",
                        border: `1px solid ${dark ? "#78350f" : "#fcd34d"}`,
                        borderRadius: "10px", padding: "12px 14px", marginBottom: "16px"
                    }}>
                        <p style={{ margin: 0, fontWeight: "700", fontSize: "13px", color: dark ? "#fbbf24" : "#92400e" }}>
                            Trading Hours: Mon–Fri, 9:15 AM – 3:30 PM IST
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: "12px", color: dark ? "#fcd34d" : "#78350f" }}>
                            {marketStatus.reason}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: "11px", color: dark ? "#d97706" : "#a16207" }}>
                            Orders outside market hours are not accepted by NSE/BSE.
                        </p>
                    </div>
                )}

                {/* Price + Balance */}
                <div style={{ background: panelBg, borderRadius: "10px", padding: "14px", marginBottom: "20px", border: `1px solid ${borderCol}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px", color: muteTxt }}>Market Price</span>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: txt }}>{livePrice ? `₹${livePrice.toFixed(2)}` : "Loading…"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px", color: muteTxt }}>Available Balance</span>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#3b82f6" }}>{'₹'}{balance.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "13px", color: muteTxt }}>Order Value</span>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: isBuy ? "#16a34a" : "#dc2626" }}>{'₹'}{total}</span>
                    </div>
                </div>

                {/* Quantity */}
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: muteTxt, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quantity</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            style={{ width: "36px", height: "36px", borderRadius: "8px", border: `1.5px solid ${borderCol}`, background: panelBg, fontSize: "18px", cursor: "pointer", color: txt }}>−</button>
                        <input type="number" min="1" value={quantity}
                            onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                            style={{ flex: 1, textAlign: "center", padding: "8px", border: `1.5px solid ${borderCol}`, borderRadius: "8px", fontSize: "16px", fontWeight: "700", background: inputBg, color: txt }} />
                        <button onClick={() => setQuantity(q => q + 1)}
                            style={{ width: "36px", height: "36px", borderRadius: "8px", border: `1.5px solid ${borderCol}`, background: panelBg, fontSize: "18px", cursor: "pointer", color: txt }}>+</button>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div style={{
                        padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px",
                        background: isSuccess ? (dark ? "#14532d" : "#f0fdf4") : (dark ? "#450a0a" : "#fef2f2"),
                        color: isSuccess ? (dark ? "#4ade80" : "#16a34a") : (dark ? "#f87171" : "#dc2626"),
                        border: `1px solid ${isSuccess ? (dark ? "#166534" : "#bbf7d0") : (dark ? "#7f1d1d" : "#fecaca")}`
                    }}>
                        {message}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={close}
                        style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1.5px solid ${borderCol}`, background: "transparent", fontWeight: "600", cursor: "pointer", color: txt }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleOrder}
                        disabled={loading || !livePrice || mktClosed}
                        title={mktClosed ? marketStatus.reason : ""}
                        style={{
                            flex: 2, padding: "12px", borderRadius: "10px", border: "none",
                            background: mktClosed ? (dark ? "#334155" : "#9ca3af") : (isBuy ? "#16a34a" : "#dc2626"),
                            color: "#fff", fontWeight: "700",
                            cursor: (loading || mktClosed) ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Processing…" : mktClosed ? "Market Closed" : `${isBuy ? "Buy" : "Sell"} at ₹${total}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BuySellModal;
