import './Start.css'
import React, {useEffect, useMemo, useRef, useState, useCallback} from "react";
import {useIntl, FormattedMessage, defineMessages} from "react-intl";
import * as d3 from "d3";
import config from "../../../client_config.json";
import * as bootstrap from "bootstrap";
import {Modal} from "bootstrap";
import {importCC3File} from "../../../utils/FileImport.js";
import {exportCC3File} from "../../../utils/FileExport.js";
import Graph from "../../../entities/graph/Graph.js";
import Controller from "../../../business-logic/handlers/Controller.js";
import SvgHandler from "../../../business-logic/handlers/SvgHandler.js";
import SelectionHandler from "../../../business-logic/handlers/SelectionHandler.js";
import Sidebar from "./components/Sidebar.jsx";
import UploadModal from "./components/UploadModal.jsx";

import "./Start.css";
import Canvas from "./components/Canvas.jsx";

const profiles = config.profiles;
const zoomLevels = SvgHandler.instance.getZoomLevels();

// ---------- helpers ----------
function validateGraph(formatMessage, messages) {
    const svgh = SvgHandler.instance;
    svgh.clearWarnings();
    const data = Graph.instance.validate();
    data.valid = false;

    const alert = (txt) => window.alert(txt);

    if (data.forms.length === 0) {
        alert(formatMessage(messages.empty));
    } else {
        const msg = [];
        if (data.forms.length > 2) msg.push(formatMessage(messages.morethan2forms)); else if (data.forms.length === 1) {
            if (!data.forms[0].closed) msg.push(formatMessage(messages.open1));
        } else {
            const [form0, form1] = data.forms;
            const bothClosed = form0.closed && form1.closed;
            if (!bothClosed) msg.push(formatMessage(messages.open2)); else {
                const inside = (p, poly) => d3.polygonContains(poly, p); // use d3 for point-in-polygon
                if (form0.meta.width < form1.meta.width && form0.meta.height < form1.meta.height) {
                    if (inside([form0.meta.center.x, form0.meta.center.y], form1.points)) data.outer = 1; else msg.push(formatMessage(messages.concentric));
                } else if (form0.meta.width > form1.meta.width && form0.meta.height > form1.meta.height) {
                    if (inside([form1.meta.center.x, form1.meta.center.y], form0.points)) data.outer = 0; else msg.push(formatMessage(messages.concentric));
                } else {
                    msg.push(formatMessage(messages.concentric));
                }
            }
        }
        if (msg.length > 0) alert(msg.join("\n"));
        if (data.intersections.length > 0) {
            alert(formatMessage(messages.validate));
            svgh.setIntersections(data.intersections);
        } else if (msg.length === 0) data.valid = true;
    }
    return data;
}

// ---------- Local Storage Helpers ----------
function getAllDrawings() {
    return JSON.parse(localStorage.getItem("drawings")) || [];
}

function saveAllDrawings(drawings) {
    localStorage.setItem("drawings", JSON.stringify(drawings));
}

function clearUnsavedDrawings() {
    const drawings = getAllDrawings().filter(d => d.saved);
    saveAllDrawings(drawings);
}

