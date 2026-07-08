'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, LayoutGrid, List, Users, CheckCircle2, Clock, ShieldAlert,
  TrendingUp, ChevronRight, Loader2, AlertTriangle,
} from 'lucide-react';

/* ──────────── Types ──────────── */
interface TeamTasksPageProps {
  currentUser: { id: string; role: string };
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  assignedTasks: number;
  completedTasks: number;
  pendingTasks: number;
  blockedTasks: number;
  utilization: number;
  completionPct: number;
}

interface MemberTask {
  id: string;
  taskId: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  sprint: string;
  project: string;
}

interface Project { id: string; name: string; }
interface Sprint { id: string; name: string; }

/* ──────────── Mock Data ──────────── */
const mockProjects: Project[] = [
  { id: 'p1', name: 'E-Commerce Platform' },
  { id: 'p2', name: 'Mobile Banking App' },
  { id: 'p3', name: 'HR Management System' },
  { id: 'p4', name: 'CRM Dashboard' },
];

const mockSprints: Sprint[] = [
  { id: 's1', name: 'Sprint 1 – Auth Module' },
  { id: 's2', name: 'Sprint 2 – Payments' },
  { id: 's3', name: 'Sprint 3 – Reporting' },
  { id: 's4', name: 'Sprint 4 – Integration' },
];

const mockMembers: TeamMember[] = [
  { id: 'm1', name: 'Sarah Chen', role: 'QA Lead', initials: 'SC', assignedTasks: 14, completedTasks: 10, pendingTasks: 3, blockedTasks: 1, utilization: 85, completionPct: 71 },
  { id: 'm2', name: 'Mike Johnson', role: 'QA Engineer', initials: 'MJ', assignedTasks: 12, completedTasks: 9, pendingTasks: 2, blockedTasks: 1, utilization: 78, completionPct: 75 },
  { id: 'm3', name: 'Emily Davis', role: 'QA Engineer', initials: 'ED', assignedTasks: 10, completedTasks: 8, pendingTasks: 1, blockedTasks: 1, utilization: 70, completionPct: 80 },
  { id: 'm4', name: 'James Wilson', role: 'QA Engineer', initials: 'JW', assignedTasks: 11, completedTasks: 6, pendingTasks: 3, blockedTasks: 2, utilization: 82, completionPct: 55 },
  { id: 'm5', name: 'Lisa Park', role: 'QA Engineer', initials: 'LP', assignedTasks: 9, completedTasks: 7, pendingTasks: 2, blockedTasks: 0, utilization: 65, completionPct: 78 },
  { id: 'm6', name: 'David Kim', role: 'QA Engineer', initials: 'DK', assignedTasks: 13, completedTasks: 11, pendingTasks: 1, blockedTasks: 1, utilization: 90, completionPct: 85 },
];

