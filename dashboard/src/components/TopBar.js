import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Menu from "./Menu";
import { API_URL, FRONTEND_URL } from "../config";

const TopBar = () => {
  const [indices, setIndices]   = useState({ nifty: null, sensex: null });
  const [dark, setDark]         = useState(() => localStorage.getItem("fh-dark") === "1");
  const [menuOpen, setMenuOpen] = useState(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  })();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("fh-dark", dark ? "1" : "0");
  }, [dark]);

  // Close mobile dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.assign(`${FRONTEND_URL}/logout`);
  };

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const res  = await fetch(`${API_URL}/api/stocks/prices?symbols=%5ENSEI,%5EBSESN`);
        const data = await res.json();
        setIndices({
          nifty:  data.find(d => d.symbol === "^NSEI"),
          sensex: data.find(d => d.symbol === "^BSESN"),
        });
      } catch (e) {}
    };
    fetchIndices();
    const iv = setInterval(fetchIndices, 15000);
    return () => clearInterval(iv);
  }, []);

  const IndexChip = ({ label, data }) => {
    if (!data) return (
      <div className="topbar-index-chip" style={{ padding: "4px 14px" }}>
        <span style={{ fontSize: "12px", color: "#9ca3af" }}>{label}</span>
      </div>
    );
    const up = data.changePercent >= 0;
    return (
      <div className="topbar-index-chip" style={{ padding: "4px 14px", borderRight: `1px solid ${dark ? "#334155" : "#f3f4f6"}` }}>
        <span style={{ fontSize: "11px", color: "#9ca3af", display: "block" }}>{label}</span>
        <span style={{ fontSize: "14px", fontWeight: "700", color: dark ? "#e2e8f0" : "#111827" }}>
          {data.price?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
        <span style={{ fontSize: "11px", fontWeight: "600", color: up ? "#16a34a" : "#dc2626", marginLeft: "6px" }}>
          {up ? "▲" : "▼"} {Math.abs(data.changePercent || 0).toFixed(2)}%
        </span>
      </div>
    );
  };

  const topbarBg     = dark ? "#1e293b" : "#fff";
  const borderCol    = dark ? "#334155" : "#e5e7eb";
  const textCol      = dark ? "#e2e8f0" : "#374151";

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: "52px", borderBottom: `1px solid ${borderCol}`,
      background: topbarBg, padding: "0 16px",
      position: "relative", zIndex: 200,
      transition: "background 0.25s", flexShrink: 0
    }}>
      {/* LEFT: Logo + Indices */}
      <div style={{ display: "flex", alignItems: "center", gap: "0", minWidth: 0 }}>
        <Link to="/" style={{ marginRight: "16px", display: "flex", alignItems: "center" }}>
          <img src="/assets/FINANCEHUB.png" alt="FinanceHub" style={{ height: "28px", objectFit: "contain" }} />
        </Link>
        <div className="topbar-indices" style={{ display: "flex" }}>
          <IndexChip label="NIFTY 50" data={indices.nifty} />
          <IndexChip label="SENSEX"   data={indices.sensex} />
        </div>
      </div>

      {/* CENTER: Desktop nav (hidden on mobile via CSS) */}
      <div className="topbar-nav-desktop">
        <Menu onNavigate={() => setMenuOpen(false)} />
      </div>

      {/* RIGHT: Dark toggle + Hamburger + Avatar + Logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        {/* Dark mode toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{ fontSize: "13px" }}>{dark ? "🌙" : "☀️"}</span>
          <label className="dm-toggle" title="Toggle dark mode">
            <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} />
            <span className="dm-slider" />
          </label>
        </div>

        {/* Hamburger (visible on mobile only) */}
        <button
          className="hamburger-btn"
          style={{ color: textCol }}
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
          aria-label="Toggle navigation"
        >
          <span style={{ transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none" }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none" }} />
        </button>

        {/* Avatar */}
        {user && (
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%", background: "#6366f1",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: "700", fontSize: "12px", flexShrink: 0
          }}>
            {user.name?.slice(0, 2).toUpperCase() || "U"}
          </div>
        )}

        {/* Logout */}
        <button onClick={handleLogout} style={{
          fontSize: "12px", color: dark ? "#94a3b8" : "#6b7280",
          border: `1px solid ${borderCol}`,
          background: dark ? "#0f172a" : "#fff",
          padding: "5px 12px", borderRadius: "8px",
          cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap"
        }}>
          Logout
        </button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {menuOpen && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "52px",
            left: 0,
            right: 0,
            background: dark ? "#1e293b" : "#fff",
            borderBottom: `2px solid ${borderCol}`,
            borderTop: `1px solid ${borderCol}`,
            boxShadow: dark
              ? "0 8px 24px rgba(0,0,0,0.5)"
              : "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 300,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Dropdown header with close button */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 20px",
            borderBottom: `1px solid ${borderCol}`,
          }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: dark ? "#94a3b8" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Navigation
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                width: "32px", height: "32px", borderRadius: "8px",
                border: `1px solid ${borderCol}`,
                background: dark ? "#0f172a" : "#f9fafb",
                color: dark ? "#e2e8f0" : "#374151",
                fontSize: "18px", lineHeight: 1,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
              }}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <Menu
            onNavigate={() => setMenuOpen(false)}
            vertical
          />
        </div>
      )}
    </div>
  );
};

export default TopBar;
