import SvgHandler from "./SvgHandler";
import Graph from "./graph/Graph";

let _singleton = Symbol();

export default class SelectionHandler {
    constructor(singletonToken) {
        if (_singleton !== singletonToken)
            throw new Error('Cannot instantiate directly.');

        this._nodes = new Map();
        this._edges = new Map();
        this._affectedEdges = new Map();
        this._rectActive = false;
        this._singleEdge = false;
    }

    get singleEdge() {
        return this._singleEdge;
    }

    /**
     * Static accessor
     *
     * @returns {SelectionHandler}
     */
    static get instance() {
        if (!this[_singleton])
            this[_singleton] = new SelectionHandler(_singleton);

        return this[_singleton]
    }

    isAnySelected() {
        return this._nodes.size > 0 || this._edges.size > 0;
    }

    isNodeSelected(node) {
        return this._nodes.has(node.id);
    }

    get selectedNodes() {
        return this._nodes.values();
    }

    isEdgeSelected(edge) {
        return this._edges.has(edge.id);
    }

    get selectedEdges() {
        return this._edges.values();
    }

    isEdgeAffected(edge) {
        return this._affectedEdges.has(edge.id);
    }

    get affectedEdges() {
        return this._affectedEdges.values();
    }

    /* --- Single Selection --- */
    selectNode(node) {
        this.clear();
        const svgh = SvgHandler.instance;
        //select node
        this._nodes.set(node.id, node);
        svgh.selectNode(node, true);
        node.adjacent.forEach(edge => this._affectedEdges.set(edge.id, {edge: edge, mod: node}));
    }

    /**
     *
     * @param {Edge} edge
     */
    selectEdge(edge) {
        this.clear();
        const svgh = SvgHandler.instance;
        //select edge
        this._edges.set(edge.id, edge);
        svgh.selectEdge(edge, true);

        const from = edge.from;
        this._nodes.set(from.id, from);
        const fromAdja = from.adjacent;
        if (fromAdja.length === 2) {
            const fromAffected = fromAdja[0] !== edge ? fromAdja[0] : fromAdja[1];
            if (!this._affectedEdges.has(fromAffected.id)) {
                this._affectedEdges.set(fromAffected.id, {edge: fromAffected, mod: from});
            }
        }

        const to = edge.to;
        this._nodes.set(to.id, to);
        const toAdja = to.adjacent;
        if (toAdja.length === 2) {
            const toAffected = toAdja[0] !== edge ? toAdja[0] : toAdja[1];
            if (!this._affectedEdges.has(toAffected.id)) {
                this._affectedEdges.set(toAffected.id, {edge: toAffected, mod: to});
            }
        }

        this._singleEdge = true;
    }

    /* --- Rectangle selection --- */

    /**
     * Starts the rectangle selection
     * @param {{x: number, y: number}} start - start point
     */
    startRectSelection(start) {
        this.clear();
        const svgHandler = SvgHandler.instance;
        this._start = start;
        this._moved = start;
        svgHandler.setRectSelection(start, start);
        svgHandler.setRectSelectionVisible(true);
        this._rectActive = true;
    };

    /**
     * Updates the rectangle selection
     * @param {{x: number, y: number}} moved - move point
     */
    moveRectSelection(moved) {
        this._moved = moved;
        SvgHandler.instance.setRectSelection(this._start, moved);
    };

    /**
     * Finishes the rectangle selection
     * Returns the selection rectangle as top-left corner and bottom-right corner
     */
    endRectSelection() {
        const graph = Graph.instance;
        const svgh = SvgHandler.instance;
        const start = this._start;
        const moved = this._moved;
        const xMin = Math.min(start.x, moved.x);
        const xMax = xMin + Math.abs(moved.x - start.x);
        const yMin = Math.min(start.y, moved.y);
        const yMax = yMin + Math.abs(moved.y - start.y);

        graph.forEachNode(node => {
            const center = node.pos;
            if (center.x >= xMin && center.x <= xMax
                && center.y >= yMin && center.y <= yMax) {
                this._nodes.set(node.id, node);
                svgh.selectNode(node, true);

                node.adjacent.forEach(edge => {
                    const fromPos = edge.from.pos;
                    const toPos = edge.to.pos;
                    const exMin = Math.min(fromPos.x, toPos.x);
                    const exMax = exMin + Math.abs(toPos.x - fromPos.x);
                    const eyMin = Math.min(fromPos.y, toPos.y);
                    const eyMax = eyMin + Math.abs(toPos.y - fromPos.y);
                    if (!this._edges.has(edge.id) && !this._affectedEdges.has(edge.id)) {
                        if (exMin >= xMin && exMax <= xMax
                            && eyMin >= yMin && eyMax <= yMax) {
                            this._edges.set(edge.id, edge);
                            svgh.selectEdge(edge, true);
                        } else {
                            this._affectedEdges.set(edge.id, {edge: edge, mod: node});
                        }
                    }
                });
            }
        });

        svgh.setRectSelectionVisible(false);
        this._rectActive = false;
    };

    cancelRectSelection() {
        SvgHandler.instance.setRectSelectionVisible(false);
        this._rectActive = false;
    }

    /**
     * Checks if the rectangle selection is active
     * @return {boolean}
     */
    isRectActive() {
        return this._rectActive;
    }

    clear() {
        const svgHandler = SvgHandler.instance;
        //deselect _nodes
        this._nodes.forEach((id, node) => {
            svgHandler.selectNode(node, false);
        });
        this._nodes.clear();

        //deselect _edges
        this._edges.forEach((id, edge) => {
            svgHandler.selectEdge(edge, false);
        });
        this._edges.clear();
        this._affectedEdges.clear();

        this._singleEdge = false;
    }
}