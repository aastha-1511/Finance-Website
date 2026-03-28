import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

const Funds = () => {
  const [portfolio, setPortfolio] = useState({ balance: 0, positions: [] });
  const [livePrices, setLivePrices] = useState({});
  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const token = localStorage.getItem("token");

  const fetchPortfolio = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortfolio(data);
      // Fetch live prices for all held positions
      if (data.positions?.length > 0) {
        const symbols = data.positions.map(p => p.symbol).join(",");
        const pr = await axios.get(`${API_URL}/api/stocks/prices?symbols=${symbols}`);
        const map = {};
        pr.data.forEach(s => { map[s.symbol] = s.price; });
        setLivePrices(map);
      }
    } catch { }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleAdd = async () => {
    if (!addAmount || addAmount <= 0) return showMsg("Enter a valid amount", "error");
    try {
      const { data } = await axios.post(`${API_URL}/api/portfolio/funds/add`,
        { amount: Number(addAmount) }, { headers: { Authorization: `Bearer ${token}` } });
      setPortfolio(p => ({ ...p, balance: data.balance }));
      setAddAmount("");
      showMsg(`₹${Number(addAmount).toLocaleString("en-IN")} added!`, "success");
    } catch (err) { showMsg(err.response?.data?.message || "Failed", "error"); }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) return showMsg("Enter a valid amount", "error");
    try {
      const { data } = await axios.post(`${API_URL}/api/portfolio/funds/withdraw`,
        { amount: Number(withdrawAmount) }, { headers: { Authorization: `Bearer ${token}` } });
      setPortfolio(p => ({ ...p, balance: data.balance }));
      setWithdrawAmount("");
      showMsg(`₹${Number(withdrawAmount).toLocaleString("en-IN")} withdrawn`, "success");
    } catch (err) { showMsg(err.response?.data?.message || "Failed", "error"); }
  };

  // Derived stats
  const invested = portfolio.positions?.reduce((a, p) => a + p.quantity * p.averagePrice, 0) || 0;
  const currentValue = portfolio.positions?.reduce((a, p) => {
    const ltp = livePrices[p.symbol] || p.averagePrice;
    return a + p.quantity * ltp;
  }, 0) || 0;
  const pnl = currentValue - invested;
  const pnlPct = invested > 0 ? ((pnl / invested) * 100).toFixed(2) : "0.00";
  const totalFunds = portfolio.balance + invested;

  if (loading) return <div style={{ padding: "30px" }}>Loading...</div>;

  const StatCard = ({ title, value, sub, color, prefix = "₹" }) => (
    <div style={{ flex: 1, minWidth: "160px", background: "#fff", borderRadius: "14px", padding: "18px 22px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</p>
      <p style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: color || "#111827" }}>
        {prefix}{typeof value === "number" ? Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : value}
      </p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9ca3af" }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ padding: "28px", maxWidth: "880px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#111827", marginBottom: "4px" }}>Funds & Portfolio</h2>
      <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "24px" }}>Manage balance and track portfolio performance</p>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "14px", marginBottom: "28px", flexWrap: "wrap" }}>
        <StatCard title="Available Balance" value={portfolio.balance} color="#16a34a" sub="Cash ready to invest" />
        <StatCard title="Invested (Used)" value={invested} color="#3b82f6" sub={`${portfolio.positions?.length || 0} position${portfolio.positions?.length !== 1 ? "s" : ""}`} />
        <StatCard title="Current Value" value={currentValue} color="#6366f1" sub="Live market value" />
        <StatCard
          title="Total P&L"
          value={pnl}
          prefix={pnl >= 0 ? "+₹" : "-₹"}
          color={pnl >= 0 ? "#16a34a" : "#dc2626"}
          sub={`${pnl >= 0 ? "▲" : "▼"} ${Math.abs(pnlPct)}% on invested`}
        />
      </div>

      {/* P&L progress bar */}
      {invested > 0 && (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Portfolio Health</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: pnl >= 0 ? "#16a34a" : "#dc2626" }}>
              {pnl >= 0 ? "▲ Profit" : "▼ Loss"} {Math.abs(pnlPct)}%
            </span>
          </div>
          <div style={{ height: "8px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "99px",
              width: `${Math.min(100, Math.abs(parseFloat(pnlPct)) * 5)}%`,
              background: pnl >= 0 ? "linear-gradient(90deg, #16a34a, #22c55e)" : "linear-gradient(90deg, #dc2626, #f87171)",
              transition: "width 0.6s ease"
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>Total Portfolio: ₹{totalFunds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>Live prices · refresh page to update</span>
          </div>
        </div>
      )}

      {/* Message toast */}
      {message.text && (
        <div style={{
          padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", fontSize: "14px",
          background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
          color: message.type === "success" ? "#16a34a" : "#dc2626",
          border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`
        }}>{message.text}</div>
      )}

      {/* Add / Withdraw */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {/* Add Funds */}
        <div style={{ flex: 1, minWidth: "280px", background: "#fff", borderRadius: "14px", padding: "24px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", marginBottom: "16px" }}>Add Dummy Funds</h3>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            {[5000, 10000, 25000, 50000].map(amt => (
              <button key={amt} onClick={() => setAddAmount(String(amt))}
                style={{ padding: "6px 14px", borderRadius: "20px", border: "1.5px solid #6366f1", background: addAmount === String(amt) ? "#6366f1" : "#fff", color: addAmount === String(amt) ? "#fff" : "#6366f1", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                ₹{amt / 1000}K
              </button>
            ))}
          </div>
          <input type="number" placeholder="Custom amount (₹)" value={addAmount} onChange={e => setAddAmount(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }} />
          <button onClick={handleAdd} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}>
            Add Funds
          </button>
        </div>

        {/* Withdraw */}
        <div style={{ flex: 1, minWidth: "280px", background: "#fff", borderRadius: "14px", padding: "24px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", marginBottom: "16px" }}>Withdraw</h3>
          <input type="number" placeholder="Amount to withdraw (₹)" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }} />
          <button onClick={handleWithdraw} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #dc2626", background: "#fff", color: "#dc2626", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}>
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};

export default Funds;
