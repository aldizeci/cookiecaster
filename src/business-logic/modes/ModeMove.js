/**
 * @author Claudio
 * @date 29.04.2018
 * @version 1.0
 */

import * as d3 from "d3";
import AbstractMode from "./AbstractMode.js";
import SelectionHandler from '../handlers/SelectionHandler.js';
import SvgHandler from '../handlers/SvgHandler.js';
import Controller from "../handlers/Controller.js";

export default class ModeMove extends AbstractMode {
    enable() {
        d3.select("#move").classed("activeMode", true);
        this.data = {cursor: undefined, nodePos: {}, qPos: {}};
    }

    onMouseDown(point) {
        this.data.cursor = point;
        const selh = SelectionHandler.instance;
        selh.selectedNodes.forEach(node => this.data.nodePos[node.id] = node.pos);
        selh.selectedEdges.forEach(edge => this.data.qPos[edge.id] = edge.q);
        selh.affectedEdges.forEach(affected => {
            const edge = affected.edge;
            this.data.qPos[edge.id] = edge.q
        });
    }

    onMouseMove(point) {
        if (this.data.cursor !== undefined) {
            const svgh = SvgHandler.instance;
            const selh = SelectionHandler.instance;
            const dx = point.x - this.data.cursor.x;
            const dy = point.y - this.data.cursor.y;
            selh.selectedNodes.forEach(node => {
                const np = this.data.nodePos[node.id];
                node.pos = {x: np.x + dx, y: np.y + dy};
                svgh.updateNode(node);
            });
            selh.selectedEdges.forEach(edge => {
                const q = this.data.qPos[edge.id];
                edge.q = {x: q.x + dx, y: q.y + dy};
                svgh.updateEdge(edge);
            });
            const dx2 = dx * 0.5;
            const dy2 = dy * 0.5;
            selh.affectedEdges.forEach(affected => {
                const edge = affected.edge;
                const q = this.data.qPos[edge.id];
                edge.q = {x: q.x + dx2, y: q.y + dy2};
                svgh.updateEdge(edge);
            });
            svgh.updateMessage();
        }
    }

    onMouseUp() {
        this.data.cursor = undefined;
    }

    onEscape() {
        return Controller.instance.modi.MODE_SELECT;
    }

    disable() {
        d3.select("#move").classed("activeMode", false);
    }
}