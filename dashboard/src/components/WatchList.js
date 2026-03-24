import React, { useContext, useState, useEffect, useCallback } from "react";
import { GeneralContext } from "./GeneralContext";
import { API_URL } from "../config";

const useBreakpoint = () => {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 1024);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
};

const useDark = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark"))
    );
    obs.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
};

const WatchList = () => {
  const { setSelectedStock, selectedStock } = useContext(GeneralContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const mobile = useBreakpoint();
  const dark = useDark();

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/stocks/prices`);
      const data = await res.json();
      if (Array.isArray(data)) setStocks(data);
    } catch (e) {
      console.error("Price fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const filtered = stocks.filter((s) =>
    (s.name || s.symbol).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bg = dark ? "#1e293b" : "#fff";
  const border = dark ? "#334155" : "#e5e7eb";
  const mute = dark ? "#94a3b8" : "#9ca3af";
  const txt = dark ? "#f1f5f9" : "#111827";

  const SearchIcon = ({ size = 15 }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  /* ── HORIZONTAL (mobile / tablet ≤1024px) ── */
  if (mobile) {
    return (
      <div style={{
        width: "100%",
        borderBottom: `1px solid ${border}`,
        background: bg,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}>
        {/* Toolbar row: label + search toggle */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 12px", borderBottom: searchOpen ? `1px solid ${border}` : "none"
        }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: mute, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Watchlist {loading && <span style={{ fontSize: "10px", fontWeight: "400" }}>· updating…</span>}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* Expandable search input */}
            {searchOpen && (
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search…"
                style={{
                  padding: "4px 10px", border: `1.5px solid ${border}`, borderRadius: "8px",
                  fontSize: "12px", background: dark ? "#0f172a" : "#f9fafb",
                  color: txt, outline: "none", width: "140px"
                }}
              />
            )}
            {/* Magnifying glass toggle */}
            <button
              onClick={() => { setSearchOpen(v => !v); if (searchOpen) setSearchTerm(""); }}
              title="Search stocks"
              style={{
                width: "30px", height: "30px", borderRadius: "8px", border: `1px solid ${border}`,
                background: searchOpen ? (dark ? "#1e3a5f" : "#eff6ff") : (dark ? "#0f172a" : "#f9fafb"),
                color: searchOpen ? "#3b82f6" : mute, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <SearchIcon />
            </button>
          </div>
        </div>

        {/* Horizontal scrollable stock chips — always white bg so text is always readable */}
        <div className="watchlist-h-scroll" style={{ overflowX: "auto", display: "flex", gap: "8px", padding: "8px 12px" }}>
          {filtered.map(stock => {
            const isUp     = stock.changePercent >= 0;
            const isActive = selectedStock === stock.symbol;
            return (
              <div
                key={stock.symbol}
                onClick={() => setSelectedStock(stock.symbol)}
                style={{
                  flexShrink: 0, cursor: "pointer",
                  padding: "6px 12px", borderRadius: "10px",
                  border: `2px solid ${isActive ? "#3b82f6" : "#d1d5db"}`,
                  background: isActive ? "#dbeafe" : "#ffffff",   /* always white for non-active */
                  display: "flex", flexDirection: "column", gap: "2px",
                  transition: "all 0.15s", minWidth: "88px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                }}
              >
                {/* Stock name — always dark for maximum contrast */}
                <span style={{ fontSize: "12px", fontWeight: "800",
                  color: isActive ? "#1d4ed8" : "#111827",
                  whiteSpace: "nowrap" }}>
                  {stock.name?.split(" ")[0] || stock.symbol.replace(".NS", "")}
                </span>
                {/* Change % */}
                <span style={{ fontSize: "11px", fontWeight: "700",
                  color: isUp ? "#15803d" : "#b91c1c" }}>
                  {isUp ? "▲" : "▼"} {Math.abs(stock.changePercent || 0).toFixed(2)}%
                </span>
                {/* Price */}
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#374151" }}>
                  ₹{stock.price?.toFixed(0) || "—"}
                </span>
              </div>
            );
          })}
          {!loading && filtered.length === 0 && (
            <span style={{ color: mute, fontSize: "12px", padding: "8px 0" }}>No results</span>
          )}
        </div>
      </div>
    );
  }

  /* ── VERTICAL (desktop >1024px) ── */
  return (
    <div className="watchlist-sidebar" style={{
      width: "28%", minWidth: "220px", maxWidth: "300px",
      borderRight: `1px solid ${border}`,
      background: bg,
      display: "flex", flexDirection: "column", height: "100%"
    }}>
      {/* Header with magnifying glass */}
      <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: mute, textTransform: "uppercase", letterSpacing: "0.06em", flex: 1 }}>Watchlist</span>

        {searchOpen && (
          <input
            autoFocus
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search…"
            style={{
              flex: 1, padding: "6px 10px", border: `1.5px solid ${border}`,
              borderRadius: "8px", fontSize: "12px",
              background: dark ? "#0f172a" : "#f9fafb", color: txt, outline: "none"
            }}
          />
        )}
        <button
          onClick={() => { setSearchOpen(v => !v); if (searchOpen) setSearchTerm(""); }}
          title="Search stocks"
          style={{
            width: "30px", height: "30px", borderRadius: "8px", border: `1px solid ${border}`,
            background: searchOpen ? (dark ? "#1e3a5f" : "#eff6ff") : "transparent",
            color: searchOpen ? "#3b82f6" : mute, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}
        >
          <SearchIcon />
        </button>
      </div>

      {loading && (
        <p style={{ fontSize: "11px", color: mute, margin: "6px 14px 0" }}>Fetching live prices…</p>
      )}

      {/* Stock list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.map(stock => {
          const isUp = stock.changePercent >= 0;
          const isActive = selectedStock === stock.symbol;
          return (
            <div
              key={stock.symbol}
              onClick={() => setSelectedStock(stock.symbol)}
              style={{
                padding: "12px 14px",
                borderBottom: `1px solid ${border}`,
                cursor: "pointer",
                backgroundColor: isActive ? (dark ? "#1e3a5f" : "#EFF6FF") : "transparent",
                borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                transition: "background 0.15s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: "700", fontSize: "13px", color: isActive ? "#3b82f6" : (dark ? "#e2e8f0" : "#111827") }}>
                    {stock.name?.split(" ")[0] || stock.symbol.replace(".NS", "")}
                  </p>
                  <p style={{ margin: 0, fontSize: "10px", color: dark ? "#94a3b8" : "#6b7280" }}>{stock.symbol.replace(".NS", "")}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: "700", fontSize: "13px", color: dark ? "#e2e8f0" : "#111827" }}>
                    ₹{stock.price?.toFixed(2) || "—"}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: isUp ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                    {isUp ? "▲" : "▼"} {Math.abs(stock.changePercent || 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <p style={{ padding: "20px", textAlign: "center", color: mute, fontSize: "13px" }}>No stocks found</p>
        )}
      </div>
    </div>
  );
};

export default WatchList;
