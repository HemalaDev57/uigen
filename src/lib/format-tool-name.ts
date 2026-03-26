/**
 * Formats tool invocation information into user-friendly text
 */
export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  state: string;
  result?: any;
}

export interface FormattedToolInfo {
  action: string;
  filename?: string;
  icon: "create" | "edit" | "view" | "delete" | "rename";
}

export function formatToolInvocation(tool: ToolInvocation): FormattedToolInfo {
  const { toolName, args } = tool;

  if (toolName === "str_replace_editor") {
    return formatStrReplaceEditor(args);
  }

  if (toolName === "file_manager") {
    return formatFileManager(args);
  }

  // Fallback for unknown tools
  return {
    action: toolName,
    icon: "edit",
  };
}

function formatStrReplaceEditor(args: any): FormattedToolInfo {
  const command = args.command;
  const path = args.path;
  const filename = path ? extractFilename(path) : undefined;

  switch (command) {
    case "create":
      return {
        action: "Created",
        filename,
        icon: "create",
      };

    case "str_replace":
      return {
        action: "Edited",
        filename,
        icon: "edit",
      };

    case "insert":
      return {
        action: "Modified",
        filename,
        icon: "edit",
      };

    case "view":
      return {
        action: "Viewed",
        filename,
        icon: "view",
      };

    default:
      return {
        action: "Modified",
        filename,
        icon: "edit",
      };
  }
}

function formatFileManager(args: any): FormattedToolInfo {
  const command = args.command;
  const path = args.path;
  const newPath = args.new_path;
  const filename = path ? extractFilename(path) : undefined;

  switch (command) {
    case "rename":
      const newFilename = newPath ? extractFilename(newPath) : undefined;
      return {
        action: newFilename ? `Renamed to ${newFilename}` : "Renamed",
        filename,
        icon: "rename",
      };

    case "delete":
      return {
        action: "Deleted",
        filename,
        icon: "delete",
      };

    default:
      return {
        action: "Modified",
        filename,
        icon: "edit",
      };
  }
}

function extractFilename(path: string): string {
  // Remove leading slash and extract just the filename
  const normalized = path.startsWith("/") ? path.substring(1) : path;
  const parts = normalized.split("/");
  return parts[parts.length - 1];
}
