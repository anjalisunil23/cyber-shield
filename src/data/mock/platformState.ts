import { useState, useEffect } from "react";
import {
  MOCK_EVIDENCE,
  MOCK_TASKS,
  MOCK_CASES,
  MockEvidence,
  MockTask,
  MockCase,
} from "./platform";

const EVIDENCE_KEY = "cybershield_mock_evidence_v1";
const TASKS_KEY = "cybershield_mock_tasks_v1";
const CASES_KEY = "cybershield_mock_cases_v1";

const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((l) => l());
}

export function getStoredEvidence(): MockEvidence[] {
  if (typeof window === "undefined") return MOCK_EVIDENCE;
  try {
    const raw = localStorage.getItem(EVIDENCE_KEY);
    return raw ? JSON.parse(raw) : MOCK_EVIDENCE;
  } catch {
    return MOCK_EVIDENCE;
  }
}

export function saveEvidence(list: MockEvidence[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(EVIDENCE_KEY, JSON.stringify(list));
  }
  notify();
}

export function addEvidenceItem(item: Omit<MockEvidence, "id"> & { id?: string }): MockEvidence {
  const list = getStoredEvidence();
  const newItem: MockEvidence = {
    id: item.id || `e_${Date.now()}`,
    name: item.name,
    type: item.type,
    size: item.size || "1.0 MB",
    caseNumber: item.caseNumber,
    uploadedBy: item.uploadedBy || "Superior Officer",
    uploadedAt: item.uploadedAt || new Date().toISOString().replace("T", " ").slice(0, 16),
    tags: item.tags || ["uploaded"],
    sha256:
      item.sha256 ||
      `${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`,
  };
  saveEvidence([newItem, ...list]);
  return newItem;
}

export function deleteEvidenceItem(id: string): boolean {
  const list = getStoredEvidence();
  const next = list.filter((e) => e.id !== id);
  saveEvidence(next);
  return next.length < list.length;
}

export function getStoredTasks(): (MockTask & { assignee?: string; priority?: string })[] {
  if (typeof window === "undefined") return MOCK_TASKS;
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : MOCK_TASKS;
  } catch {
    return MOCK_TASKS;
  }
}

export function saveTasks(list: (MockTask & { assignee?: string; priority?: string })[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TASKS_KEY, JSON.stringify(list));
  }
  notify();
}

export function addTaskItem(
  task: Omit<MockTask, "id"> & { id?: string; assignee?: string; priority?: string },
): MockTask {
  const list = getStoredTasks();
  const newTask: MockTask & { assignee?: string; priority?: string } = {
    id: task.id || `t_${Date.now()}`,
    title: task.title,
    due: task.due,
    status: task.status || "Open",
    caseNumber: task.caseNumber,
    assignee: task.assignee || "Alex Mercer",
    priority: task.priority || "High",
  };
  saveTasks([newTask, ...list]);
  return newTask;
}

export function deleteTaskItem(id: string): boolean {
  const list = getStoredTasks();
  const next = list.filter((t) => t.id !== id);
  saveTasks(next);
  return next.length < list.length;
}

export function getStoredCases(): MockCase[] {
  if (typeof window === "undefined") return MOCK_CASES;
  try {
    const raw = localStorage.getItem(CASES_KEY);
    return raw ? JSON.parse(raw) : MOCK_CASES;
  } catch {
    return MOCK_CASES;
  }
}

export function saveCases(list: MockCase[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CASES_KEY, JSON.stringify(list));
  }
  notify();
}

export function addCaseItem(item: Partial<MockCase> & { title: string }): MockCase {
  const list = getStoredCases();
  const newCase: MockCase = {
    id: item.id || `c_${Date.now()}`,
    caseNumber: item.caseNumber || `CS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    title: item.title,
    priority: item.priority || "Medium",
    status: item.status || "Open",
    assignee: item.assignee || "Unassigned",
    department: item.department || "Cybercrime",
    created: item.created || new Date().toISOString().slice(0, 10),
    updated: item.updated || new Date().toISOString().slice(0, 10),
    description: item.description || "",
  };
  saveCases([newCase, ...list]);
  return newCase;
}

export function assignCaseToInvestigator(caseId: string, assignee: string): boolean {
  const list = getStoredCases();
  const next = list.map((c) =>
    c.id === caseId || c.caseNumber === caseId ? { ...c, assignee } : c,
  );
  saveCases(next);
  return true;
}

export function useEvidenceList(): MockEvidence[] {
  const [data, setData] = useState<MockEvidence[]>(getStoredEvidence);
  useEffect(() => {
    const update = () => setData(getStoredEvidence());
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);
  return data;
}

export function useTaskList(): (MockTask & { assignee?: string; priority?: string })[] {
  const [data, setData] =
    useState<(MockTask & { assignee?: string; priority?: string })[]>(getStoredTasks);
  useEffect(() => {
    const update = () => setData(getStoredTasks());
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);
  return data;
}

export function useCaseList(): MockCase[] {
  const [data, setData] = useState<MockCase[]>(getStoredCases);
  useEffect(() => {
    const update = () => setData(getStoredCases());
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);
  return data;
}
