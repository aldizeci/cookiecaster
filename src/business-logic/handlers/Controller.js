import Graph from "../../entities/graph/Graph.js";
import Node from "../../entities/graph/Node.js";
import Edge from "../../entities/graph/Edge.js";
import SvgHandler from "./SvgHandler.js";
import SelectionHandler from "./SelectionHandler.js";
import ModeDraw from "../modes/ModeDraw.js";
import ModeMove from "../modes/ModeMove.js";
import ModeRotate from "../modes/ModeRotate.js";
import ModeSelect from "../modes/ModeSelect.js";

let _singleton = Symbol();

export default class Controller {
    constructor(singletonToken) {
        if (_singleton !== singletonToken)
            throw new Error("Use Controller.instance instead of direct instantiation.");

        this.modi = {
            MODE_DRAW: new ModeDraw(),
            MODE_SELECT: new ModeSelect(),
            MODE_MOVE: new ModeMove(),
            MODE_ROTATE: new ModeRotate(),
        };

        this._mode = this.modi.MODE_DRAW;
        this._grid = true;
    }

    /** Singleton accessor */
    static get instance() {
        if (!this[_singleton])
            this[_singleton] = new Controller(_singleton);
        return this[_singleton];
    }

    // --- Grid toggle ---
    get grid() { return this._grid; }
    set grid(active) { this._grid = Boolean(active); }

    // --- Mode handling ---
    get mode() { return this._mode; }
    set mode(newMode) {
        if (newMode === this._mode) return;
        this._mode.disable();
        this._mode = newMode;
        this._mode.enable();
    }

    // UTILITY METHODS
    /** Snaps point to grid and clamps to drawing area boundaries */
    fixAndSnapPoint(point) {
        const svgh = SvgHandler.instance;
        const space = svgh.getRasterSpace();
        const size = svgh.getDrawingAreaSize();

        if (this._grid) {
            const snap = Math.floor(space / 2);
            point.x = Math.floor(point.x / space) * space + (point.x % space > snap ? space : 0);
            point.y = Math.floor(point.y / space) * space + (point.y % space > snap ? space : 0);
        }

        // Clamp inside boundaries
        point.x = Math.min(Math.max(point.x, space), size - space);
        point.y = Math.min(Math.max(point.y, space), size - space);
    }

    // MOUSE INTERACTIONS

    mouseDown(point) {
        if (!SelectionHandler.instance.isRectActive()) this.fixAndSnapPoint(point);
        this._transition(this._mode.onMouseDown(point));
    }

    mouseMove(point) {
        const selh = SelectionHandler.instance;
        if (!selh.isRectActive()) this.fixAndSnapPoint(point);
        this._transition(this._mode.onMouseMove(point));
    }

    mouseUp() {
        this._transition(this._mode.onMouseUp());
    }

    /** Helper to safely change mode if a function returns a new one */
    _transition(nextMode) {
        if (nextMode !== undefined) this.mode = nextMode;
    }

    // COMMANDS

    /** Clears graph and resets to draw mode */
    reset() {
        Graph.instance.clear();
        SvgHandler.instance.clear();
        this.mode = this.modi.MODE_DRAW;
    }

    /** Deletes selected elements */
    erase() {
        const selh = SelectionHandler.instance;
        const svgh = SvgHandler.instance;
        const graph = Graph.instance;

        for (const edge of selh.selectedEdges) graph.removeEdge(edge);

        if (!selh.singleEdge) {
            for (const { edge } of selh.affectedEdges) graph.removeEdge(edge);
            for (const node of selh.selectedNodes) graph.removeNode(node);
        }

        selh.clear();
        svgh.updateMessage("");
        this.mode = graph.nodeSize > 0 ? this.modi.MODE_SELECT : this.modi.MODE_DRAW;
    }

    /** Duplicates selected elements, offsetting them by 5 raster spaces */
    copy() {
        const graph = Graph.instance;
        const selh = SelectionHandler.instance;
        const svgh = SvgHandler.instance;
        const dx = svgh.getRasterSpace() * 5;
        const dy = svgh.getRasterSpace() * 5;

        const selNodes = Array.from(selh.selectedNodes);
        const selEdges = Array.from(selh.selectedEdges);
        if (!selNodes.length && !selEdges.length) {
            console.log("Copy: nothing selected");
            return;
        }

        selh.clear();
        const cNodes = {};

        // Copy nodes
        for (const sn of selNodes) {
            const node = new Node(svgh.nodeID++, { x: sn.pos.x + dx, y: sn.pos.y + dy });
            graph.addNode(node);
            selh._nodes.set(node.id, node);
            svgh.selectNode(node, true);
            cNodes[sn.id] = node;
        }

        // Copy edges
        for (const se of selEdges) {
            const from = cNodes[se.from.id];
            const to = cNodes[se.to.id];
            if (!from || !to) continue;

            const edge = new Edge(svgh.edgeID++, from, to, { x: se.q.x + dx, y: se.q.y + dy });
            graph.addEdge(edge);
            selh._edges.set(edge.id, edge);
            svgh.selectEdge(edge, true);
        }

        svgh.updateMessage();
        this.mode = this.modi.MODE_MOVE;
    }

    /** Mirrors selected elements along the line between two “tail” nodes */
    mirror() {
        const graph = Graph.instance;
        const selh = SelectionHandler.instance;
        const svgh = SvgHandler.instance;

        const tails = [];
        for (const sn of selh.selectedNodes) {
            if (sn.adjacent.length === 1) tails.push(sn);
            if (sn.adjacent.length === 0) return;
        }
        if (tails.length !== 2) return;

        const [p1, p2] = tails.map(t => t.pos);
        const vec = { x: p2.x - p1.x, y: p2.y - p1.y };
        const invLen2 = 1 / (vec.x * vec.x + vec.y * vec.y);
        const cNodes = {};

        // Mirror nodes
        for (const sn of selh.selectedNodes) {
            if (tails.includes(sn)) {
                cNodes[sn.id] = sn;
                continue;
            }

            const { x, y } = sn.pos;
            const lambda = (vec.x * (x - p1.x) + vec.y * (y - p1.y)) * invLen2;
            const fx = p1.x + lambda * vec.x;
            const fy = p1.y + lambda * vec.y;
            const node = new Node(svgh.nodeID++, {
                x: x + 2 * (fx - x),
                y: y + 2 * (fy - y),
            });

            graph.addNode(node);
            cNodes[sn.id] = node;
        }

        // Mirror edges
        for (const se of selh.selectedEdges) {
            const { x, y } = se.q;
            const lambda = (vec.x * (x - p1.x) + vec.y * (y - p1.y)) * invLen2;
            const fx = p1.x + lambda * vec.x;
            const fy = p1.y + lambda * vec.y;
            const edge = new Edge(
                svgh.edgeID++,
                cNodes[se.from.id],
                cNodes[se.to.id],
                { x: x + 2 * (fx - x), y: y + 2 * (fy - y) }
            );
            graph.addEdge(edge);
        }

        selh.clear();
        svgh.updateMessage();
        this.mode = this.modi.MODE_SELECT;
    }

    /** Escape key handler */
    escape() {
        this._transition(this._mode.onEscape());
    }
}