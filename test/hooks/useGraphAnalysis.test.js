// useGraphAnalysis.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let useGraphAnalysis;

// ---- React hook mocks (no DOM/render needed) ----
function makeReactMock() {
  const setters = {
    setAnalyze: jest.fn(),
  };

  const reactMock = {
    useState: jest.fn((init) => {
      const value = typeof init === 'function' ? init() : init;
      return [value, setters.setAnalyze];
    }),
    useCallback: jest.fn((fn) => fn),
    __setters: setters,
  };

  return reactMock;
}

// ---- mutable stubs for instances ----
let graphStub;
let svghStub;
let selhStub;
let validateGraphMock;

const loadFresh = async ({
  profiles = { default: { p: 1 }, alt: { p: 2 } },
} = {}) => {
  jest.resetModules();
  jest.clearAllMocks();

  const reactMock = makeReactMock();

  // global window.alert mock
  globalThis.window = globalThis.window || {};
  globalThis.window.alert = jest.fn();

  // SelectionHandler mock
  selhStub = {
    clear: jest.fn(),
  };

  // SvgHandler mock
  svghStub = {
    setCritNodes: jest.fn(),
    setCritSeg: jest.fn(),
  };

  // Graph mock
  graphStub = {
    analyze: jest.fn(),
  };

  // validateGraph mock
  validateGraphMock = jest.fn();

  // Mock react
  await jest.unstable_mockModule('react', () => ({
    __esModule: true,
    useState: reactMock.useState,
    useCallback: reactMock.useCallback,
  }));

  // Mock config JSON import: profiles = config.profiles :contentReference[oaicite:2]{index=2}
  await jest.unstable_mockModule('../../src/client_config.json', () => ({
    __esModule: true,
    default: { profiles },
  }));

  // Mock Graph singleton
  await jest.unstable_mockModule('../../src/entities/graph/Graph.js', () => ({
    __esModule: true,
    default: class Graph {
      static get instance() {
        return graphStub;
      }
    },
  }));

  // Mock SvgHandler singleton
  await jest.unstable_mockModule('../../src/business-logic/handlers/SvgHandler.js', () => ({
    __esModule: true,
    default: class SvgHandler {
      static get instance() {
        return svghStub;
      }
    },
  }));

  // Mock SelectionHandler singleton
  await jest.unstable_mockModule('../../src/business-logic/handlers/SelectionHandler.js', () => ({
    __esModule: true,
    default: class SelectionHandler {
      static get instance() {
        return selhStub;
      }
    },
  }));

  // Mock validateGraph service
  await jest.unstable_mockModule('../../src/business-logic/services/graphValidation.js', () => ({
    __esModule: true,
    validateGraph: validateGraphMock,
  }));

  ({ default: useGraphAnalysis } = await import('../../src/ui/pages/Start/hooks/useGraphAnalysis.js')); // adjust if needed

  return { reactMock, profiles };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useGraphAnalysis (no jsdom)', () => {
  test('initial state: status=false, keys from profiles, data = profiles.default', async () => {
    const { profiles } = await loadFresh({
      profiles: { default: { p: 1 }, pro: { p: 2 }, x: { p: 3 } },
    });

    const formatMessage = jest.fn((x) => `FMT:${x}`);
    const msgs = {};

    const { analyze } = useGraphAnalysis(formatMessage, msgs);

    expect(analyze.status).toBe(false);
    expect(analyze.data).toEqual(profiles.default);
    expect(analyze.keys).toEqual(['default', 'pro', 'x']);
  });

  test('analyzeGraph: always clears selection first', async () => {
    await loadFresh();

    validateGraphMock.mockReturnValue({ valid: false, errors: [], warnings: [] });

    const formatMessage = jest.fn((x) => `FMT:${x}`);
    const msgs = {};

    const { analyzeGraph } = useGraphAnalysis(formatMessage, msgs);
    analyzeGraph();

    expect(selhStub.clear).toHaveBeenCalledTimes(1);
    expect(validateGraphMock).toHaveBeenCalledTimes(1);
  });

  test('edge case: invalid graph with errors => alerts joined errors and stops (no analyze, no setAnalyze, no crit setters)', async () => {
    const { reactMock } = await loadFresh();

    validateGraphMock.mockReturnValue({
      valid: false,
      errors: ['E1', 'E2'],
      warnings: ['W1'],
    });

    const formatMessage = jest.fn((x) => `FMT:${x}`);
    const msgs = { export: 'EXPORT', useful: 'USEFUL' };

    const { analyzeGraph } = useGraphAnalysis(formatMessage, msgs);
    analyzeGraph();

    expect(window.alert).toHaveBeenCalledTimes(1);
    expect(window.alert).toHaveBeenCalledWith('E1\nE2');

    expect(graphStub.analyze).not.toHaveBeenCalled();
    expect(reactMock.__setters.setAnalyze).not.toHaveBeenCalled();
    expect(svghStub.setCritNodes).not.toHaveBeenCalled();
    expect(svghStub.setCritSeg).not.toHaveBeenCalled();
  });

  test('edge case: invalid graph with NO errors => no alert and stops', async () => {
    const { reactMock } = await loadFresh();

    validateGraphMock.mockReturnValue({
      valid: false,
      errors: [],
      warnings: ['W1'],
    });

    const formatMessage = jest.fn((x) => `FMT:${x}`);
    const msgs = {};

    const { analyzeGraph } = useGraphAnalysis(formatMessage, msgs);
    analyzeGraph();

    expect(window.alert).not.toHaveBeenCalled();
    expect(graphStub.analyze).not.toHaveBeenCalled();
    expect(reactMock.__setters.setAnalyze).not.toHaveBeenCalled();
  });

  test('valid graph with warnings => alerts warnings first, continues to analyze', async () => {
    await loadFresh();

    validateGraphMock.mockReturnValue({
      valid: true,
      errors: [],
      warnings: ['W1', 'W2'],
    });

    graphStub.analyze.mockReturnValue({
      critNodes: [{ id: 1 }],
      critSeg: new Set([[0, 0], [1, 1]]),
    });

    const formatMessage = jest.fn((x) => `FMT:${x}`);
    const msgs = { useful: 'USEFUL', export: 'EXPORT' };

    const { analyzeGraph } = useGraphAnalysis(formatMessage, msgs);
    analyzeGraph();

    // warnings alerted (joined)
    expect(window.alert).toHaveBeenCalledWith('W1\nW2');

    // then useful alerted
    expect(window.alert).toHaveBeenCalledWith('FMT:USEFUL');

    expect(graphStub.analyze).toHaveBeenCalledTimes(1);
    expect(svghStub.setCritNodes).toHaveBeenCalledWith([{ id: 1 }]);
    expect(svghStub.setCritSeg).toHaveBeenCalled();
  });

  test('edge case: critNodes empty and critSeg empty => alerts msgs.export and returns (no setAnalyze, no setters)', async () => {
    const { reactMock } = await loadFresh();

    validateGraphMock.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });

    graphStub.analyze.mockReturnValue({
      critNodes: [],
      critSeg: new Set(), // segCount=0
    });

    const formatMessage = jest.fn((x) => `FMT:${x}`);
    const msgs = { export: 'EXPORT', useful: 'USEFUL' };

    const { analyzeGraph } = useGraphAnalysis(formatMessage, msgs);
    analyzeGraph();

    expect(window.alert).toHaveBeenCalledTimes(1);
    expect(window.alert).toHaveBeenCalledWith('FMT:EXPORT');

    expect(reactMock.__setters.setAnalyze).not.toHaveBeenCalled();
    expect(svghStub.setCritNodes).not.toHaveBeenCalled();
    expect(svghStub.setCritSeg).not.toHaveBeenCalled();
  });

  test('success path: sets analyze.status true, resets data to profiles.default, sets crit nodes/segments, alerts useful', async () => {
    const { reactMock, profiles } = await loadFresh({
      profiles: { default: { p: 111 }, pro: { p: 222 } },
    });

    validateGraphMock.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });

    const critSeg = new Set([['a'], ['b']]);
    const critNodes = [{ id: 1 }, { id: 2 }];

    graphStub.analyze.mockReturnValue({
      critNodes,
      critSeg,
    });

    const formatMessage = jest.fn((x) => `FMT:${x}`);
    const msgs = { useful: 'USEFUL', export: 'EXPORT' };

    const { analyze, analyzeGraph } = useGraphAnalysis(formatMessage, msgs);

    // sanity: initial data is default
    expect(analyze.data).toEqual(profiles.default);

    analyzeGraph();

    // setAnalyze called with status true and data reset to profiles.default :contentReference[oaicite:3]{index=3}
    expect(reactMock.__setters.setAnalyze).toHaveBeenCalledTimes(1);
    expect(reactMock.__setters.setAnalyze).toHaveBeenCalledWith({
      status: true,
      keys: analyze.keys,
      data: profiles.default,
    });

    expect(svghStub.setCritNodes).toHaveBeenCalledWith(critNodes);
    expect(svghStub.setCritSeg).toHaveBeenCalledWith(critSeg);

    expect(window.alert).toHaveBeenCalledWith('FMT:USEFUL');
  });

  test('analyzeGraph passes analyze.data to Graph.instance.analyze(data, analyze.data)', async () => {
    const { reactMock } = await loadFresh({
      profiles: { default: { profile: 'DEFAULT' }, custom: { profile: 'CUSTOM' } },
    });

    validateGraphMock.mockReturnValue({ valid: true, errors: [], warnings: [] });

    graphStub.analyze.mockReturnValue({
      critNodes: [{ id: 1 }],
      critSeg: new Set([['s']]),
    });

    const formatMessage = jest.fn((x) => `FMT:${x}`);
    const msgs = { useful: 'USEFUL', export: 'EXPORT' };

    // Force initial analyze.data to be something else by overriding useState init
    // We'll do it by swapping reactMock.useState behavior here:
    reactMock.useState.mockImplementationOnce(() => [
      { status: false, keys: ['default', 'custom'], data: { profile: 'CUSTOM' } },
      reactMock.__setters.setAnalyze,
    ]);

    const { analyzeGraph } = useGraphAnalysis(formatMessage, msgs);
    analyzeGraph();

    expect(graphStub.analyze).toHaveBeenCalledTimes(1);
    const [, passedProfile] = graphStub.analyze.mock.calls[0];
    expect(passedProfile).toEqual({ profile: 'CUSTOM' });
  });
});
