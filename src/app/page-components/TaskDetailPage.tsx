'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MessageSquare,
  Paperclip,
  History,
  Clock,
  Play,
  Pause,
  Square,
  Send,
  Reply,
  FileText,
  Loader2,
  Plus,
  Upload,
  Download,
} from 'lucide-react';

type CurrentUser = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  sprint: string;
  epic: string;
  userStory: string;
  module: string;
  feature: string;
  taskCategory: string;
  taskType: string;
  priority: string;
  severity: string;
  status: string;
  assignedToId: string;
  assignedById: string;
  estimatedHours: number | null;
  storyPoints: number | null;
  startDate: string;
  dueDate: string;
  environment: string;
  dependencies: string;
  createdAt: string;
  updatedAt: string;
  project?: { name: string };
  assignedTo?: { firstName: string; lastName: string; username: string };
  assignedBy?: { firstName: string; lastName: string; username: string };
  labels?: { name: string }[];
};

type Comment = {
  id: string;
  comment: string;
  createdAt: string;
  userId: string;
  parentId?: string;
  user?: { firstName: string; lastName: string; username: string };
  replies?: Comment[];
};

type Attachment = {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedById: string;
  uploadedBy?: { firstName: string; lastName: string };
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

type TimeLog = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  description: string;
  userId: string;
  createdAt: string;
};

