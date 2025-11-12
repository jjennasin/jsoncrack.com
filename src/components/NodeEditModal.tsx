import React, { useEffect, useState } from "react";
import { Modal, TextInput, Group, Button } from "@mantine/core";

interface NodeEditModalProps {
  isOpen: boolean;
  nodePath: string;
  currentValue: any;
  onSave: (newValue: any) => void;
  onCancel: () => void;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({
  isOpen,
  nodePath,
  currentValue,
  onSave,
  onCancel,
}) => {
  const [editValue, setEditValue] = useState<string>(() =>
    currentValue === undefined || currentValue === null ? "" : String(currentValue)
  );

  useEffect(() => {
    setEditValue(currentValue === undefined || currentValue === null ? "" : String(currentValue));
  }, [currentValue, isOpen]);

  const handleSave = () => {
    let parsedValue: any = editValue;
    if (editValue === "true") parsedValue = true;
    else if (editValue === "false") parsedValue = false;
    else if (editValue === "null") parsedValue = null;
    else if (editValue.trim() === "") parsedValue = "";
    else if (!Number.isNaN(Number(editValue)) && editValue.trim() !== "") parsedValue = Number(editValue);

    onSave(parsedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    <Modal opened={isOpen} onClose={onCancel} title="Edit Node Value" centered>
      <div style={{ marginBottom: 12 }}>
        <strong>Path:</strong> <code>{nodePath}</code>
      </div>

      <TextInput
        label="New Value"
        placeholder="Enter new value"
        value={editValue}
        onChange={(e) => setEditValue(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <Button variant="light" onClick={onCancel} style={{ marginRight: 8 }}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </Modal>
  );
};

export default NodeEditModal;