import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { GeneralContextProvider } from "./GeneralContext";

import Apps from "./Apps";
import Funds from "./Funds";
import Holdings from "./Holdings";
import Orders from "./Orders";
import Positions from "./Positions";
import Summary from "./Summary";
import WatchList from "./WatchList";
import BuySellModal from "./BuySellModal";
import Expenses from "./Expenses";

const Dashboard = () => {
  const location = useLocation();
  const isMarketsPage = location.pathname === "/";

  return (
    <GeneralContextProvider>
      <div className="dashboard-container">
        <BuySellModal />
        {/* WatchList only shown on the Markets page */}
        {isMarketsPage && <WatchList />}
        <div className="content">
          <Routes>
            <Route exact path="/" element={<Summary />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/funds" element={<Funds />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/apps" element={<Apps />} />
          </Routes>
        </div>
      </div>
    </GeneralContextProvider>
  );
};

export default Dashboard;
