/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

// IMPORTANT: ESM-safe module mocking
const mockNavigate = jest.fn();

jest.unstable_mockModule("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Import the hook AFTER mocking the module
const { useGallerySelection } = await import(
  "../../src/ui/pages/Gallery/hooks/useGallerySelection.js" // adjust if needed
);

let container = null;
let root = null;

beforeEach(() => {
  mockNavigate.mockClear();
  sessionStorage.clear();

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  container = null;
  root = null;
});

function HookHarness(props) {
  const onSelect = useGallerySelection();

  useEffect(() => {
    props.onReady(onSelect);
  }, [onSelect]);

  return null;
}

function renderHookAndGetCallback() {
  let cb;

  act(() => {
    root.render(
      React.createElement(HookHarness, {
        onReady: (fn) => {
          cb = fn;
        },
      })
    );
  });

  return cb;
}

describe("useGallerySelection (ESM, no JSX, no extra deps)", () => {
  test("returns early when item has neither svgPath nor svg", () => {
    const onSelect = renderHookAndGetCallback();

    act(() => onSelect({ id: "x1" }));

    expect(sessionStorage.getItem("selectedDrawingId")).toBeNull();
    expect(sessionStorage.getItem("selectedSource")).toBeNull();
    expect(sessionStorage.getItem("templateGraphJSON")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("returns early when item is null/undefined", () => {
    const onSelect = renderHookAndGetCallback();

    act(() => onSelect(null));
    act(() => onSelect(undefined));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
  });

  test("stores local selection and navigates to /start", () => {
    const onSelect = renderHookAndGetCallback();

    act(() =>
      onSelect({ id: "local-123", svgPath: "M0 0", isTemplate: false })
    );

    expect(sessionStorage.getItem("selectedDrawingId")).toBe("local-123");
    expect(sessionStorage.getItem("selectedSource")).toBe("local");
    expect(sessionStorage.getItem("templateGraphJSON")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/start");
  });

  test("accepts svg when svgPath missing", () => {
    const onSelect = renderHookAndGetCallback();

    act(() => onSelect({ id: "local-svg", svg: "<svg />", isTemplate: false }));

    expect(sessionStorage.getItem("selectedDrawingId")).toBe("local-svg");
    expect(sessionStorage.getItem("selectedSource")).toBe("local");
    expect(mockNavigate).toHaveBeenCalledWith("/start");
  });

  test("stores templateGraphJSON when template has graphJSON", () => {
    const onSelect = renderHookAndGetCallback();

    const graph = { nodes: [1], edges: [] };
    act(() =>
      onSelect({
        id: "tpl-1",
        svgPath: "M1 1",
        isTemplate: true,
        graphJSON: graph,
      })
    );

    expect(sessionStorage.getItem("selectedDrawingId")).toBe("tpl-1");
    expect(sessionStorage.getItem("selectedSource")).toBe("template");
    expect(sessionStorage.getItem("templateGraphJSON")).toBe(JSON.stringify(graph));
    expect(mockNavigate).toHaveBeenCalledWith("/start");
  });

  test("does not store templateGraphJSON when graphJSON missing", () => {
    const onSelect = renderHookAndGetCallback();

    act(() =>
      onSelect({ id: "tpl-2", svgPath: "M2 2", isTemplate: true })
    );

    expect(sessionStorage.getItem("selectedDrawingId")).toBe("tpl-2");
    expect(sessionStorage.getItem("selectedSource")).toBe("template");
    expect(sessionStorage.getItem("templateGraphJSON")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/start");
  });
});
