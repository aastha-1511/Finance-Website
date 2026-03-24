import React, { useContext, useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";
import { GeneralContext } from "./GeneralContext";
import { API_URL } from "../config";

const RANGE_OPTIONS = [
  { label: "1M", range: "1mo", interval: "1d" },
  { label: "3M", range: "3mo", interval: "1d" },
  { label: "6M", range: "6mo", interval: "1d" },
  { label: "1Y", range: "1y", interval: "1wk" },
];

const Summary = () => {
  const { selectedStock, openBuyModal, openSellModal } = useContext(GeneralContext);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState(RANGE_OPTIONS[0]);
  const [livePrice, setLivePrice] = useState(null);

  useEffect(() => {
    if (!selectedStock) return;
    const fetchHistory = async () => {
      setLoading(true); setError("");
      try {
        const { data } = await axios.get(
          `${API_URL}/api/stocks/${selectedStock}/history?interval=${range.interval}&range=${range.range}`
        );
        if (!data.quotes || data.quotes.length === 0) {
          setError("No candlestick data available for this period."); setChartData([]); return;
        }
        const formatted = data.quotes
          .filter(q => q.open && q.high && q.low && q.close)
          .map(q => ({ x: new Date(q.date), y: [q.open, q.high, q.low, q.close] }));
        setChartData([{ data: formatted }]);
      } catch {
        setError("Failed to load chart data. Check your internet connection.");
      } finally { setLoading(false); }
    };
    fetchHistory();
  }, [selectedStock, range]);

  useEffect(() => {
    if (!selectedStock) return;
    axios.get(`${API_URL}/api/stocks/quote/${selectedStock}`)
      .then(r => setLivePrice(r.data.price))
      .catch(() => { });
    const iv = setInterval(() => {
      axios.get(`${API_URL}/api/stocks/quote/${selectedStock}`)
        .then(r => setLivePrice(r.data.price)).catch(() => { });
    }, 10000);
    return () => clearInterval(iv);
  }, [selectedStock]);

  const chartOptions = {
    chart: {
      type: "candlestick", height: 420,
      toolbar: { show: true, tools: { download: false } },
      background: "#fff", animations: { enabled: false }
    },
    title: {
      text: selectedStock?.replace(".NS", "") + " Price Chart",
      align: "left",
      style: { fontSize: "16px", fontWeight: "700", color: "#6366f1" }
    },
    xaxis: { type: "datetime", labels: { style: { fontSize: "11px" } } },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        formatter: v => `₹${v?.toFixed(0)}`,
        style: { fontSize: "11px" }
      }
    },
    plotOptions: {
      candlestick: {
        colors: { upward: "#16a34a", downward: "#dc2626" },
        wick: { useFillColor: true }
      }
    },
    grid: { borderColor: "#f3f4f6" },
    tooltip: {
      custom: ({ dataPointIndex, w }) => {
        try {
          const point = w.globals.initialSeries[0]?.data[dataPointIndex];
          if (!point || !Array.isArray(point.y)) return "";
          const [o, h, l, c] = point.y;
          const sym = selectedStock?.replace(".NS", "");
          return `<div style="padding:12px 14px;font-size:12px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.12);min-width:140px">
            <b style="color:#111827;font-size:13px">${sym}</b><br/>
            <div style="margin-top:6px;display:grid;grid-template-columns:auto auto;gap:2px 12px">
              <span style="color:#9ca3af">Open</span><b>₹${o?.toFixed(2)}</b>
              <span style="color:#9ca3af">High</span><b style="color:#16a34a">₹${h?.toFixed(2)}</b>
              <span style="color:#9ca3af">Low</span><b style="color:#dc2626">₹${l?.toFixed(2)}</b>
              <span style="color:#9ca3af">Close</span><b>₹${c?.toFixed(2)}</b>
            </div>
          </div>`;
        } catch { return ""; }
      }
    }
  };

  return (
    <div style={{ padding: "16px", flex: 1, minWidth: 0, boxSizing: "border-box", overflowX: "hidden" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        {/* Stock name + price */}
        <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "800", color: "#111827" }}>
          {selectedStock?.replace(".NS", "")}
        </h2>
        {livePrice && (
          <p style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: "700", color: "#3b82f6" }}>
            ₹{livePrice?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "8px" }}>Live · updates every 10s</span>
          </p>
        )}
        {/* Controls row — wraps on mobile so nothing overflows */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {RANGE_OPTIONS.map(r => (
            <button key={r.label} onClick={() => setRange(r)}
              style={{
                padding: "6px 12px", borderRadius: "8px", border: "1.5px solid", fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "all 0.15s",
                borderColor: range.label === r.label ? "#6366f1" : "#e5e7eb",
                background: range.label === r.label ? "#6366f1" : "#fff",
                color: range.label === r.label ? "#fff" : "#6b7280"
              }}>{r.label}</button>
          ))}
          <button onClick={() => openBuyModal(selectedStock)}
            style={{ padding: "7px 18px", borderRadius: "8px", border: "none", background: "#16a34a", color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            BUY
          </button>
          <button onClick={() => openSellModal(selectedStock)}
            style={{ padding: "7px 18px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            SELL
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {loading ? (
          <div style={{ height: "420px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "#9ca3af", fontSize: "15px" }}>Loading candlestick data…</p>
          </div>
        ) : error ? (
          <div style={{ height: "420px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "#dc2626", fontSize: "14px" }}>{error}</p>
          </div>
        ) : chartData.length > 0 && chartData[0].data.length > 0 ? (
          <ReactApexChart options={chartOptions} series={chartData} type="candlestick" height={420} />
        ) : (
          <div style={{ height: "420px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "#9ca3af" }}>No data available. Select a stock from the watchlist.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;
