import React from "react";
import {Link} from "react-router-dom";
import {FormattedMessage} from "react-intl";

export default function Sidebar({
                                    intl,
                                    showGrid,
                                    changeGrid,
                                    pictureUrl,
                                    toggleBackground,
                                    zoomIndex,
                                    changeZoom,
                                    handleUploadClick,
                                    fileInputRef,
                                    handleFileSelected,
                                    zoomLevels
                                }) {
    return (
        <aside className="sidenav">
            <h5>
                <FormattedMessage id="start.title"/>
            </h5>

            <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2 standard-font">
                    <i className="fas fa-table-cells-large"></i>
                    <FormattedMessage id="start.helplines"/>
                </div>

                <label className="switch m-0">
                    <input
                        type="checkbox"
                        checked={showGrid}
                        onChange={(e) => changeGrid(e.target.checked)}
                    />
                    <span className="slider round"></span>
                </label>
            </div>

            <div className="list-group-item d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <i className="far fa-image"></i>
                    <FormattedMessage id="start.backgroundImage"/>
                </div>

                <label className="switch m-0">
                    <input
                        type="checkbox"
                        checked={!!pictureUrl}
                        onChange={(e) => toggleBackground(e.target.checked)}
                    />
                    <span className="slider round"></span>
                </label>
            </div>

            <div className="list-group-item d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <i className="fa fa-search"></i>
                    <FormattedMessage id="start.zoom"/>
                </div>
                <div className="selector m-0 flex-shrink-0">
                    <select
                        className="form-select form-select-sm"
                        aria-label="Zoom"
                        value={zoomIndex}
                        onChange={(e) => changeZoom(e.target.value)}
                    >
                        {zoomLevels.map((z, i) => (
                            <option key={z} value={i}>{z}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button id="reset" type="button" data-bs-toggle="tooltip" data-bs-placement="top"
                    data-bs-title={intl.formatMessage({id: "start.deleteEverything"})}>
                <i className="far fa-file"></i> <FormattedMessage id="start.new"/>
            </button>

            <button id="draw">
                <i className="far fa-edit"></i> <FormattedMessage id="start.draw"/>
            </button>

            <button id="select">
                <i className="fas fa-expand"></i> <FormattedMessage id="start.select"/>
            </button>

            <button id="move">
                <i className="fas fa-arrows-alt"></i> <FormattedMessage id="start.move"/>
            </button>

            <button id="rotate">
                <i className="fas fa-sync-alt"></i> <FormattedMessage id="start.rotate"/>
            </button>

            <button id="mirror">
                <i className="far fa-star-half"></i> <FormattedMessage id="start.mirror"/>
            </button>

            <button id="copy">
                <i className="far fa-clone"></i> <FormattedMessage id="start.copy"/>
            </button>

            <div className="upload-button-container">
                <button
                    id="upload"
                    type="button"
                    onClick={handleUploadClick}
                    className="btn btn-sm"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    data-bs-title={intl.formatMessage({id: "start.uploadTooltip"})}
                >
                    <i className="fas fa-camera"></i> <FormattedMessage id="start.upload"/>
                </button>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleFileSelected}
            />

            <button id="erase" data-bs-title={intl.formatMessage({id: "start.deleteTooltip"})}>
                <i className="far fa-trash-alt"></i> <FormattedMessage id="start.delete"/>
            </button>

            <hr/>

            <button id="analyze" data-bs-title={intl.formatMessage({id: "start.analyzeText"})}>
                <i className="fab fa-searchengin"></i> <FormattedMessage id="start.analyze"/>
            </button>

            <button id="save">
                <i className="far fa-save"></i> <FormattedMessage id="start.save"/>
            </button>

            <Link id="load" className="nav-link" to="/gallery">
                <i className="fas fa-upload"></i>{" "}
                <FormattedMessage id="start.loadFromGallery"/>
            </Link>

            <button id="loadFromFile">
                <i className="fas fa-folder-open"></i> Vorlage aus Datei laden
            </button>

            <button id="exportToFile">
                <i className="fas fa-file-export"></i> Vorlage als Datei exportieren
            </button>

            <Link id="goToExport" className="nav-link" to="/export">
                <i className="fas fa-download"></i> Export 3D
            </Link>
        </aside>
    );
}