// ---------- component ----------
export default function Start() {
    const intl = useIntl();
    const {formatMessage} = intl;

    const msgs = useMemo(() => defineMessages({
        drawingarea: {id: "start.drawingarea"},
        validate: {id: "alert.validate"},
        concentric: {id: "alert.concentric"},
        empty: {id: "alert.empty"},
        morethan2forms: {id: "alert.morethan2forms"},
        open1: {id: "alert.open1"},
        open2: {id: "alert.open2"},
        export: {id: "alert.export"},
        useful: {id: "alert.useful"},
        noName: {id: "alert.noName"},
        exampleName: {id: "alert.exampleName"},
        enterName: {id: "alert.enterName"},
        saveButton: {id: "alert.saveButton"},
        cancelButton: {id: "alert.cancelButton"},
        noSave: {id: "alert.noSave"},
        save: {id: "alert.save"},
        service: {id: "alert.service"},
        imageUploadTitle: {id: "alert.imageUploadTitle"},
        imageUploadDescription: {id: "alert.imageUploadDescription"},
        shrink: {id: "alert.shrink"},
        scale: {id: "alert.scale"},
        enterFile: {id: "alert.enterFile"},
        back: {id: "alert.back"},
        upload: {id: "alert.upload"},
    }), []);

    useEffect(() => {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map((el) => new bootstrap.Tooltip(el));
        return () => tooltipList.forEach((t) => t.dispose());
    }, []);

    // ---- local state ----
    const [showGrid, setShowGrid] = useState(true);
    const [pictureUrl, setPictureUrl] = useState(null);
    const [temporaryUrl, setTemporaryUrl] = useState(null);
    const [analyze, setAnalyze] = useState({
        status: false, keys: Object.keys(profiles), data: profiles.default,
    });
    const [zoomIndex, setZoomIndex] = useState(() => SvgHandler.instance.getZoomLevel() - 1);
    const [uploadMode, setUploadMode] = useState("shrink"); // "shrink" oder "scale"
    const [previewUrl, setPreviewUrl] = useState(null);
    const uploadModalRef = useRef(null);
    const svgRef = useRef(null);
    const fileInputRef = useRef(null);

    // ---- derived values ----
    const size = SvgHandler.instance.getDrawingAreaSize();
    const viewBox = `0 0 ${size} ${size}`;
    const translate = `translate(${size / 2},${size / 2})`;
    const backgroundStyle = pictureUrl ? {
        backgroundImage: `url(${pictureUrl})`,
        backgroundPosition: "center",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
    } : undefined;

    useEffect(() => {
        // Enable all tooltips on page load
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));

        // Optional: clean up on unmount
        return () => tooltipList.forEach((t) => t.dispose());
    }, []);

    const handleUploadClick = useCallback(() => {
        const modalElement = uploadModalRef.current;
        if (modalElement) {
            const modal = new Modal(modalElement);
            modal.show();
        }
    }, []);

    const handleFileSelected = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target.result;
            setPreviewUrl(url);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleConfirmUpload = useCallback(async () => {
        if (!previewUrl) return;

        const {formatMessage} = intl;

        try {
            if (uploadMode === "scale") {
                await cropImage(previewUrl);
            } else {
                setPictureUrl(previewUrl);
                setTemporaryUrl(previewUrl);
            }

            // Aktiviere den Background-Slider
            const sliderCheckbox = document.querySelector('input[type="checkbox"][aria-label="Background"]');
            if (sliderCheckbox) {
                sliderCheckbox.checked = true;
                sliderCheckbox.dispatchEvent(new Event("change", {bubbles: true}));
            }

            // Schließe das Modal
            const modalElement = uploadModalRef.current;
            if (modalElement) {
                const modal = Modal.getInstance(modalElement);
                modal?.hide();
            }

            setPreviewUrl(null);
            setUploadMode("shrink");
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Fehler beim Upload:", error);
            alert(formatMessage({id: "alert.uploadError"}));
        }
    }, [previewUrl, uploadMode, intl]);

    const cropImage = (uploadedURL) => {
        return new Promise((resolve) => {
            const outputImageAspectRatio = 1;
            const inputImage = new Image();
            inputImage.src = uploadedURL;

            inputImage.onload = () => {
                const inputWidth = inputImage.naturalWidth;
                const inputHeight = inputImage.naturalHeight;
                const inputImageAspectRatio = inputWidth / inputHeight;
                const outputImage = document.createElement("canvas");
                let outputWidth = inputWidth;
                let outputHeight = inputHeight;

                if (inputImageAspectRatio > outputImageAspectRatio) {
                    outputWidth = inputHeight * outputImageAspectRatio;
                } else if (inputImageAspectRatio < outputImageAspectRatio) {
                    outputHeight = inputWidth / outputImageAspectRatio;
                }

                outputImage.width = outputWidth;
                outputImage.height = outputHeight;

                const ctx = outputImage.getContext("2d");
                ctx.drawImage(inputImage, 0, 0);

                const croppedUrl = outputImage.toDataURL();
                setPictureUrl(croppedUrl);
                setTemporaryUrl(croppedUrl);
                resolve();
            };
        });
    };

    const handleCancelUpload = useCallback(() => {
        setPreviewUrl(null);
        setUploadMode("shrink");
        if (fileInputRef.current) fileInputRef.current.value = "";

        const modalElement = uploadModalRef.current;
        if (modalElement) {
            const modal = Modal.getInstance(modalElement);
            modal?.hide();
        }
    }, []);

    // ---- handlers ----
    const changeGrid = useCallback((checked) => {
        Controller.instance.grid = checked;
        setShowGrid(checked);
        d3.select("#raster").attr("visibility", checked ? "visible" : "hidden");
    }, []);

    const toggleBackground = useCallback((checked) => {
        if (!checked) {
            setTemporaryUrl(pictureUrl);
            setPictureUrl(null);
        } else {
            setPictureUrl((prev) => prev ?? temporaryUrl);
        }
    }, [pictureUrl, temporaryUrl]);

    const changeZoom = useCallback((idx) => {
        const zoom = parseInt(idx, 10);
        SvgHandler.instance.setZoomLevel(zoom + 1);
        setZoomIndex(zoom);
    }, []);

    const saveGraph = useCallback(() => {
        const graph = Graph.instance;
        const jsonData = graph.toJSON();
        const forms = Graph.instance.validate()?.forms || [];
        const svgPath = forms.map(f => f.path).join(" ");

        const name = window.prompt(formatMessage(msgs.enterName), formatMessage(msgs.exampleName));
        if (!name || !name.trim()) {
            window.alert(formatMessage(msgs.noName));
            return;
        }

        try {
            const payload = {
                id: "drawing-" + Date.now(),
                name: name.trim(),
                graphJSON: jsonData,
                svgPath,
                saved: true,
                timestamp: new Date().toISOString(),
            };

            const drawings = getAllDrawings();
            drawings.push(payload);
            saveAllDrawings(drawings);

            window.alert(formatMessage(msgs.save));
        } catch (err) {
            console.error(err);
            window.alert(formatMessage(msgs.noSave));
        }
    }, [formatMessage, msgs]);

    const analyzeGraph = useCallback(() => {
        SelectionHandler.instance.clear();
        const data = validateGraph(formatMessage, msgs);
        if (!data.valid) return;

        const crit = Graph.instance.analyze(data, analyze.data);
        const segCount = Array.from(crit.critSeg).length;
        if (crit.critNodes.length === 0 && segCount === 0) {
            window.alert(formatMessage(msgs.export));
        } else {
            setAnalyze((prev) => ({...prev, status: true, data: profiles.default}));
            const svgh = SvgHandler.instance;
            svgh.setCritNodes(crit.critNodes);
            window.alert(formatMessage(msgs.useful));
            svgh.setCritSeg(crit.critSeg);
        }
    }, [analyze.data, formatMessage, msgs]);

    // ---- grid lines generation ----
    const rasterLines = useMemo(() => {
        const linesY = [];
        const linesX = [];
        const raster = SvgHandler.instance.getRasterSpace();
        const s = SvgHandler.instance.getDrawingAreaSize();
        const end = s / raster;
        for (let i = 1; i < end; i++) {
            const y = i * raster;
            const x = i * raster;
            linesY.push(<line key={`ry-${i}`} x1="0" y1={y} x2={s} y2={y}/>);
            linesX.push(<line key={`rx-${i}`} y1="0" x1={x} y2={s} x2={x}/>);
        }
        return {linesY, linesX};
    }, []);

    // ---- lifecycle: mount -> attach interactions, restore graph ----
    useEffect(() => {
            // mark navbar id (kept from original)
            d3.selectAll("nav.navbar.navbar-default").attr("id", "startNavBar");

            const ctr = Controller.instance;
            const svgSel = d3.select(svgRef.current);
            const svgNode = svgSel.node();

            const pointerPos = (evt) => {
                const [x, y] = d3.pointer(evt, svgNode);
                return {x: Math.round(x), y: Math.round(y)};
            };

            // Lade ausgewählte Zeichnung oder Template
            const selectedId = sessionStorage.getItem("selectedDrawingId");
            const selectedSource = sessionStorage.getItem("selectedSource");

            if (selectedId) {
                try {
                    let graphData = null;

                    if (selectedSource === "template") {
                        // Template aus sessionStorage laden
                        const templateJSON = sessionStorage.getItem("templateGraphJSON");
                        if (templateJSON) {
                            graphData = JSON.parse(templateJSON);
                        }
                    } else if (selectedSource === "local") {
                        // LocalStorage-Zeichnung laden
                        const drawings = getAllDrawings();
                        const drawing = drawings.find(d => d.id === selectedId);
                        if (drawing?.graphJSON) {
                            graphData = drawing.graphJSON;
                        }
                    }

                    if (graphData) {
                        Graph.instance.fromJSON(graphData);
                        SvgHandler.instance.redraw();
                    }
                } catch (err) {
                    console.error("Fehler beim Laden der Zeichnung:", err);
                } finally {
                    // Cleanup sessionStorage
                    sessionStorage.removeItem("selectedDrawingId");
                    sessionStorage.removeItem("selectedSource");
                    sessionStorage.removeItem("templateGraphJSON");
                }
            }

// mouse/touch handlers using D3 v6+ pointer API
            const onDown = (evt) => {
                if (analyze.status) SvgHandler.instance.clearWarnings();
                d3.select("#layer").remove();
                ctr.mouseDown(pointerPos(evt));
            };
            const onMove = (evt) => ctr.mouseMove(pointerPos(evt));
            const onUp = () => {
                ctr.mouseUp();

                try {
                    const graph = Graph.instance;

                    const drawings = getAllDrawings().filter(d => d.saved);
                    const temp = {
                        id: "temp-autosave",
                        name: "Temporär",
                        graphJSON: graph.toJSON(),
                        saved: false,
                        timestamp: new Date().toISOString(),
                    };
                    drawings.push(temp);
                    saveAllDrawings(drawings);
                } catch (err) {
                    console.warn("Autosave skipped:", err);
                }
            };

            svgSel.on("pointerdown", onDown);
            svgSel.on("pointermove", onMove);
            svgSel.on("pointerup", onUp);
            svgSel.on("pointercancel", onUp);
            svgSel.on("mouseleave", onUp);

// keyboard
            const onKeyDown = (evt) => {
                switch (evt.key) {
                    case "Escape":
                        ctr.escape();
                        break;
                    case "Delete":
                        ctr.erase();
                        break;
                    case "c":
                        if (evt.ctrlKey || evt.metaKey) ctr.copy();
                        break;
                    default:
                }
            };
            window.addEventListener("keydown", onKeyDown);

// --- Buttons / modes ---
            d3.select("#reset").on("click", () => {
                ctr.reset();
                clearUnsavedDrawings(); // remove only temporary drawings
            });

// assign pre-instantiated mode objects
            d3.select("#draw").on("click", () => {
                ctr.mode = ctr.modi.MODE_DRAW;
            });

            d3.select("#select").on("click", () => {
                ctr.mode = ctr.modi.MODE_SELECT;
            });

            d3.select("#move").on("click", () => {
                ctr.mode = ctr.modi.MODE_MOVE;
            });

            d3.select("#rotate").on("click", () => {
                ctr.mode = ctr.modi.MODE_ROTATE;
            });

            d3.select("#mirror").on("click", () => ctr.mirror());
            d3.select("#copy").on("click", () => ctr.copy());
            d3.select("#erase").on("click", () => ctr.erase());

            d3.select("#analyze").on("click", () => analyzeGraph());
            d3.select("#save").on("click", () => saveGraph());

            // --- File Import/Export (.cc3) ---
            d3.select("#loadFromFile").on("click", async () => {
                try {
                    const project = await importCC3File();
                    if (!project) return;

                    document.querySelector("#reset")?.click();
                    await new Promise(r => setTimeout(r, 50));

                    Graph.instance.fromJSON(
                        typeof project.graphJSON === "string"
                            ? project.graphJSON
                            : JSON.stringify(project.graphJSON)
                    );

                    SvgHandler.instance.updateMessage();
                    Controller.instance.mode = Controller.instance.modi.MODE_SELECT;
                    Controller.instance.mode.enable();

                    alert("Vorlage erfolgreich geladen!");
                } catch (err) {
                    console.warn("Import abgebrochen oder fehlgeschlagen:", err);
                }
            });

            d3.select("#exportToFile").on("click", () => {
                const data = Graph.instance.toJSON();
                exportCC3File(data, "drawing");
            });

            // --- Init default mode ---
            if (!ctr.mode) {
                ctr.mode = new ctr.modi.MODE_DRAW();
                ctr.mode.enable();
            }

            ctr.mode.enable();

            return () => {
                window.removeEventListener("keydown", onKeyDown);
                svgSel.on(".pointerdown", null).on(".pointermove", null).on(".pointerup", null);
            };
// eslint-disable-next-line react-hooks/exhaustive-deps
        }
        ,
        [analyze.status, analyzeGraph, saveGraph]
    );

    // --- Restore unsaved autosave drawing on mount ---
    useEffect(() => {
        const graph = Graph.instance;
        const temp = getAllDrawings().find((d) => !d.saved);

        if (!temp) return;

        try {
            const json =
                typeof temp.graphJSON === "string"
                    ? temp.graphJSON
                    : JSON.stringify(temp.graphJSON);

            if (temp.graphJSON) graph.fromJSON(json);
            else if (temp.svgPath) graph.fromSvg([temp.svgPath]);

            SvgHandler.instance.updateMessage();
        } catch (err) {
            console.warn("⚠️ Failed to restore autosave:", err);
        }
    }, []); // separate and independent

