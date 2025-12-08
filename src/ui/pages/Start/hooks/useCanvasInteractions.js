import {useEffect} from "react";
import * as d3 from "d3";
import {importCC3File} from "../../../../utils/FileImport.js";
import {exportCC3File} from "../../../../utils/FileExport.js";
import {useServices} from "../../../../business-logic/services/ServicesProvider.jsx";

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

export default function useCanvasInteractions({
                                                  svgRef,
                                                  analyze,
                                                  analyzeGraph,
                                                  saveGraph
                                              }) {
    const {controller: ctr, graph: graphSvc, svgHandler: svgh} = useServices();

    useEffect(() => {
            d3.selectAll("nav.navbar.navbar-default").attr("id", "startNavBar");

            const svgSel = d3.select(svgRef.current);
            const svgNode = svgSel.node();

            const pointerPos = (evt) => {
                const [x, y] = d3.pointer(evt, svgNode);
                return {x: Math.round(x), y: Math.round(y)};
            };

            // --- Load template / saved drawing ---
            const selectedId = sessionStorage.getItem("selectedDrawingId");
            const selectedSource = sessionStorage.getItem("selectedSource");

            if (selectedId) {
                try {
                    let graphData = null;

                    if (selectedSource === "template") {
                        graphData = JSON.parse(sessionStorage.getItem("templateGraphJSON") || null);
                    } else if (selectedSource === "local") {
                        const drawings = getAllDrawings();
                        const found = drawings.find(d => d.id === selectedId);
                        graphData = found?.graphJSON ?? null;
                    }

                    if (graphData) {
                        graphSvc.fromJSON(graphData);
                        svgh.redraw();
                    }
                } catch { /* empty */
                } finally {
                    sessionStorage.removeItem("selectedDrawingId");
                    sessionStorage.removeItem("selectedSource");
                    sessionStorage.removeItem("templateGraphJSON");
                }
            }

            // --- Pointer events ---
            const onDown = (evt) => {
                if (analyze.status) svgh.clearWarnings();
                d3.select("#layer").remove();
                ctr.mouseDown(pointerPos(evt));
            };

            const onMove = (evt) => ctr.mouseMove(pointerPos(evt));

            const onUp = () => {
                ctr.mouseUp();
                try {
                    const list = getAllDrawings().filter(d => d.saved);
                    list.push({
                        id: "temp-autosave",
                        name: "Temporär",
                        graphJSON: graphSvc.toJSON(),
                        saved: false,
                        timestamp: new Date().toISOString(),
                    });
                    saveAllDrawings(list);
                } catch { /* empty */
                }
            };

            svgSel.on("pointerdown", onDown);
            svgSel.on("pointermove", onMove);
            svgSel.on("pointerup", onUp);
            svgSel.on("pointercancel", onUp);
            svgSel.on("mouseleave", onUp);

            // --- Keyboard handler ---
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
                        break;
                }
            };
            window.addEventListener("keydown", onKeyDown);

            // --- Sidebar Buttons ---
            d3.select("#reset").on("click", () => {
                ctr.reset();
                clearUnsavedDrawings();
            });

            d3.select("#draw").on("click", () => ctr.mode = ctr.modi.MODE_DRAW);
            d3.select("#select").on("click", () => ctr.mode = ctr.modi.MODE_SELECT);
            d3.select("#move").on("click", () => ctr.mode = ctr.modi.MODE_MOVE);
            d3.select("#rotate").on("click", () => ctr.mode = ctr.modi.MODE_ROTATE);
            d3.select("#mirror").on("click", () => ctr.mirror());
            d3.select("#copy").on("click", () => ctr.copy());
            d3.select("#erase").on("click", () => ctr.erase());
            d3.select("#analyze").on("click", analyzeGraph);
            d3.select("#save").on("click", saveGraph);

            // --- Import/Export ---
            d3.select("#loadFromFile").on("click", async () => {
                try {
                    const project = await importCC3File();
                    if (!project) return;

                    document.querySelector("#reset")?.click();
                    await new Promise(r => setTimeout(r, 50));

                    graphSvc.fromJSON(
                        typeof project.graphJSON === "string"
                            ? project.graphJSON
                            : JSON.stringify(project.graphJSON)
                    );

                    svgh.updateMessage();
                    ctr.mode = ctr.modi.MODE_SELECT;
                    ctr.mode.enable();
                    alert("Vorlage erfolgreich geladen!");
                } catch { /* empty */
                }
            });

            d3.select("#exportToFile").on("click", () => {
                const data = graphSvc.toJSON();
                exportCC3File(data, "drawing");
            });

            // Init mode
            if (!ctr.mode) {
                ctr.mode = new ctr.modi.MODE_DRAW();
            }
            ctr.mode.enable();

            return () => {
                window.removeEventListener("keydown", onKeyDown);
                svgSel.on(".pointerdown", null)
                    .on(".pointermove", null)
                    .on(".pointerup", null);
            };
        },
        [svgRef, analyze.status, analyzeGraph, saveGraph, ctr, graphSvc, svgh]);
}
