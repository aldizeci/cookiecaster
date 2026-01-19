import React, {createContext, useContext, useMemo} from "react";
import {createServices} from "./ServiceContainer.js";

const ServicesContext = createContext(null);

export function ServicesProvider({children}) {
    const services = useMemo(() => createServices(), []);
    return (
        <ServicesContext.Provider value={services}>
            {children}
        </ServicesContext.Provider>
    );
}

export function useServices() {
    const ctx = useContext(ServicesContext);
    if (!ctx) throw new Error("useServices must be used within ServicesProvider");
    return ctx;
}