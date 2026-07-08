'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import {
  Search, Plus, SlidersHorizontal, ChevronLeft, ChevronRight,
  Eye, MessageSquare, Timer, CheckCircle2, MoreHorizontal,
  ChevronDown, ArrowUpDown, X, CalendarIcon, Filter,
} from 'lucide-react';

/* ──────────── Types ──────────── */
interface Task {
  id: string;
  taskId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  projectId: string;
  assignedToId: string;
  dueDate: string;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
  project?: { name: string };
}

interface MyTasksPageProps {
  currentUser: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  onCreateTask: () => void;
  onViewTask: (taskId: string) => void;
}

/* ──────────── Constants ──────────── */
const STATUS_COLORS: Record<string, string> = {
  TO_DO: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  READY: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  UNDER_REVIEW: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  TESTING: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  WAITING_FOR_BUILD: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  WAITING_FOR_ENVIRONMENT: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  WAITING_FOR_DEPENDENCY: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  BLOCKED: 'bg-red-500/15 text-red-400 border-red-500/20',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-500/15 text-red-400 border-red-500/20',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

const STATUS_OPTIONS = [
  'TO_DO', 'READY', 'IN_PROGRESS', 'UNDER_REVIEW', 'TESTING',
  'WAITING_FOR_BUILD', 'WAITING_FOR_ENVIRONMENT', 'WAITING_FOR_DEPENDENCY',
  'BLOCKED', 'COMPLETED', 'CANCELLED',
];

const PRIORITY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW'];

const CATEGORY_OPTIONS = ['Development', 'Testing', 'Design', 'Documentation', 'DevOps', 'Research', 'Bug Fix', 'Feature', 'Other'];

const SORT_OPTIONS = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Created Date' },
] as const;

const STATUS_ORDER: Record<string, number> = {
  BLOCKED: 0,
  IN_PROGRESS: 1,
  UNDER_REVIEW: 2,
  TESTING: 3,
  WAITING_FOR_BUILD: 4,
  WAITING_FOR_ENVIRONMENT: 5,
  WAITING_FOR_DEPENDENCY: 6,
  TO_DO: 7,
  READY: 8,
  COMPLETED: 9,
  CANCELLED: 10,
};

const PRIORITY_ORDER: Record<string, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

const ITEMS_PER_PAGE = 10;

/* ──────────── Helpers ──────────── */
function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM dd, yyyy');
  } catch {
    return dateStr;
  }
}

