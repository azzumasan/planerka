import type { TaskCategory, TaskPriority } from "@/lib/types";

export const CATEGORY_COLOR: Record<TaskCategory, string> = {
  work: "#8b7bff",
  health: "#f8567e",
  personal: "#34e0c4",
  finance: "#f5a83c",
  learning: "#5b8dff",
  other: "#565d75",
};

export const PRIORITY_COLOR: Record<TaskPriority, string> = {
  high: "#f8567e",
  medium: "#f5a83c",
  low: "#34e0c4",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: "высокий",
  medium: "средний",
  low: "низкий",
};
