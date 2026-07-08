'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { Bug, Plus, Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Download, FileText, MessageSquare, History, Activity, AlertTriangle, CheckCircle2, Clock, RotateCcw, ArrowRight, TrendingUp, Send } from 'lucide-react';

type Defect = {
  id: string;
  defectId: string;
  title: string;
  description: string;
  severity: string;
  priority: string;
  status: string;
  module: string;
  environment: string;
  buildVersion: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  resolution: string;
  attachment: string;
  projectId: string;
  reportedById: string;
  assignedToId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { comments: number };
  project?: { name: string };
  reportedBy?: { firstName: string; lastName: string };
  assignedTo?: { firstName: string; lastName: string };
  comments?: Comment[];
  history?: HistoryEntry[];
};

type Comment = {
  id: string;
  comment: string;
  createdAt: string;
  userId: string;
  user?: { firstName: string; lastName: string };
};

type HistoryEntry = {
  id: string;
  action: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  userId: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
};

type Project = {
  id: string;
  name: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
};

type ReportData = {
  summary: {
    total: number;
    open: number;
    closed: number;
    critical: number;
    reopened: number;
    inProgress: number;
    retest: number;
  };
  severityDistribution: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  priorityDistribution: { name: string; value: number }[];
  trendData: { date: string; opened: number; closed: number }[];
  recentDefects: Defect[];
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/15 text-red-400',
  HIGH: 'bg-orange-500/15 text-orange-400',
  MEDIUM: 'bg-yellow-500/15 text-yellow-400',
  LOW: 'bg-green-500/15 text-green-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/15 text-red-400',
  HIGH: 'bg-orange-500/15 text-orange-400',
  MEDIUM: 'bg-yellow-500/15 text-yellow-400',
  LOW: 'bg-green-500/15 text-green-400',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500/15 text-blue-400',
  ASSIGNED: 'bg-cyan-500/15 text-cyan-400',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-400',
  FIXED: 'bg-emerald-500/15 text-emerald-400',
  RETEST: 'bg-purple-500/15 text-purple-400',
  REOPENED: 'bg-orange-500/15 text-orange-400',
  CLOSED: 'bg-green-500/15 text-green-400',
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ['ASSIGNED', 'IN_PROGRESS'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['FIXED'],
  FIXED: ['RETEST'],
  RETEST: ['CLOSED', 'REOPENED'],
  REOPENED: ['IN_PROGRESS'],
  CLOSED: ['REOPENED'],
};

const MODULE_OPTIONS = ['Login', 'Dashboard', 'API', 'Database', 'UI', 'Reports', 'Settings', 'Other'];
const SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PRIORITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUS_OPTIONS = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FIXED', 'RETEST', 'REOPENED', 'CLOSED'];
const ENVIRONMENT_OPTIONS = ['DEV', 'QA', 'STAGING', 'UAT', 'PRODUCTION'];

const SEVERITY_PIE_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const emptyDefectForm = {
  title: '',
  description: '',
  severity: '',
  priority: '',
  projectId: '',
  reportedById: '',
  assignedToId: '',
  module: '',
  environment: '',
  buildVersion: '',
  stepsToReproduce: '',
  expectedResult: '',
  actualResult: '',
  attachment: '',
  resolution: '',
};

function getInitials(firstName: string, lastName: string): string {
  return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'MMM dd, yyyy');
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateStr;
  }
}

