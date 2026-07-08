'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';
import {
  Calendar, CheckCircle2, Clock, ListTodo, AlertTriangle,
  AlertCircle, Flag, PieChartIcon, TrendingUp, BarChart3,
  Activity,
} from 'lucide-react';

/* ──────────── Types ──────────── */
interface DashboardSummary {
  todayTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  completionPercentage: number;
}

interface StatusDistribution {
  name: string;
  value: number;
}

interface WeeklyProgress {
  day: string;
  completed: number;
  created: number;
}

interface PriorityDistribution {
  name: string;
  value: number;
}

interface SprintProgress {
  date: string;
  completed: number;
  created: number;
  remaining: number;
}

interface DashboardData {
  summary: DashboardSummary;
  statusDistribution: StatusDistribution[];
  weeklyProgress: WeeklyProgress[];
  priorityDistribution: PriorityDistribution[];
  sprintProgress: SprintProgress[];
}

interface TaskDashboardPageProps {
  currentUser: { id: string; role: string };
}

/* ──────────── Color Constants ──────────── */
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#22c55e',
  IN_PROGRESS: '#3b82f6',
  BLOCKED: '#ef4444',
  TO_DO: '#71717a',
  UNDER_REVIEW: '#f59e0b',
  TESTING: '#a855f7',
  READY: '#3b82f6',
  WAITING_FOR_BUILD: '#f97316',
  WAITING_FOR_ENVIRONMENT: '#f97316',
  WAITING_FOR_DEPENDENCY: '#f97316',
  CANCELLED: '#52525b',
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};

const TOOLTIP_STYLE = {
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: '8px',
  color: '#e4e4e7',
};

const AXIS_STROKE = '#71717a';
const AXIS_TICK = { fontSize: 12, fill: '#a1a1aa' };
const GRID_STROKE = '#27272a';

/* ──────────── Component ──────────── */
export default function TaskDashboardPage({ currentUser }: TaskDashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tasks/dashboard?userId=${currentUser.id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silent fallback — charts will show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [currentUser.id]);

  /* ─── Summary Cards Config ─── */
  const summaryCards = [
    { label: "Today's Tasks", value: data?.summary.todayTasks ?? 0, icon: Calendar, bg: 'bg-emerald-500/15', color: 'text-emerald-400' },
    { label: 'Completed', value: data?.summary.completedTasks ?? 0, icon: CheckCircle2, bg: 'bg-emerald-500/15', color: 'text-emerald-400' },
    { label: 'In Progress', value: data?.summary.inProgressTasks ?? 0, icon: Clock, bg: 'bg-blue-500/15', color: 'text-blue-400' },
    { label: 'Pending', value: data?.summary.pendingTasks ?? 0, icon: ListTodo, bg: 'bg-amber-500/15', color: 'text-amber-400' },
    { label: 'Blocked', value: data?.summary.blockedTasks ?? 0, icon: AlertTriangle, bg: 'bg-red-500/15', color: 'text-red-400' },
    { label: 'Overdue', value: data?.summary.overdueTasks ?? 0, icon: AlertCircle, bg: 'bg-red-500/15', color: 'text-red-400' },
    { label: 'High Priority', value: data?.summary.highPriorityTasks ?? 0, icon: Flag, bg: 'bg-orange-500/15', color: 'text-orange-400' },
    {
      label: 'Completion %',
      value: `${data?.summary.completionPercentage ?? 0}%`,
      icon: PieChartIcon,
      bg: 'bg-emerald-500/15',
      color: 'text-emerald-400',
      isProgress: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-zinc-800 bg-zinc-900/50 rounded-xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${card.bg} shrink-0`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500 truncate">{card.label}</p>
                {loading ? (
                  <Skeleton className="h-7 w-16 mt-1 bg-zinc-800" />
                ) : (
                  <p className="text-xl font-bold text-white">{card.value}</p>
                )}
                {card.isProgress && !loading && (
                  <Progress
                    value={data?.summary.completionPercentage ?? 0}
                    className="mt-2 h-1.5 bg-zinc-800"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Charts Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Task Status Distribution (Donut) */}
        <Card className="border-zinc-800 bg-zinc-900/50 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              Task Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-64 w-64 rounded-full bg-zinc-800" />
                </div>
              ) : mounted && data?.statusDistribution?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }: { name: string; percent: number }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {data.statusDistribution.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name] || '#52525b'}
                        />
                      ))}
                    </Pie>
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }}
                    />
                    <RTooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                  No status data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Weekly Progress (BarChart) */}
        <Card className="border-zinc-800 bg-zinc-900/50 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full bg-zinc-800" />
                  ))}
                </div>
              ) : mounted && data?.weeklyProgress?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.weeklyProgress} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis
                      dataKey="day"
                      stroke={AXIS_STROKE}
                      tick={AXIS_TICK}
                    />
                    <YAxis stroke={AXIS_STROKE} tick={AXIS_TICK} />
                    <RTooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="created" name="Created" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                  No weekly data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Priority Distribution (PieChart) */}
        <Card className="border-zinc-800 bg-zinc-900/50 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Flag className="h-5 w-5 text-emerald-500" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-64 w-64 rounded-full bg-zinc-800" />
                </div>
              ) : mounted && data?.priorityDistribution?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.priorityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }: { name: string; percent: number }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {data.priorityDistribution.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PRIORITY_COLORS[entry.name] || '#52525b'}
                        />
                      ))}
                    </Pie>
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }}
                    />
                    <RTooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                  No priority data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4. Sprint / Monthly Progress (AreaChart) */}
        <Card className="border-zinc-800 bg-zinc-900/50 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Sprint Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full bg-zinc-800" />
                  ))}
                </div>
              ) : mounted && data?.sprintProgress?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.sprintProgress}>
                    <defs>
                      <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis
                      dataKey="date"
                      stroke={AXIS_STROKE}
                      tick={AXIS_TICK}
                      tickFormatter={(val: string) => {
                        try {
                          return format(new Date(val), 'MMM dd');
                        } catch {
                          return val;
                        }
                      }}
                    />
                    <YAxis stroke={AXIS_STROKE} tick={AXIS_TICK} />
                    <RTooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#gradCompleted)"
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      name="Created"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#gradCreated)"
                    />
                    <Area
                      type="monotone"
                      dataKey="remaining"
                      name="Remaining"
                      stroke="#71717a"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="none"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                  No sprint data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}