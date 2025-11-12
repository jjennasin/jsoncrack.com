import React from "react";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import type { NodeData } from "../../../../../types/graph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";

type RowProps = {
  row: NodeData["text"][number];
  x: number;
  y: number;
  index: number;
};

const Row = ({ row, x, y, index }: RowProps) => {
  const rowPosition = index * NODE_DIMENSIONS.ROW_HEIGHT;

  const getRowText = () => {
    if (row.type === "object") return `{${row.childrenCount ?? 0} keys}`;
    if (row.type === "array") return `[${row.childrenCount ?? 0} items]`;
    return row.value;
  };

  return (
    <Styled.StyledRow
      $value={row.value}
      data-key={`${row.key}: ${row.value}`}
      data-x={x}
      data-y={y + rowPosition}
    >
      <Styled.StyledKey $type="object">{row.key}: </Styled.StyledKey>
      <TextRenderer>{getRowText()}</TextRenderer>
    </Styled.StyledRow>
  );
};

const Node = ({ node, x, y }: CustomNodeProps) => {
  // helper to convert path array to accessor string like a.b[0].c
  const pathToAccessor = (path?: any[]) => {
    if (!path || path.length === 0) return "";
    let acc = "";
    path.forEach((seg, idx) => {
      if (typeof seg === "number") acc += `[${seg}]`;
      else acc += idx === 0 ? `${seg}` : `.${seg}`;
    });
    return acc;
  };

  // normalize node rows into a value (object or single value)
  const normalizeNodeValue = (rows: typeof node.text) => {
    if (!rows || rows.length === 0) return null;
    if (rows.length === 1 && !rows[0].key) return rows[0].value;
    const obj: Record<string, any> = {};
    rows.forEach(r => {
      if (r.type !== "array" && r.type !== "object") {
        if (r.key) obj[r.key] = r.value;
      }
    });
    return obj;
  };

  const accessor = pathToAccessor((node as any).path as any[]);
  const value = normalizeNodeValue(node.text);

  return (
    <Styled.StyledForeignObject
      data-id={`node-${node.id}`}
      data-json-path={accessor}
      data-json-value={JSON.stringify(value)}
      width={node.width}
      height={node.height}
      x={0}
      y={0}
      $isObject
    >
      <div style={{ width: "100%", height: "100%", position: "relative", pointerEvents: "none" }}>
        {node.text.map((row, index) => (
          <Row key={`${node.id}-${index}`} row={row} x={x} y={y} index={index} />
        ))}
      </div>
    </Styled.StyledForeignObject>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return (
    JSON.stringify(prev.node.text) === JSON.stringify(next.node.text) &&
    prev.node.width === next.node.width
  );
}

export const ObjectNode = React.memo(Node, propsAreEqual);
