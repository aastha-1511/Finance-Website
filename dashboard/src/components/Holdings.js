import React, { useEffect, useState } from "react";
import axios from "axios";

const useDark = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
};

const Holdings = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const dark = useDark();

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return setLoading(false);

        const { data } = await axios.get("http://localhost:5000/api/portfolio", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPortfolio(data);

        // Fetch live prices for all positions
        if (data.positions?.length > 0) {
          const symbols = data.positions.map(p => p.symbol).join(",");
          const priceRes = await axios.get(`http://localhost:5000/api/stocks/prices?symbols=${symbols}`);
          const map = {};
          priceRes.data.forEach(s => { map[s.symbol] = s; });
          setLivePrices(map);
        }
      } catch (error) {
        console.error("Failed to fetch portfolio", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHoldings();
  }, []);

  const card = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "#334155" : "#e5e7eb";
  const txt = dark ? "#f1f5f9" : "#111827";
  const mute = dark ? "#94a3b8" : "#6b7280";

  if (loading) return (
    <div style={{ padding: "40px", color: mute, fontSize: "14px" }}>Loading holdings…</div>
  );

  if (!portfolio?.positions?.length) return (
    <div style={{ padding: "60px 28px", textAlign: "center" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>📂</div>
      <p style={{ fontSize: "16px", color: txt, fontWeight: "600", marginBottom: "6px" }}>No Holdings Yet</p>
      <p style={{ fontSize: "13px", color: mute }}>Buy stocks from the Summary page to see your holdings here.</p>
    </div>
  );

  const positions = portfolio.positions;

  const totalInvested = positions.reduce((a, p) => a + p.averagePrice * p.quantity, 0);
  const totalCurrent = positions.reduce((a, p) => {
    const ltp = livePrices[p.symbol]?.price || p.averagePrice;
    return a + ltp * p.quantity;
  }, 0);
  const totalPnl = totalCurrent - totalInvested;
  const pnlPct = totalInvested ? ((totalPnl / totalInvested) * 100) : 0;
  const isProfit = totalPnl >= 0;

  const statCards = [
    { label: "Invested", value: `₹${totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, accent: "#6366f1" },
    { label: "Current Value", value: `₹${totalCurrent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, accent: "#3b82f6" },
    {
      label: "Total P&L",
      value: `${isProfit ? "+" : ""}₹${Math.abs(totalPnl).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      sub: `${isProfit ? "▲" : "▼"} ${Math.abs(pnlPct).toFixed(2)}%`,
      accent: isProfit ? "#16a34a" : "#dc2626"
    },
  ];

  return (
    <div style={{ padding: "28px", maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: txt, margin: 0 }}>
          Holdings <span style={{ fontSize: "14px", fontWeight: "500", color: mute, marginLeft: "8px" }}>({positions.length} stocks)</span>
        </h2>
        <p style={{ color: mute, fontSize: "13px", marginTop: "4px" }}>Your long-term equity portfolio</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-row" style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        {statCards.map(({ label, value, sub, accent }) => (
          <div key={label} style={{
            flex: 1, minWidth: "200px", background: card, border: `1px solid ${border}`,
            borderRadius: "14px", padding: "18px 22px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            borderLeft: `4px solid ${accent}`
          }}>
            <p style={{ margin: "0 0 6px", fontSize: "11px", color: mute, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600" }}>{label}</p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: accent }}>{value}</p>
            {sub && <p style={{ margin: "3px 0 0", fontSize: "12px", fontWeight: "600", color: accent }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="holdings-table-wrap" style={{ background: card, border: `1px solid ${border}`, borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: dark ? "#1e3a5f" : "#f1f5f9", borderBottom: `1px solid ${border}` }}>
              {["Instrument", "Qty", "Avg Cost", "LTP", "Invested", "Current", "Day Chg%", "P&L", "P&L %"].map(h => (
                <th key={h} style={{
                  padding: "12px 16px", textAlign: "left", fontSize: "11px",
                  fontWeight: "700", color: dark ? "#94a3b8" : "#6b7280",
                  textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap"
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, i) => {
              const ltp = livePrices[pos.symbol]?.price || pos.averagePrice;
              const dayChg = livePrices[pos.symbol]?.changePercent || 0;
              const invested = pos.quantity * pos.averagePrice;
              const current = pos.quantity * ltp;
              const pnl = current - invested;
              const pnlPct = invested ? ((pnl / invested) * 100) : 0;
              const up = pnl >= 0;

              return (
                <tr key={i}
                  style={{ borderBottom: i < positions.length - 1 ? `1px solid ${border}` : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Instrument */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "8px",
                        background: dark ? "#1e3a5f" : "#eff6ff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: "800", color: "#6366f1"
                      }}>
                        {pos.symbol.replace(".NS", "").slice(0, 2)}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: "700", fontSize: "13px", color: txt }}>{pos.symbol.replace(".NS", "")}</p>
                        <p style={{ margin: 0, fontSize: "10px", color: mute }}>NSE</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: txt, fontWeight: "600" }}>{pos.quantity}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: mute }}>₹{pos.averagePrice.toFixed(2)}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700", color: txt }}>₹{ltp.toFixed(2)}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: mute }}>₹{invested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: txt, fontWeight: "600" }}>₹{current.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: "14px 16px", fontSize: "12px", fontWeight: "700", color: dayChg >= 0 ? (dark ? "#4ade80" : "#16a34a") : (dark ? "#f87171" : "#dc2626") }}>
                    {dayChg >= 0 ? "▲" : "▼"} {Math.abs(dayChg).toFixed(2)}%
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700", color: up ? (dark ? "#4ade80" : "#16a34a") : (dark ? "#f87171" : "#dc2626") }}>
                    {up ? "+" : ""}₹{Math.abs(pnl).toFixed(2)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                      background: up ? (dark ? "#14532d" : "#f0fdf4") : (dark ? "#450a0a" : "#fef2f2"),
                      color: up ? (dark ? "#86efac" : "#16a34a") : (dark ? "#fca5a5" : "#dc2626")
                    }}>
                      {up ? "+" : ""}{pnlPct.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* P&L progress bar */}
      <div style={{ marginTop: "16px", background: card, border: `1px solid ${border}`, borderRadius: "12px", padding: "16px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: mute, fontWeight: "600" }}>Portfolio Health</span>
          <span style={{ fontSize: "12px", fontWeight: "700", color: isProfit ? (dark ? "#4ade80" : "#16a34a") : (dark ? "#f87171" : "#dc2626") }}>
            {isProfit ? "▲" : "▼"} {Math.abs(pnlPct).toFixed(2)}% {isProfit ? "Profit" : "Loss"}
          </span>
        </div>
        <div style={{ background: dark ? "#334155" : "#f1f5f9", borderRadius: "99px", height: "8px", overflow: "hidden" }}>
          <div style={{
            width: `${Math.min(Math.abs(pnlPct) * 5, 100)}%`,
            height: "100%", borderRadius: "99px",
            background: isProfit ? "linear-gradient(90deg,#4ade80,#16a34a)" : "linear-gradient(90deg,#f87171,#dc2626)",
            transition: "width 0.6s ease"
          }} />
        </div>
      </div>
    </div>
  );
};

export default Holdings;
