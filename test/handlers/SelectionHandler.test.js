// SelectionHandler.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let SelectionHandler;
let SvgHandlerMod;
let GraphMod;

let svgh;   // SvgHandler.instance stub
let graph;  // Graph.instance stub

const loadFresh = async () => {
  jest.resetModules();

  // --- SvgHandler.instance stub ---
  svgh = {
    selectNode: jest.fn(),
    selectEdge: jest.fn(),
    setRectSelection: jest.fn(),
    setRectSelectionVisible: jest.fn(),
  };

  // --- Graph.instance stub ---
  graph = {
    forEachNode: jest.fn(),
  };

  // Mock SvgHandler default export class with static instance getter
  await jest.unstable_mockModule('../../src/business-logic/handlers/SvgHandler.js', () => ({
    __esModule: true,
    default: class SvgHandler {
      static get instance() {
        return svgh;
      }
    },
  }));

  // Mock Graph default export class with static instance getter
  await jest.unstable_mockModule('../../src/entities/graph/Graph.js', () => ({
    __esModule: true,
    default: class Graph {
      static get instance() {
        return graph;
      }
    },
  }));

  // Import after mocks are registered
  ({ default: SelectionHandler } = await import('../../src/business-logic/handlers/SelectionHandler.js'));
  SvgHandlerMod = await import('../../src/business-logic/handlers/SvgHandler.js');
  GraphMod = await import('../../src/entities/graph/Graph.js');

  return { SelectionHandler, SvgHandlerMod, GraphMod };
};

beforeEach(async () => {
  jest.clearAllMocks();
  await loadFresh();
});

function makeNode(id, x, y, adjacent = []) {
  return { id, pos: { x, y }, adjacent };
}

function makeEdge(id, from, to) {
  return { id, from, to };
}

