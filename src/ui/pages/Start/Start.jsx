import './Start.css'
import React, {useMemo, useRef, useState, useCallback} from "react";
import {useIntl, FormattedMessage, defineMessages} from "react-intl";
import Sidebar from "./components/Sidebar.jsx";
import UploadModal from "./components/UploadModal.jsx";
import useCanvasInteractions from "./hooks/useCanvasInteractions.js";
import useGraphAnalysis from "./hooks/useGraphAnalysis";
import Canvas from "./components/Canvas.jsx";
import useGraphStorage from "./hooks/useGraphStorage.js";
import useImageUpload from "./hooks/useImageUpload.js";
import useCanvasConfig from "./hooks/useCanvasConfig.js";

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
    const [pictureUrl, setPictureUrl] = useState(null);
    const [temporaryUrl, setTemporaryUrl] = useState(null);
    const {analyze, analyzeGraph} = useGraphAnalysis(formatMessage, msgs);
    const {saveGraph} = useGraphStorage(formatMessage, msgs);
    const svgRef = useRef(null);
    const {
        showGrid,
        changeGrid,
        zoomIndex,
        changeZoom,
        zoomLevels,
        viewBox,
        translate,
        size,
        raster
    } = useCanvasConfig();

    // ---- derived values ----
    const backgroundStyle = pictureUrl ? {
        backgroundImage: `url(${pictureUrl})`,
        backgroundPosition: "center",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
    } : undefined;

    const toggleBackground = useCallback((checked) => {
        if (!checked) {
            setTemporaryUrl(pictureUrl);
            setPictureUrl(null);
        } else {
            setPictureUrl((prev) => prev ?? temporaryUrl);
        }
    }, [pictureUrl, temporaryUrl]);

    const {
        fileInputRef,
        isUploadOpen,
        previewUrl,
        uploadMode,
        setUploadMode,
        openUpload,
        selectFile,
        confirmUpload,
        closeUpload,
    } = useImageUpload({setPictureUrl, setTemporaryUrl, toggleBackground, intl});

    // ---- grid lines generation ----
    const rasterLines = useMemo(() => {
        const linesY = [];
        const linesX = [];
        const end = size / raster;
        for (let i = 1; i < end; i++) {
            const y = i * raster;
            const x = i * raster;
            linesY.push(<line key={`ry-${i}`} x1="0" y1={y} x2={size} y2={y}/>);
            linesX.push(<line key={`rx-${i}`} y1="0" x1={x} y2={size} x2={x}/>);
        }
        return {linesY, linesX};
    }, []);

    useCanvasInteractions({
        svgRef,
        analyze,
        analyzeGraph,
        saveGraph,
    });

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
                    showGrid={showGrid}
                />

                <Sidebar intl={intl}
                         showGrid={showGrid}
                         changeGrid={changeGrid}
                         pictureUrl={pictureUrl}
                         toggleBackground={toggleBackground}
                         zoomIndex={zoomIndex}
                         changeZoom={changeZoom}
                         handleUploadClick={openUpload}
                         fileInputRef={fileInputRef}
                         handleFileSelected={selectFile}
                         zoomLevels={zoomLevels}/>
            </div>

            {/* Upload Modal - OUTSIDE the layout to avoid z-index issues */}
            <UploadModal
                show={isUploadOpen}
                onHide={closeUpload}
                fileInputRef={fileInputRef}
                previewUrl={previewUrl}
                uploadMode={uploadMode}
                setUploadMode={setUploadMode}
                handleFileSelected={selectFile}
                handleConfirmUpload={confirmUpload}
            />
        </div>
    );
}
