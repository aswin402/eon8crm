"use client";

import React from "react";
import { X } from "lucide-react";

export interface TaskFormData {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  assigneeId: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  projectName: string;
  taskForm: TaskFormData;
  setTaskForm: React.Dispatch<React.SetStateAction<TaskFormData>>;
  assignableStaff: Array<{ id: string; name: string }>;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  taskForm,
  setTaskForm,
  assignableStaff,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-card border border-border/80 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Assign Project Task</h3>
            <p className="text-[11px] text-muted-foreground">{projectName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement OAuth SSO Flow"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm({
                    ...taskForm,
                    priority: e.target.value as TaskFormData["priority"],
                  })
                }
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Assignee</label>
              <select
                value={taskForm.assigneeId}
                onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
              >
                <option value="">Unassigned</option>
                {assignableStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Target Due Date</label>
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground font-mono focus:outline-hidden focus:border-foreground/40 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Task Notes & Criteria</label>
            <textarea
              rows={2}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Acceptance criteria or implementation details..."
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-border/80 text-foreground hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium transition-colors shadow-2xs"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
