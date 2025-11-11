/**
 * @author Claudio
 * @date 29.04.2018
 * @version 1.0
 */

import * as d3 from "d3";
import AbstractMode from "./AbstractMode";
import Node from '../graph/Node'
import Edge from '../graph/Edge'
import SvgHandler from '../SvgHandler'
import Graph from "../graph/Graph";
import Controller from "../Controller";
import SelectionHandler from "../SelectionHandler";

export default class ModeDraw extends AbstractMode {
    constructor() {
        super();
        this._prev = undefined;
    }

    get prev() {
        return this._prev
    }

    set prev(value) {
        this._prev = value;
        if (value !== undefined) {
            SvgHandler.instance.resetMoveEdge(value.pos);
        }
    }

    enable() {
        d3.select("#draw").classed("activeMode", true);
        this.enableButtons({move: false, rotate: false, copy: false, mirror: false, erase: false});
        SelectionHandler.instance.clear();
    }

    onMouseDown(point) {
        const svgh = SvgHandler.instance;
        const focus = svgh.focus;
        const graph = Graph.instance;
        if (this.prev !== undefined) {
            if (focus.obj !== undefined && focus.type === "node") {
                if (focus.obj !== this.prev) {
                    const an = focus.obj.adjacent.length;
                    if (an < 2) {
                        const eid = svgh.edgeID++;
                        const edge = new Edge(eid, this.prev, focus.obj);
                        graph.addEdge(edge);
                        this.prev = focus.obj;
                        if (focus.obj.adjacent.length === 2) {
                            return Controller.instance.modi.MODE_SELECT;
                        }
                        this.prev = focus.obj;
                    } else if (an === 2) {
                        return Controller.instance.modi.MODE_SELECT;
                    }
                } else {
                    return Controller.instance.modi.MODE_SELECT;
                }
            } else if (focus.obj === undefined) {
                const eid = svgh.edgeID++;
                const nid = svgh.nodeID++;
                const node = new Node(nid, point);
                graph.addNode(node);
                const edge = new Edge(eid, this.prev, node);
                graph.addEdge(edge);
                this.prev = node;
            }
        } else {
            if (focus.obj !== undefined && focus.type === "node" && focus.obj.adjacent.length < 2) {
                this.prev = focus.obj;
                SvgHandler.instance.setMoveEdgeVisible(true);
            } else if (focus.obj === undefined) {
                const nid = svgh.nodeID++;
                const node = new Node(nid, point);
                graph.addNode(node);
                this.prev = node;
                SvgHandler.instance.setMoveEdgeVisible(true);
            }
        }
        svgh.updateMessage();
    }

    onMouseMove(point) {
        const svgh = SvgHandler.instance;
        const focus = svgh.focus;
        if (this.prev !== undefined)
            svgh.setMoveEdgeTo(focus.obj !== undefined && focus.type === "node" ? focus.obj.pos : point);
    }

    onEscape() {
        return Controller.instance.modi.MODE_SELECT;
    }

    disable() {
        d3.select("#draw").classed("activeMode", false);
        this.prev = undefined;
        SvgHandler.instance.setMoveEdgeVisible(false);
    }

}