export default function DefectsPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; firstName: string; lastName: string; role: string }>({
    id: 'cmqp0a8lg00bfq2td50zek40q',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
  });

  const [defects, setDefects] = useState<Defect[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [activeTab, setActiveTab] = useState('dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterModule, setFilterModule] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDefect, setEditingDefect] = useState<Defect | null>(null);
  const [viewingDefect, setViewingDefect] = useState<Defect | null>(null);
  const [deletingDefect, setDeletingDefect] = useState<Defect | null>(null);

  const [formData, setFormData] = useState(emptyDefectForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [commentText, setCommentText] = useState('');
  const [viewSubTab, setViewSubTab] = useState('details');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('currentUser');
    const user = stored
      ? JSON.parse(stored)
      : { id: 'cmqp0a8lg00bfq2td50zek40q', firstName: 'Admin', lastName: 'User', role: 'ADMIN' };
    setCurrentUser(user);
    setFormData((prev) => ({ ...prev, reportedById: user.id }));
  }, []);

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

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchDefects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterSeverity !== 'ALL') params.set('severity', filterSeverity);
      if (filterPriority !== 'ALL') params.set('priority', filterPriority);
      if (filterModule !== 'ALL') params.set('module', filterModule);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res = await fetch(`/api/defects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDefects(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    }
  }, [filterStatus, filterSeverity, filterPriority, filterModule, searchQuery]);

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch('/api/defects/reports');
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchReport();
    } else {
      fetchDefects();
    }
  }, [activeTab, fetchDefects, fetchReport]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterSeverity, filterPriority, filterModule]);

  const filteredDefects = defects;

  const totalPages = Math.ceil(filteredDefects.length / itemsPerPage);
  const paginatedDefects = filteredDefects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const showingStart = (currentPage - 1) * itemsPerPage + 1;
  const showingEnd = Math.min(currentPage * itemsPerPage, filteredDefects.length);

  const openCreateDialog = () => {
    setEditingDefect(null);
    setFormData({ ...emptyDefectForm, reportedById: currentUser.id });
    setFormErrors({});
    setShowCreateDialog(true);
  };

  const openEditDialog = (defect: Defect) => {
    setEditingDefect(defect);
    setFormData({
      title: defect.title || '',
      description: defect.description || '',
      severity: defect.severity || '',
      priority: defect.priority || '',
      projectId: defect.projectId || '',
      reportedById: defect.reportedById || '',
      assignedToId: defect.assignedToId || '',
      module: defect.module || '',
      environment: defect.environment || '',
      buildVersion: defect.buildVersion || '',
      stepsToReproduce: defect.stepsToReproduce || '',
      expectedResult: defect.expectedResult || '',
      actualResult: defect.actualResult || '',
      attachment: defect.attachment || '',
      resolution: defect.resolution || '',
    });
    setFormErrors({});
    setShowCreateDialog(true);
  };

  const openViewDialog = async (defect: Defect) => {
    try {
      const res = await fetch(`/api/defects/${defect.id}`);
      if (res.ok) {
        const data = await res.json();
        setViewingDefect(data);
        setViewSubTab('details');
        setCommentText('');
      }
    } catch {
      setViewingDefect(defect);
      setViewSubTab('details');
      setCommentText('');
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (editingDefect) {
        const res = await fetch(`/api/defects/${editingDefect.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, ...formData }),
        });
        if (res.ok) {
          setShowCreateDialog(false);
          fetchDefects();
          fetchReport();
        }
      } else {
        const res = await fetch('/api/defects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setShowCreateDialog(false);
          fetchDefects();
          fetchReport();
        }
      }
    } catch {
      // silent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDefect) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/defects/${deletingDefect.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingDefect(null);
        fetchDefects();
        fetchReport();
      }
    } catch {
      // silent
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (defectId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/defects/${defectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, statusChange: newStatus }),
      });
      if (res.ok) {
        const updatedDefect = await res.json();
        setViewingDefect(updatedDefect);
        fetchDefects();
        fetchReport();
      }
    } catch {
      // silent
    }
  };

  const handleAddComment = async () => {
    if (!viewingDefect || !commentText.trim()) return;
    try {
      const res = await fetch(`/api/defects/${viewingDefect.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, comment: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText('');
        const refresh = await fetch(`/api/defects/${viewingDefect.id}`);
        if (refresh.ok) {
          setViewingDefect(await refresh.json());
        }
      }
    } catch {
      // silent
    }
  };

  const handleExportCSV = () => {
    if (filteredDefects.length === 0) return;
    const headers = ['Defect ID', 'Title', 'Severity', 'Priority', 'Status', 'Module', 'Assigned To', 'Created'];
    const rows = filteredDefects.map((d) => [
      d.defectId || d.id,
      d.title,
      d.severity,
      d.priority,
      d.status,
      d.module,
      d.assignedTo ? `${d.assignedTo.firstName} ${d.assignedTo.lastName}` : '',
      formatDate(d.createdAt),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `defects_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (filteredDefects.length === 0) return;
    const rows = filteredDefects.map((d) => `
      <tr>
        <td style="border:1px solid #ccc;padding:6px;">${d.defectId || d.id}</td>
        <td style="border:1px solid #ccc;padding:6px;">${d.title}</td>
        <td style="border:1px solid #ccc;padding:6px;">${d.severity}</td>
        <td style="border:1px solid #ccc;padding:6px;">${d.priority}</td>
        <td style="border:1px solid #ccc;padding:6px;">${d.status}</td>
        <td style="border:1px solid #ccc;padding:6px;">${d.module}</td>
        <td style="border:1px solid #ccc;padding:6px;">${d.assignedTo ? `${d.assignedTo.firstName} ${d.assignedTo.lastName}` : ''}</td>
        <td style="border:1px solid #ccc;padding:6px;">${formatDate(d.createdAt)}</td>
      </tr>
    `).join('');
    const html = `<!DOCTYPE html><html><head><title>Defects Report</title></head><body style="font-family:Arial,sans-serif;">
      <h1 style="text-align:center;">Defects Report</h1>
      <p style="text-align:center;">Generated on ${new Date().toLocaleDateString()}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <thead>
          <tr style="background:#f3f3f3;">
            <th style="border:1px solid #ccc;padding:6px;">Defect ID</th>
            <th style="border:1px solid #ccc;padding:6px;">Title</th>
            <th style="border:1px solid #ccc;padding:6px;">Severity</th>
            <th style="border:1px solid #ccc;padding:6px;">Priority</th>
            <th style="border:1px solid #ccc;padding:6px;">Status</th>
            <th style="border:1px solid #ccc;padding:6px;">Module</th>
            <th style="border:1px solid #ccc;padding:6px;">Assigned To</th>
            <th style="border:1px solid #ccc;padding:6px;">Created</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const statCards = [
    { label: 'Total Defects', value: reportData?.summary.total ?? 0, icon: Bug, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Open', value: reportData?.summary.open ?? 0, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Closed', value: reportData?.summary.closed ?? 0, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Critical', value: reportData?.summary.critical ?? 0, icon: Activity, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Reopened', value: reportData?.summary.reopened ?? 0, icon: RotateCcw, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'In Progress', value: reportData?.summary.inProgress ?? 0, icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  const getHistoryIcon = (action: string) => {
    switch (action) {
      case 'STATUS_CHANGE':
        return <ArrowRight className="h-4 w-4 text-blue-400" />;
      case 'COMMENT_ADDED':
        return <MessageSquare className="h-4 w-4 text-green-400" />;
      case 'FIELD_UPDATE':
        return <Edit className="h-4 w-4 text-amber-400" />;
      case 'DEFECT_CREATED':
        return <Plus className="h-4 w-4 text-emerald-400" />;
      default:
        return <History className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Bug className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Defect Tracking</h1>
            <p className="text-sm text-zinc-400">Manage and track defects across your projects</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="defects" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500">
            Defect List
          </TabsTrigger>
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card) => (
              <Card key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">{card.label}</p>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border border-zinc-800 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Defect Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData?.trendData || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis
                          dataKey="date"
                          stroke="#71717a"
                          tick={{ fontSize: 12, fill: '#a1a1aa' }}
                          tickFormatter={(val: string) => {
                            try {
                              return format(new Date(val), 'MMM dd');
                            } catch {
                              return val;
                            }
                          }}
                        />
                        <YAxis stroke="#71717a" tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                        <RTooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '8px',
                            color: '#e4e4e7',
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="opened" stroke="#3b82f6" strokeWidth={2} name="Opened" dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="closed" stroke="#22c55e" strokeWidth={2} name="Closed" dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-500">Loading chart...</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border border-zinc-800 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  Severity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData?.severityDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {(reportData?.severityDistribution || []).map((entry: { name: string }) => (
                            <Cell key={entry.name} fill={SEVERITY_PIE_COLORS[entry.name] || '#71717a'} />
                          ))}
                        </Pie>
                        <Legend />
                        <RTooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '8px',
                            color: '#e4e4e7',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-500">Loading chart...</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Recent Defects</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Defect ID</TableHead>
                    <TableHead className="text-zinc-400">Title</TableHead>
                    <TableHead className="text-zinc-400">Severity</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Reported By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.recentDefects?.length === 0 && (
                    <TableRow className="border-zinc-800">
                      <TableCell colSpan={5} className="text-center text-zinc-500 py-8">No recent defects</TableCell>
                    </TableRow>
                  )}
                  {reportData?.recentDefects?.map((d) => (
                    <TableRow key={d.id} className="border-zinc-800 hover:bg-zinc-800/50 cursor-pointer" onClick={() => openViewDialog(d)}>
                      <TableCell className="text-zinc-300 font-mono text-sm">{d.defectId || d.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-white font-medium">{d.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={SEVERITY_COLORS[d.severity] || ''}>
                          {d.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_COLORS[d.status] || ''}>
                          {d.status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {d.reportedBy ? `${d.reportedBy.firstName} ${d.reportedBy.lastName}` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEFECT LIST TAB */}
        <TabsContent value="defects" className="space-y-6 mt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Search defects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="ALL">All Status</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="ALL">All Severity</SelectItem>
                  {SEVERITY_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="ALL">All Priority</SelectItem>
                  {PRIORITY_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="ALL">All Modules</SelectItem>
                  {MODULE_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
              <Button size="sm" onClick={openCreateDialog} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="h-4 w-4 mr-1" /> New Defect
              </Button>
            </div>
          </div>

          <Card className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Defect ID</TableHead>
                  <TableHead className="text-zinc-400">Title</TableHead>
                  <TableHead className="text-zinc-400">Severity</TableHead>
                  <TableHead className="text-zinc-400">Priority</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Module</TableHead>
                  <TableHead className="text-zinc-400">Assigned To</TableHead>
                  <TableHead className="text-zinc-400">Created</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDefects.length === 0 && (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={9} className="text-center text-zinc-500 py-12">
                      No defects found. Create a new defect to get started.
                    </TableCell>
                  </TableRow>
                )}
                {paginatedDefects.map((d) => (
                  <TableRow key={d.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="text-zinc-300 font-mono text-sm">{d.defectId || d.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-white font-medium max-w-[200px] truncate">{d.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={SEVERITY_COLORS[d.severity] || ''}>
                        {d.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={PRIORITY_COLORS[d.priority] || ''}>
                        {d.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_COLORS[d.status] || ''}>
                        {d.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">{d.module || '—'}</TableCell>
                    <TableCell className="text-zinc-400">
                      {d.assignedTo ? `${d.assignedTo.firstName} ${d.assignedTo.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">{formatDate(d.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
                          onClick={() => openViewDialog(d)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10"
                          onClick={() => openEditDialog(d)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => setDeletingDefect(d)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {filteredDefects.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Showing {showingStart}-{showingEnd} of {filteredDefects.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="text-sm text-zinc-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) setShowCreateDialog(false); }}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {editingDefect ? 'Edit Defect' : 'Create New Defect'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-zinc-300">Title <span className="text-red-400">*</span></Label>
              <Input
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Defect title..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              {formErrors.title && <p className="text-red-400 text-xs">{formErrors.title}</p>}
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-zinc-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Describe the defect..."
                rows={3}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Module</Label>
              <Select value={formData.module} onValueChange={(v) => handleFormChange('module', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {MODULE_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Severity</Label>
              <Select value={formData.severity} onValueChange={(v) => handleFormChange('severity', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {SEVERITY_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => handleFormChange('priority', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Environment</Label>
              <Select value={formData.environment} onValueChange={(v) => handleFormChange('environment', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {ENVIRONMENT_OPTIONS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Build Version</Label>
              <Input
                value={formData.buildVersion}
                onChange={(e) => handleFormChange('buildVersion', e.target.value)}
                placeholder="e.g. 1.2.0"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Project</Label>
              <Select value={formData.projectId} onValueChange={(v) => handleFormChange('projectId', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Assignee</Label>
              <Select value={formData.assignedToId} onValueChange={(v) => handleFormChange('assignedToId', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-zinc-300">Steps to Reproduce</Label>
              <Textarea
                value={formData.stepsToReproduce}
                onChange={(e) => handleFormChange('stepsToReproduce', e.target.value)}
                placeholder="1. Step one&#10;2. Step two&#10;3. Step three"
                rows={4}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-zinc-300">Expected Result</Label>
              <Textarea
                value={formData.expectedResult}
                onChange={(e) => handleFormChange('expectedResult', e.target.value)}
                placeholder="What should happen..."
                rows={2}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-zinc-300">Actual Result</Label>
              <Textarea
                value={formData.actualResult}
                onChange={(e) => handleFormChange('actualResult', e.target.value)}
                placeholder="What actually happened..."
                rows={2}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-zinc-300">Attachment URL</Label>
              <Input
                value={formData.attachment}
                onChange={(e) => handleFormChange('attachment', e.target.value)}
                placeholder="https://..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            {editingDefect && (
              <div className="md:col-span-2 space-y-2">
                <Label className="text-zinc-300">Resolution</Label>
                <Textarea
                  value={formData.resolution}
                  onChange={(e) => handleFormChange('resolution', e.target.value)}
                  placeholder="Describe how the defect was resolved..."
                  rows={3}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitForm}
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isSubmitting ? 'Saving...' : editingDefect ? 'Update Defect' : 'Create Defect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW DEFECT DIALOG */}
      <Dialog open={!!viewingDefect} onOpenChange={(open) => { if (!open) setViewingDefect(null); }}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 text-white max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <Bug className="h-5 w-5 text-emerald-500" />
              {viewingDefect?.defectId || viewingDefect?.id?.slice(0, 8)} — {viewingDefect?.title}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={viewSubTab} onValueChange={setViewSubTab} className="flex-1 min-h-0">
            <TabsList className="bg-zinc-800 border border-zinc-700">
              <TabsTrigger value="details" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-emerald-500">
                Details
              </TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-emerald-500">
                Comments {viewingDefect?.comments && viewingDefect.comments.length > 0 && `(${viewingDefect.comments.length})`}
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-emerald-500">
                History
              </TabsTrigger>
            </TabsList>

            {/* DETAILS SUB-TAB */}
            <TabsContent value="details" className="mt-4 flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Severity</p>
                  <Badge variant="secondary" className={SEVERITY_COLORS[viewingDefect?.severity || ''] || ''}>
                    {viewingDefect?.severity}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Priority</p>
                  <Badge variant="secondary" className={PRIORITY_COLORS[viewingDefect?.priority || ''] || ''}>
                    {viewingDefect?.priority}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Status</p>
                  <Badge variant="secondary" className={STATUS_COLORS[viewingDefect?.status || ''] || ''}>
                    {viewingDefect?.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Module</p>
                  <p className="text-sm text-zinc-300">{viewingDefect?.module || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Environment</p>
                  <p className="text-sm text-zinc-300">{viewingDefect?.environment || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Build Version</p>
                  <p className="text-sm text-zinc-300">{viewingDefect?.buildVersion || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Project</p>
                  <p className="text-sm text-zinc-300">{viewingDefect?.project?.name || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Created</p>
                  <p className="text-sm text-zinc-300">{formatDateTime(viewingDefect?.createdAt || '')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Reported By</p>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-xs font-medium text-emerald-400">
                        {getInitials(viewingDefect?.reportedBy?.firstName || '', viewingDefect?.reportedBy?.lastName || '')}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">
                      {viewingDefect?.reportedBy ? `${viewingDefect.reportedBy.firstName} ${viewingDefect.reportedBy.lastName}` : '—'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-400">
                        {getInitials(viewingDefect?.assignedTo?.firstName || '', viewingDefect?.assignedTo?.lastName || '')}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">
                      {viewingDefect?.assignedTo ? `${viewingDefect.assignedTo.firstName} ${viewingDefect.assignedTo.lastName}` : 'Unassigned'}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Description</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{viewingDefect?.description || 'No description provided.'}</p>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Steps to Reproduce</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{viewingDefect?.stepsToReproduce || '—'}</p>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Expected Result</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{viewingDefect?.expectedResult || '—'}</p>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Actual Result</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{viewingDefect?.actualResult || '—'}</p>
                </div>
                {viewingDefect?.resolution && (
                  <div className="md:col-span-2 space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Resolution</p>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{viewingDefect.resolution}</p>
                  </div>
                )}
                {viewingDefect?.attachment && (
                  <div className="md:col-span-2 space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Attachment</p>
                    <a href={viewingDefect.attachment} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:underline break-all">
                      {viewingDefect.attachment}
                    </a>
                  </div>
                )}

                {/* Change Status Section */}
                <div className="md:col-span-2 mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-sm font-medium text-zinc-300 mb-3">Change Status</p>
                  <div className="flex flex-wrap gap-2">
                    {viewingDefect?.status && STATUS_TRANSITIONS[viewingDefect.status]?.map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        size="sm"
                        variant="outline"
                        className={`border-zinc-700 text-zinc-300 hover:bg-zinc-800 ${STATUS_COLORS[nextStatus]}`}
                        onClick={() => handleStatusChange(viewingDefect.id, nextStatus)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        {nextStatus.replace('_', ' ')}
                      </Button>
                    ))}
                    {!STATUS_TRANSITIONS[viewingDefect?.status || ''] && (
                      <p className="text-sm text-zinc-500">No further transitions available for this status.</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* COMMENTS SUB-TAB */}
            <TabsContent value="comments" className="mt-4 flex-1 min-h-0 flex flex-col">
              <ScrollArea className="flex-1 h-64 pr-4">
                {(!viewingDefect?.comments || viewingDefect.comments.length === 0) && (
                  <div className="flex items-center justify-center h-32 text-zinc-500">
                    <MessageSquare className="h-5 w-5 mr-2" /> No comments yet
                  </div>
                )}
                {viewingDefect?.comments?.map((c) => (
                  <div key={c.id} className="mb-4 pb-4 border-b border-zinc-800 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-400">
                          {getInitials(c.user?.firstName || '', c.user?.lastName || '')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-zinc-300">
                        {c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Unknown'}
                      </span>
                      <span className="text-xs text-zinc-500">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-zinc-400 pl-8 whitespace-pre-wrap">{c.comment}</p>
                  </div>
                ))}
              </ScrollArea>
              <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* HISTORY SUB-TAB */}
            <TabsContent value="history" className="mt-4 flex-1 min-h-0">
              <ScrollArea className="h-80 pr-4">
                {(!viewingDefect?.history || viewingDefect.history.length === 0) && (
                  <div className="flex items-center justify-center h-32 text-zinc-500">
                    <History className="h-5 w-5 mr-2" /> No history recorded
                  </div>
                )}
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-zinc-800" />
                  <div className="space-y-6">
                    {viewingDefect?.history?.map((h) => (
                      <div key={h.id} className="flex gap-3 relative">
                        <div className="relative z-10 mt-0.5 h-[30px] w-[30px] rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                          {getHistoryIcon(h.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-zinc-300">
                              {h.user ? `${h.user.firstName} ${h.user.lastName}` : 'System'}
                            </span>
                            <span className="text-xs text-zinc-500">{formatDateTime(h.createdAt)}</span>
                          </div>
                          <p className="text-sm text-zinc-400">
                            {h.action === 'STATUS_CHANGE' && (
                              <>
                                Changed status from{' '}
                                <Badge variant="secondary" className={STATUS_COLORS[h.oldValue] || ''}>
                                  {h.oldValue?.replace('_', ' ')}
                                </Badge>
                                {' '}to{' '}
                                <Badge variant="secondary" className={STATUS_COLORS[h.newValue] || ''}>
                                  {h.newValue?.replace('_', ' ')}
                                </Badge>
                              </>
                            )}
                            {h.action === 'FIELD_UPDATE' && (
                              <>
                                Updated <span className="text-zinc-300 font-medium">{h.fieldName}</span>
                                {h.oldValue && h.newValue && (
                                  <>
                                    {' '}from <span className="text-red-400/80">{h.oldValue || '(empty)'}</span>
                                    {' '}to <span className="text-green-400/80">{h.newValue || '(empty)'}</span>
                                  </>
                                )}
                              </>
                            )}
                            {h.action === 'COMMENT_ADDED' && 'Added a comment'}
                            {h.action === 'DEFECT_CREATED' && 'Created this defect'}
                            {!['STATUS_CHANGE', 'FIELD_UPDATE', 'COMMENT_ADDED', 'DEFECT_CREATED'].includes(h.action) && (
                              <span className="text-zinc-400">{h.action.replace(/_/g, ' ').toLowerCase()}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!deletingDefect} onOpenChange={(open) => { if (!open) setDeletingDefect(null); }}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Defect</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete &quot;{deletingDefect?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}