// keep grid visibility in sync
    useEffect(() => {
        d3.select("#raster").attr("visibility", showGrid ? "visible" : "hidden");
    }, [showGrid]);

// ---- render ----

    // ---- render ----
    return (
        <div className="start-root">
            <div className="start-layout">
                <Canvas
                    svgRef={svgRef}
                    viewBox={viewBox}
                    backgroundStyle={backgroundStyle}
                    translate={translate}
                    rasterLines={rasterLines}
                    formatMessage={formatMessage}
                    msgs={msgs}
                />

                <Sidebar intl={intl}
                         showGrid={showGrid}
                         changeGrid={changeGrid}
                         pictureUrl={pictureUrl}
                         toggleBackground={toggleBackground}
                         zoomIndex={zoomIndex}
                         changeZoom={changeZoom}
                         handleUploadClick={handleUploadClick}
                         fileInputRef={fileInputRef}
                         handleFileSelected={handleFileSelected}
                         zoomLevels={zoomLevels}/>
            </div>

            {/* Upload Modal - OUTSIDE the layout to avoid z-index issues */}
            <UploadModal
                uploadModalRef={uploadModalRef}
                fileInputRef={fileInputRef}
                previewUrl={previewUrl}
                uploadMode={uploadMode}
                setUploadMode={setUploadMode}
                handleFileSelected={handleFileSelected}
                handleCancelUpload={handleCancelUpload}
                handleConfirmUpload={handleConfirmUpload}
            />
        </div>
    );
}
