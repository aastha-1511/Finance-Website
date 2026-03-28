import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

// Tracks whether dark mode is currently active
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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const dark = useDark();
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get(`${API_URL}/api/portfolio`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const sorted = (r.data.orders || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        setOrders(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ padding: "30px" }}>Loading orders...</div>;

  return (
    <div style={{ padding: "28px", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#111827", marginBottom: "6px" }}>Orders</h2>
      <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "24px" }}>History of all your buy and sell transactions</p>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "6px" }}>No orders yet</p>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>Add funds and buy a stock to see your orders here.</p>
        </div>
      ) : (
        <div className="table-scroll-wrapper" style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f3f4f6", background: "#f9fafb" }}>
                {["Time", "Symbol", "Type", "Qty", "Price", "Value"].map(h => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6b7280" }}>
                    {new Date(o.date).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700", color: "#111827" }}>
                    {o.symbol.replace(".NS", "")}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                      background: o.type === "BUY"
                        ? (dark ? "#14532d" : "#f0fdf4")
                        : (dark ? "#450a0a" : "#fef2f2"),
                      color: o.type === "BUY"
                        ? (dark ? "#86efac" : "#16a34a")
                        : (dark ? "#fca5a5" : "#dc2626")
                    }}>
                      {o.type}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#374151" }}>{o.quantity}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#374151" }}>₹{o.price?.toFixed(2)}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "600", color: "#111827" }}>₹{(o.quantity * o.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
