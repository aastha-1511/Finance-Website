import React from "react";
import { Link, useLocation } from "react-router-dom";
import { DASHBOARD_URL } from "../config";

function NavBar() {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  const goToDashboard = () => {
    const token = localStorage.getItem('token');
    if (!token || token === 'null') {
      // Not actually logged in — send to login page
      window.location.assign('/login');
      return;
    }
    const user = localStorage.getItem('user') || '{}';
    const userEncoded = encodeURIComponent(user);
    window.location.assign(`${DASHBOARD_URL}?token=${token}&user=${userEncoded}`);
  };

  const links = [
    { to: "/about", label: "About" },
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    { to: "/support", label: "Support" },
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
      <div className="container">
        {/* Brand: logo + FinanceHub text */}
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/" style={{ textDecoration: "none" }}>
          <img src="/assets/FINANCEHUB.png" alt="logo" style={{ height: "38px" }} />
          <span style={{ fontWeight: "800", fontSize: "18px", color: "#1e40af", letterSpacing: "-0.5px" }}>
            FinanceHub
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto me-4 mb-2 mb-lg-0" style={{ gap: "1.2rem", alignItems: "center" }}>
            {links.map(({ to, label }) => (
              <li className="nav-item" key={to}>
                <Link
                  className="nav-link"
                  to={to}
                  style={{
                    fontWeight: location.pathname === to ? "700" : "500",
                    color: location.pathname === to ? "#2563EB" : "#374151",
                  }}
                >
                  {label}
                </Link>
              </li>
            ))}

            {isLoggedIn ? (
              <>
                {/* Dashboard button */}
                <li className="nav-item">
                  <button
                    onClick={goToDashboard}
                    style={{
                      backgroundColor: "#2563EB",
                      color: "#fff",
                      padding: "7px 16px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "14px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Dashboard
                  </button>
                </li>
                {/* Logout button */}
                <li className="nav-item">
                  <button
                    onClick={handleLogout}
                    style={{
                      backgroundColor: "transparent",
                      color: "#6b7280",
                      border: "1px solid #e5e7eb",
                      padding: "7px 16px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link
                  to="/login"
                  style={{
                    backgroundColor: "#2563EB",
                    color: "#fff",
                    padding: "7px 16px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "14px",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
