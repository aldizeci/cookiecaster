// Controller.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let Controller;

// --- shared stubs (reset each test via loadFresh) ---
let graphStub, svghStub, selhStub;
let ModeDraw, ModeSelect, ModeMove, ModeRotate; // mocked classes
let NodeMock, EdgeMock;

function makeMode(name) {
  return {
    name,
    enable: jest.fn(),
    disable: jest.fn(),
    onMouseDown: jest.fn(() => undefined),
    onMouseMove: jest.fn(() => undefined),
    onMouseUp: jest.fn(() => undefined),
    onEscape: jest.fn(() => undefined),
  };
}

const asIterable = (arr) => ({
  [Symbol.iterator]: function* () {
    yield* arr;
  },
});

async function loadFresh() {
  jest.resetModules();

  // --- Graph.instance stub ---
  graphStub = {
    nodeSize: 0,
    addNode: jest.fn(() => { graphStub.nodeSize += 1; }),
    addEdge: jest.fn(),
    removeNode: jest.fn(() => { graphStub.nodeSize = Math.max(0, graphStub.nodeSize - 1); }),
    removeEdge: jest.fn(),
    clear: jest.fn(() => { graphStub.nodeSize = 0; }),
  };

  await jest.unstable_mockModule('../../src/entities/graph/Graph.js', () => ({
    __esModule: true,
    default: class Graph {
      static get instance() {
        return graphStub;
      }
    },
  }));

  // --- SvgHandler.instance stub ---
  svghStub = {
    nodeID: 0,
    edgeID: 0,
    getRasterSpace: jest.fn(() => 6),
    getDrawingAreaSize: jest.fn(() => 240),
    clear: jest.fn(),
    updateMessage: jest.fn(),
    selectNode: jest.fn(),
    selectEdge: jest.fn(),
  };

  await jest.unstable_mockModule('../../src/business-logic/handlers/SvgHandler.js', () => ({
    __esModule: true,
    default: class SvgHandler {
      static get instance() {
        return svghStub;
      }
    },
  }));

  // --- SelectionHandler.instance stub ---
  selhStub = {
    _nodes: new Map(),
    _edges: new Map(),
    selectedNodes: (function* () {})(),
    selectedEdges: (function* () {})(),
    affectedEdges: (function* () {})(),
    singleEdge: false,
    isRectActive: jest.fn(() => false),
    clear: jest.fn(() => {
      selhStub._nodes.clear();
      selhStub._edges.clear();
    }),
  };

  await jest.unstable_mockModule('../../src/business-logic/handlers/SelectionHandler.js', () => ({
    __esModule: true,
    default: class SelectionHandler {
      static get instance() {
        return selhStub;
      }
    },
  }));

  // --- Node / Edge mocks used by Controller.copy/mirror ---
  NodeMock = class Node {
    constructor(id, pos) {
      this.id = id;
      this.pos = pos;
      this.adjacent = [];
    }
  };
  EdgeMock = class Edge {
    constructor(id, from, to, q) {
      this.id = id;
      this.from = from;
      this.to = to;
      this.q = q;
    }
  };

  await jest.unstable_mockModule('../../src/entities/graph/Node.js', () => ({
    __esModule: true,
    default: NodeMock,
  }));
  await jest.unstable_mockModule('../../src/entities/graph/Edge.js', () => ({
    __esModule: true,
    default: EdgeMock,
  }));

  // --- Mode mocks (Controller constructs them) ---
  const draw = makeMode('draw');
  const select = makeMode('select');
  const move = makeMode('move');
  const rotate = makeMode('rotate');

  ModeDraw = class { constructor() { return draw; } };
  ModeSelect = class { constructor() { return select; } };
  ModeMove = class { constructor() { return move; } };
  ModeRotate = class { constructor() { return rotate; } };

  await jest.unstable_mockModule('../../src/business-logic/modes/ModeDraw.js', () => ({
    __esModule: true,
    default: ModeDraw,
  }));
  await jest.unstable_mockModule('../../src/business-logic/modes/ModeSelect.js', () => ({
    __esModule: true,
    default: ModeSelect,
  }));
  await jest.unstable_mockModule('../../src/business-logic/modes/ModeMove.js', () => ({
    __esModule: true,
    default: ModeMove,
  }));
  await jest.unstable_mockModule('../../src/business-logic/modes/ModeRotate.js', () => ({
    __esModule: true,
    default: ModeRotate,
  }));

  ({ default: Controller } = await import('../../src/business-logic/handlers/Controller.js'));

  return { draw, select, move, rotate };
}

