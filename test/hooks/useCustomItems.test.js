/**
 * @jest-environment jsdom
 */

import { jest } from "@jest/globals";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

// Import AFTER environment is set
import { useCustomItems } from "../../src/ui/pages/Gallery/hooks/useCustomItems.js"; // adjust path if needed

let container = null;
let root = null;

beforeEach(() => {
  localStorage.clear();

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

/**
 * Harness component to expose hook values to the test
 */
function HookHarness(props) {
  const value = useCustomItems(props.storageKey);

  useEffect(() => {
    props.onReady(value);
  }, [value]);

  return null;
}

function renderHook(storageKey = undefined) {
  let result;

  act(() => {
    root.render(
      React.createElement(HookHarness, {
        storageKey,
        onReady: (v) => {
          result = v;
        },
      })
    );
  });

  return result;
}

describe("useCustomItems (ESM, no JSX, no extra deps)", () => {
  test("loads empty array when localStorage is empty", () => {
    const { customItems } = renderHook();

    expect(customItems).toEqual([]);
  });

  test("filters only saved items from localStorage", () => {
    const data = [
      { id: "1", saved: true },
      { id: "2", saved: false },
      { id: "3", saved: true },
    ];

    localStorage.setItem("drawings", JSON.stringify(data));

    const { customItems } = renderHook();

    expect(customItems).toEqual([
      { id: "1", saved: true },
      { id: "3", saved: true },
    ]);
  });

  test("uses custom storageKey", () => {
    const data = [{ id: "x", saved: true }];

    localStorage.setItem("my-key", JSON.stringify(data));

    const { customItems } = renderHook("my-key");

    expect(customItems).toEqual([{ id: "x", saved: true }]);
  });

  test("deleteItem removes item from state and localStorage", () => {
    const data = [
      { id: "a", saved: true },
      { id: "b", saved: true },
    ];

    localStorage.setItem("drawings", JSON.stringify(data));

    let hook;

    act(() => {
      root.render(
        React.createElement(HookHarness, {
          onReady: (v) => {
            hook = v;
          },
        })
      );
    });

    act(() => {
      hook.deleteItem("a");
    });

    expect(hook.customItems).toEqual([{ id: "b", saved: true }]);

    const stored = JSON.parse(localStorage.getItem("drawings"));
    expect(stored).toEqual([{ id: "b", saved: true }]);
  });

  test("deleteItem with custom storageKey", () => {
    const data = [
      { id: "1", saved: true },
      { id: "2", saved: true },
    ];

    localStorage.setItem("custom", JSON.stringify(data));

    let hook;

    act(() => {
      root.render(
        React.createElement(HookHarness, {
          storageKey: "custom",
          onReady: (v) => {
            hook = v;
          },
        })
      );
    });

    act(() => {
      hook.deleteItem("2");
    });

    expect(hook.customItems).toEqual([{ id: "1", saved: true }]);
    expect(JSON.parse(localStorage.getItem("custom"))).toEqual([
      { id: "1", saved: true },
    ]);
  });
});
