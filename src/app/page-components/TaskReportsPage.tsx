'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FileSpreadsheet, FileText, Download, Calendar, Filter,
  TrendingUp, Clock, CheckCircle2, AlertTriangle, BarChart3,
  ArrowUpDown, Users,
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

/* ─── Types ─── */
type ReportType = 'daily' | 'weekly' | 'monthly' | 'sprint' | 'team';

interface ReportData {
  summary?: {
    completedToday?: number;
    createdToday?: number;
    overdue?: number;
    blocked?: number;
    totalCompleted?: number;
    avgCompletionTime?: number;
    totalHoursLogged?: number;
  };
  dailyTasks?: TaskRow[];
  weeklyBars?: { day: string; completed: number }[];
  monthlyTrend?: { date: string; completed: number }[];
  categoryDistribution?: { name: string; value: number; color: string }[];
  sprints?: { id: string; name: string }[];
  sprintProgress?: { completed: number; total: number; statuses: Record<string, number> };
  teamMembers?: TeamMember[];
}

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  timeSpent: number;
  assignee?: string;
  project?: string;
}

interface TeamMember {
  name: string;
  assigned: number;
  completed: number;
  inProgress: number;
  blocked: number;
  completionPct: number;
  avgHours: number;
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899'];

export default function TaskReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [projectFilter, setProjectFilter] = useState('all');
  const [sprintId, setSprintId] = useState('');
  const [data, setData] = useState<ReportData>({});
  const [loading, setLoading] = useState(true);
  const [teamSortKey, setTeamSortKey] = useState<keyof TeamMember>('completed');
  const [teamSortAsc, setTeamSortAsc] = useState(false);