describe('SelectionHandler (no jsdom)', () => {
  test('instance returns singleton; constructor guard throws', async () => {
    const a = SelectionHandler.instance;
    const b = SelectionHandler.instance;
    expect(a).toBe(b);

    expect(() => new SelectionHandler()).toThrow(/Use SelectionHandler\.instance/i);
  });

  test('initial state: nothing selected, rect inactive, singleEdge false', () => {
    const sh = SelectionHandler.instance;
    expect(sh.isAnySelected()).toBe(false);
    expect(sh.isRectActive()).toBe(false);
    expect(sh.singleEdge).toBe(false);

    // iterables should be empty
    expect([...sh.selectedNodes]).toEqual([]);
    expect([...sh.selectedEdges]).toEqual([]);
    expect([...sh.affectedEdges]).toEqual([]);
  });

  test('selectNode: clears previous selection, selects node, marks all adjacent edges affected (mod=node)', () => {
    const sh = SelectionHandler.instance;

    const e1 = makeEdge(1, {}, {});
    const e2 = makeEdge(2, {}, {});
    const n = makeNode(10, 5, 5, [e1, e2]);

    // pre-select something to ensure clear() path deselects
    const oldNode = makeNode(99, 0, 0, []);
    sh._nodes.set(oldNode.id, oldNode); // using internal for test setup
    sh._edges.set(88, makeEdge(88, {}, {}));
    sh._affectedEdges.set(77, { edge: makeEdge(77, {}, {}), mod: oldNode });

    sh.selectNode(n);

    // old selections should be deselected
    expect(svgh.selectNode).toHaveBeenCalledWith(oldNode, false);
    expect(svgh.selectEdge).toHaveBeenCalledWith(expect.anything(), false);

    // new node selected
    expect(sh.isNodeSelected(n)).toBe(true);
    expect(svgh.selectNode).toHaveBeenCalledWith(n, true);

    // edges affected
    expect(sh.isEdgeAffected(e1)).toBe(true);
    expect(sh.isEdgeAffected(e2)).toBe(true);

    const affected = [...sh.affectedEdges];
    expect(affected).toHaveLength(2);
    for (const { edge, mod } of affected) {
      expect([1, 2]).toContain(edge.id);
      expect(mod).toBe(n);
    }

    expect(sh.singleEdge).toBe(false);
  });

  test('selectEdge: selects edge, selects both nodes, sets singleEdge true, adds affected edge when node has exactly 2 adjacent', () => {
    const sh = SelectionHandler.instance;

    // main edge between A and B
    const A = makeNode(1, 0, 0, []);
    const B = makeNode(2, 1, 1, []);

    const main = makeEdge(10, A, B);

    // Each node gets exactly 2 adjacents: main + other
    const otherA = makeEdge(11, A, makeNode(3, 2, 2, []));
    const otherB = makeEdge(12, B, makeNode(4, 3, 3, []));

    A.adjacent = [main, otherA];
    B.adjacent = [otherB, main]; // reversed order to hit "adj[0] !== main ? adj[0] : adj[1]" both ways

    sh.selectEdge(main);

    expect(sh.isEdgeSelected(main)).toBe(true);
    expect(svgh.selectEdge).toHaveBeenCalledWith(main, true);

    // both nodes should be selected in internal map
    expect(sh.isNodeSelected(A)).toBe(true);
    expect(sh.isNodeSelected(B)).toBe(true);

    // affected edges should include otherA and otherB with mod=node
    expect(sh.isEdgeAffected(otherA)).toBe(true);
    expect(sh.isEdgeAffected(otherB)).toBe(true);

    const affected = [...sh.affectedEdges];
    const ids = affected.map((x) => x.edge.id).sort((x, y) => x - y);
    expect(ids).toEqual([11, 12]);

    // mod should be the respective node
    const aEntry = affected.find((x) => x.edge.id === 11);
    const bEntry = affected.find((x) => x.edge.id === 12);
    expect(aEntry.mod).toBe(A);
    expect(bEntry.mod).toBe(B);

    expect(sh.singleEdge).toBe(true);
  });

  test('selectEdge: does NOT add affected edge if node adjacent length != 2, and dedupes affected edges by id', () => {
    const sh = SelectionHandler.instance;

    const A = makeNode(1, 0, 0, []);
    const B = makeNode(2, 1, 1, []);
    const main = makeEdge(10, A, B);

    // Node A has 3 adjacents => no affected edge should be added for A
    const eA1 = makeEdge(20, A, makeNode(3, 0, 0, []));
    const eA2 = makeEdge(21, A, makeNode(4, 0, 0, []));
    A.adjacent = [main, eA1, eA2];

    // Node B has exactly 2 adjacents, but "other" edge id duplicates an existing affected edge id
    const dup = makeEdge(99, B, makeNode(5, 0, 0, []));
    B.adjacent = [main, dup];

    // preload affectedEdges with the same id to hit the "if (!this._affectedEdges.has(...))" branch
    sh._affectedEdges.set(99, { edge: dup, mod: A });

    sh.selectEdge(main);

    // Still only one entry for id=99 (not duplicated)
    const affected = [...sh.affectedEdges];
    const count99 = affected.filter((x) => x.edge.id === 99).length;
    expect(count99).toBe(1);

    // No affected edges from A (since adj length !=2)
    // Only possibly the existing 99 remains
    expect(affected.map((x) => x.edge.id)).toEqual([99]);
  });

  test('startRectSelection: clears, activates rect, sets start/moved, sets rect selection and visible', () => {
    const sh = SelectionHandler.instance;
    const start = { x: 10, y: 20 };

    sh.startRectSelection(start);

    expect(sh.isRectActive()).toBe(true);
    expect(svgh.setRectSelection).toHaveBeenCalledWith(start, start);
    expect(svgh.setRectSelectionVisible).toHaveBeenCalledWith(true);
  });

  test('moveRectSelection: updates moved point and updates svg rect selection', () => {
    const sh = SelectionHandler.instance;
    const start = { x: 0, y: 0 };
    const moved = { x: 5, y: 6 };

    sh.startRectSelection(start);
    sh.moveRectSelection(moved);

    expect(svgh.setRectSelection).toHaveBeenLastCalledWith(start, moved);
  });

  test('endRectSelection: selects nodes inside rectangle, selects edges fully inside, marks crossing edges as affected, and dedupes edges', () => {
    const sh = SelectionHandler.instance;

    // Rectangle: (0,0) to (10,10)
    sh.startRectSelection({ x: 0, y: 0 });
    sh.moveRectSelection({ x: 10, y: 10 });

    // Nodes:
    // nIn at (5,5) inside
    // nOut at (50,50) outside
    const nIn = makeNode(1, 5, 5, []);
    const nOut = makeNode(2, 50, 50, []);

    // Edges adjacent to nIn:
    // eInside: both endpoints inside (nIn -> nIn2 inside)
    const nIn2 = makeNode(3, 6, 6, []);
    const eInside = makeEdge(10, nIn, nIn2);

    // eCross: one endpoint inside (nIn -> nOut) => affected
    const eCross = makeEdge(11, nIn, nOut);

    // Put same edge twice to ensure dedupe condition "!_edges.has && !_affectedEdges.has"
    nIn.adjacent = [eInside, eCross, eCross];

    // Graph.forEachNode will visit all nodes
    graph.forEachNode.mockImplementation((cb) => {
      cb(nIn);
      cb(nOut);
      cb(nIn2); // inside too, but note: it has no adjacents, still should be selected
    });

    sh.endRectSelection();

    // selected nodes: nIn and nIn2 (inside), not nOut
    expect(sh.isNodeSelected(nIn)).toBe(true);
    expect(sh.isNodeSelected(nIn2)).toBe(true);
    expect(sh.isNodeSelected(nOut)).toBe(false);

    // svg selection called for inside nodes
    expect(svgh.selectNode).toHaveBeenCalledWith(nIn, true);
    expect(svgh.selectNode).toHaveBeenCalledWith(nIn2, true);
    expect(svgh.selectNode).not.toHaveBeenCalledWith(nOut, true);

    // eInside should be selected edge
    expect(sh.isEdgeSelected(eInside)).toBe(true);
    expect(svgh.selectEdge).toHaveBeenCalledWith(eInside, true);

    // eCross should be affected with mod = nIn
    expect(sh.isEdgeAffected(eCross)).toBe(true);
    const affected = [...sh.affectedEdges];
    const entry = affected.find((x) => x.edge.id === 11);
    expect(entry.mod).toBe(nIn);

    // dedupe: eCross should appear once even if adjacent contained duplicates
    expect(affected.filter((x) => x.edge.id === 11)).toHaveLength(1);

    // endRectSelection hides rect and deactivates
    expect(svgh.setRectSelectionVisible).toHaveBeenCalledWith(false);
    expect(sh.isRectActive()).toBe(false);
  });

  test('endRectSelection edge case: reversed rectangle coordinates (start > moved) still works', () => {
    const sh = SelectionHandler.instance;

    // Start at bottom-right, moved to top-left => min/max logic must handle
    sh.startRectSelection({ x: 10, y: 10 });
    sh.moveRectSelection({ x: 0, y: 0 });

    const n = makeNode(1, 5, 5, []);
    graph.forEachNode.mockImplementation((cb) => cb(n));

    sh.endRectSelection();

    expect(sh.isNodeSelected(n)).toBe(true);
    expect(svgh.selectNode).toHaveBeenCalledWith(n, true);
  });

  test('cancelRectSelection: hides rect and deactivates (even if nothing selected)', () => {
    const sh = SelectionHandler.instance;

    sh.startRectSelection({ x: 0, y: 0 });
    sh.cancelRectSelection();

    expect(svgh.setRectSelectionVisible).toHaveBeenCalledWith(false);
    expect(sh.isRectActive()).toBe(false);
  });

  test('clear: deselects all nodes/edges in SvgHandler, clears maps, resets singleEdge', () => {
    const sh = SelectionHandler.instance;

    const n1 = makeNode(1, 0, 0, []);
    const n2 = makeNode(2, 1, 1, []);
    const e1 = makeEdge(10, n1, n2);

    sh._nodes.set(n1.id, n1);
    sh._nodes.set(n2.id, n2);
    sh._edges.set(e1.id, e1);
    sh._affectedEdges.set(99, { edge: makeEdge(99, n1, n2), mod: n1 });
    sh._singleEdge = true;

    sh.clear();

    expect(svgh.selectNode).toHaveBeenCalledWith(n1, false);
    expect(svgh.selectNode).toHaveBeenCalledWith(n2, false);
    expect(svgh.selectEdge).toHaveBeenCalledWith(e1, false);

    expect(sh.isAnySelected()).toBe(false);
    expect([...sh.affectedEdges]).toEqual([]);
    expect(sh.singleEdge).toBe(false);
  });

  test('query helpers: isNodeSelected/isEdgeSelected/isEdgeAffected behave as expected', () => {
    const sh = SelectionHandler.instance;

    const n = makeNode(1, 0, 0, []);
    const e = makeEdge(10, n, n);

    sh._nodes.set(n.id, n);
    sh._edges.set(e.id, e);
    sh._affectedEdges.set(e.id, { edge: e, mod: n });

    expect(sh.isNodeSelected(n)).toBe(true);
    expect(sh.isEdgeSelected(e)).toBe(true);
    expect(sh.isEdgeAffected(e)).toBe(true);
    expect(sh.isAnySelected()).toBe(true);
  });
});
