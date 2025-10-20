import React, {useEffect, useState, useCallback} from "react";
import {Link, useNavigate} from "react-router-dom";
import {FormattedMessage} from "react-intl";
import "./Gallery.css";

export default function Gallery() {
    const [items, setItems] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("drawings")) || [];
        setItems(stored.filter(d => d.saved));
    }, []);

    const handleSelect = useCallback((drawing) => {
        if (!drawing?.svgPath && !drawing?.svg) return;
        sessionStorage.setItem("selectedDrawingId", drawing.id);
        navigate("/start");
    }, [navigate]);

    const handleDelete = useCallback((id) => {
        const rest = items.filter(i => i.id !== id);
        localStorage.setItem("drawings", JSON.stringify(rest));
        setItems(rest);
    }, [items]);

    if (items.length === 0) {
        return (
            <div className="gallery-empty text-center p-5">
                <FormattedMessage id="gallery.empty" defaultMessage="Noch keine gespeicherten Formen"/>
                <div className="mt-4">
                    <Link to="/start" className="btn btn-primary">
                        <FormattedMessage id="gallery.backButton" defaultMessage="Zurück"/>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="gallery-container">
            <h2><FormattedMessage id="gallery.title" defaultMessage="Gespeicherte Formen"/></h2>
            <div className="gallery-grid">
                {items.map(item => (
                    <div key={item.id} className="gallery-item">
                        <svg
                            viewBox="0 0 200 200"
                            className="gallery-preview"
                            onClick={() => handleSelect(item)}
                        >
                            <path d={item.svgPath || item.svg}/>
                        </svg>
                        <div className="gallery-caption">
                            <p>{item.name}</p>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>
                                <FormattedMessage id="gallery.delete" defaultMessage="Löschen"/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Link to="/start" className="btn btn-primary mt-4">
                <FormattedMessage id="gallery.backButton" defaultMessage="Zurück"/>
            </Link>
        </div>
    );
}