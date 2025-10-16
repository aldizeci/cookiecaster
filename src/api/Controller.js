import Graph from "./graph/Graph";
import Node from "./graph/Node";
import Edge from "./graph/Edge";
import SvgHandler from "./SvgHandler";
import SelectionHandler from "./SelectionHandler";
import ModeDraw from "./modi/ModeDraw";
import ModeMove from "./modi/ModeMove";
import ModeRotate from "./modi/ModeRotate";
import ModeSelect from "./modi/ModeSelect";

let _singleton = Symbol();

export default class Controller {
    constructor(singletonToken) {
        if (_singleton !== singletonToken)
            throw new Error("Cannot instantiate directly.");

        this.modi = {
            MODE_DRAW: new ModeDraw(),
            MODE_SELECT: new ModeSelect(),
            MODE_MOVE: new ModeMove(),
            MODE_ROTATE: new ModeRotate(),
        };
        this._mode = this.modi.MODE_DRAW;
        this._grid = true;
    }

    /**
     * Static accessor
     *
     * @returns {Controller}
     */
    static get instance() {
        if (!this[_singleton]) this[_singleton] = new Controller(_singleton);

        return this[_singleton];
    }

    /**
     *
     * @returns {boolean}
     */
    get grid() {
        return this._grid;
    }

    set grid(isGridActived) {
        this._grid = isGridActived;
    }

    /**
     *
     * @returns {AbstractMode}
     */
    get mode() {
        return this._mode;
    }

    set mode(value) {
        this._mode.disable();
        this._mode = value;
        this._mode.enable();
    }

    fixIfAtBoundary(pos) {
        const space = SvgHandler.instance.getRasterSpace();
        const size = SvgHandler.instance.getDrawingAreaSize();
        if (pos.x < space) {
            pos.x = space;
        }
        if (pos.y < space) {
            pos.y = space;
        }
        if (pos.x > size - space) {
            pos.x = size - space;
        }
        if (pos.y > size - space) {
            pos.y = size - space;
        }
    }

    updatePoint(point) {
        const space = SvgHandler.instance.getRasterSpace();
        const moduloX = point.x % space;
        const moduloY = point.y % space;
        const snap = Math.floor(space / 2);
        let x = Math.floor(point.x / space) * space;
        let y = Math.floor(point.y / space) * space;
        if (moduloX > snap) {
            x = Math.floor(point.x / space) * space + space;
        }
        if (moduloY > snap) {
            y = Math.floor(point.y / space) * space + space;
        }
        point.x = x;
        point.y = y;
    }

    mouseDown(point) {
        if (!SelectionHandler.instance.isRectActive()) {
            if (this._grid) {
                this.updatePoint(point);
            }
            this.fixIfAtBoundary(point);
        }
        const m = this.mode.onMouseDown(point);
        if (m !== undefined) {
            this.mode = m;
        }
    }

    mouseMove(point) {
        const selh = SelectionHandler.instance;
        if (!selh.isRectActive()) {
            if (this._grid) {
                this.updatePoint(point);
            }
            this.fixIfAtBoundary(point);
        }
        const m = this.mode.onMouseMove(point);
        if (m !== undefined) {
            this.mode = m;
        }
    }

    mouseUp() {
        const m = this.mode.onMouseUp();
        if (m !== undefined) {
            this.mode = m;
        }
    }

    reset() {
        Graph.instance.clear();
        SvgHandler.instance.clear();
        this.mode = this.modi.MODE_DRAW;
    }

    erase() {
        const selh = SelectionHandler.instance;
        const svgh = SvgHandler.instance;
        const graph = Graph.instance;
        selh.selectedEdges.forEach((edge) => graph.removeEdge(edge));
        if (!selh.singleEdge) {
            selh.affectedEdges.forEach((affected) =>
                graph.removeEdge(affected.edge)
            );
            selh.selectedNodes.forEach((node) => graph.removeNode(node));
        }
        selh.clear();
        svgh.updateMessage("");
        this.mode =
            graph.nodeSize > 0 ? this.modi.MODE_SELECT : this.modi.MODE_DRAW;
    }

    copy() {
        const graph = Graph.instance;
        const selh = SelectionHandler.instance;
        const svgh = SvgHandler.instance;
        const dx = svgh.getRasterSpace()*5,
            dy = svgh.getRasterSpace()*5;
        const cNodes = {};
        const selNodes = selh.selectedNodes;
        const selEdges = selh.selectedEdges;
        selh.clear();

        selNodes.forEach((sn) => {
            const nid = svgh.nodeID++;
            const node = new Node(nid, { x: sn.pos.x + dx, y: sn.pos.y + dy });
            graph.addNode(node);
            selh._nodes.put(node.id, node);
            svgh.selectNode(node, true);
            cNodes[sn.id] = node;
        });
        selEdges.forEach((se) => {
            const eid = svgh.edgeID++;
            const from = cNodes[se.from.id];
            const to = cNodes[se.to.id];
            const edge = new Edge(eid, from, to, {
                x: se.q.x + dx,
                y: se.q.y + dy,
            });
            graph.addEdge(edge);
            selh._edges.put(edge.id, edge);
            svgh.selectEdge(edge, true);
        });
        svgh.updateMessage();
        this.mode = this.modi.MODE_MOVE;
    }

    mirror() {
        const graph = Graph.instance;
        const selh = SelectionHandler.instance;
        const svgh = SvgHandler.instance;
        const cNodes = {};
        const tails = [];

        const check = selh.selectedNodes.forEach((sn) => {
            if (sn.adjacent.length === 0) return -1;
            else if (sn.adjacent.length === 1) {
                tails.push(sn);
            }
        });
        if (check < 0 || tails.length !== 2) return;

        const p = tails[0].pos;
        const vec = { x: tails[1].pos.x - p.x, y: tails[1].pos.y - p.y };
        const dvec2 = 1 / (vec.x * vec.x + vec.y * vec.y);

        selh.selectedNodes.forEach((sn) => {
            if (sn === tails[0] || sn === tails[1]) {
                cNodes[sn.id] = sn;
            } else {
                const pn = sn.pos;
                const lambda =
                    (vec.x * (pn.x - p.x) + vec.y * (pn.y - p.y)) * dvec2;
                const fpx = p.x + lambda * vec.x;
                const fpy = p.y + lambda * vec.y;
                const nid = svgh.nodeID++;
                const node = new Node(nid, {
                    x: pn.x + 2 * (fpx - pn.x),
                    y: pn.y + 2 * (fpy - pn.y),
                });
                graph.addNode(node);
                cNodes[sn.id] = node;
            }
        });
        selh.selectedEdges.forEach((se) => {
            const q = se.q;
            const lambda = (vec.x * (q.x - p.x) + vec.y * (q.y - p.y)) * dvec2;
            const fpx = p.x + lambda * vec.x;
            const fpy = p.y + lambda * vec.y;
            const eid = svgh.edgeID++;
            const edge = new Edge(eid, cNodes[se.from.id], cNodes[se.to.id], {
                x: q.x + 2 * (fpx - q.x),
                y: q.y + 2 * (fpy - q.y),
            });
            graph.addEdge(edge);
        });
        selh.clear();
        svgh.updateMessage();
        this.mode = this.modi.MODE_SELECT;
    }

    escape() {
        const m = this.mode.onEscape();
        if (m !== undefined) {
            this.mode = m;
        }
    }
}
