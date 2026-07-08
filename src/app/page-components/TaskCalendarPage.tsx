'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft, ChevronRight, CalendarDays, CalendarRange,
  Clock, Filter, X, ListTodo, AlertCircle,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays, isSameDay, isSameMonth, isToday, getDay, parseISO,
} from 'date-fns';

/* ─── Types ─── */
interface TaskCalendarPageProps {
  currentUser: { id: string; role: string };
  onViewTask: (taskId: string) => void;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  startTime?: string;
  endTime?: string;
  project?: string;
  assignee?: string;
  assigneeName?: string;
  timeSpent?: number;
}

type ViewMode = 'day' | 'week' | 'month';

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const PRIORITY_DOT: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-emerald-500',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i);

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  return `${h}:00 ${i < 12 ? 'AM' : 'PM'}`;
});

export default function TaskCalendarPage({ currentUser, onViewTask }: TaskCalendarPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    project: 'all',
    status: 'all',
    priority: 'all',
    assignee: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  /* ─── Date range for API ─── */
  const dateRange = useMemo(() => {
    let start: Date;
    let end: Date;
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      start = startOfWeek(monthStart, { weekStartsOn: 0 });
      end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 0 });
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
    } else {
      start = currentDate;
      end = addDays(currentDate, 0);
    }
    return { start, end };
  }, [currentDate, viewMode]);

  /* ─── Fetch tasks ─── */
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          startDate: format(dateRange.start, 'yyyy-MM-dd'),
          dueDate: format(dateRange.end, 'yyyy-MM-dd'),
        });
        if (filters.project !== 'all') params.set('project', filters.project);
        if (filters.status !== 'all') params.set('status', filters.status);
        if (filters.priority !== 'all') params.set('priority', filters.priority);
        if (filters.assignee !== 'all') params.set('assignee', filters.assignee);

        const res = await fetch(`/api/tasks?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTasks(Array.isArray(data) ? data : data.tasks ?? []);
        }
      } catch {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [dateRange.start, dateRange.end, filters]);

  /* ─── Filtered tasks ─── */
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
      if (filters.status !== 'all' && t.status !== filters.status) return false;
      return true;
    });
  }, [tasks, filters]);

  /* ─── Navigation ─── */
  const navigatePrev = useCallback(() => {
    if (viewMode === 'month') setCurrentDate(d => subMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => subWeeks(d, 1));
    else setCurrentDate(d => subDays(d, 1));
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    if (viewMode === 'month') setCurrentDate(d => addMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => addWeeks(d, 1));
    else setCurrentDate(d => addDays(d, 1));
  }, [viewMode]);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  /* ─── Tasks for a specific date ─── */
  const getTasksForDate = useCallback(
    (date: Date) => filteredTasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), date)),
    [filteredTasks]
  );

  /* ─── Selected date tasks ─── */
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  /* ─── Monthly grid days ─── */
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  /* ─── Week days ─── */
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [currentDate]);

  /* ─── Header label ─── */
  const headerLabel = useMemo(() => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = addDays(start, 6);
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
      }
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  }, [currentDate, viewMode]);

  /* ─── Render: Month View ─── */
  const renderMonthView = () => (
    <div className="flex-1 grid grid-cols-7 border border-zinc-800 rounded-lg overflow-hidden">
      {DAY_NAMES.map(d => (
        <div key={d} className="bg-zinc-800/60 px-2 py-2.5 text-center text-xs font-semibold text-zinc-400 border-b border-zinc-800">
          {d}
        </div>
      ))}
      {monthDays.map(day => {
        const dayTasks = getTasksForDate(day);
        const inMonth = isSameMonth(day, currentDate);
        const today = isToday(day);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        return (
          <div
            key={day.toISOString()}
            onClick={() => setSelectedDate(day)}
            className={`min-h-[110px] p-1.5 border-b border-r border-zinc-800/60 cursor-pointer transition-colors hover:bg-zinc-800/40 ${
              !inMonth ? 'bg-zinc-950/40' : ''
            } ${isSelected ? 'bg-emerald-500/5 ring-1 ring-emerald-500/30' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                  today
                    ? 'bg-emerald-500 text-white'
                    : inMonth
                    ? 'text-zinc-300'
                    : 'text-zinc-600'
                }`}
              >
                {format(day, 'd')}
              </span>
              {dayTasks.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-zinc-700 text-zinc-300 border-0">
                  {dayTasks.length}
                </Badge>
              )}
            </div>
            <div className="space-y-0.5">
              {dayTasks.slice(0, 3).map(task => (
                <div
                  key={task.id}
                  onClick={e => { e.stopPropagation(); onViewTask(task.id); }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-zinc-300 hover:bg-zinc-700/50 truncate cursor-pointer transition-colors"
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-zinc-500'}`} />
                  <span className="truncate">{task.title}</span>
                </div>
              ))}
              {dayTasks.length > 3 && (
                <span className="text-[10px] text-zinc-500 pl-3">+{dayTasks.length - 3} more</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ─── Render: Week View ─── */
  const renderWeekView = () => (
    <div className="flex-1 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="grid grid-cols-8 border-b border-zinc-800">
        <div className="bg-zinc-800/60 px-2 py-2.5 text-xs text-zinc-500 text-center border-r border-zinc-800">Time</div>
        {weekDays.map(day => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`bg-zinc-800/60 px-2 py-2.5 text-center border-r border-zinc-800 last:border-r-0 cursor-pointer hover:bg-zinc-800/80 ${today ? 'bg-emerald-500/10' : ''}`}
            >
              <div className={`text-[10px] font-medium ${today ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {format(day, 'EEE')}
              </div>
              <div className={`text-sm font-bold ${today ? 'text-emerald-400' : 'text-zinc-200'}`}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-340px)]">
        {TIME_SLOTS.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-zinc-800/40 min-h-[48px]">
            <div className="px-2 py-1 text-[10px] text-zinc-500 border-r border-zinc-800/40 flex items-start pt-2">
              {HOURS[hour]}
            </div>
            {weekDays.map(day => {
              const dayTasks = getTasksForDate(day).filter(t => {
                if (!t.startTime) return hour === 9;
                const h = parseInt(t.startTime.split(':')[0], 10);
                return h === hour;
              });
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className="border-r border-zinc-800/40 last:border-r-0 p-0.5 cursor-pointer hover:bg-zinc-800/20"
                >
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={e => { e.stopPropagation(); onViewTask(task.id); }}
                      className={`px-1.5 py-1 rounded text-[10px] mb-0.5 cursor-pointer transition-colors border ${
                        PRIORITY_COLORS[task.priority] || 'bg-zinc-700/50 text-zinc-300 border-zinc-600'
                      }`}
                    >
                      <span className="font-medium">{task.title}</span>
                      {task.startTime && (
                        <span className="block text-[9px] opacity-70">{task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Render: Day View ─── */
  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const tasksByTime = TIME_SLOTS.map(hour => ({
      hour,
      tasks: dayTasks.filter(t => {
        if (!t.startTime) return hour === 9;
        return parseInt(t.startTime.split(':')[0], 10) === hour;
      }),
    }));

    return (
      <div className="flex-1 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="bg-zinc-800/60 px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{format(currentDate, 'EEEE')}</div>
            <div className="text-xs text-zinc-400">{format(currentDate, 'MMMM d, yyyy')}</div>
          </div>
          <Badge variant="secondary" className="ml-auto bg-zinc-700 text-zinc-300 border-0">
            {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-360px)]">
          {tasksByTime.map(({ hour, tasks }) => (
            <div key={hour} className="grid grid-cols-[80px_1fr] border-b border-zinc-800/40 min-h-[56px]">
              <div className="px-3 py-2 text-xs text-zinc-500 border-r border-zinc-800/40 flex items-start pt-3">
                {HOURS[hour]}
              </div>
              <div className="p-1.5">
                {tasks.length === 0 ? (
                  <div className="h-full min-h-[40px] border border-dashed border-zinc-800 rounded-md" />
                ) : (
                  tasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => onViewTask(task.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-colors border ${
                        PRIORITY_COLORS[task.priority] || 'bg-zinc-700/30 text-zinc-300 border-zinc-600'
                      } hover:brightness-125`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-zinc-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{task.title}</div>
                        <div className="text-[11px] opacity-70 flex items-center gap-2">
                          {task.startTime && <span>{task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}</span>}
                          {task.project && <span>· {task.project}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5 border-current/20 bg-transparent shrink-0">
                        {task.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ─── Side Panel ─── */
  const renderSidePanel = () => {
    if (!selectedDate) return null;
    return (
      <Card className="w-72 shrink-0 border-zinc-800 bg-zinc-900/50 flex flex-col h-fit max-h-[calc(100vh-240px)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEE, MMM d')}
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white" onClick={() => setSelectedDate(null)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <Separator className="bg-zinc-800" />
        <CardContent className="p-0 flex-1">
          {selectedDateTasks.length === 0 ? (
            <div className="p-4 text-center">
              <ListTodo className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No tasks for this day</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-340px)]">
              <div className="p-2 space-y-1.5">
                {selectedDateTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onViewTask(task.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:brightness-125 ${
                      PRIORITY_COLORS[task.priority] || 'bg-zinc-800/50 border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-zinc-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{task.title}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {task.startTime && <span className="mr-2">{task.startTime}</span>}
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-current/20 bg-transparent">
                            {task.status}
                          </Badge>
                        </div>
                        {task.project && (
                          <div className="text-[10px] text-zinc-500 mt-1">{task.project}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* View Toggle */}
        <div className="flex items-center bg-zinc-800/60 rounded-lg p-0.5 border border-zinc-700/50">
          {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-emerald-500 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={navigatePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-zinc-400 hover:text-white" onClick={goToToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={navigateNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold text-white ml-1 min-w-[180px]">{headerLabel}</span>
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          className={`ml-auto h-8 text-xs border-zinc-700 ${showFilters ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          onClick={() => setShowFilters(f => !f)}
        >
          <Filter className="w-3.5 h-3.5 mr-1.5" />
          Filters
        </Button>
      </div>

      {/* Filters Row */}
      {showFilters && (
        <Card className="mb-4 border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={filters.project} onValueChange={v => setFilters(f => ({ ...f, project: v }))}>
                <SelectTrigger className="w-36 h-8 bg-zinc-800 border-zinc-700 text-white text-xs">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all" className="text-zinc-300">All Projects</SelectItem>
                  <SelectItem value="project-1" className="text-zinc-300">Website Redesign</SelectItem>
                  <SelectItem value="project-2" className="text-zinc-300">Mobile App</SelectItem>
                  <SelectItem value="project-3" className="text-zinc-300">API Platform</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
                <SelectTrigger className="w-36 h-8 bg-zinc-800 border-zinc-700 text-white text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all" className="text-zinc-300">All Status</SelectItem>
                  <SelectItem value="TODO" className="text-zinc-300">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS" className="text-zinc-300">In Progress</SelectItem>
                  <SelectItem value="DONE" className="text-zinc-300">Done</SelectItem>
                  <SelectItem value="BLOCKED" className="text-zinc-300">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.priority} onValueChange={v => setFilters(f => ({ ...f, priority: v }))}>
                <SelectTrigger className="w-36 h-8 bg-zinc-800 border-zinc-700 text-white text-xs">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all" className="text-zinc-300">All Priority</SelectItem>
                  <SelectItem value="HIGH" className="text-zinc-300">High</SelectItem>
                  <SelectItem value="MEDIUM" className="text-zinc-300">Medium</SelectItem>
                  <SelectItem value="LOW" className="text-zinc-300">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.assignee} onValueChange={v => setFilters(f => ({ ...f, assignee: v }))}>
                <SelectTrigger className="w-36 h-8 bg-zinc-800 border-zinc-700 text-white text-xs">
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all" className="text-zinc-300">All Assignees</SelectItem>
                  <SelectItem value="user-1" className="text-zinc-300">John Smith</SelectItem>
                  <SelectItem value="user-2" className="text-zinc-300">Sarah Chen</SelectItem>
                  <SelectItem value="user-3" className="text-zinc-300">Mike Johnson</SelectItem>
                </SelectContent>
              </Select>
              {(filters.project !== 'all' || filters.status !== 'all' || filters.priority !== 'all' || filters.assignee !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-zinc-400 hover:text-white"
                  onClick={() => setFilters({ project: 'all', status: 'all', priority: 'all', assignee: 'all' })}
                >
                  <X className="w-3 h-3 mr-1" />Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar + Side Panel */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'day' && renderDayView()}
            </>
          )}
        </div>
        {selectedDate && viewMode !== 'day' && renderSidePanel()}
      </div>
    </div>
  );
}