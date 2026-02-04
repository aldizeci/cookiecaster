import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";

let useCanvasInteractions;

// ---- shared mutable stubs ----
let graphSvc, ctr, svgh;
let importCC3FileMock, exportCC3FileMock;
let analyzeGraphMock, saveGraphMock;

// React useEffect mock: run effect immediately + capture cleanup
let lastCleanup;
const reactMock = {
  useEffect: jest.fn((fn) => {
    lastCleanup = fn();
  }),
};

// Simple in-memory storages (Node-friendly)
function makeStorage() {
  const m = new Map();
  return {
    getItem: jest.fn((k) => (m.has(k) ? m.get(k) : null)),
    setItem: jest.fn((k, v) => m.set(k, String(v))),
    removeItem: jest.fn((k) => m.delete(k)),
    clear: jest.fn(() => m.clear()),
    __map: m,
  };
}

// d3 mock with handler registry: select("#id").on("click", fn) etc.
function makeD3Mock() {
  const registry = new Map(); // key: `${selector}|${event}` => fn
  const attrs = new Map(); // key: `${selector}|${attr}` => value

  const svgNode = { __isSvgNode: true };

  const makeSelection = (selector, nodeObj = null) => {
    const sel = {
      attr: jest.fn((k, v) => {
        attrs.set(`${selector}|${k}`, v);
        return sel; // ✅ chain safely
      }),
      on: jest.fn((event, fn) => {
        registry.set(`${selector}|${event}`, fn);
        return sel; // ✅ chain safely
      }),
      node: jest.fn(() => nodeObj),
      remove: jest.fn(() => {
        registry.set(`${selector}|__removed`, true);
      }),
    };
    return sel;
  };

  const d3 = {
    __registry: registry,
    __attrs: attrs,
    __svgNode: svgNode,

    selectAll: jest.fn((selector) => makeSelection(`ALL:${selector}`)),
    select: jest.fn((selectorOrNode) => {
      // if passed an element-ish object (like svgRef.current), return SVG selection
      if (selectorOrNode && typeof selectorOrNode === "object") {
        return makeSelection("SVG", svgNode);
      }
      return makeSelection(String(selectorOrNode));
    }),

    pointer: jest.fn((_evt, _node) => [10.4, 20.6]), // will be rounded to {10,21}
  };

  return d3;
}

