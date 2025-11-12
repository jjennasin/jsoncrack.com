import { create } from "zustand";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";
import useFile from "./useFile";

interface JsonActions {
  setJson: (json: string) => void;
  getJson: () => string;
  clear: () => void;
  updateNodeValue: (path: string, newValue: any) => void;
}

const initialStates = {
  json: "{}",
  loading: true,
};

export type JsonStates = typeof initialStates;

function pathToKeys(path: string) {
  if (!path) return [];
  return path.replace(/\]/g, "").split(/\.|\[/).filter(Boolean);
}

function setAtPath(obj: any, path: string, value: any) {
  const keys = pathToKeys(path);
  if (keys.length === 0) return;
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in cur) || cur[k] === null) {
      const nextKey = keys[i + 1];
      cur[k] = /^\d+$/.test(nextKey) ? [] : {};
    }
    cur = cur[k];
  }
  const lastKey = keys[keys.length - 1];
  cur[lastKey] = value;
}

// Deep merge: merge newValue into existing value while preserving nested properties
function deepMerge(existing: any, newValue: any): any {
  // If newValue is not an object, just replace
  if (typeof newValue !== "object" || newValue === null || Array.isArray(newValue)) {
    return newValue;
  }
  
  // If existing is not an object, just use newValue
  if (typeof existing !== "object" || existing === null || Array.isArray(existing)) {
    return newValue;
  }
  
  // Both are objects - merge them
  const result = { ...existing };
  for (const key in newValue) {
    if (newValue.hasOwnProperty(key)) {
      if (key in existing && typeof existing[key] === "object" && typeof newValue[key] === "object" && !Array.isArray(existing[key])) {
        // Recursively merge nested objects
        result[key] = deepMerge(existing[key], newValue[key]);
      } else {
        // Replace or add the property
        result[key] = newValue[key];
      }
    }
  }
  // Preserve properties that exist in existing but not in newValue
  for (const key in existing) {
    if (existing.hasOwnProperty(key) && !(key in newValue)) {
      result[key] = existing[key];
    }
  }
  return result;
}

export const useJson = create<JsonStates & JsonActions>()((set, get) => ({
  ...initialStates,
  getJson: () => get().json,
  setJson: (json: string) => {
    set({ json, loading: false });
    useGraph.getState().setGraph(json);
  },
  clear: () => {
    set({ json: "{}", loading: false });
    useGraph.getState().clearGraph();
  },
  updateNodeValue: (path: string, newValue: any) => {
    const currentJson = get().json;
    let parsed = JSON.parse(currentJson);
    
    // Get the existing value at this path to merge with
    const keys = pathToKeys(path);
    let existingValue: any = parsed;
    for (const key of keys) {
      existingValue = existingValue[key];
    }
    
    // If editing an object, merge new values with existing nested properties
    const valueToSet = (typeof newValue === "object" && newValue !== null && !Array.isArray(newValue) && typeof existingValue === "object" && !Array.isArray(existingValue))
      ? deepMerge(existingValue, newValue)
      : newValue;
    
    setAtPath(parsed, path, valueToSet);
    const updatedJson = JSON.stringify(parsed, null, 2);
    set({ json: updatedJson });
    // Use useFile to trigger normal update flow which preserves edges and node IDs
    useFile.getState().setContents({ contents: updatedJson, hasChanges: false, skipUpdate: false });
  },
}));

// add this line so both `import { useJson }` and `import useJson` work
export default useJson;