import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/portfolio`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const pos = data.positions || [];
        setPositions(pos);

        if (pos.length > 0) {
          const symbols = pos.map(p => p.symbol).join(",");
          const priceRes = await axios.get(`${API_URL}/api/stocks/prices?symbols=${symbols}`);
          const map = {};
          priceRes.data.forEach(s => { map[s.symbol] = s.price; });
          setLivePrices(map);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  if (loading) return <div style={{ padding: "30px" }}>Loading positions...</div>;

  if (positions.length === 0) return (
    <div style={{ padding: "60px 28px", textAlign: "center" }}>
      <p style={{ fontSize: "16px", color: "#6b7280" }}>No open positions</p>
      <p style={{ fontSize: "13px", color: "#9ca3af" }}>Buy stocks to see your positions here.</p>
    </div>
  );

  const totalInvested = positions.reduce((a, p) => a + p.quantity * p.averagePrice, 0);
  const totalCurrent = positions.reduce((a, p) => a + p.quantity * (livePrices[p.symbol] || p.averagePrice), 0);
  const totalPnl = totalCurrent - totalInvested;

  return (
    <div style={{ padding: "28px", maxWidth: "1000px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#111827", marginBottom: "6px" }}>Positions</h2>
      <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "20px" }}>Your current open positions with live P&L</p>

      {/* Summary Cards */}
      <div className="stat-cards-row" style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Invested", value: totalInvested, color: "#3b82f6" },
          { label: "Current Value", value: totalCurrent, color: "#6366f1" },
          { label: "Total P&L", value: totalPnl, color: totalPnl >= 0 ? "#16a34a" : "#dc2626" }
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, minWidth: "180px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: "800", color }}>
              {totalPnl >= 0 || label !== "Total P&L" ? "" : "-"}₹{Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      <div className="positions-table-wrap" style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f3f4f6", background: "#f9fafb" }}>
              {["Instrument", "Qty", "Avg Cost", "LTP", "Invested", "Current", "P&L", "Change%"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, i) => {
              const ltp = livePrices[pos.symbol] || pos.averagePrice;
              const invested = pos.quantity * pos.averagePrice;
              const current = pos.quantity * ltp;
              const pnl = current - invested;
              const chg = ((pnl / invested) * 100).toFixed(2);
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontWeight: "700", fontSize: "13px", color: "#111827" }}>{pos.symbol.replace(".NS", "")}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#374151" }}>{pos.quantity}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#374151" }}>₹{pos.averagePrice.toFixed(2)}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "600", color: "#111827" }}>₹{ltp.toFixed(2)}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#374151" }}>₹{invested.toFixed(2)}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#374151" }}>₹{current.toFixed(2)}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700", color: pnl >= 0 ? "#16a34a" : "#dc2626" }}>
                    {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700", color: pnl >= 0 ? "#16a34a" : "#dc2626" }}>
                    {pnl >= 0 ? "▲" : "▼"}{Math.abs(chg)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Positions;
