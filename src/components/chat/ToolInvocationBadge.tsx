"use client";

import { Loader2, FilePlus, FileEdit, Eye, Trash2, FileType } from "lucide-react";
import { formatToolInvocation, type ToolInvocation } from "@/lib/format-tool-name";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

const iconMap = {
  create: FilePlus,
  edit: FileEdit,
  view: Eye,
  delete: Trash2,
  rename: FileType,
};

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const isComplete = toolInvocation.state === "result" && toolInvocation.result;
  const formattedTool = formatToolInvocation(toolInvocation);
  const Icon = iconMap[formattedTool.icon];

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <Icon className="h-3.5 w-3.5 text-neutral-600" />
          <span className="text-neutral-700 font-medium">
            {formattedTool.action}
          </span>
          {formattedTool.filename && (
            <span className="text-neutral-500 font-mono">
              {formattedTool.filename}
            </span>
          )}
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <Icon className="h-3.5 w-3.5 text-neutral-600" />
          <span className="text-neutral-700 font-medium">
            {formattedTool.action}
          </span>
          {formattedTool.filename && (
            <span className="text-neutral-500 font-mono">
              {formattedTool.filename}
            </span>
          )}
        </>
      )}
    </div>
  );
}
