import { test, expect, describe } from "vitest";
import { formatToolInvocation, type ToolInvocation } from "../format-tool-name";

describe("formatToolInvocation", () => {
  describe("str_replace_editor tool", () => {
    test("formats create command correctly", () => {
      const tool: ToolInvocation = {
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/components/Button.tsx",
        },
        state: "result",
        result: "Success",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("Created");
      expect(result.filename).toBe("Button.tsx");
      expect(result.icon).toBe("create");
    });

    test("formats str_replace command correctly", () => {
      const tool: ToolInvocation = {
        toolCallId: "2",
        toolName: "str_replace_editor",
        args: {
          command: "str_replace",
          path: "/App.jsx",
          old_str: "old code",
          new_str: "new code",
        },
        state: "result",
        result: "Success",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("Edited");
      expect(result.filename).toBe("App.jsx");
      expect(result.icon).toBe("edit");
    });

    test("formats insert command correctly", () => {
      const tool: ToolInvocation = {
        toolCallId: "3",
        toolName: "str_replace_editor",
        args: {
          command: "insert",
          path: "/src/utils/helper.ts",
          insert_line: 10,
          new_str: "inserted code",
        },
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("Modified");
      expect(result.filename).toBe("helper.ts");
      expect(result.icon).toBe("edit");
    });

    test("formats view command correctly", () => {
      const tool: ToolInvocation = {
        toolCallId: "4",
        toolName: "str_replace_editor",
        args: {
          command: "view",
          path: "/package.json",
        },
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("Viewed");
      expect(result.filename).toBe("package.json");
      expect(result.icon).toBe("view");
    });

    test("handles unknown command", () => {
      const tool: ToolInvocation = {
        toolCallId: "5",
        toolName: "str_replace_editor",
        args: {
          command: "unknown_command",
          path: "/test.js",
        },
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("Modified");
      expect(result.filename).toBe("test.js");
      expect(result.icon).toBe("edit");
    });
  });

  describe("file_manager tool", () => {
    test("formats delete command correctly", () => {
      const tool: ToolInvocation = {
        toolCallId: "6",
        toolName: "file_manager",
        args: {
          command: "delete",
          path: "/temp/test.txt",
        },
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("Deleted");
      expect(result.filename).toBe("test.txt");
      expect(result.icon).toBe("delete");
    });

    test("formats rename command correctly", () => {
      const tool: ToolInvocation = {
        toolCallId: "7",
        toolName: "file_manager",
        args: {
          command: "rename",
          path: "/components/OldName.tsx",
          new_path: "/components/NewName.tsx",
        },
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("Renamed to NewName.tsx");
      expect(result.filename).toBe("OldName.tsx");
      expect(result.icon).toBe("rename");
    });

    test("formats rename command without new_path", () => {
      const tool: ToolInvocation = {
        toolCallId: "8",
        toolName: "file_manager",
        args: {
          command: "rename",
          path: "/components/File.tsx",
        },
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("Renamed");
      expect(result.filename).toBe("File.tsx");
      expect(result.icon).toBe("rename");
    });

    test("handles unknown file_manager command", () => {
      const tool: ToolInvocation = {
        toolCallId: "9",
        toolName: "file_manager",
        args: {
          command: "unknown",
          path: "/file.js",
        },
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("Modified");
      expect(result.filename).toBe("file.js");
      expect(result.icon).toBe("edit");
    });
  });

  describe("filename extraction", () => {
    test("extracts filename from path with leading slash", () => {
      const tool: ToolInvocation = {
        toolCallId: "10",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/Button.tsx",
        },
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.filename).toBe("Button.tsx");
    });

    test("extracts filename from nested path", () => {
      const tool: ToolInvocation = {
        toolCallId: "11",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/src/components/ui/Button.tsx",
        },
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.filename).toBe("Button.tsx");
    });

    test("extracts filename from path without leading slash", () => {
      const tool: ToolInvocation = {
        toolCallId: "12",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "components/Button.tsx",
        },
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.filename).toBe("Button.tsx");
    });
  });

  describe("edge cases", () => {
    test("handles unknown tool names", () => {
      const tool: ToolInvocation = {
        toolCallId: "13",
        toolName: "unknown_tool",
        args: {},
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("unknown_tool");
      expect(result.icon).toBe("edit");
    });

    test("handles missing path in args", () => {
      const tool: ToolInvocation = {
        toolCallId: "14",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          // path is missing
        },
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("Created");
      expect(result.filename).toBeUndefined();
      expect(result.icon).toBe("create");
    });

    test("handles empty args", () => {
      const tool: ToolInvocation = {
        toolCallId: "15",
        toolName: "str_replace_editor",
        args: {},
        state: "result",
      };

      const result = formatToolInvocation(tool);

      expect(result.action).toBe("Modified");
      expect(result.filename).toBeUndefined();
      expect(result.icon).toBe("edit");
    });
  });
});
