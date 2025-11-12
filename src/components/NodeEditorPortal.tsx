import React, { useEffect, useState } from "react";
import { NodeEditModal } from "@/components/NodeEditModal";
import { useJson } from "@/store/useJson";

interface EditingNode {
  path: string;
  value: any;
}

export const NodeEditorPortal: React.FC = () => {
  const [editingNode, setEditingNode] = useState<EditingNode | null>(null);
  const updateNodeValue = useJson((s: any) => s.updateNodeValue);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const nodeEl = target.closest("[data-json-path]") as HTMLElement | null;
      if (!nodeEl) return;

      // prevent opening modal for controls inside modal or buttons etc.
      if (nodeEl.closest(".mantine-Modal-root")) return;

      const path = nodeEl.getAttribute("data-json-path");
      if (!path) return;

      const raw = nodeEl.getAttribute("data-json-value");
      let value: any = raw ?? nodeEl.textContent ?? "";

      // Try to parse JSON value attribute; fallback leave string
      try {
        if (raw !== null) {
          value = JSON.parse(raw);
        } else {
          // try parse text content as JSON (number/true/null/object)
          const trimmed = (nodeEl.textContent || "").trim();
          if (trimmed === "true") value = true;
          else if (trimmed === "false") value = false;
          else if (trimmed === "null") value = null;
          else if (trimmed !== "" && !Number.isNaN(Number(trimmed))) value = Number(trimmed);
          else {
            // keep as string
            value = trimmed;
          }
        }
      } catch {
        // keep as string if parse fails
      }

      setEditingNode({ path, value });
    }

    function onOpenNodeEditor(e: Event) {
      // allow programmatic opening via CustomEvent detail { path, value }
      const ev = e as CustomEvent;
      if (!ev?.detail) return;
      const { path: p, value: v } = ev.detail as { path?: string; value?: any };
      if (!p) return;
      setEditingNode({ path: p, value: v });
    }

    document.addEventListener("click", onDocClick);
    document.addEventListener("open-node-editor", onOpenNodeEditor as EventListener);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("open-node-editor", onOpenNodeEditor as EventListener);
    };
  }, []);

  const handleSave = (newValue: any) => {
    if (!editingNode) return;
    updateNodeValue(editingNode.path, newValue);
    setEditingNode(null);
  };

  const handleCancel = () => setEditingNode(null);

  return (
    <NodeEditModal
      isOpen={!!editingNode}
      nodePath={editingNode?.path || ""}
      currentValue={editingNode?.value}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default NodeEditorPortal;