  /* ─── Auto-set date ranges ─── */
  useEffect(() => {
    const today = new Date();
    if (reportType === 'daily') {
      setDateFrom(format(today, 'yyyy-MM-dd'));
      setDateTo(format(today, 'yyyy-MM-dd'));
    } else if (reportType === 'weekly') {
      setDateFrom(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setDateTo(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (reportType === 'monthly') {
      setDateFrom(format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'));
      setDateTo(format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd'));
    }
  }, [reportType]);

  /* ─── Fetch report data ─── */
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type: reportType, from: dateFrom, to: dateTo });
        if (projectFilter !== 'all') params.set('project', projectFilter);
        if (sprintId) params.set('sprintId', sprintId);
        const res = await fetch(`/api/tasks/reports?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        setData({});
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportType, dateFrom, dateTo, projectFilter, sprintId]);

  /* ─── Mock data for demo ─── */
  const mockWeeklyBars = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end: endOfWeek(new Date(), { weekStartsOn: 1 }) });
    return days.map(d => ({ day: format(d, 'EEE'), completed: Math.floor(Math.random() * 8) + 2 }));
  }, []);

  const mockMonthlyTrend = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(today, 29 - i), 'MMM d'),
      completed: Math.floor(Math.random() * 10) + 1,
    }));
  }, []);

  const mockCategories = [
    { name: 'Development', value: 35, color: PIE_COLORS[0] },
    { name: 'Design', value: 20, color: PIE_COLORS[1] },
    { name: 'Testing', value: 18, color: PIE_COLORS[2] },
    { name: 'Documentation', value: 12, color: PIE_COLORS[3] },
    { name: 'Bug Fix', value: 10, color: PIE_COLORS[4] },
    { name: 'DevOps', value: 5, color: PIE_COLORS[5] },
  ];

  const mockSprints = [
    { id: 'sprint-1', name: 'Sprint 23 — Core Features' },
    { id: 'sprint-2', name: 'Sprint 24 — UI Overhaul' },
    { id: 'sprint-3', name: 'Sprint 25 — Performance' },
  ];

  const mockSprintProgress = { completed: 18, total: 28, statuses: { DONE: 18, IN_PROGRESS: 6, TODO: 3, BLOCKED: 1 } };

  const mockTeam: TeamMember[] = [
    { name: 'John Smith', assigned: 24, completed: 18, inProgress: 4, blocked: 2, completionPct: 75, avgHours: 3.2 },
    { name: 'Sarah Chen', assigned: 20, completed: 16, inProgress: 3, blocked: 1, completionPct: 80, avgHours: 2.8 },
    { name: 'Mike Johnson', assigned: 18, completed: 14, inProgress: 2, blocked: 2, completionPct: 78, avgHours: 3.5 },
    { name: 'Lisa Park', assigned: 15, completed: 12, inProgress: 2, blocked: 1, completionPct: 80, avgHours: 2.5 },
    { name: 'Tom Wilson', assigned: 22, completed: 15, inProgress: 5, blocked: 2, completionPct: 68, avgHours: 4.1 },
  ];

  /* ─── Sorted team data ─── */
  const sortedTeam = useMemo(() => {
    return [...mockTeam].sort((a, b) => {
      const va = a[teamSortKey];
      const vb = b[teamSortKey];
      if (typeof va === 'number' && typeof vb === 'number') return teamSortAsc ? va - vb : vb - va;
      return teamSortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [teamSortKey, teamSortAsc]);

  /* ─── Export ─── */
  const handleExportCSV = () => {
    const rows = [['Task', 'Status', 'Priority', 'Time Spent (h)'].join(',')];
    const tasks = data.dailyTasks ?? [];
    tasks.forEach(t => rows.push([`"${t.title}"`, t.status, t.priority, String(t.timeSpent)].join(',')));
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-report-${reportType}-${dateFrom}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Chart tooltip style ─── */
  const tooltipStyle = {
    contentStyle: { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' },
    labelStyle: { color: '#fafafa' },
    itemStyle: { color: '#a1a1aa' },
  };

  /* ─── Status color helper ─── */
  const statusColor = (s: string) => {
    if (s === 'DONE') return 'text-emerald-400';
    if (s === 'IN_PROGRESS') return 'text-amber-400';
    if (s === 'BLOCKED') return 'text-red-400';
    return 'text-zinc-400';
  };

  /* ─── Render: Daily Report ─── */
  const renderDaily = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Completed Today', value: data.summary?.completedToday ?? 8, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Created Today', value: data.summary?.createdToday ?? 12, icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Overdue', value: data.summary?.overdue ?? 3, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Blocked', value: data.summary?.blocked ?? 2, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(s => (
          <Card key={s.label} className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${s.bg} p-2.5 rounded-xl`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white">Today&apos;s Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 text-xs">Task</TableHead>
                <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                <TableHead className="text-zinc-400 text-xs">Priority</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Time Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: '1', title: 'Implement user authentication', status: 'DONE', priority: 'HIGH', timeSpent: 4 },
                { id: '2', title: 'Design dashboard layout', status: 'IN_PROGRESS', priority: 'MEDIUM', timeSpent: 2.5 },
                { id: '3', title: 'Fix login redirect bug', status: 'BLOCKED', priority: 'HIGH', timeSpent: 1 },
                { id: '4', title: 'Write API documentation', status: 'TODO', priority: 'LOW', timeSpent: 0 },
                { id: '5', title: 'Setup CI/CD pipeline', status: 'IN_PROGRESS', priority: 'MEDIUM', timeSpent: 3 },
              ].map(t => (
                <TableRow key={t.id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell className="text-sm text-zinc-300 font-medium">{t.title}</TableCell>
                  <TableCell><span className={`text-xs font-medium ${statusColor(t.status)}`}>{t.status.replace('_', ' ')}</span></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] h-5 border-current/20 bg-transparent ${
                      t.priority === 'HIGH' ? 'text-red-400' : t.priority === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>{t.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400 text-right">{t.timeSpent}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  /* ─── Render: Weekly Report ─── */
  const renderWeekly = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{data.summary?.totalCompleted ?? 34}</p>
              <p className="text-xs text-zinc-500">Total Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-cyan-500/10 p-2.5 rounded-xl"><Clock className="w-5 h-5 text-cyan-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{data.summary?.avgCompletionTime ?? 2.4}h</p>
              <p className="text-xs text-zinc-500">Avg Completion Time</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-500/10 p-2.5 rounded-xl"><BarChart3 className="w-5 h-5 text-amber-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{data.summary?.totalHoursLogged ?? 68}h</p>
              <p className="text-xs text-zinc-500">Total Hours Logged</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white">Tasks Completed Per Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockWeeklyBars} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#3f3f46' }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#3f3f46' }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white">Weekly Task Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 text-xs">Day</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Completed</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Created</TableHead>
                <TableHead className="text-zinc-400 text-xs text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockWeeklyBars.map(d => (
                <TableRow key={d.day} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell className="text-sm text-zinc-300">{d.day}</TableCell>
                  <TableCell className="text-sm text-emerald-400 text-right font-medium">{d.completed}</TableCell>
                  <TableCell className="text-sm text-zinc-400 text-right">{Math.floor(Math.random() * 5) + 3}</TableCell>
                  <TableCell className="text-sm text-zinc-400 text-right">{(d.completed * (Math.random() * 2 + 1.5)).toFixed(1)}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  /* ─── Render: Monthly Report ─── */
  const renderMonthly = () => (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">142</p>
            <p className="text-xs text-zinc-500 mt-1">Total Completed</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">168</p>
            <p className="text-xs text-zinc-500 mt-1">Total Created</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">84.5%</p>
            <p className="text-xs text-zinc-500 mt-1">Completion Rate</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">2.6h</p>
            <p className="text-xs text-zinc-500 mt-1">Avg Time/Task</p>
          </CardContent>
        </Card>
      </div>

      {/* Area Chart */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white">Daily Task Completion Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMonthlyTrend}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} interval={4} axisLine={{ stroke: '#3f3f46' }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#3f3f46' }} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fill="url(#colorCompleted)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white">Task Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={3}
                  stroke="none"
                >
                  {mockCategories.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend
                  verticalAlign="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /* ─── Render: Sprint Report ─── */
  const renderSprint = () => {
    const pct = Math.round((mockSprintProgress.completed / mockSprintProgress.total) * 100);
    const statusEntries = Object.entries(mockSprintProgress.statuses);
    return (
      <div className="space-y-6">
        {/* Sprint Selector */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 flex items-center gap-4">
            <Select value={sprintId || 'sprint-2'} onValueChange={setSprintId}>
              <SelectTrigger className="w-64 h-9 bg-zinc-800 border-zinc-700 text-white text-sm">
                <SelectValue placeholder="Select Sprint" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {mockSprints.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-zinc-300">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Sprint Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">{mockSprintProgress.completed} of {mockSprintProgress.total} tasks completed</span>
              <span className="text-emerald-400 font-semibold">{pct}%</span>
            </div>
            <Progress value={pct} className="h-3 [&>div]:bg-emerald-500" />
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statusEntries.map(([status, count]) => {
                const colorMap: Record<string, string> = {
                  DONE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  TODO: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
                  BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/20',
                };
                return (
                  <div key={status} className={`p-3 rounded-lg border ${colorMap[status] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs mt-1">{status.replace('_', ' ')}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Team Contribution */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Team Member Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockTeam} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#3f3f46' }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={90} axisLine={{ stroke: '#3f3f46' }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="completed" fill="#10b981" radius={[0, 4, 4, 0]} name="Completed" />
                  <Bar dataKey="inProgress" fill="#f59e0b" radius={[0, 4, 4, 0]} name="In Progress" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /* ─── Render: Team Productivity ─── */
  const renderTeam = () => (
    <div className="space-y-6">
      {/* Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Team Productivity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 text-xs">Team Member</TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right cursor-pointer select-none" onClick={() => { setTeamSortKey('assigned'); setTeamSortAsc(!teamSortAsc); }}>
                    <span className="inline-flex items-center gap-1">Assigned <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right cursor-pointer select-none" onClick={() => { setTeamSortKey('completed'); setTeamSortAsc(!teamSortAsc); }}>
                    <span className="inline-flex items-center gap-1">Completed <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right">In Progress</TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right">Blocked</TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right cursor-pointer select-none" onClick={() => { setTeamSortKey('completionPct'); setTeamSortAsc(!teamSortAsc); }}>
                    <span className="inline-flex items-center gap-1">Completion % <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                  <TableHead className="text-zinc-400 text-xs text-right cursor-pointer select-none" onClick={() => { setTeamSortKey('avgHours'); setTeamSortAsc(!teamSortAsc); }}>
                    <span className="inline-flex items-center gap-1">Avg Hours/Task <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeam.map(m => (
                  <TableRow key={m.name} className="border-zinc-800 hover:bg-zinc-800/40">
                    <TableCell className="text-sm text-white font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm text-zinc-300 text-right">{m.assigned}</TableCell>
                    <TableCell className="text-sm text-emerald-400 text-right font-medium">{m.completed}</TableCell>
                    <TableCell className="text-sm text-amber-400 text-right">{m.inProgress}</TableCell>
                    <TableCell className="text-sm text-red-400 text-right">{m.blocked}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={m.completionPct} className="w-16 h-1.5 [&>div]:bg-emerald-500" />
                        <span className="text-xs text-zinc-300 w-10 text-right">{m.completionPct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400 text-right">{m.avgHours}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white">Team Member Productivity Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockTeam} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#3f3f46' }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#3f3f46' }} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                <Bar dataKey="assigned" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Assigned" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="inProgress" fill="#f59e0b" radius={[4, 4, 0, 0]} name="In Progress" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /* ─── Report type tabs ─── */
  const reportTypes: { value: ReportType; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'sprint', label: 'Sprint' },
    { value: 'team', label: 'Team Productivity' },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Report Type */}
            <div className="flex items-center bg-zinc-800/60 rounded-lg p-0.5 border border-zinc-700/50">
              {reportTypes.map(rt => (
                <button
                  key={rt.value}
                  onClick={() => setReportType(rt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    reportType === rt.value ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-36 h-8 bg-zinc-800 border-zinc-700 text-white text-xs"
              />
              <span className="text-xs text-zinc-500">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-36 h-8 bg-zinc-800 border-zinc-700 text-white text-xs"
              />
            </div>

            {/* Project Filter */}
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-40 h-8 bg-zinc-800 border-zinc-700 text-white text-xs">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all" className="text-zinc-300">All Projects</SelectItem>
                <SelectItem value="p1" className="text-zinc-300">Website Redesign</SelectItem>
                <SelectItem value="p2" className="text-zinc-300">Mobile App</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs border-zinc-700 text-zinc-400 hover:text-white" onClick={handleExportCSV}>
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs border-zinc-700 text-zinc-400 hover:text-white" onClick={handleExportCSV}>
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {reportType === 'daily' && renderDaily()}
          {reportType === 'weekly' && renderWeekly()}
          {reportType === 'monthly' && renderMonthly()}
          {reportType === 'sprint' && renderSprint()}
          {reportType === 'team' && renderTeam()}
        </>
      )}
    </div>
  );
}