function isOverdue(dueDate: string, status: string): boolean {
  if (!dueDate || status === 'COMPLETED' || status === 'CANCELLED') return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

/* ──────────── Component ──────────── */
export default function MyTasksPage({ currentUser, onCreateTask, onViewTask }: MyTasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filter / Sort / Search state */
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  /* Pagination state */
  const [currentPage, setCurrentPage] = useState(1);

  /* ─── Fetch tasks ─── */
  const fetchTasks = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ assignedToId: currentUser.id });
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  /* ─── Reset page on filter/search change ─── */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPriority, filterCategory, filterProject, dateFrom, dateTo, sortBy, sortDir]);

  /* ─── Client-side filtering, searching, sorting ─── */
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.taskId?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    // Filter: Status
    if (filterStatus !== 'ALL') {
      result = result.filter((t) => t.status === filterStatus);
    }

    // Filter: Priority
    if (filterPriority !== 'ALL') {
      result = result.filter((t) => t.priority === filterPriority);
    }

    // Filter: Category
    if (filterCategory !== 'ALL') {
      result = result.filter((t) => t.category === filterCategory);
    }

    // Filter: Project
    if (filterProject !== 'ALL') {
      result = result.filter((t) => t.projectId === filterProject);
    }

    // Filter: Date range
    if (dateFrom) {
      result = result.filter((t) => t.dueDate && new Date(t.dueDate) >= dateFrom);
    }
    if (dateTo) {
      const toDateEnd = new Date(dateTo);
      toDateEnd.setHours(23, 59, 59, 999);
      result = result.filter((t) => t.dueDate && new Date(t.dueDate) <= toDateEnd);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'dueDate':
          cmp = (a.dueDate || '').localeCompare(b.dueDate || '');
          break;
        case 'priority':
          cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
          break;
        case 'status':
          cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
          break;
        case 'createdAt':
          cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tasks, searchQuery, filterStatus, filterPriority, filterCategory, filterProject, dateFrom, dateTo, sortBy, sortDir]);

  /* ─── Pagination ─── */
  const totalPages = Math.max(1, Math.ceil(processedTasks.length / ITEMS_PER_PAGE));
  const paginatedTasks = processedTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const showingStart = processedTasks.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const showingEnd = Math.min(currentPage * ITEMS_PER_PAGE, processedTasks.length);

  /* ─── Active filter count ─── */
  const activeFilterCount = [
    filterStatus !== 'ALL',
    filterPriority !== 'ALL',
    filterCategory !== 'ALL',
    filterProject !== 'ALL',
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterStatus('ALL');
    setFilterPriority('ALL');
    setFilterCategory('ALL');
    setFilterProject('ALL');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  /* ─── Quick status update ─── */
  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch {
      // silent
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    await handleStatusUpdate(taskId, 'COMPLETED');
  };

  /* ─── Sort toggle ─── */
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  /* ─── Status transition options ─── */
  const getNextStatuses = (current: string): string[] => {
    switch (current) {
      case 'TO_DO': return ['READY', 'IN_PROGRESS', 'CANCELLED'];
      case 'READY': return ['IN_PROGRESS', 'CANCELLED'];
      case 'IN_PROGRESS': return ['UNDER_REVIEW', 'TESTING', 'BLOCKED'];
      case 'UNDER_REVIEW': return ['IN_PROGRESS', 'TESTING', 'COMPLETED'];
      case 'TESTING': return ['IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'BLOCKED'];
      case 'WAITING_FOR_BUILD': return ['IN_PROGRESS', 'BLOCKED', 'CANCELLED'];
      case 'WAITING_FOR_ENVIRONMENT': return ['IN_PROGRESS', 'BLOCKED', 'CANCELLED'];
      case 'WAITING_FOR_DEPENDENCY': return ['IN_PROGRESS', 'BLOCKED', 'CANCELLED'];
      case 'BLOCKED': return ['IN_PROGRESS', 'CANCELLED'];
      case 'COMPLETED': return ['IN_PROGRESS'];
      case 'CANCELLED': return ['TO_DO'];
      default: return [];
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search by title, task ID, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters((v) => !v)}
            className={`border-zinc-700 text-zinc-300 shrink-0 relative ${showFilters ? 'bg-zinc-700' : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
        <Button
          onClick={onCreateTask}
          className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* ─── Filter Panel ─── */}
      {showFilters && (
        <Card className="border-zinc-800 bg-zinc-900/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Filter className="h-4 w-4 text-zinc-400" />
                Filters
              </h3>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-zinc-400 hover:text-white text-xs h-auto p-1"
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* Status */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority */}
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Project */}
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="ALL">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm justify-start font-normal w-full h-9"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                    {dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'From Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    className="bg-zinc-900 text-zinc-300"
                  />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm justify-start font-normal w-full h-9"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                    {dateTo ? format(dateTo, 'MMM dd, yyyy') : 'To Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    className="bg-zinc-900 text-zinc-300"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Sort Bar ─── */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-zinc-500">Sort by:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleSort(opt.value)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              sortBy === opt.value
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-300 border border-transparent hover:border-zinc-700'
            }`}
          >
            {opt.label}
            {sortBy === opt.value && (
              <ArrowUpDown className="h-3 w-3" />
            )}
            {sortBy !== opt.value && (
              <ChevronDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ))}
      </div>

      {/* ─── Task Table ─── */}
      <Card className="border-zinc-800 bg-zinc-900/50 rounded-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-zinc-800 rounded-lg" />
              ))}
            </div>
          ) : processedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <Search className="h-10 w-10 mb-3 text-zinc-700" />
              <p className="text-sm font-medium">No tasks found</p>
              <p className="text-xs text-zinc-600 mt-1">
                {searchQuery || activeFilterCount > 0
                  ? 'Try adjusting your search or filters'
                  : 'Create a new task to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 text-xs font-medium">Task ID</TableHead>
                    <TableHead className="text-zinc-400 text-xs font-medium">Title</TableHead>
                    <TableHead className="text-zinc-400 text-xs font-medium">Status</TableHead>
                    <TableHead className="text-zinc-400 text-xs font-medium">Priority</TableHead>
                    <TableHead className="text-zinc-400 text-xs font-medium">Category</TableHead>
                    <TableHead className="text-zinc-400 text-xs font-medium">Due Date</TableHead>
                    <TableHead className="text-zinc-400 text-xs font-medium text-right">Est. Hours</TableHead>
                    <TableHead className="text-zinc-400 text-xs font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((task) => {
                    const nextStatuses = getNextStatuses(task.status);
                    const overdue = isOverdue(task.dueDate, task.status);
                    return (
                      <TableRow
                        key={task.id}
                        className="border-zinc-800 hover:bg-zinc-800/40 cursor-pointer transition-colors"
                        onClick={() => onViewTask(task.id)}
                      >
                        <TableCell className="text-zinc-400 text-xs font-mono whitespace-nowrap">
                          {task.taskId || '—'}
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          <p className="text-sm text-white font-medium truncate">{task.title}</p>
                          {task.project?.name && (
                            <p className="text-xs text-zinc-500 truncate">{task.project.name}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[task.status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'}`}
                          >
                            {formatStatus(task.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[task.priority] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'}`}
                          >
                            {task.priority || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-300 text-xs whitespace-nowrap">
                          {task.category || '—'}
                        </TableCell>
                        <TableCell className={`text-xs whitespace-nowrap ${overdue ? 'text-red-400 font-medium' : 'text-zinc-300'}`}>
                          {formatDate(task.dueDate)}
                          {overdue && ' (Overdue)'}
                        </TableCell>
                        <TableCell className="text-zinc-300 text-xs text-right">
                          {task.estimatedHours != null ? `${task.estimatedHours}h` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Mark Complete (only if not already) */}
                            {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleMarkComplete(task.id)}
                                className="p-1.5 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                                title="Mark Complete"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}

                            {/* View Details */}
                            <button
                              onClick={() => onViewTask(task.id)}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Add Comment */}
                            <button
                              className="p-1.5 rounded-md text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                              title="Add Comment"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>

                            {/* Track Time */}
                            <button
                              className="p-1.5 rounded-md text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 transition-colors"
                              title="Track Time"
                            >
                              <Timer className="h-4 w-4" />
                            </button>

                            {/* Status Update Dropdown */}
                            {nextStatuses.length > 0 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                    title="Update Status"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700 w-48">
                                  {nextStatuses.map((s) => (
                                    <DropdownMenuItem
                                      key={s}
                                      onClick={() => handleStatusUpdate(task.id, s)}
                                      className="text-zinc-300 focus:bg-zinc-800 focus:text-white text-xs"
                                    >
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] px-1.5 py-0 mr-2 ${STATUS_COLORS[s] || ''}`}
                                      >
                                        {formatStatus(s)}
                                      </Badge>
                                      {formatStatus(s)}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Pagination ─── */}
      {!loading && processedTasks.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-500">
            Showing <span className="text-zinc-300">{showingStart}</span>–<span className="text-zinc-300">{showingEnd}</span> of{' '}
            <span className="text-zinc-300">{processedTasks.length}</span> tasks
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-zinc-700 text-zinc-300 h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                  acc.push('ellipsis');
                }
                acc.push(page);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="px-1 text-zinc-600">...</span>
                ) : (
                  <Button
                    key={item}
                    variant={item === currentPage ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setCurrentPage(item)}
                    className={
                      item === currentPage
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white h-8 w-8'
                        : 'border-zinc-700 text-zinc-300 h-8 w-8'
                    }
                  >
                    {item}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-zinc-700 text-zinc-300 h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}