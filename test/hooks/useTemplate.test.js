/**
 * @jest-environment jsdom
 */

import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { useTemplates } from "../../src/ui/pages/Gallery/hooks/useTemplates.js";

let container = null;
let root = null;

beforeEach(() => {
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

function TestComponent(props) {
  const templates = useTemplates(props.files);

  useEffect(() => {
    props.onResult(templates);
  }, [templates]);

  return null;
}

describe("useTemplates (no JSX, no extra deps)", () => {
  test("maps primary fields", () => {
    const files = {
      "/templates/foo.json": {
        name: "Foo Template",
        svgPath: "PATH",
        graphJSON: { a: 1 },
      },
    };

    let result;

    act(() => {
      root.render(
        React.createElement(TestComponent, {
          files,
          onResult: (v) => (result = v),
        })
      );
    });

    expect(result).toEqual([
      {
        id: "tpl-foo",
        name: "Foo Template",
        svgPath: "PATH",
        graphJSON: { a: 1 },
        isTemplate: true,
      },
    ]);
  });

  test("uses fallbacks", () => {
    const files = {
      "/x/bar.json": {
        svg: "<svg />",
        extra: 123,
      },
    };

    let result;

    act(() => {
      root.render(
        React.createElement(TestComponent, {
          files,
          onResult: (v) => (result = v),
        })
      );
    });

    expect(result).toEqual([
      {
        id: "tpl-bar",
        name: "bar",
        svgPath: "<svg />",
        graphJSON: { svg: "<svg />", extra: 123 },
        isTemplate: true,
      },
    ]);
  });

  test("covers filename edge cases", () => {
    const files = {
      "baz": {},
      "/trailing/": {},
    };

    let result;

    act(() => {
      root.render(
        React.createElement(TestComponent, {
          files,
          onResult: (v) => (result = v),
        })
      );
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        {
          id: "tpl-baz",
          name: "baz",
          svgPath: "",
          graphJSON: {},
          isTemplate: true,
        },
        {
          id: "tpl-",
          name: "",
          svgPath: "",
          graphJSON: {},
          isTemplate: true,
        },
      ])
    );
  });

  test("updates when input changes", () => {
    const filesA = {
      "/a.json": { name: "A", svgPath: "A", graphJSON: { a: 1 } },
    };
    const filesB = {
      "/b.json": { name: "B", svgPath: "B", graphJSON: { b: 2 } },
      "/c.json": { svgPath: "C" },
    };

    let result;

    act(() => {
      root.render(
        React.createElement(TestComponent, {
          files: filesA,
          onResult: (v) => (result = v),
        })
      );
    });

    expect(result).toEqual([
      { id: "tpl-a", name: "A", svgPath: "A", graphJSON: { a: 1 }, isTemplate: true },
    ]);

    act(() => {
      root.render(
        React.createElement(TestComponent, {
          files: filesB,
          onResult: (v) => (result = v),
        })
      );
    });

    expect(result).toEqual([
      { id: "tpl-b", name: "B", svgPath: "B", graphJSON: { b: 2 }, isTemplate: true },
      { id: "tpl-c", name: "c", svgPath: "C", graphJSON: { svgPath: "C" }, isTemplate: true },
    ]);
  });
});