const TASK_STATUSES = [
  'DRAFT', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED',
  'TESTING', 'READY_FOR_UAT', 'UAT_IN_PROGRESS', 'DONE', 'CANCELLED', 'REJECTED',
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-500/15 text-red-400 border-red-500/30',
  MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-green-500/15 text-green-400 border-green-500/30',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  MODERATE: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  MINOR: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  TODO: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  IN_REVIEW: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  BLOCKED: 'bg-red-500/15 text-red-400 border-red-500/30',
  TESTING: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  READY_FOR_UAT: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  UAT_IN_PROGRESS: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  DONE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const HISTORY_ACTION_COLORS: Record<string, string> = {
  CREATE: 'border-emerald-500/40 bg-emerald-500/5',
  UPDATE: 'border-blue-500/40 bg-blue-500/5',
  STATUS_CHANGE: 'border-amber-500/40 bg-amber-500/5',
  DELETE: 'border-red-500/40 bg-red-500/5',
};

const HISTORY_ACTION_BADGE: Record<string, string> = {
  CREATE: 'bg-emerald-500/15 text-emerald-400',
  UPDATE: 'bg-blue-500/15 text-blue-400',
  STATUS_CHANGE: 'bg-amber-500/15 text-amber-400',
  DELETE: 'bg-red-500/15 text-red-400',
};

function getFileIconColor(fileType: string): string {
  const upper = (fileType || '').toUpperCase();
  if (upper.includes('PDF')) return 'text-red-400';
  if (upper.includes('DOC')) return 'text-blue-400';
  if (upper.includes('XLS') || upper.includes('CSV')) return 'text-green-400';
  if (upper.includes('PNG') || upper.includes('JPEG') || upper.includes('PJPG')) return 'text-purple-400';
  if (upper.includes('ZIP') || upper.includes('RAR') || upper.includes('TAR')) return 'text-amber-400';
  return 'text-zinc-400';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(firstName: string, lastName: string): string {
  return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`;
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTimerSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface TaskDetailPageProps {
  taskId: string;
  currentUser: CurrentUser;
  onBack: () => void;
}

export default function TaskDetailPage({ taskId, currentUser, onBack }: TaskDetailPageProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Time tracking
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit callback
  const [onEditRequested, setOnEditRequested] = useState(false);

  const fetchTask = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : data.comments || []);
      }
    } catch {
      // silently fail
    }
  }, [taskId]);

  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(Array.isArray(data) ? data : data.attachments || []);
      }
    } catch {
      // silently fail
    }
  }, [taskId]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : data.history || []);
      }
    } catch {
      // silently fail
    }
  }, [taskId]);

  const fetchTimeLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/time-logs`);
      if (res.ok) {
        const data = await res.json();
        setTimeLogs(Array.isArray(data) ? data : data.timeLogs || []);
      }
    } catch {
      // silently fail
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
    fetchComments();
    fetchAttachments();
    fetchHistory();
    fetchTimeLogs();
  }, [fetchTask, fetchComments, fetchAttachments, fetchHistory, fetchTimeLogs]);

  // Timer effect
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTask({ ...task, status: newStatus });
        fetchHistory();
      }
    } catch {
      // silently fail
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      onBack();
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async (parentId?: string, text?: string) => {
    const commentText = text || newComment;
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: commentText.trim(),
          parentId: parentId || null,
        }),
      });
      if (parentId) {
        setReplyingTo(null);
        setReplyText('');
      } else {
        setNewComment('');
      }
      fetchComments();
    } catch {
      // silently fail
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    setCommentSubmitting(true);
    try {
      await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: editCommentText.trim() }),
      });
      setEditingCommentId(null);
      setEditCommentText('');
      fetchComments();
    } catch {
      // silently fail
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' });
      fetchComments();
    } catch {
      // silently fail
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, { method: 'DELETE' });
      fetchAttachments();
    } catch {
      // silently fail
    }
  };

  const handleUploadAttachment = async () => {
    try {
      const simulatedFile = {
        fileName: `document_${Date.now()}.pdf`,
        fileSize: Math.floor(Math.random() * 5000000) + 50000,
        fileType: 'application/pdf',
      };
      await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulatedFile),
      });
      fetchAttachments();
    } catch {
      // silently fail
    }
  };

  const handleStartTimer = () => setTimerRunning(true);
  const handlePauseTimer = () => setTimerRunning(false);
  const handleStopTimer = () => {
    setTimerRunning(false);
    if (timerSeconds > 0) {
      const now = new Date();
      const start = new Date(now.getTime() - timerSeconds * 1000);
      const newLog: TimeLog = {
        id: `local-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        startTime: start.toISOString(),
        endTime: now.toISOString(),
        duration: timerSeconds,
        description: 'Manual time entry',
        userId: currentUser.id,
        createdAt: now.toISOString(),
      };
      setTimeLogs((prev) => [newLog, ...prev]);
      setTimerSeconds(0);
    }
  };

  // Computed time summaries
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const totalAllTime = timeLogs.reduce((acc, l) => acc + (l.duration || 0), 0);
  const totalToday = timeLogs.filter((l) => l.date === todayStr).reduce((acc, l) => acc + (l.duration || 0), 0);
  const totalThisWeek = timeLogs.filter((l) => l.date >= weekStartStr).reduce((acc, l) => acc + (l.duration || 0), 0);
  const totalThisMonth = timeLogs.filter((l) => l.date >= monthStartStr).reduce((acc, l) => acc + (l.duration || 0), 0);

  // Detail fields
  const detailFields: { label: string; value: string }[] = task
    ? [
        { label: 'Project', value: task.project?.name || '—' },
        { label: 'Sprint', value: task.sprint || '—' },
        { label: 'Epic', value: task.epic || '—' },
        { label: 'User Story', value: task.userStory || '—' },
        { label: 'Module', value: task.module || '—' },
        { label: 'Feature', value: task.feature || '—' },
        { label: 'Task Category', value: task.taskCategory?.replace(/_/g, ' ') || '—' },
        { label: 'Task Type', value: task.taskType?.replace(/_/g, ' ') || '—' },
        { label: 'Priority', value: task.priority || '—' },
        { label: 'Severity', value: task.severity || '—' },
        { label: 'Environment', value: task.environment || '—' },
        { label: 'Estimated Hours', value: task.estimatedHours?.toString() || '—' },
        { label: 'Story Points', value: task.storyPoints?.toString() || '—' },
        { label: 'Start Date', value: formatDate(task.startDate) },
        { label: 'Due Date', value: formatDate(task.dueDate) },
        { label: 'Assigned By', value: task.assignedBy ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}` : '—' },
        { label: 'Assigned To', value: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '—' },
        { label: 'Created', value: formatDateTime(task.createdAt) },
        { label: 'Updated', value: formatDateTime(task.updatedAt) },
      ]
    : [];

  const renderComment = (c: Comment, indent = 0) => (
    <div key={c.id} style={{ marginLeft: indent * 32 }} className="mb-4">
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <span className="text-xs font-medium text-emerald-400">
            {getInitials(c.user?.firstName || '', c.user?.lastName || '')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">
              {c.user?.firstName} {c.user?.lastName}
              {c.user?.username && (
                <span className="text-zinc-500 font-normal ml-1">@{c.user.username}</span>
              )}
            </span>
            <span className="text-xs text-zinc-500">{formatDateTime(c.createdAt)}</span>
          </div>
          {editingCommentId === c.id ? (
            <div className="space-y-2">
              <Textarea
                value={editCommentText}
                onChange={(e) => setEditCommentText(e.target.value)}
                rows={2}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleEditComment(c.id)}
                  disabled={commentSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
                  className="border-zinc-700 text-zinc-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{c.comment}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyingTo(replyingTo === c.id ? null : c.id);
                setReplyText('');
              }}
              className="text-zinc-500 hover:text-zinc-300 h-7 px-2"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
            {c.userId === currentUser.id && editingCommentId !== c.id && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.comment); }}
                  className="text-zinc-500 hover:text-zinc-300 h-7 px-2"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(c.id)}
                  className="text-zinc-500 hover:text-red-400 h-7 px-2"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
          {replyingTo === c.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                placeholder="Write a reply..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAddComment(c.id, replyText)}
                  disabled={commentSubmitting || !replyText.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setReplyingTo(null); setReplyText(''); }}
                  className="border-zinc-700 text-zinc-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {c.replies?.map((r) => renderComment(r, indent + 1))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400">Task not found.</p>
        <Button variant="outline" onClick={onBack} className="border-zinc-700 text-zinc-300 mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white truncate">{task.title}</h1>
            <Badge className={STATUS_COLORS[task.status] || 'bg-zinc-500/15 text-zinc-400'}>
              {(task.status || '').replace(/_/g, ' ')}
            </Badge>
            <Badge className={PRIORITY_COLORS[task.priority] || 'bg-zinc-500/15 text-zinc-400'}>
              {task.priority || '—'}
            </Badge>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hidden sm:inline-flex">
              {(task.taskCategory || '').replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => setOnEditRequested(true)}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="border-red-800 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="bg-zinc-800/50 border border-zinc-800 w-full justify-start rounded-lg h-11 px-1">
          <TabsTrigger
            value="details"
            className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400"
          >
            <FileText className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments
          </TabsTrigger>
          <TabsTrigger
            value="attachments"
            className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400"
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Attachments
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger
            value="time-tracking"
            className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400"
          >
            <Clock className="h-4 w-4 mr-2" />
            Time Tracking
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 - Details */}
        <TabsContent value="details" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-white text-base">Task Details</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">Status:</span>
                <Select value={task.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-44 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-zinc-300 focus:bg-zinc-700 focus:text-white">
                        {s.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {task.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Description</h3>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap bg-zinc-800/40 rounded-lg p-4 border border-zinc-800">
                    {task.description}
                  </p>
                </div>
              )}
              {task.dependencies && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Dependencies</h3>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap bg-zinc-800/40 rounded-lg p-4 border border-zinc-800">
                    {task.dependencies}
                  </p>
                </div>
              )}
              {task.labels && task.labels.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.labels.map((label, idx) => (
                      <Badge key={idx} variant="outline" className="border-zinc-600 text-zinc-300">
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Separator className="bg-zinc-800 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {detailFields.map((field) => (
                  <div key={field.label} className="flex items-start gap-3">
                    <span className="text-sm text-zinc-400 min-w-[130px] flex-shrink-0 pt-0.5">
                      {field.label}
                    </span>
                    <span className="text-sm text-white break-words">{field.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2 - Comments */}
        <TabsContent value="comments" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-500" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New comment form */}
              <div className="space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  placeholder="Add a comment... (use @username to mention)"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleAddComment()}
                    disabled={commentSubmitting || !newComment.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {commentSubmitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              {/* Comments list */}
              <ScrollArea className="max-h-[500px]">
                {comments.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">No comments yet. Be the first to comment!</p>
                ) : (
                  <div className="py-2">
                    {comments.map((c) => renderComment(c))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3 - Attachments */}
        <TabsContent value="attachments" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-emerald-500" />
                Attachments ({attachments.length})
              </CardTitle>
              <Button
                onClick={handleUploadAttachment}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No attachments yet.</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      <div className={`flex-shrink-0 ${getFileIconColor(att.fileType)}`}>
                        <FileText className="h-8 w-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{att.fileName}</p>
                        <p className="text-xs text-zinc-500">
                          {formatFileSize(att.fileSize)} &middot;{' '}
                          {att.uploadedBy ? `${att.uploadedBy.firstName} ${att.uploadedBy.lastName}` : 'Unknown'} &middot;{' '}
                          {formatDate(att.uploadedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="text-zinc-400 hover:text-red-400 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4 - History */}
        <TabsContent value="history" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-500" />
                Change History ({history.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No history recorded.</p>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="relative pl-6 space-y-0">
                    {/* Timeline line */}
                    <div className="absolute left-[9px] top-2 bottom-2 w-px bg-zinc-700" />
                    {history.map((entry, idx) => (
                      <div key={entry.id || idx} className="relative pb-6 last:pb-0">
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-6 top-1.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${
                            entry.action === 'CREATE'
                              ? 'bg-emerald-500/20 border-emerald-500'
                              : entry.action === 'DELETE'
                                ? 'bg-red-500/20 border-red-500'
                                : entry.action === 'STATUS_CHANGE'
                                  ? 'bg-amber-500/20 border-amber-500'
                                  : 'bg-blue-500/20 border-blue-500'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            entry.action === 'CREATE'
                              ? 'bg-emerald-400'
                              : entry.action === 'DELETE'
                                ? 'bg-red-400'
                                : entry.action === 'STATUS_CHANGE'
                                  ? 'bg-amber-400'
                                  : 'bg-blue-400'
                          }`} />
                        </div>
                        {/* Content */}
                        <div className={`ml-3 p-3 rounded-lg border ${HISTORY_ACTION_COLORS[entry.action] || 'border-zinc-700 bg-zinc-800/30'}`}>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge className={`text-[10px] px-1.5 py-0 ${HISTORY_ACTION_BADGE[entry.action] || 'bg-zinc-500/15 text-zinc-400'}`}>
                              {entry.action}
                            </Badge>
                            <span className="text-xs text-zinc-500">{formatDateTime(entry.createdAt)}</span>
                            <span className="text-xs text-zinc-400">
                              by {entry.user?.firstName} {entry.user?.lastName}
                            </span>
                          </div>
                          {entry.fieldName && (
                            <div className="text-sm text-zinc-300">
                              <span className="text-zinc-400 font-medium">{entry.fieldName.replace(/_/g, ' ')}: </span>
                              {entry.oldValue && (
                                <span className="text-zinc-500 line-through">{entry.oldValue}</span>
                              )}
                              {entry.oldValue && entry.newValue && (
                                <span className="text-zinc-500 mx-1.5">→</span>
                              )}
                              {entry.newValue && (
                                <span className="text-white font-medium">{entry.newValue}</span>
                              )}
                              {!entry.oldValue && !entry.newValue && entry.action === 'CREATE' && (
                                <span className="text-emerald-400">Task created</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5 - Time Tracking */}
        <TabsContent value="time-tracking" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-500" />
                Time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timer */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-zinc-800/40 border border-zinc-800">
                <div className="text-4xl font-mono font-bold text-white tracking-wider">
                  {formatTimerSeconds(timerSeconds)}
                </div>
                <div className="flex items-center gap-2">
                  {!timerRunning ? (
                    <Button
                      onClick={handleStartTimer}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePauseTimer}
                      variant="outline"
                      className="border-amber-700 text-amber-400 hover:bg-amber-500/10"
                      size="sm"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  <Button
                    onClick={handleStopTimer}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    size="sm"
                    disabled={timerSeconds === 0}
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                </div>
                <Badge
                  className={
                    timerRunning
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : timerSeconds > 0
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                  }
                >
                  {timerRunning ? '● Running' : timerSeconds > 0 ? '⏸ Paused' : '○ Stopped'}
                </Badge>
              </div>

              {/* Time Summaries */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Today', value: totalToday },
                  { label: 'This Week', value: totalThisWeek },
                  { label: 'This Month', value: totalThisMonth },
                  { label: 'All Time', value: totalAllTime },
                ].map((summary) => (
                  <div key={summary.label} className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-800 text-center">
                    <p className="text-xs text-zinc-500 mb-1">{summary.label}</p>
                    <p className="text-lg font-bold text-white">{formatTimerSeconds(summary.value)}</p>
                  </div>
                ))}
              </div>

              <Separator className="bg-zinc-800" />

              {/* Time Log Table */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Time Logs</h3>
                {timeLogs.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-6">No time logs yet.</p>
                ) : (
                  <ScrollArea className="max-h-72">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                          <TableHead className="text-zinc-400">Date</TableHead>
                          <TableHead className="text-zinc-400">Start Time</TableHead>
                          <TableHead className="text-zinc-400">End Time</TableHead>
                          <TableHead className="text-zinc-400">Duration</TableHead>
                          <TableHead className="text-zinc-400">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeLogs.map((log, idx) => (
                          <TableRow key={log.id || idx} className="border-zinc-800 hover:bg-zinc-800/40">
                            <TableCell className="text-sm text-zinc-300">{formatDate(log.date)}</TableCell>
                            <TableCell className="text-sm text-zinc-300">
                              {log.startTime
                                ? new Date(log.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-zinc-300">
                              {log.endTime
                                ? new Date(log.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-white font-mono">
                              {formatTimerSeconds(log.duration)}
                            </TableCell>
                            <TableCell className="text-sm text-zinc-400 max-w-[200px] truncate">
                              {log.description || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete &ldquo;{task.title}&rdquo;? This action cannot be undone. All comments,
              attachments, and history will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Task'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit navigation indicator - parent should handle routing */}
      {onEditRequested && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="border-emerald-500/30 bg-zinc-900 p-3 shadow-lg">
            <p className="text-xs text-zinc-400 mb-2">Navigate to edit this task</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setOnEditRequested(false)}
                className="border-zinc-700 text-zinc-300"
                variant="outline"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Edit className="h-3 w-3 mr-1" />
                Go to Edit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}