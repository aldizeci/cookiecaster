import React from "react";
//import "./App.css";
import {HashRouter as Router, Routes, Route} from "react-router-dom";
import {IntlProvider} from "react-intl";

// Components
import Home from "./ui/pages/Home.jsx";
import Start from "./ui/pages/Start/Start.jsx";
import Export from "./ui/pages/Export.jsx";
import Navbar from "./ui/components/CustomNavbar.jsx";
import Gallery from "./ui/pages/Gallery/Gallery.jsx";
import Ueber from "./ui/pages/Ueber.jsx";
import ErrorPage from "./ui/pages/Error.jsx";
import About from "./ui/pages/About.jsx";

// Translations
import messages_de from "./translations/de.json";
import messages_en from "./translations/en.json";
import ResponsiveLayout from "./ui/components/ResponsiveLayout.jsx";


// Define supported locales
const messages = {
    de: messages_de,
    en: messages_en,
};

const getLocale = () => {
    const saved = window.localStorage.getItem("locale");
    return saved && messages[saved] ? saved : "de";
};

export default function App() {
    const locale = getLocale();

    return (
        <IntlProvider locale={locale} key={locale} messages={messages[locale]}>
            <Router>
                <Navbar />
                <main className="container py-4">
                    <ResponsiveLayout>
                        <Routes>
                            <Route path="/" element={<Home/>}/>
                            <Route path="/start" element={<Start/>}/>
                            <Route path="/export" element={<Export/>}/>
                            <Route path="/gallery" element={<Gallery/>}/>
                            <Route path="/ueber" element={<Ueber/>}/>
                            <Route path="/about" element={<About/>}/>
                            <Route path="*" element={<ErrorPage/>}/>
                        </Routes>
                    </ResponsiveLayout> 
                </main>
            </Router>
        </IntlProvider>
    );
}