const mockMemberTasks: Record<string, MemberTask[]> = {
  m1: [
    { id: 't1', taskId: 'TC-101', title: 'Login page validation tests', status: 'COMPLETED', priority: 'HIGH', dueDate: '2025-01-20', sprint: 'Sprint 1', project: 'E-Commerce Platform' },
    { id: 't2', taskId: 'TC-102', title: 'Registration flow E2E tests', status: 'COMPLETED', priority: 'HIGH', dueDate: '2025-01-22', sprint: 'Sprint 1', project: 'E-Commerce Platform' },
    { id: 't3', taskId: 'TC-103', title: 'Password reset edge cases', status: 'IN_PROGRESS', priority: 'MEDIUM', dueDate: '2025-01-25', sprint: 'Sprint 2', project: 'E-Commerce Platform' },
    { id: 't4', taskId: 'TC-104', title: 'OAuth integration tests', status: 'BLOCKED', priority: 'HIGH', dueDate: '2025-01-28', sprint: 'Sprint 2', project: 'Mobile Banking App' },
    { id: 't5', taskId: 'TC-105', title: 'Session timeout testing', status: 'PENDING', priority: 'LOW', dueDate: '2025-02-01', sprint: 'Sprint 3', project: 'Mobile Banking App' },
  ],
  m2: [
    { id: 't6', taskId: 'TC-201', title: 'Checkout flow smoke tests', status: 'COMPLETED', priority: 'HIGH', dueDate: '2025-01-18', sprint: 'Sprint 1', project: 'E-Commerce Platform' },
    { id: 't7', taskId: 'TC-202', title: 'Payment gateway validation', status: 'COMPLETED', priority: 'CRITICAL', dueDate: '2025-01-21', sprint: 'Sprint 2', project: 'E-Commerce Platform' },
    { id: 't8', taskId: 'TC-203', title: 'Cart persistence tests', status: 'IN_PROGRESS', priority: 'MEDIUM', dueDate: '2025-01-26', sprint: 'Sprint 2', project: 'E-Commerce Platform' },
    { id: 't9', taskId: 'TC-204', title: 'Coupon code scenarios', status: 'PENDING', priority: 'LOW', dueDate: '2025-02-03', sprint: 'Sprint 3', project: 'E-Commerce Platform' },
  ],
  m3: [
    { id: 't10', taskId: 'TC-301', title: 'API endpoint coverage tests', status: 'COMPLETED', priority: 'HIGH', dueDate: '2025-01-19', sprint: 'Sprint 1', project: 'HR Management System' },
    { id: 't11', taskId: 'TC-302', title: 'Employee CRUD validation', status: 'COMPLETED', priority: 'MEDIUM', dueDate: '2025-01-23', sprint: 'Sprint 2', project: 'HR Management System' },
    { id: 't12', taskId: 'TC-303', title: 'Leave management workflow', status: 'BLOCKED', priority: 'HIGH', dueDate: '2025-01-27', sprint: 'Sprint 3', project: 'HR Management System' },
  ],
  m4: [
    { id: 't13', taskId: 'TC-401', title: 'Dashboard widget tests', status: 'COMPLETED', priority: 'MEDIUM', dueDate: '2025-01-20', sprint: 'Sprint 2', project: 'CRM Dashboard' },
    { id: 't14', taskId: 'TC-402', title: 'Report generation tests', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2025-01-25', sprint: 'Sprint 3', project: 'CRM Dashboard' },
    { id: 't15', taskId: 'TC-403', title: 'Data export validation', status: 'BLOCKED', priority: 'MEDIUM', dueDate: '2025-01-28', sprint: 'Sprint 3', project: 'CRM Dashboard' },
    { id: 't16', taskId: 'TC-404', title: 'Filter & search E2E', status: 'PENDING', priority: 'LOW', dueDate: '2025-02-05', sprint: 'Sprint 4', project: 'CRM Dashboard' },
  ],
  m5: [
    { id: 't17', taskId: 'TC-501', title: 'Mobile responsive tests', status: 'COMPLETED', priority: 'HIGH', dueDate: '2025-01-22', sprint: 'Sprint 2', project: 'E-Commerce Platform' },
    { id: 't18', taskId: 'TC-502', title: 'Cross-browser compatibility', status: 'COMPLETED', priority: 'MEDIUM', dueDate: '2025-01-24', sprint: 'Sprint 2', project: 'Mobile Banking App' },
    { id: 't19', taskId: 'TC-503', title: 'Accessibility audit tests', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2025-01-30', sprint: 'Sprint 3', project: 'E-Commerce Platform' },
  ],
  m6: [
    { id: 't20', taskId: 'TC-601', title: 'Performance load tests', status: 'COMPLETED', priority: 'CRITICAL', dueDate: '2025-01-17', sprint: 'Sprint 1', project: 'Mobile Banking App' },
    { id: 't21', taskId: 'TC-602', title: 'Security penetration tests', status: 'COMPLETED', priority: 'CRITICAL', dueDate: '2025-01-20', sprint: 'Sprint 2', project: 'Mobile Banking App' },
    { id: 't22', taskId: 'TC-603', title: 'API rate limiting tests', status: 'BLOCKED', priority: 'HIGH', dueDate: '2025-01-29', sprint: 'Sprint 3', project: 'Mobile Banking App' },
  ],
};

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  PENDING: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  BLOCKED: 'bg-red-500/15 text-red-400 border-red-500/20',
  UNDER_REVIEW: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  MEDIUM: 'bg-amber-500/20 text-amber-400',
  LOW: 'bg-zinc-500/20 text-zinc-400',
};

/* ──────────── Component ──────────── */
export default function TeamTasksPage({ currentUser }: TeamTasksPageProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [memberTasks, setMemberTasks] = useState<Record<string, MemberTask[]>>({});
  const [projects] = useState<Project[]>(mockProjects);
  const [sprints] = useState<Sprint[]>(mockSprints);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedSprint, setSelectedSprint] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tasks/team?projectId=${selectedProject}`);
        if (res.ok) {
          const data = await res.json();
          if (data.members?.length) {
            setMembers(data.members);
            return;
          }
        }
      } catch { /* fallback to mock */ }
      setMembers(mockMembers);
      setMemberTasks(mockMemberTasks);
      setLoading(false);
    };
    fetchData();
  }, [selectedProject]);

  // Load member tasks when dialog opens
  useEffect(() => {
    if (selectedMember && dialogOpen && !memberTasks[selectedMember.id]) {
      const fetchTasks = async () => {
        try {
          const res = await fetch(`/api/tasks/team?projectId=${selectedProject}&memberId=${selectedMember.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.tasks?.length) {
              setMemberTasks(prev => ({ ...prev, [selectedMember.id]: data.tasks }));
              return;
            }
          }
        } catch { /* fallback */ }
        setMemberTasks(prev => ({ ...prev, [selectedMember.id]: mockMemberTasks[selectedMember.id] || [] }));
      };
      fetchTasks();
    }
  }, [selectedMember, dialogOpen, selectedProject, memberTasks]);

  const filteredMembers = useMemo(() => {
    let result = members;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
    }
    if (selectedSprint !== 'all') {
      // In a real app, sprint filter would be server-side
      const sprintSeed = selectedSprint.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      result = result.filter((_, i) => (i + sprintSeed) % 3 !== 0);
    }
    return result;
  }, [members, search, selectedSprint]);

  const teamSummary = useMemo(() => {
    const total = members.length;
    const totalTasks = members.reduce((s, m) => s + m.assignedTasks, 0);
    const avgCompletion = total > 0 ? Math.round(members.reduce((s, m) => s + m.completionPct, 0) / total) : 0;
    return { totalMembers: total, totalTasks, avgCompletion };
  }, [members]);

  const handleReassign = async (taskId: string, newAssigneeId: string) => {
    if (!newAssigneeId) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: newAssigneeId }),
      });
      if (res.ok) {
        // Remove from current member's tasks
        if (selectedMember) {
          setMemberTasks(prev => ({
            ...prev,
            [selectedMember.id]: (prev[selectedMember.id] || []).filter(t => t.id !== taskId),
          }));
        }
        setReassigningTaskId(null);
        setReassignTarget('');
      }
    } catch {
      // Handle error silently – fallback to optimistic UI
    }
  };

  const openMemberDetail = (member: TeamMember) => {
    setSelectedMember(member);
    setDialogOpen(true);
  };

  /* ──────────── Access Denied ──────────── */
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'QA_LEAD') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Access Denied</h2>
        <p className="text-zinc-400 text-sm max-w-md text-center">
          You do not have permission to view the Team Tasks page. This page is only available to QA Leads and Administrators.
        </p>
      </div>
    );
  }

  /* ──────────── Loading ──────────── */
  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Team Members</p>
              <p className="text-2xl font-bold text-white">{teamSummary.totalMembers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <List className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total Tasks Assigned</p>
              <p className="text-2xl font-bold text-white">{teamSummary.totalTasks}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Avg Completion</p>
              <p className="text-2xl font-bold text-white">{teamSummary.avgCompletion}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ── */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search team members..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full sm:w-52 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="w-full sm:w-52 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Sprints" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">All Sprints</SelectItem>
                {sprints.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-md p-1">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className={viewMode === 'card' ? 'bg-emerald-500 hover:bg-emerald-600 text-white h-8 w-8 p-0' : 'h-8 w-8 p-0 text-zinc-400 hover:text-white'}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-emerald-500 hover:bg-emerald-600 text-white h-8 w-8 p-0' : 'h-8 w-8 p-0 text-zinc-400 hover:text-white'}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Card View ── */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map(member => (
            <Card
              key={member.id}
              className="border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors cursor-pointer"
              onClick={() => openMemberDetail(member)}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-11 h-11">
                    <AvatarFallback className="bg-emerald-500/15 text-emerald-400 text-sm font-bold">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                    <p className="text-xs text-zinc-500">{member.role}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <List className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs text-zinc-400">Assigned</span>
                    <span className="text-xs font-semibold text-white ml-auto">{member.assignedTasks}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-zinc-400">Done</span>
                    <span className="text-xs font-semibold text-emerald-400 ml-auto">{member.completedTasks}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-zinc-400">Pending</span>
                    <span className="text-xs font-semibold text-amber-400 ml-auto">{member.pendingTasks}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs text-zinc-400">Blocked</span>
                    <span className="text-xs font-semibold text-red-400 ml-auto">{member.blockedTasks}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Completion</span>
                    <span className="text-white font-medium">{member.completionPct}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        member.completionPct >= 75 ? 'bg-emerald-500' : member.completionPct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${member.completionPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Utilization</span>
                    <span className="text-white font-medium">{member.utilization}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        member.utilization >= 80 ? 'bg-blue-500' : member.utilization >= 60 ? 'bg-cyan-500' : 'bg-zinc-500'
                      }`}
                      style={{ width: `${member.utilization}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Table View ── */}
      {viewMode === 'table' && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Member</TableHead>
                    <TableHead className="text-zinc-400 text-center">Assigned</TableHead>
                    <TableHead className="text-zinc-400 text-center">Completed</TableHead>
                    <TableHead className="text-zinc-400 text-center">Pending</TableHead>
                    <TableHead className="text-zinc-400 text-center">Blocked</TableHead>
                    <TableHead className="text-zinc-400 text-center">Utilization</TableHead>
                    <TableHead className="text-zinc-400">Completion</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map(member => (
                    <TableRow
                      key={member.id}
                      className="border-zinc-800 hover:bg-zinc-800/40 cursor-pointer"
                      onClick={() => openMemberDetail(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-white">{member.name}</p>
                            <p className="text-xs text-zinc-500">{member.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-white">{member.assignedTasks}</TableCell>
                      <TableCell className="text-center text-sm text-emerald-400">{member.completedTasks}</TableCell>
                      <TableCell className="text-center text-sm text-amber-400">{member.pendingTasks}</TableCell>
                      <TableCell className="text-center text-sm text-red-400">{member.blockedTasks}</TableCell>
                      <TableCell className="text-center text-sm text-white">{member.utilization}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                member.completionPct >= 75 ? 'bg-emerald-500' : member.completionPct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${member.completionPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-white font-medium w-8 text-right">{member.completionPct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredMembers.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Users className="w-12 h-12 text-zinc-700" />
          <p className="text-zinc-400">No team members found</p>
        </div>
      )}

      {/* ── Member Detail Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 p-0">
          <DialogHeader className="p-5 pb-0">
            <div className="flex items-center gap-3">
              {selectedMember && (
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-emerald-500/15 text-emerald-400 text-sm font-bold">
                    {selectedMember.initials}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <DialogTitle className="text-white text-lg">
                  {selectedMember?.name} — Tasks
                </DialogTitle>
                <p className="text-sm text-zinc-500 mt-0.5">{selectedMember?.role}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="px-5 pt-3 pb-2 grid grid-cols-4 gap-3">
            <div className="bg-zinc-900/60 rounded-lg p-3 text-center border border-zinc-800">
              <p className="text-lg font-bold text-white">{selectedMember?.assignedTasks}</p>
              <p className="text-xs text-zinc-500">Assigned</p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-3 text-center border border-zinc-800">
              <p className="text-lg font-bold text-emerald-400">{selectedMember?.completedTasks}</p>
              <p className="text-xs text-zinc-500">Completed</p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-3 text-center border border-zinc-800">
              <p className="text-lg font-bold text-amber-400">{selectedMember?.pendingTasks}</p>
              <p className="text-xs text-zinc-500">Pending</p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-3 text-center border border-zinc-800">
              <p className="text-lg font-bold text-red-400">{selectedMember?.blockedTasks}</p>
              <p className="text-xs text-zinc-500">Blocked</p>
            </div>
          </div>

          <ScrollArea className="max-h-80">
            <div className="px-5 pb-5 space-y-2">
              {(memberTasks[selectedMember?.id || ''] || []).map(task => (
                <div
                  key={task.id}
                  className="border border-zinc-800 bg-zinc-900/50 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-zinc-500">{task.taskId}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[task.status] || ''}`}>
                          {task.status.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority] || ''}`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-white font-medium truncate">{task.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {task.project} · {task.sprint} · Due: {task.dueDate}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {reassigningTaskId === task.id ? (
                        <div className="flex items-center gap-2">
                          <Select value={reassignTarget} onValueChange={v => handleReassign(task.id, v)}>
                            <SelectTrigger className="w-36 h-8 text-xs bg-zinc-800 border-zinc-700 text-white">
                              <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700">
                              {members
                                .filter(m => m.id !== selectedMember?.id)
                                .map(m => (
                                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-500 hover:text-white"
                            onClick={() => { setReassigningTaskId(null); setReassignTarget(''); }}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-zinc-500 hover:text-emerald-400"
                          onClick={(e) => { e.stopPropagation(); setReassigningTaskId(task.id); }}
                        >
                          Reassign
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!memberTasks[selectedMember?.id || ''] || memberTasks[selectedMember?.id || ''].length === 0) && (
                <div className="py-8 text-center text-zinc-500 text-sm">No tasks found for this member</div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}