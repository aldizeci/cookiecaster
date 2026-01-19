import React from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { exportCC3File } from "../../../utils/FileExport.js";
import "./Gallery.css";

// hooks
import { useTemplates } from "hooks/useTemplates.js";
import { useCustomItems } from "hooks/useCustomItems.js";
import { useGallerySelection } from "hooks/useGallerySelection.js";

// Dynamischer Import aller JSON Templates im Ordner /templates
const templateFiles = import.meta.glob("../../templates/*.json", { eager: true });

export default function Gallery() {
    const templates = useTemplates(templateFiles);
    const { customItems, deleteItem } = useCustomItems("drawings");
    const handleSelect = useGallerySelection();

    // --- Leerer Zustand ---
    if (templates.length === 0 && customItems.length === 0) {
        return (
            <div className="gallery-empty text-center p-5">
                <FormattedMessage
                    id="gallery.empty"
                    defaultMessage="Noch keine gespeicherten Formen"
                />
                <div className="mt-4">
                    <Link to="/start" className="btn btn-primary">
                        <FormattedMessage id="gallery.backButton" defaultMessage="Zurück" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="gallery-container">
            {/* === Templates === */}
            {templates.length > 0 && (
                <>
                    <h2 className="mt-4">
                        <FormattedMessage id="gallery.templates" defaultMessage="Vorlagen" />
                    </h2>

                    <div className="gallery-grid">
                        {templates.map((tpl) => (
                            <div key={tpl.id} className="gallery-item">
                                <svg
                                    viewBox="0 0 200 200"
                                    className="gallery-preview"
                                    onClick={() => handleSelect(tpl)}
                                >
                                    <path d={tpl.svgPath || ""} />
                                </svg>

                                <div className="gallery-caption">
                                    <p>{tpl.name}</p>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => exportCC3File(tpl.graphJSON, tpl.name)}
                                    >
                                        <FormattedMessage
                                            id="gallery.export"
                                            defaultMessage="Exportieren"
                                        />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* === Eigene Zeichnungen === */}
            {customItems.length > 0 && (
                <>
                    <h2 className="mt-5">
                        <FormattedMessage
                            id="gallery.custom"
                            defaultMessage="Eigene Formen"
                        />
                    </h2>

                    <div className="gallery-grid">
                        {customItems.map((item) => (
                            <div key={item.id} className="gallery-item">
                                <svg
                                    viewBox="0 0 200 200"
                                    className="gallery-preview"
                                    onClick={() => handleSelect(item)}
                                >
                                    <path d={item.svgPath || item.svg} />
                                </svg>

                                <div className="gallery-caption">
                                    <p>{item.name}</p>

                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => deleteItem(item.id)}
                                    >
                                        <FormattedMessage
                                            id="gallery.delete"
                                            defaultMessage="Löschen"
                                        />
                                    </button>

                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => exportCC3File(item.graphJSON, item.name)}
                                    >
                                        <FormattedMessage
                                            id="gallery.export"
                                            defaultMessage="Exportieren"
                                        />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <Link to="/start" className="btn btn-primary mt-5">
                <FormattedMessage id="gallery.backButton" defaultMessage="Zurück" />
            </Link>
        </div>
    );
}
