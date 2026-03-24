import React, { useState, createContext } from "react";

export const GeneralContext = createContext();

export const GeneralContextProvider = (props) => {
    const [selectedStock, setSelectedStock] = useState("RELIANCE.NS");
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);

    const openBuyModal = (stock) => {
        setSelectedStock(stock);
        setIsBuyModalOpen(true);
    };
    const closeBuyModal = () => setIsBuyModalOpen(false);

    const openSellModal = (stock) => {
        setSelectedStock(stock);
        setIsSellModalOpen(true);
    };
    const closeSellModal = () => setIsSellModalOpen(false);

    return (
        <GeneralContext.Provider
            value={{
                selectedStock,
                setSelectedStock,
                openBuyModal,
                openSellModal,
                closeBuyModal,
                closeSellModal,
                isBuyModalOpen,
                isSellModalOpen
            }}
        >
            {props.children}
        </GeneralContext.Provider>
    );
};
