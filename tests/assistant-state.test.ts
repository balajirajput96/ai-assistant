import { describe, expect, it } from "vitest";

import { createInitialSnapshot, filterTasks, isApprovalRequired, taskProgress } from "../lib/assistant-state";
import type { AgentTask } from "../shared/assistant-types";

const task = (id: string, status: AgentTask["status"]): AgentTask => ({
  id,
  title: `Task ${id}`,
  summary: "Test task",
  status,
  riskLevel: "low",
  progress: taskProgress(status),
  source: "manual",
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
});

describe("assistant state helpers", () => {
  it("creates an isolated starter snapshot", () => {
    const first = createInitialSnapshot();
    const second = createInitialSnapshot();
    first.messages[0].content = "Changed locally";

    expect(second.messages[0].content).not.toBe("Changed locally");
    expect(first.workflows.length).toBeGreaterThan(0);
    expect(first.memory.length).toBeGreaterThan(0);
  });

  it("filters active, blocked, and completed tasks accurately", () => {
    const tasks = [task("queued", "queued"), task("running", "running"), task("blocked", "blocked"), task("done", "completed")];

    expect(filterTasks(tasks, "active").map((item) => item.id)).toEqual(["queued", "running"]);
    expect(filterTasks(tasks, "blocked").map((item) => item.id)).toEqual(["blocked"]);
    expect(filterTasks(tasks, "complete").map((item) => item.id)).toEqual(["done"]);
  });

  it("requires an approval gate for consequential categories", () => {
    expect(isApprovalRequired("low")).toBe(false);
    expect(isApprovalRequired("medium")).toBe(false);
    expect(isApprovalRequired("high")).toBe(true);
    expect(isApprovalRequired("destructive")).toBe(true);
    expect(isApprovalRequired("external_publish")).toBe(true);
    expect(isApprovalRequired("financial")).toBe(true);
  });

  it("maps task state to transparent local progress", () => {
    expect(taskProgress("queued")).toBe(0);
    expect(taskProgress("planning")).toBe(20);
    expect(taskProgress("running")).toBe(55);
    expect(taskProgress("completed")).toBe(100);
    expect(taskProgress("failed")).toBe(0);
  });
});
