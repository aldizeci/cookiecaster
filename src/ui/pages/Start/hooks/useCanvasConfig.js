import {useCallback, useState, useMemo} from "react";
import SvgHandler from "../../../../business-logic/handlers/SvgHandler.js";
import Controller from "../../../../business-logic/handlers/Controller.js";

export default function useCanvasConfig() {
    const handler = SvgHandler.instance;

    // Local UI state synced with BL state
    const [showGrid, setShowGrid] = useState(Controller.instance.grid);
    const [zoomIndex, setZoomIndex] = useState(() => handler.getZoomLevel() - 1);

    // Computed values coming from handler
    const size = handler.getDrawingAreaSize();
    const viewBox = useMemo(() => `0 0 ${size} ${size}`, [size]);
    const translate = useMemo(
        () => `translate(${size / 2},${size / 2})`,
        [size]
    );

    const zoomLevels = handler.getZoomLevels();

    const raster = handler.getRasterSpace();

    const changeGrid = useCallback((checked) => {
        Controller.instance.grid = checked;
        setShowGrid(checked);
    }, []);

    const changeZoom = useCallback((idx) => {
        const zoom = parseInt(idx, 10);
        handler.setZoomLevel(zoom + 1);
        setZoomIndex(zoom);
    }, [handler]);

    return {
        showGrid,
        changeGrid,
        zoomIndex,
        changeZoom,
        zoomLevels,
        size,
        viewBox,
        translate,
        raster,
    };
}