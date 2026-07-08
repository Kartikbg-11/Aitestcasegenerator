'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Loader2, GripVertical, Calendar, Layers,
  Filter, X,
} from 'lucide-react';
import {
  DndContext, closestCorners, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';

/* ──────────── Types ──────────── */
interface SprintTasksPageProps {
  currentUser: { id: string; role: string };
}

type TaskStatus = 'TO_DO' | 'READY' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'TESTING' | 'BLOCKED' | 'COMPLETED';

interface Task {
  id: string;
  taskId: string;
  title: string;
  status: TaskStatus;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignee: string;
  assigneeInitials: string;
  dueDate: string;
  storyPoints: number;
  category: string;
  sprint: string;
  projectId: string;
}

interface Project { id: string; name: string; }

/* ──────────── Constants ──────────── */
const COLUMNS: { id: TaskStatus; label: string; color: string; bg: string }[] = [
  { id: 'TO_DO',        label: 'To Do',        color: 'border-t-zinc-500',       bg: 'bg-zinc-500/5' },
  { id: 'READY',        label: 'Ready',        color: 'border-t-blue-500',       bg: 'bg-blue-500/5' },
  { id: 'IN_PROGRESS',  label: 'In Progress',  color: 'border-t-blue-500',       bg: 'bg-blue-500/5' },
  { id: 'UNDER_REVIEW', label: 'Under Review', color: 'border-t-amber-500',      bg: 'bg-amber-500/5' },
  { id: 'TESTING',      label: 'Testing',      color: 'border-t-purple-500',     bg: 'bg-purple-500/5' },
  { id: 'BLOCKED',      label: 'Blocked',      color: 'border-t-red-500',        bg: 'bg-red-500/5' },
  { id: 'COMPLETED',    label: 'Completed',    color: 'border-t-emerald-500',    bg: 'bg-emerald-500/5' },
];

const priorityStyles: Record<string, string> = {
  CRITICAL: 'bg-red-500 text-white text-[10px] font-bold',
  HIGH:     'bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px]',
  MEDIUM:   'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]',
  LOW:      'bg-zinc-600/30 text-zinc-400 border border-zinc-600/30 text-[10px]',
};

/* ──────────── Mock Data ──────────── */
const mockProjects: Project[] = [
  { id: 'p1', name: 'E-Commerce Platform' },
  { id: 'p2', name: 'Mobile Banking App' },
  { id: 'p3', name: 'HR Management System' },
];

const mockTasks: Task[] = [
  { id: 'k1', taskId: 'TC-101', title: 'Login page validation tests', status: 'COMPLETED', priority: 'HIGH', assignee: 'Sarah Chen', assigneeInitials: 'SC', dueDate: '2025-01-20', storyPoints: 3, category: 'Functional', sprint: 'Sprint 1', projectId: 'p1' },
  { id: 'k2', taskId: 'TC-102', title: 'Registration flow E2E tests', status: 'COMPLETED', priority: 'HIGH', assignee: 'Mike Johnson', assigneeInitials: 'MJ', dueDate: '2025-01-22', storyPoints: 5, category: 'E2E', sprint: 'Sprint 1', projectId: 'p1' },
  { id: 'k3', taskId: 'TC-103', title: 'Password reset edge cases', status: 'TESTING', priority: 'MEDIUM', assignee: 'Emily Davis', assigneeInitials: 'ED', dueDate: '2025-01-25', storyPoints: 3, category: 'Functional', sprint: 'Sprint 2', projectId: 'p1' },
  { id: 'k4', taskId: 'TC-104', title: 'OAuth integration tests', status: 'BLOCKED', priority: 'HIGH', assignee: 'Sarah Chen', assigneeInitials: 'SC', dueDate: '2025-01-28', storyPoints: 8, category: 'Integration', sprint: 'Sprint 2', projectId: 'p2' },
  { id: 'k5', taskId: 'TC-105', title: 'Session timeout testing', status: 'TO_DO', priority: 'LOW', assignee: 'James Wilson', assigneeInitials: 'JW', dueDate: '2025-02-01', storyPoints: 2, category: 'Functional', sprint: 'Sprint 3', projectId: 'p2' },
  { id: 'k6', taskId: 'TC-106', title: 'Checkout flow smoke tests', status: 'UNDER_REVIEW', priority: 'CRITICAL', assignee: 'Mike Johnson', assigneeInitials: 'MJ', dueDate: '2025-01-26', storyPoints: 5, category: 'Smoke', sprint: 'Sprint 2', projectId: 'p1' },
  { id: 'k7', taskId: 'TC-107', title: 'Payment gateway validation', status: 'IN_PROGRESS', priority: 'CRITICAL', assignee: 'David Kim', assigneeInitials: 'DK', dueDate: '2025-01-27', storyPoints: 8, category: 'Integration', sprint: 'Sprint 2', projectId: 'p1' },
  { id: 'k8', taskId: 'TC-108', title: 'Cart persistence tests', status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: 'Lisa Park', assigneeInitials: 'LP', dueDate: '2025-01-28', storyPoints: 3, category: 'Functional', sprint: 'Sprint 2', projectId: 'p1' },
  { id: 'k9', taskId: 'TC-109', title: 'Coupon code scenarios', status: 'READY', priority: 'LOW', assignee: 'James Wilson', assigneeInitials: 'JW', dueDate: '2025-02-03', storyPoints: 2, category: 'Functional', sprint: 'Sprint 3', projectId: 'p1' },
  { id: 'k10', taskId: 'TC-110', title: 'API endpoint coverage tests', status: 'COMPLETED', priority: 'HIGH', assignee: 'Emily Davis', assigneeInitials: 'ED', dueDate: '2025-01-19', storyPoints: 5, category: 'API', sprint: 'Sprint 1', projectId: 'p3' },
  { id: 'k11', taskId: 'TC-111', title: 'Employee CRUD validation', status: 'TESTING', priority: 'MEDIUM', assignee: 'Emily Davis', assigneeInitials: 'ED', dueDate: '2025-01-23', storyPoints: 3, category: 'API', sprint: 'Sprint 2', projectId: 'p3' },
  { id: 'k12', taskId: 'TC-112', title: 'Leave management workflow', status: 'BLOCKED', priority: 'HIGH', assignee: 'James Wilson', assigneeInitials: 'JW', dueDate: '2025-01-27', storyPoints: 5, category: 'E2E', sprint: 'Sprint 3', projectId: 'p3' },
  { id: 'k13', taskId: 'TC-113', title: 'Dashboard widget tests', status: 'TO_DO', priority: 'MEDIUM', assignee: 'Lisa Park', assigneeInitials: 'LP', dueDate: '2025-02-05', storyPoints: 3, category: 'UI', sprint: 'Sprint 4', projectId: 'p1' },
  { id: 'k14', taskId: 'TC-114', title: 'Report generation tests', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'Sarah Chen', assigneeInitials: 'SC', dueDate: '2025-01-29', storyPoints: 5, category: 'E2E', sprint: 'Sprint 3', projectId: 'p1' },
  { id: 'k15', taskId: 'TC-115', title: 'Data export validation', status: 'READY', priority: 'MEDIUM', assignee: 'David Kim', assigneeInitials: 'DK', dueDate: '2025-02-04', storyPoints: 3, category: 'API', sprint: 'Sprint 4', projectId: 'p1' },
  { id: 'k16', taskId: 'TC-116', title: 'Mobile responsive tests', status: 'UNDER_REVIEW', priority: 'HIGH', assignee: 'Lisa Park', assigneeInitials: 'LP', dueDate: '2025-01-30', storyPoints: 3, category: 'UI', sprint: 'Sprint 3', projectId: 'p1' },
  { id: 'k17', taskId: 'TC-117', title: 'Cross-browser compatibility', status: 'TO_DO', priority: 'MEDIUM', assignee: 'Mike Johnson', assigneeInitials: 'MJ', dueDate: '2025-02-06', storyPoints: 5, category: 'UI', sprint: 'Sprint 4', projectId: 'p2' },
  { id: 'k18', taskId: 'TC-118', title: 'Performance load tests', status: 'COMPLETED', priority: 'CRITICAL', assignee: 'David Kim', assigneeInitials: 'DK', dueDate: '2025-01-17', storyPoints: 8, category: 'Performance', sprint: 'Sprint 1', projectId: 'p2' },
];

/* ──────────── Sortable Task Card ──────────── */
function SortableTaskCard({ task }: { task: Task }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id, data: { status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-zinc-800 bg-zinc-900/70 rounded-lg p-3 hover:border-zinc-700 transition-colors group"
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0 focus:outline-none"
          aria-label="Drag task"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header row */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500">{task.taskId}</span>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 leading-none ${priorityStyles[task.priority]}`}>
              {task.priority}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-zinc-500 border-zinc-700 ml-auto shrink-0">
              {task.category}
            </Badge>
          </div>

          {/* Title */}
          <p className="text-sm text-white font-medium leading-snug line-clamp-2">{task.title}</p>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="bg-emerald-500/15 text-emerald-400 text-[8px] font-bold">
                  {task.assigneeInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-zinc-400 truncate max-w-[80px]">{task.assignee.split(' ')[0]}</span>
            </div>
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <Layers className="w-3 h-3" />
              <span>{task.storyPoints}pt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────── Kanban Column ──────────── */
function KanbanColumn({ status, label, color, bg, tasks }: {
  status: TaskStatus; label: string; color: string; bg: string; tasks: Task[];
}) {
  return (
    <div className={`flex flex-col min-w-[280px] w-[280px] shrink-0 rounded-xl border-t-2 ${color} ${bg} border-x border-b border-zinc-800`}>
      {/* Column Header */}
      <div className="px-3 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">{label}</h3>
          <span className="w-6 h-6 rounded-full bg-zinc-800 text-xs text-zinc-400 flex items-center justify-center font-medium">
            {tasks.length}
          </span>
        </div>
        <span className="text-xs text-zinc-500">
          {tasks.reduce((s, t) => s + t.storyPoints, 0)} pts
        </span>
      </div>

      {/* Column Body */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="p-2 space-y-2 min-h-[80px]">
            {tasks.map(task => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <div className="py-6 text-center text-xs text-zinc-600">No tasks</div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

/* ──────────── Main Component ──────────── */
export default function SprintTasksPage({ currentUser }: SprintTasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allSprints, setAllSprints] = useState<string[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSprint !== 'all') params.set('sprint', selectedSprint);
        const res = await fetch(`/api/tasks?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tasks?.length) {
            setTasks(data.tasks);
            const sprints = [...new Set(data.tasks.map((t: Task) => t.sprint))].sort();
            setAllSprints(sprints);
            return;
          }
        }
      } catch { /* fallback */ }
      setTasks(mockTasks);
      const sprints = [...new Set(mockTasks.map(t => t.sprint))].sort();
      setAllSprints(sprints);
      setLoading(false);
    };
    fetchData();
  }, [selectedSprint]);

  const allAssignees = useMemo(
    () => [...new Set(tasks.map(t => t.assignee))].sort(),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedSprint !== 'all') {
      result = result.filter(t => t.sprint === selectedSprint);
    }
    if (selectedProject !== 'all') {
      result = result.filter(t => t.projectId === selectedProject);
    }
    if (selectedAssignee !== 'all') {
      result = result.filter(t => t.assignee === selectedAssignee);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.taskId.toLowerCase().includes(q) ||
          t.assignee.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tasks, selectedSprint, selectedProject, selectedAssignee, search]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      TO_DO: [], READY: [], IN_PROGRESS: [], UNDER_REVIEW: [], TESTING: [], BLOCKED: [], COMPLETED: [],
    };
    filteredTasks.forEach(t => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [filteredTasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    let newStatus: TaskStatus | undefined;

    // Check if dropped over a column (column id is the status)
    const column = COLUMNS.find(c => c.id === over.id);
    if (column) {
      newStatus = column.id;
    } else {
      // Dropped on another task — find which column that task is in
      const targetTask = tasks.find(t => t.id === over.id);
      if (targetTask) {
        newStatus = targetTask.status;
      }
    }

    if (!newStatus) return;

    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    // Optimistic update
    setUpdating(taskId);
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus! } : t)),
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Revert on error
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: currentTask.status } : t)),
      );
    } finally {
      setUpdating(null);
    }
  };

  const hasActiveFilters = selectedProject !== 'all' || selectedAssignee !== 'all' || search.trim() !== '';

  /* ──────────── Loading ──────────── */
  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Filters ── */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search tasks by title, ID, or assignee..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="w-full lg:w-48 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Sprints" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">All Sprints</SelectItem>
                {allSprints.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full lg:w-48 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">All Projects</SelectItem>
                {mockProjects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger className="w-full lg:w-44 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">All Assignees</SelectItem>
                {allAssignees.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-zinc-400 hover:text-white shrink-0"
                onClick={() => { setSelectedProject('all'); setSelectedAssignee('all'); setSearch(''); }}
              >
                <X className="w-4 h-4 mr-1" />Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Stats ── */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-zinc-400">
          <Filter className="w-4 h-4" />
          <span>
            Showing <span className="text-white font-medium">{filteredTasks.length}</span> of{' '}
            <span className="text-white font-medium">{tasks.length}</span> tasks
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />To Do
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />Review
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />Testing
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />Blocked
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />Done
          </span>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              status={col.id}
              label={col.label}
              color={col.color}
              bg={col.bg}
              tasks={tasksByStatus[col.id]}
            />
          ))}
        </div>
      </DndContext>

      {/* ── Updating indicator ── */}
      {updating && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-lg shadow-xl">
          <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
          Updating task status...
        </div>
      )}
    </div>
  );
}