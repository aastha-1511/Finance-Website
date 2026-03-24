import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FRONTEND_URL } from '../config';

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

const navItems = [
  { path: "/",          label: "Markets",   icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { path: "/orders",    label: "Orders",    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { path: "/holdings",  label: "Holdings",  icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" },
  { path: "/positions", label: "Positions", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { path: "/funds",     label: "Funds",     icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { path: "/expenses",  label: "Expenses",  icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
];

/**
 * Menu renders nav links.
 * Props:
 *   onNavigate - called after any link is clicked (closes mobile dropdown)
 *   vertical   - if true, renders as a full-width vertical dropdown list
 *   dark       - override dark value (used when rendered inside TopBar dropdown)
 */
const Menu = ({ onNavigate, vertical = false }) => {
  const location = useLocation();
  const dark     = useDark();

  const isActive = (path) => location.pathname === path;

  /* ── VERTICAL MODE (mobile dropdown) ─── */
  if (vertical) {
    const rowStyle = (path) => ({
      display: "flex", alignItems: "center", gap: "12px",
      padding: "14px 20px",
      textDecoration: "none",
      fontSize: "14px", fontWeight: isActive(path) ? "700" : "500",
      color: isActive(path)
        ? (dark ? "#93c5fd" : "#2563EB")
        : (dark ? "#e2e8f0" : "#374151"),
      background: isActive(path)
        ? (dark ? "rgba(30,58,95,0.8)" : "#EFF6FF")
        : "transparent",
      borderLeft: isActive(path)
        ? `3px solid ${dark ? "#93c5fd" : "#2563EB"}`
        : "3px solid transparent",
      transition: "background 0.15s",
    });

    const dividerStyle = {
      height: "1px",
      background: dark ? "#334155" : "#f3f4f6",
      margin: "0"
    };

    return (
      <>
        {/* Home */}
        <a href={FRONTEND_URL} onClick={onNavigate} style={rowStyle("__home")}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Home</span>
        </a>
        <div style={dividerStyle} />

        {/* Nav items */}
        {navItems.map(({ path, label, icon }, i) => (
          <React.Fragment key={path}>
            <Link to={path} onClick={onNavigate} style={rowStyle(path)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              <span>{label}</span>
            </Link>
            {i < navItems.length - 1 && <div style={dividerStyle} />}
          </React.Fragment>
        ))}
        <div style={dividerStyle} />

        {/* Community */}
        <a href={`${FRONTEND_URL}/community`} onClick={onNavigate}
          style={{ ...rowStyle("__community"), color: dark ? "#a5b4fc" : "#6366f1" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Community</span>
        </a>
      </>
    );
  }

  /* ── HORIZONTAL MODE (desktop) ─── */
  const linkStyle = (path) => ({
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '5px 10px', borderRadius: '8px', textDecoration: 'none',
    fontSize: '12.5px', fontWeight: isActive(path) ? '700' : '500',
    color: isActive(path)
      ? (dark ? '#93c5fd' : '#2563EB')
      : (dark ? '#e2e8f0' : '#374151'),
    backgroundColor: isActive(path)
      ? (dark ? '#1e3a5f' : '#EFF6FF')
      : 'transparent',
    transition: 'all 0.15s', whiteSpace: 'nowrap'
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {/* Home icon */}
      <a href={FRONTEND_URL} title="Back to FinanceHub Home" onClick={onNavigate}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '8px',
          color: dark ? '#e2e8f0' : '#374151', textDecoration: 'none',
          marginRight: '4px', border: `1.5px solid ${dark ? '#334155' : '#e5e7eb'}`,
          background: dark ? '#0f172a' : '#f9fafb', transition: 'all 0.15s'
        }}>
        <svg width="15" height="15" fill="none" stroke={dark ? '#e2e8f0' : '#374151'} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </a>

      {navItems.map(({ path, label, icon }) => (
        <Link key={path} to={path} style={linkStyle(path)} onClick={onNavigate}>
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
          {label}
        </Link>
      ))}

      {/* Community */}
      <a href={`${FRONTEND_URL}/community`} onClick={onNavigate}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 10px', borderRadius: '8px', textDecoration: 'none',
          fontSize: '12.5px', fontWeight: '500',
          color: dark ? '#a5b4fc' : '#6366f1',
          backgroundColor: dark ? '#1e1b4b' : '#eef2ff',
          transition: 'all 0.15s', whiteSpace: 'nowrap'
        }}>
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Community
      </a>
    </div>
  );
};

export default Menu;