beforeEach(async () => {
  jest.clearAllMocks();
  await loadFresh();
});

describe('Controller (no jsdom)', () => {
  test('singleton + constructor guard', async () => {
    const a = Controller.instance;
    const b = Controller.instance;
    expect(a).toBe(b);

    expect(() => new Controller()).toThrow(/Use Controller\.instance/i);
  });

  test('grid getter/setter coerces to boolean', () => {
    const c = Controller.instance;
    expect(c.grid).toBe(true);

    c.grid = 0;
    expect(c.grid).toBe(false);

    c.grid = 'yes';
    expect(c.grid).toBe(true);
  });

  test('mode setter: same mode does nothing; changing mode calls disable/enable', async () => {
    const { draw, select } = await loadFresh();
    const c = Controller.instance;

    // initial mode is draw
    expect(c.mode).toBe(c.modi.MODE_DRAW);

    // setting same mode: no disable/enable
    c.mode = c.modi.MODE_DRAW;
    expect(draw.disable).not.toHaveBeenCalled();
    expect(draw.enable).not.toHaveBeenCalled();

    // change mode: disable old, enable new
    c.mode = c.modi.MODE_SELECT;
    expect(draw.disable).toHaveBeenCalledTimes(1);
    expect(select.enable).toHaveBeenCalledTimes(1);
    expect(c.mode).toBe(c.modi.MODE_SELECT);
  });

  test('fixAndSnapPoint: snaps to grid and clamps to boundaries', () => {
    const c = Controller.instance;

    // rasterSpace=6 => snap threshold = 3; drawingArea=240 => clamp to [6, 234]
    const p = { x: 1, y: 999 }; // outside both ends
    c.fixAndSnapPoint(p);

    // clamped
    expect(p.x).toBe(6);
    expect(p.y).toBe(234);

    // snapping behavior: point.x=10 -> snaps to 12 (10%6=4>3)
    const p2 = { x: 10, y: 10 };
    c.fixAndSnapPoint(p2);
    expect(p2.x).toBe(12);
    expect(p2.y).toBe(12);
  });

  test('fixAndSnapPoint: when grid is off, only clamps (no snapping)', () => {
    const c = Controller.instance;
    c.grid = false;

    const p = { x: 10, y: 10 };
    c.fixAndSnapPoint(p);

    // no snapping => remains 10 but clamped min is 6 so stays 10
    expect(p).toEqual({ x: 10, y: 10 });
  });

  test('mouseDown/mouseMove: snaps unless rectangle selection active', async () => {
    const c = Controller.instance;

    // force rect inactive
    selhStub.isRectActive.mockReturnValue(false);
    const spyFix = jest.spyOn(c, 'fixAndSnapPoint');

    const p1 = { x: 10, y: 10 };
    c.mouseDown(p1);
    expect(spyFix).toHaveBeenCalledTimes(1);

    const p2 = { x: 11, y: 11 };
    c.mouseMove(p2);
    expect(spyFix).toHaveBeenCalledTimes(2);

    // now rect active => no snap
    selhStub.isRectActive.mockReturnValue(true);

    const p3 = { x: 12, y: 12 };
    c.mouseDown(p3);
    c.mouseMove({ x: 13, y: 13 });
    expect(spyFix).toHaveBeenCalledTimes(2);
  });

  test('_transition: changes mode only when nextMode is not undefined', async () => {
    const { draw, select } = await loadFresh();
    const c = Controller.instance;

    // current is draw; call transition with undefined => no changes
    c._transition(undefined);
    expect(draw.disable).not.toHaveBeenCalled();
    expect(select.enable).not.toHaveBeenCalled();

    // transition to select
    c._transition(c.modi.MODE_SELECT);
    expect(draw.disable).toHaveBeenCalledTimes(1);
    expect(select.enable).toHaveBeenCalledTimes(1);
  });

  test('mouseUp calls onMouseUp and transitions if mode returns a new one', async () => {
    const { draw, move } = await loadFresh();
    const c = Controller.instance;

    // make current mode return MODE_MOVE on mouseUp
    draw.onMouseUp.mockReturnValue(c.modi.MODE_MOVE);

    c.mouseUp();
    expect(draw.onMouseUp).toHaveBeenCalledTimes(1);
    expect(draw.disable).toHaveBeenCalledTimes(1);
    expect(move.enable).toHaveBeenCalledTimes(1);
    expect(c.mode).toBe(c.modi.MODE_MOVE);
  });

  test('reset: clears Graph and SvgHandler and sets mode to draw', async () => {
    const { draw } = await loadFresh();
    const c = Controller.instance;

    // set different mode first
    c.mode = c.modi.MODE_SELECT;
    expect(draw.disable).toHaveBeenCalledTimes(1); // draw disabled on mode change

    c.reset();
    expect(graphStub.clear).toHaveBeenCalledTimes(1);
    expect(svghStub.clear).toHaveBeenCalledTimes(1);
    expect(c.mode).toBe(c.modi.MODE_DRAW);
  });

  test('erase: removes selectedEdges always; when singleEdge=false also removes affectedEdges + selectedNodes; sets mode based on graph.nodeSize', async () => {
    const c = Controller.instance;

    const n1 = { id: 1, adjacent: [] };
    const e1 = { id: 10 };
    const e2 = { id: 11 };

    // selectedEdges yields [e1]
    selhStub.selectedEdges = (function* () { yield e1; })();
    // affectedEdges yields [{edge:e2}]
    selhStub.affectedEdges = (function* () { yield { edge: e2, mod: n1 }; })();
    // selectedNodes yields [n1]
    selhStub.selectedNodes = (function* () { yield n1; })();
    selhStub.singleEdge = false;

    graphStub.nodeSize = 5;

    c.erase();

    expect(graphStub.removeEdge).toHaveBeenCalledWith(e1);
    expect(graphStub.removeEdge).toHaveBeenCalledWith(e2);
    expect(graphStub.removeNode).toHaveBeenCalledWith(n1);

    expect(selhStub.clear).toHaveBeenCalledTimes(1);
    expect(svghStub.updateMessage).toHaveBeenCalledWith('');
    // nodeSize > 0 => MODE_SELECT
    expect(c.mode).toBe(c.modi.MODE_SELECT);
  });

  test('erase edge case: singleEdge=true skips affectedEdges + selectedNodes; sets draw mode if graph empty', () => {
    const c = Controller.instance;

    const n1 = { id: 1, adjacent: [] };
    const e1 = { id: 10 };
    const e2 = { id: 11 };

    selhStub.selectedEdges = (function* () { yield e1; })();
    selhStub.affectedEdges = (function* () { yield { edge: e2, mod: n1 }; })();
    selhStub.selectedNodes = (function* () { yield n1; })();
    selhStub.singleEdge = true;

    graphStub.nodeSize = 0;

    c.erase();

    expect(graphStub.removeEdge).toHaveBeenCalledWith(e1);
    expect(graphStub.removeEdge).not.toHaveBeenCalledWith(e2);
    expect(graphStub.removeNode).not.toHaveBeenCalled();

    expect(c.mode).toBe(c.modi.MODE_DRAW);
  });

  test('copy: logs and returns if nothing selected', () => {
    const c = Controller.instance;

    // empty iterables
    selhStub.selectedNodes = (function* () {})();
    selhStub.selectedEdges = (function* () {})();

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    c.copy();
    expect(logSpy).toHaveBeenCalledWith('Copy: nothing selected');
    logSpy.mockRestore();
  });

  test('copy: copies nodes with offset; copies edges only when both endpoints were copied; sets mode to MOVE', () => {
    const c = Controller.instance;

    // rasterSpace=6 => dx=dy=30
    svghStub.nodeID = 100;
    svghStub.edgeID = 200;

    const a = { id: 1, pos: { x: 10, y: 20 } };
    const b = { id: 2, pos: { x: 40, y: 50 } };
    const cNodeNotSelected = { id: 3, pos: { x: 999, y: 999 } };

    const eGood = { id: 7, from: a, to: b, q: { x: 20, y: 30 } };
    const eSkip = { id: 8, from: a, to: cNodeNotSelected, q: { x: 1, y: 1 } };

    selhStub.selectedNodes = (function* () { yield a; yield b; })();
    selhStub.selectedEdges = (function* () { yield eGood; yield eSkip; })();

    c.copy();

    // nodes created with new ids and offset by 30
    expect(graphStub.addNode).toHaveBeenCalledTimes(2);
    const createdNodeIds = Array.from(selhStub._nodes.keys());
    expect(createdNodeIds.length).toBe(2);
    expect(svghStub.selectNode).toHaveBeenCalledTimes(2);

    // edges: only eGood copied because both endpoints exist in cNodes
    expect(graphStub.addEdge).toHaveBeenCalledTimes(1);
    expect(svghStub.selectEdge).toHaveBeenCalledTimes(1);

    // updateMessage and mode move
    expect(svghStub.updateMessage).toHaveBeenCalledTimes(1);
    expect(c.mode).toBe(c.modi.MODE_MOVE);

    // edgeID/nodeID advanced
    expect(svghStub.nodeID).toBe(102);
    expect(svghStub.edgeID).toBe(201);
  });

  test('mirror: early returns when a selected node has adjacent.length === 0', () => {
    const c = Controller.instance;

    const n = { id: 1, pos: { x: 0, y: 0 }, adjacent: [] };
    selhStub.selectedNodes = (function* () { yield n; })();
    selhStub.selectedEdges = (function* () {})();

    svghStub.nodeID = 0;
    svghStub.edgeID = 0;

    c.mirror();

    expect(graphStub.addNode).not.toHaveBeenCalled();
    expect(graphStub.addEdge).not.toHaveBeenCalled();
    expect(selhStub.clear).not.toHaveBeenCalled();
  });

  test('mirror: early returns when tails.length !== 2', () => {
    const c = Controller.instance;

    const tail = { id: 1, pos: { x: 0, y: 0 }, adjacent: [{}] }; // degree 1 tail
    const mid = { id: 2, pos: { x: 10, y: 0 }, adjacent: [{}, {}] }; // degree 2 (not tail)
    selhStub.selectedNodes = (function* () { yield tail; yield mid; })();
    selhStub.selectedEdges = (function* () {})();

    c.mirror();

    expect(graphStub.addNode).not.toHaveBeenCalled();
    expect(graphStub.addEdge).not.toHaveBeenCalled();
  });

test('mirror: success mirrors non-tail nodes and edges; clears selection; sets mode SELECT', () => {
  const c = Controller.instance;

  svghStub.nodeID = 10;
  svghStub.edgeID = 20;

  // Two tails (degree 1) define mirror axis:
  const t1 = { id: 1, pos: { x: 0, y: 0 }, adjacent: [{}] };
  const t2 = { id: 2, pos: { x: 10, y: 0 }, adjacent: [{}] };

  // Node to mirror (degree 2 so it isn't a tail)
  const n = { id: 3, pos: { x: 5, y: 4 }, adjacent: [{}, {}] };

  // Edge whose endpoints exist in cNodes after mirroring:
  const e = { id: 7, from: t1, to: n, q: { x: 5, y: 2 } };

  // ✅ IMPORTANT: make these re-iterable (Controller.mirror() iterates selectedNodes twice)
  selhStub.selectedNodes = asIterable([t1, t2, n]);
  selhStub.selectedEdges = asIterable([e]);

  c.mirror();

  // One new node created (mirror of n); tails not duplicated
  expect(graphStub.addNode).toHaveBeenCalledTimes(1);

  // One mirrored edge created
  expect(graphStub.addEdge).toHaveBeenCalledTimes(1);

  expect(selhStub.clear).toHaveBeenCalledTimes(1);
  expect(svghStub.updateMessage).toHaveBeenCalledTimes(1);
  expect(c.mode).toBe(c.modi.MODE_SELECT);

  // IDs advanced
  expect(svghStub.nodeID).toBe(11);
  expect(svghStub.edgeID).toBe(21);
});


  test('escape: transitions based on mode.onEscape()', async () => {
    const { draw, rotate } = await loadFresh();
    const c = Controller.instance;

    // switch to rotate
    c.mode = c.modi.MODE_ROTATE;
    // make rotate escape return draw
    rotate.onEscape.mockReturnValue(c.modi.MODE_DRAW);

    c.escape();

    expect(rotate.onEscape).toHaveBeenCalledTimes(1);
    expect(rotate.disable).toHaveBeenCalledTimes(1);
    expect(draw.enable).toHaveBeenCalledTimes(1);
    expect(c.mode).toBe(c.modi.MODE_DRAW);
  });
});
