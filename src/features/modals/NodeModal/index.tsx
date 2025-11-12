import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { Textarea, Button } from "@mantine/core";
import { useState, useCallback, useEffect } from "react";
import { useJson } from "../../../store/useJson";

// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const json = useJson(state => state.json);
  const updateNodeValue = useJson(state => state.updateNodeValue);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState<string>(() => normalizeNodeData(nodeData?.text ?? []));
  const [displayedNodeData, setDisplayedNodeData] = useState<NodeData | null>(nodeData);

  // keep editText in sync when nodeData changes or when modal opens
  React.useEffect(() => {
    setEditText(normalizeNodeData(nodeData?.text ?? []));
    setIsEditing(false);
    setDisplayedNodeData(nodeData);
  }, [nodeData?.text, opened, json]);

  // When saving, immediately update the displayed node data by re-fetching from current JSON
  const handleSave = useCallback(() => {
    let parsed: any = null;
    try {
      const trimmed = editText.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        parsed = JSON.parse(editText);
      } else if (trimmed === "true") parsed = true;
      else if (trimmed === "false") parsed = false;
      else if (trimmed === "null") parsed = null;
      else if (trimmed !== "" && !Number.isNaN(Number(trimmed))) parsed = Number(trimmed);
      else parsed = trimmed;

      // build accessor path string from nodeData.path
      const accessor = (nodeData?.path || []).map((seg: any, idx: number) => (typeof seg === 'number' ? `[${seg}]` : (idx === 0 ? `${seg}` : `.${seg}`))).join('');
      if (accessor) {
        updateNodeValue(accessor, parsed);
        // Force update displayedNodeData after save to show new values immediately
        setEditText(trimmed);
      }
      setIsEditing(false);
    } catch (err) {
      // if parse failed show an alert (could be improved)
      if (err instanceof Error) alert(err.message);
    }
  }, [editText, nodeData?.path, updateNodeValue]);

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <CloseButton onClick={onClose} />
          </Flex>
          <ScrollArea.Autosize mah={250} maw={600}>
            {!isEditing ? (
              <CodeHighlight
                code={normalizeNodeData(displayedNodeData?.text ?? [])}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            ) : (
              <Textarea
                minRows={6}
                value={editText}
                onChange={e => setEditText(e.currentTarget.value)}
                placeholder="Edit JSON content"
                styles={{
                  input: {
                    fontFamily: "monospace",
                    fontSize: 12,
                    minWidth: 350,
                  },
                }}
              />
            )}
          </ScrollArea.Autosize>
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(displayedNodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>

        {/* Edit / Save / Cancel controls */}
        <Flex justify="flex-end" gap="sm" mt="md">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <>
              <Button variant="default" onClick={() => {
                // cancel edit
                setEditText(normalizeNodeData(displayedNodeData?.text ?? []));
                setIsEditing(false);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </>
          )}
        </Flex>
      </Stack>
    </Modal>
  );
};
