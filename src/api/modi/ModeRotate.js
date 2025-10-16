/**
 * @author Claudio
 * @date 22.06.2018
 * @version 1.0
 */

import AbstractMode from "./AbstractMode";
import * as d3 from "d3";
import SvgHandler from "../SvgHandler";
import Controller from "../Controller";
import SelectionHandler from "../SelectionHandler";

let round5 = x => Math.round(2 * x) * 0.5;

export default class ModeRotate extends AbstractMode {
    enable() {
        d3.select("#rotate").classed("activeMode", true);
        this.data = {pivot: undefined, vec: undefined, nodePos: {}, qPos: {}};
    }

    onMouseDown(point) {
        const selh = SelectionHandler.instance;
        const selNodes = selh.selectedNodes;
        if (selNodes.length > 0) {
            let cx = 0, cy = 0;
            selNodes.forEach(node => {
                cx += node.pos.x;
                cy += node.pos.y;
                this.data.nodePos[node.id] = node.pos
            });
            selh.selectedEdges.forEach(edge => this.data.qPos[edge.id] = edge.q);
            selh.affectedEdges.forEach(affected => {
                const edge = affected.edge;
                this.data.qPos[edge.id] = edge.q
            });
            const dn = 1 / selNodes.length;
            this.data.pivot = {x: cx * dn, y: cy * dn};
            this.data.vec = {x: point.x - this.data.pivot.x, y: point.y - this.data.pivot.y};
        }
    }

    onMouseMove(point) {
        if (this.data.vec !== undefined) {
            const svgh = SvgHandler.instance;
            const selh = SelectionHandler.instance;
            const vx = this.data.vec.x;
            const vy = this.data.vec.y;
            const dx = point.x - this.data.pivot.x;
            const dy = point.y - this.data.pivot.y;

            const s = Math.sign(vx * dy - vy * dx);
            const cosPhi = (vx * dx + vy * dy) / (Math.sqrt(vx * vx + vy * vy) * Math.sqrt(dx * dx + dy * dy));
            const sinPhi = s * Math.sqrt(1 - cosPhi * cosPhi);

            //todo check simplify
            const cosPhi2 = Math.cos(0.5 * Math.acos(cosPhi));
            const sinPhi2 = s * Math.sqrt(1 - cosPhi2 * cosPhi2);

            selh.selectedNodes.forEach(node => {
                const np = this.data.nodePos[node.id];
                const dx = np.x - this.data.pivot.x;
                const dy = np.y - this.data.pivot.y;
                node.pos = {
                    x: round5(dx * cosPhi - dy * sinPhi + this.data.pivot.x),
                    y: round5(dx * sinPhi + dy * cosPhi + this.data.pivot.y),
                };
                svgh.updateNode(node);
            });
            selh.selectedEdges.forEach(edge => {
                const q = this.data.qPos[edge.id];
                const dx = q.x - this.data.pivot.x;
                const dy = q.y - this.data.pivot.y;
                edge.q = {
                    x: round5(dx * cosPhi - dy * sinPhi + this.data.pivot.x),
                    y: round5(dx * sinPhi + dy * cosPhi + this.data.pivot.y),
                };
                svgh.updateEdge(edge);
            });
            selh.affectedEdges.forEach(affected => {
                const edge = affected.edge;
                const q = this.data.qPos[edge.id];
                const dx = q.x - this.data.pivot.x;
                const dy = q.y - this.data.pivot.y;
                edge.q = {
                    x: round5(dx * cosPhi2 - dy * sinPhi2 + this.data.pivot.x),
                    y: round5(dx * sinPhi2 + dy * cosPhi2 + this.data.pivot.y),
                };
                svgh.updateEdge(edge);
            });
            svgh.updateMessage();
        }
    }

    onMouseUp() {
        this.data.vec = undefined;
    }

    onEscape() {
        return Controller.instance.modi.MODE_SELECT;
    }

    disable() {
        d3.select("#rotate").classed("activeMode", false);
    }
}