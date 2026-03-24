import React, { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import { FRONTEND_URL } from "../config";

const Home = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read token/user passed via URL params from frontend (cross-origin login handoff)
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const urlUser  = params.get('user');

      if (urlToken && urlToken !== 'null') {
        localStorage.setItem('token', urlToken);
        if (urlUser) {
          try { localStorage.setItem('user', decodeURIComponent(urlUser)); } catch { }
        }
        // Clean sensitive data from address bar
        window.history.replaceState({}, '', '/');
      }
    } catch (e) {
      console.warn('Home: error parsing URL params', e);
    }

    const token = localStorage.getItem('token');
    if (!token || token === 'null') {
      // Use config-driven URL so this works on deployment too
      window.location.assign(`${FRONTEND_URL}/login`);
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  return (
    <>
      <TopBar />
      <Dashboard />
    </>
  );
};

export default Home;
