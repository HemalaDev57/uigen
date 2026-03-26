import { test, expect, describe, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "@/lib/format-tool-name";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className}>
      Loader2
    </div>
  ),
  FilePlus: ({ className }: { className?: string }) => (
    <div data-testid="file-plus-icon" className={className}>
      FilePlus
    </div>
  ),
  FileEdit: ({ className }: { className?: string }) => (
    <div data-testid="file-edit-icon" className={className}>
      FileEdit
    </div>
  ),
  Eye: ({ className }: { className?: string }) => (
    <div data-testid="eye-icon" className={className}>
      Eye
    </div>
  ),
  Trash2: ({ className }: { className?: string }) => (
    <div data-testid="trash-icon" className={className}>
      Trash2
    </div>
  ),
  FileType: ({ className }: { className?: string }) => (
    <div data-testid="file-type-icon" className={className}>
      FileType
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("ToolInvocationBadge", () => {
  describe("str_replace_editor tool", () => {
    test("renders 'Created' action with filename for create command", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/components/Button.tsx",
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByText("Created")).toBeDefined();
      expect(screen.getByText("Button.tsx")).toBeDefined();
      expect(screen.getByTestId("file-plus-icon")).toBeDefined();
    });

    test("renders 'Edited' action with filename for str_replace command", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "2",
        toolName: "str_replace_editor",
        args: {
          command: "str_replace",
          path: "/App.jsx",
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByText("Edited")).toBeDefined();
      expect(screen.getByText("App.jsx")).toBeDefined();
      expect(screen.getByTestId("file-edit-icon")).toBeDefined();
    });

    test("renders 'Modified' action for insert command", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "3",
        toolName: "str_replace_editor",
        args: {
          command: "insert",
          path: "/utils/helper.ts",
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByText("Modified")).toBeDefined();
      expect(screen.getByText("helper.ts")).toBeDefined();
    });

    test("renders 'Viewed' action for view command", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "4",
        toolName: "str_replace_editor",
        args: {
          command: "view",
          path: "/package.json",
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByText("Viewed")).toBeDefined();
      expect(screen.getByText("package.json")).toBeDefined();
      expect(screen.getByTestId("eye-icon")).toBeDefined();
    });
  });

  describe("file_manager tool", () => {
    test("renders 'Deleted' action with filename for delete command", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "5",
        toolName: "file_manager",
        args: {
          command: "delete",
          path: "/temp/test.txt",
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByText("Deleted")).toBeDefined();
      expect(screen.getByText("test.txt")).toBeDefined();
      expect(screen.getByTestId("trash-icon")).toBeDefined();
    });

    test("renders 'Renamed to X' for rename command", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "6",
        toolName: "file_manager",
        args: {
          command: "rename",
          path: "/components/OldName.tsx",
          new_path: "/components/NewName.tsx",
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByText("Renamed to NewName.tsx")).toBeDefined();
      expect(screen.getByText("OldName.tsx")).toBeDefined();
      expect(screen.getByTestId("file-type-icon")).toBeDefined();
    });
  });

  describe("loading states", () => {
    test("shows green dot for completed state", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "7",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/Button.tsx",
        },
        state: "result",
        result: "Success",
      };

      const { container } = render(
        <ToolInvocationBadge toolInvocation={toolInvocation} />
      );

      const greenDot = container.querySelector(".bg-emerald-500");
      expect(greenDot).toBeDefined();
      expect(greenDot?.className).toContain("rounded-full");
    });

    test("shows loading spinner for pending state", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "8",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/Button.tsx",
        },
        state: "pending",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("loader-icon")).toBeDefined();
    });

    test("shows loading spinner when result is missing", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "9",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/Button.tsx",
        },
        state: "result",
        // result is missing
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("loader-icon")).toBeDefined();
    });
  });

  describe("icon display", () => {
    test("displays FilePlus icon for create action", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "10",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/test.js",
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("file-plus-icon")).toBeDefined();
    });

    test("displays FileEdit icon for edit action", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "11",
        toolName: "str_replace_editor",
        args: {
          command: "str_replace",
          path: "/test.js",
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("file-edit-icon")).toBeDefined();
    });

    test("displays Eye icon for view action", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "12",
        toolName: "str_replace_editor",
        args: {
          command: "view",
          path: "/test.js",
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("eye-icon")).toBeDefined();
    });

    test("displays Trash2 icon for delete action", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "13",
        toolName: "file_manager",
        args: {
          command: "delete",
          path: "/test.js",
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("trash-icon")).toBeDefined();
    });

    test("displays FileType icon for rename action", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "14",
        toolName: "file_manager",
        args: {
          command: "rename",
          path: "/old.js",
          new_path: "/new.js",
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("file-type-icon")).toBeDefined();
    });
  });

  describe("edge cases", () => {
    test("handles tool invocations without filename", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "15",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          // path is missing
        },
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByText("Created")).toBeDefined();
      // Should not crash, just not show filename
    });

    test("handles unknown tool names", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "16",
        toolName: "unknown_tool",
        args: {},
        state: "result",
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

      expect(screen.getByText("unknown_tool")).toBeDefined();
      expect(screen.getByTestId("file-edit-icon")).toBeDefined();
    });
  });

  describe("styling", () => {
    test("applies correct base styling", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "17",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/test.js",
        },
        state: "result",
        result: "Success",
      };

      const { container } = render(
        <ToolInvocationBadge toolInvocation={toolInvocation} />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("inline-flex");
      expect(badge.className).toContain("items-center");
      expect(badge.className).toContain("gap-2");
      expect(badge.className).toContain("bg-neutral-50");
      expect(badge.className).toContain("rounded-lg");
      expect(badge.className).toContain("border");
    });

    test("applies monospace font to filename", () => {
      const toolInvocation: ToolInvocation = {
        toolCallId: "18",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/Button.tsx",
        },
        state: "result",
        result: "Success",
      };

      const { container } = render(
        <ToolInvocationBadge toolInvocation={toolInvocation} />
      );

      const filename = screen.getByText("Button.tsx");
      expect(filename.className).toContain("font-mono");
    });
  });
});