async function loadFresh({ selectedSource, selectedId, templateGraphJSON, localDrawings } = {}) {
  jest.resetModules();
  jest.clearAllMocks();
  lastCleanup = undefined;

  globalThis.localStorage = makeStorage();
  globalThis.sessionStorage = makeStorage();

  if (selectedId) globalThis.sessionStorage.setItem("selectedDrawingId", selectedId);
  if (selectedSource) globalThis.sessionStorage.setItem("selectedSource", selectedSource);
  if (templateGraphJSON !== undefined) {
    globalThis.sessionStorage.setItem("templateGraphJSON", JSON.stringify(templateGraphJSON));
  }
  if (localDrawings !== undefined) {
    globalThis.localStorage.setItem("drawings", JSON.stringify(localDrawings));
  }

  const keyHandlers = new Map();
  globalThis.window = {
    addEventListener: jest.fn((type, fn) => keyHandlers.set(type, fn)),
    removeEventListener: jest.fn((type, fn) => {
      if (keyHandlers.get(type) === fn) keyHandlers.delete(type);
    }),
    __keyHandlers: keyHandlers,
  };

  // Needed because hook uses document.querySelector("#reset")?.click()
  globalThis.document = {
    querySelector: jest.fn((sel) => {
      if (sel !== "#reset") return null;
      return {
        click: () => {
          const fn = d3.__registry.get("#reset|click");
          if (fn) fn();
        },
      };
    }),
  };

  globalThis.alert = jest.fn();

  const d3 = makeD3Mock();

  // ✅ IMPORTANT: hook uses graphSvc, not Graph.instance
  graphSvc = {
    fromJSON: jest.fn(),
    toJSON: jest.fn(() => ({ g: 1 })),
  };

  svgh = {
    updateMessage: jest.fn(),
    clearWarnings: jest.fn(),
    redraw: jest.fn(),
  };

  ctr = {
    modi: {
      MODE_DRAW: { enable: jest.fn(), disable: jest.fn() },
      MODE_SELECT: { enable: jest.fn(), disable: jest.fn() },
      MODE_MOVE: { enable: jest.fn(), disable: jest.fn() },
      MODE_ROTATE: { enable: jest.fn(), disable: jest.fn() },
    },
    _mode: undefined,
    reset: jest.fn(),
    mouseDown: jest.fn(),
    mouseMove: jest.fn(),
    mouseUp: jest.fn(),
    escape: jest.fn(),
    erase: jest.fn(),
    copy: jest.fn(),
    mirror: jest.fn(),
  };
  Object.defineProperty(ctr, "mode", {
    get() { return this._mode; },
    set(newMode) {
      if (newMode === this._mode) return;
      if (this._mode && typeof this._mode.disable === "function") this._mode.disable();
      this._mode = newMode;
      if (this._mode && typeof this._mode.enable === "function") this._mode.enable();
    },
    configurable: true,
    enumerable: true,
  });

  importCC3FileMock = jest.fn();
  exportCC3FileMock = jest.fn();
  analyzeGraphMock = jest.fn();
  saveGraphMock = jest.fn();

  await jest.unstable_mockModule("react", () => ({
    __esModule: true,
    useEffect: reactMock.useEffect,
  }));
  await jest.unstable_mockModule("d3", () => ({ __esModule: true, ...d3 }));

  // ✅ IMPORTANT: mock ServicesProvider to inject controller/graph/svgHandler
  await jest.unstable_mockModule(
    "../../src/business-logic/services/ServicesProvider.jsx",
    () => ({
      __esModule: true,
      useServices: () => ({ controller: ctr, graph: graphSvc, svgHandler: svgh }),
    })
  );

  await jest.unstable_mockModule("../../src/utils/FileImport.js", () => ({
    __esModule: true,
    importCC3File: importCC3FileMock,
  }));

  await jest.unstable_mockModule("../../src/utils/FileExport.js", () => ({
    __esModule: true,
    exportCC3File: exportCC3FileMock,
  }));

  ({ default: useCanvasInteractions } = await import(
    "../../src/ui/pages/Start/hooks/useCanvasInteractions.js"
  ));

  return { d3 };
}

function runHook({ d3, analyzeStatus = false } = {}) {
  const svgRef = { current: { __isSvgRefEl: true } };

  const api = useCanvasInteractions({
    svgRef,
    analyze: { status: analyzeStatus },
    analyzeGraph: analyzeGraphMock,
    saveGraph: saveGraphMock,
  });

  expect(reactMock.useEffect).toHaveBeenCalled();

  return { api, svgRef, d3 };
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // run cleanup if your hook returns one
  if (typeof lastCleanup === "function") lastCleanup();
});

