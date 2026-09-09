import { useState, useEffect } from "react";
import {
  MOCK_EVIDENCE,
  MOCK_TASKS,
  MOCK_CASES,
  MOCK_NOTES,
  MockEvidence,
  MockTask,
  MockCase,
  MockNote,
} from "./platform";

const EVIDENCE_KEY = "cybershield_mock_evidence_v1";
const TASKS_KEY = "cybershield_mock_tasks_v1";
const CASES_KEY = "cybershield_mock_cases_v1";
const NOTES_KEY = "cybershield_mock_notes_v1";

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
    if (!raw) return MOCK_CASES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const map = new Map<string, MockCase>();
      // Standard cases first
      MOCK_CASES.forEach((mc) => map.set(mc.caseNumber, mc));
      // Stored user custom cases / updates
      parsed.forEach((pc: MockCase) => {
        if (pc.caseNumber) map.set(pc.caseNumber, { ...(map.get(pc.caseNumber) || {}), ...pc });
        else if (pc.id) map.set(pc.id, pc);
      });
      return Array.from(map.values());
    }
    return MOCK_CASES;
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

export function getStoredNotes(): MockNote[] {
  if (typeof window === "undefined") return MOCK_NOTES;
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return MOCK_NOTES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_NOTES;
  } catch {
    return MOCK_NOTES;
  }
}

export function saveNotes(list: MockNote[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(NOTES_KEY, JSON.stringify(list));
  }
  notify();
}

export function addNoteItem(
  note?: Partial<MockNote> & { title?: string; body?: string },
): MockNote {
  const list = getStoredNotes();
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${now.getFullYear()}`;

  const newNote: MockNote = {
    id: note?.id || `n_${Date.now()}`,
    title: note?.title || "Untitled Note",
    body: note?.body || "",
    caseNumber: note?.caseNumber || "CS-2026-0142",
    author: note?.author || "Alex Mercer",
    pinned: note?.pinned ?? false,
    updatedAt: note?.updatedAt || formattedDate,
    created: note?.created || formattedDate,
    tags: note?.tags || ["investigation"],
    status: note?.status || "Working",
  };
  saveNotes([newNote, ...list]);
  return newNote;
}

export function updateNoteItem(id: string, updates: Partial<MockNote>): MockNote | null {
  const list = getStoredNotes();
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${now.getFullYear()}`;

  let updatedNote: MockNote | null = null;
  const next = list.map((n) => {
    if (n.id === id) {
      updatedNote = {
        ...n,
        ...updates,
        updatedAt: updates.updatedAt || formattedDate,
      };
      return updatedNote;
    }
    return n;
  });

  if (updatedNote) {
    saveNotes(next);
  }
  return updatedNote;
}

export function deleteNoteItem(id: string): boolean {
  const list = getStoredNotes();
  const next = list.filter((n) => n.id !== id);
  saveNotes(next);
  return next.length < list.length;
}

export function duplicateNoteItem(id: string): MockNote | null {
  const list = getStoredNotes();
  const source = list.find((n) => n.id === id);
  if (!source) return null;

  const now = new Date();
  const formattedDate = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${now.getFullYear()}`;

  const copy: MockNote = {
    ...source,
    id: `n_${Date.now()}`,
    title: `${source.title} (Copy)`,
    pinned: false,
    updatedAt: formattedDate,
    created: formattedDate,
  };

  saveNotes([copy, ...list]);
  return copy;
}

export function togglePinNote(id: string): boolean {
  const list = getStoredNotes();
  const next = list.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
  saveNotes(next);
  return true;
}

export function useNotesList(): MockNote[] {
  const [data, setData] = useState<MockNote[]>(getStoredNotes);
  useEffect(() => {
    const update = () => setData(getStoredNotes());
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);
  return data;
}
