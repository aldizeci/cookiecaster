import './Start.css'
import React, {useEffect, useMemo, useRef, useState, useCallback} from "react";
import {useIntl, FormattedMessage, defineMessages} from "react-intl";
import * as d3 from "d3";
import Controller from "../../../business-logic/handlers/Controller.js";
import SvgHandler from "../../../business-logic/handlers/SvgHandler.js";
import Sidebar from "./components/Sidebar.jsx";
import UploadModal from "./components/UploadModal.jsx";
import useCanvasInteractions from "./hooks/useCanvasInteractions.js";
import useGraphAnalysis from "./hooks/useGraphAnalysis";
import Canvas from "./components/Canvas.jsx";
import useGraphStorage from "./hooks/useGraphStorage.js";

const zoomLevels = SvgHandler.instance.getZoomLevels();

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

    // ---- local state ----
    const [showGrid, setShowGrid] = useState(true);
    const [pictureUrl, setPictureUrl] = useState(null);
    const [temporaryUrl, setTemporaryUrl] = useState(null);
    const [zoomIndex, setZoomIndex] = useState(() => SvgHandler.instance.getZoomLevel() - 1);
    const [uploadMode, setUploadMode] = useState("shrink"); // "shrink" oder "scale"
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const {analyze, analyzeGraph} = useGraphAnalysis(formatMessage, msgs);
    const {saveGraph} = useGraphStorage(formatMessage, msgs);
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

    const handleUploadClick = useCallback(() => {
        setIsUploadOpen(true);
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

            // Schliesse das Modal
            setIsUploadOpen(false);

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

    useCanvasInteractions({
        svgRef,
        analyze,
        analyzeGraph,
        saveGraph,
    });

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
                show={isUploadOpen}
                onHide={() => setIsUploadOpen(false)}
                fileInputRef={fileInputRef}
                previewUrl={previewUrl}
                uploadMode={uploadMode}
                setUploadMode={setUploadMode}
                handleFileSelected={handleFileSelected}
                handleConfirmUpload={handleConfirmUpload}
            />
        </div>
    );
}