describe("useCanvasInteractions (no jsdom)", () => {
  test("exportToFile: calls graphSvc.toJSON and exportCC3File(data,'drawing')", async () => {
    const { d3 } = await loadFresh();
    const { api } = runHook({ d3 });

    api.exportToFile();

    expect(graphSvc.toJSON).toHaveBeenCalledTimes(1);
    expect(exportCC3FileMock).toHaveBeenCalledWith({ g: 1 }, "drawing");
  });

  test("importFromFile: early return when importCC3File returns null", async () => {
    const { d3 } = await loadFresh();
    const { api } = runHook({ d3 });

    importCC3FileMock.mockResolvedValue(null);

    await api.importFromFile();

    expect(ctr.reset).not.toHaveBeenCalled();
    expect(graphSvc.fromJSON).not.toHaveBeenCalled();
    expect(globalThis.alert).not.toHaveBeenCalled();
  });

  test("importFromFile: success resets controller, loads graphJSON stringified if needed, sets mode to new MODE_SELECT and enables it, alerts", async () => {
    const { d3 } = await loadFresh();
    const { api } = runHook({ d3 });

    importCC3FileMock.mockResolvedValue({ graphJSON: { foo: 1 } });

    const enableSpy = jest.fn();
    ctr.modi.MODE_SELECT = { enable: enableSpy, disable: jest.fn() };

    await api.importFromFile();

    expect(ctr.reset).toHaveBeenCalledTimes(1);

    expect(graphSvc.fromJSON).toHaveBeenCalledTimes(1);
    const arg = graphSvc.fromJSON.mock.calls[0][0];
    expect(typeof arg).toBe("string");
    expect(arg).toContain('"foo":1');

    expect(svgh.updateMessage).toHaveBeenCalledTimes(1);
    expect(enableSpy).toHaveBeenCalledTimes(1);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  test("useEffect: sets navbar id, installs pointer + keyboard handlers, and initializes mode to MODE_DRAW when ctr.mode is falsy", async () => {
    const { d3 } = await loadFresh();
    ctr.mode = undefined;

    runHook({ d3 });

    expect(d3.selectAll).toHaveBeenCalledWith("nav.navbar.navbar-default");
    expect(d3.__attrs.get("ALL:nav.navbar.navbar-default|id")).toBe("startNavBar");

    expect(d3.__registry.get("SVG|pointerdown")).toEqual(expect.any(Function));
    expect(d3.__registry.get("SVG|pointermove")).toEqual(expect.any(Function));
    expect(d3.__registry.get("SVG|pointerup")).toEqual(expect.any(Function));
    expect(d3.__registry.get("SVG|pointercancel")).toEqual(expect.any(Function));
    expect(d3.__registry.get("SVG|mouseleave")).toEqual(expect.any(Function));

    expect(window.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));

    expect(ctr.mode).toBe(ctr.modi.MODE_DRAW);
  });

  test("pointerdown: clears warnings when analyze.status true, removes #layer, calls ctr.mouseDown(pointerPos)", async () => {
    const { d3 } = await loadFresh();
    runHook({ d3, analyzeStatus: true });

    const onDown = d3.__registry.get("SVG|pointerdown");
    onDown({ type: "pointerdown" });

    expect(svgh.clearWarnings).toHaveBeenCalledTimes(1);
    expect(d3.__registry.get("#layer|__removed")).toBe(true);
    expect(ctr.mouseDown).toHaveBeenCalledWith({ x: 10, y: 21 });
  });

  test("pointermove: calls ctr.mouseMove(pointerPos)", async () => {
    const { d3 } = await loadFresh();
    runHook({ d3 });

    const onMove = d3.__registry.get("SVG|pointermove");
    onMove({ type: "pointermove" });

    expect(ctr.mouseMove).toHaveBeenCalledWith({ x: 10, y: 21 });
  });

  test("pointerup: calls ctr.mouseUp and writes temp autosave to localStorage (saved drawings retained)", async () => {
    const { d3 } = await loadFresh({
      localDrawings: [
        { id: "a", saved: true, graphJSON: { a: 1 } },
        { id: "b", saved: false, graphJSON: { b: 2 } },
      ],
    });
    runHook({ d3 });

    const onUp = d3.__registry.get("SVG|pointerup");
    onUp();

    expect(ctr.mouseUp).toHaveBeenCalledTimes(1);

    const saved = JSON.parse(localStorage.setItem.mock.calls.at(-1)[1]);
    expect(saved.find((d) => d.id === "b")).toBeUndefined();

    const temp = saved.find((d) => d.id === "temp-autosave");
    expect(temp).toBeDefined();
    expect(temp.saved).toBe(false);
    expect(temp.graphJSON).toEqual({ g: 1 });
    expect(typeof temp.timestamp).toBe("string");
  });

  test("keyboard handler: Escape/Delete/c with ctrl/meta call controller actions", async () => {
    const { d3 } = await loadFresh();
    runHook({ d3 });

    const onKeyDown = window.addEventListener.mock.calls.find(([t]) => t === "keydown")[1];

    onKeyDown({ key: "Escape" });
    expect(ctr.escape).toHaveBeenCalledTimes(1);

    onKeyDown({ key: "Delete" });
    expect(ctr.erase).toHaveBeenCalledTimes(1);

    onKeyDown({ key: "c", ctrlKey: true });
    expect(ctr.copy).toHaveBeenCalledTimes(1);

    onKeyDown({ key: "c", metaKey: true });
    expect(ctr.copy).toHaveBeenCalledTimes(2);

    onKeyDown({ key: "x" });
  });

  test("sidebar buttons: reset clears controller and removes unsaved drawings; mode buttons set ctr.mode; mirror/copy/erase call methods", async () => {
    const { d3 } = await loadFresh({
      localDrawings: [
        { id: "keep", saved: true },
        { id: "drop", saved: false },
      ],
    });

    runHook({ d3 });

    d3.__registry.get("#reset|click")();
    expect(ctr.reset).toHaveBeenCalledTimes(1);

    const drawingsSaved = JSON.parse(localStorage.setItem.mock.calls.at(-1)[1]);
    expect(drawingsSaved).toEqual([{ id: "keep", saved: true }]);

    d3.__registry.get("#draw|click")();
    expect(ctr.mode).toBe(ctr.modi.MODE_DRAW);

    d3.__registry.get("#select|click")();
    expect(ctr.mode).toBe(ctr.modi.MODE_SELECT);

    d3.__registry.get("#move|click")();
    expect(ctr.mode).toBe(ctr.modi.MODE_MOVE);

    d3.__registry.get("#rotate|click")();
    expect(ctr.mode).toBe(ctr.modi.MODE_ROTATE);

    d3.__registry.get("#mirror|click")();
    expect(ctr.mirror).toHaveBeenCalledTimes(1);

    d3.__registry.get("#copy|click")();
    expect(ctr.copy).toHaveBeenCalledTimes(1);

    d3.__registry.get("#erase|click")();
    expect(ctr.erase).toHaveBeenCalledTimes(1);

    d3.__registry.get("#analyze|click")();
    expect(analyzeGraphMock).toHaveBeenCalledTimes(1);

    d3.__registry.get("#save|click")();
    expect(saveGraphMock).toHaveBeenCalledTimes(1);
  });

  test("sessionStorage load: template source parses templateGraphJSON, calls graphSvc.fromJSON + svgh.redraw, then clears session keys", async () => {
    const { d3 } = await loadFresh({
      selectedId: "t1",
      selectedSource: "template",
      templateGraphJSON: { hello: 1 },
    });

    runHook({ d3 });

    expect(graphSvc.fromJSON).toHaveBeenCalledWith({ hello: 1 });

    expect(sessionStorage.removeItem).toHaveBeenCalledWith("selectedDrawingId");
    expect(sessionStorage.removeItem).toHaveBeenCalledWith("selectedSource");
    expect(sessionStorage.removeItem).toHaveBeenCalledWith("templateGraphJSON");
  });

  test("sessionStorage load: local source finds drawing by id in localStorage and loads graphJSON", async () => {
    const { d3 } = await loadFresh({
      selectedId: "L1",
      selectedSource: "local",
      localDrawings: [
        { id: "L1", saved: true, graphJSON: { local: 123 } },
        { id: "L2", saved: true, graphJSON: { local: 999 } },
      ],
    });

    runHook({ d3 });

    expect(graphSvc.fromJSON).toHaveBeenCalledWith({ local: 123 });
  });

  test("exportToFile button: calls exportCC3File(graphSvc.toJSON(),'drawing')", async () => {
    const { d3 } = await loadFresh();
    runHook({ d3 });

    d3.__registry.get("#exportToFile|click")();

    expect(graphSvc.toJSON).toHaveBeenCalledTimes(1);
    expect(exportCC3FileMock).toHaveBeenCalledWith({ g: 1 }, "drawing");
  });
});
