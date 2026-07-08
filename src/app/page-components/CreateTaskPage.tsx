'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, FileText, FolderKanban, ListChecks, UserCheck, Clock, Tag } from 'lucide-react';

type CurrentUser = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
};

type Project = {
  id: string;
  name: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
};

type TaskFormData = {
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
  estimatedHours: string;
  storyPoints: string;
  startDate: string;
  dueDate: string;
  environment: string;
  dependencies: string;
  labels: string;
};

const TASK_CATEGORIES = [
  'MANUAL_TESTING',
  'AUTOMATION_TESTING',
  'API_TESTING',
  'DATABASE_TESTING',
  'MOBILE_TESTING',
  'AI_TESTING',
  'PERFORMANCE_TESTING',
  'SECURITY_TESTING',
  'ACCESSIBILITY_TESTING',
  'REGRESSION_TESTING',
  'SMOKE_TESTING',
  'SANITY_TESTING',
  'EXPLORATORY_TESTING',
  'BUG_VERIFICATION',
  'REQUIREMENT_ANALYSIS',
  'TEST_SCENARIO_DESIGN',
  'TEST_CASE_DESIGN',
  'TEST_DATA_PREPARATION',
  'DOCUMENTATION',
  'MEETING',
  'PRODUCTION_VALIDATION',
  'RELEASE_TESTING',
  'CODE_REVIEW',
  'FRAMEWORK_DEVELOPMENT',
];

const TASK_TYPES = ['FUNCTIONAL', 'NON_FUNCTIONAL', 'SECURITY', 'PERFORMANCE', 'USABILITY', 'RELIABILITY'];

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];

const SEVERITIES = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'MINOR'];

const TASK_STATUSES = [
  'DRAFT',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'BLOCKED',
  'TESTING',
  'READY_FOR_UAT',
  'UAT_IN_PROGRESS',
  'DONE',
  'CANCELLED',
  'REJECTED',
];

const emptyForm: TaskFormData = {
  title: '',
  description: '',
  projectId: '',
  sprint: '',
  epic: '',
  userStory: '',
  module: '',
  feature: '',
  taskCategory: '',
  taskType: '',
  priority: '',
  severity: '',
  status: 'DRAFT',
  assignedToId: '',
  estimatedHours: '',
  storyPoints: '',
  startDate: '',
  dueDate: '',
  environment: '',
  dependencies: '',
  labels: '',
};

interface CreateTaskPageProps {
  currentUser: CurrentUser;
  editTaskId?: string;
  onTaskCreated: (taskId: string) => void;
  onBack: () => void;
}

export default function CreateTaskPage({
  currentUser,
  editTaskId,
  onTaskCreated,
  onBack,
}: CreateTaskPageProps) {
  const [form, setForm] = useState<TaskFormData>(emptyForm);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [titleError, setTitleError] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : data.projects || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : data.users || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchTask = useCallback(async () => {
    if (!editTaskId) return;
    setFetching(true);
    try {
      const res = await fetch(`/api/tasks/${editTaskId}`);
      if (res.ok) {
        const task = await res.json();
        setForm({
          title: task.title || '',
          description: task.description || '',
          projectId: task.projectId || '',
          sprint: task.sprint || '',
          epic: task.epic || '',
          userStory: task.userStory || '',
          module: task.module || '',
          feature: task.feature || '',
          taskCategory: task.taskCategory || '',
          taskType: task.taskType || '',
          priority: task.priority || '',
          severity: task.severity || '',
          status: task.status || 'DRAFT',
          assignedToId: task.assignedToId || '',
          estimatedHours: task.estimatedHours?.toString() || '',
          storyPoints: task.storyPoints?.toString() || '',
          startDate: task.startDate ? task.startDate.split('T')[0] : '',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          environment: task.environment || '',
          dependencies: task.dependencies || '',
          labels: task.labels?.map((l: { name: string }) => l.name).join(', ') || '',
        });
      }
    } catch {
      // silently fail
    } finally {
      setFetching(false);
    }
  }, [editTaskId]);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
    if (editTaskId) {
      fetchTask();
    }
  }, [fetchProjects, fetchUsers, fetchTask]);

  const updateField = (field: keyof TaskFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'title') setTitleError('');
  };

  const validateForm = (): boolean => {
    if (!form.title.trim()) {
      setTitleError('Task title is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null,
        storyPoints: form.storyPoints ? parseInt(form.storyPoints, 10) : null,
        assignedById: currentUser.id,
        labels: form.labels
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
      };

      const url = editTaskId ? `/api/tasks/${editTaskId}` : '/api/tasks';
      const method = editTaskId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const taskId = data.id || editTaskId || '';
        onTaskCreated(taskId);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-white">
          {editTaskId ? 'Edit Task' : 'Create New Task'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="space-y-6 pr-4 pb-8">
            {/* Section 1 - Basic Info */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-zinc-300">
                    Task Title <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Enter task title..."
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  {titleError && (
                    <p className="text-sm text-red-400">{titleError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300">
                    Task Description
                  </Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe the task in detail..."
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2 - Project Context */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <FolderKanban className="h-5 w-5 text-emerald-500" />
                  Project Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-zinc-300">
                    Project
                  </Label>
                  <Select
                    value={form.projectId}
                    onValueChange={(val) => updateField('projectId', val)}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-zinc-300 focus:bg-zinc-700 focus:text-white">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sprint" className="text-zinc-300">
                    Sprint
                  </Label>
                  <Input
                    id="sprint"
                    value={form.sprint}
                    onChange={(e) => updateField('sprint', e.target.value)}
                    placeholder="e.g. Sprint 12"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="epic" className="text-zinc-300">
                    Epic
                  </Label>
                  <Input
                    id="epic"
                    value={form.epic}
                    onChange={(e) => updateField('epic', e.target.value)}
                    placeholder="e.g. EPIC-101 User Authentication"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userStory" className="text-zinc-300">
                    User Story
                  </Label>
                  <Input
                    id="userStory"
                    value={form.userStory}
                    onChange={(e) => updateField('userStory', e.target.value)}
                    placeholder="e.g. US-201 Login flow validation"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 3 - Task Details */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <ListChecks className="h-5 w-5 text-emerald-500" />
                  Task Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Module</Label>
                    <Input
                      value={form.module}
                      onChange={(e) => updateField('module', e.target.value)}
                      placeholder="e.g. Auth, Payments"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Feature</Label>
                    <Input
                      value={form.feature}
                      onChange={(e) => updateField('feature', e.target.value)}
                      placeholder="e.g. OAuth2, Checkout"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Task Category</Label>
                    <Select
                      value={form.taskCategory}
                      onValueChange={(val) => updateField('taskCategory', val)}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 max-h-64">
                        {TASK_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-zinc-300 focus:bg-zinc-700 focus:text-white">
                            {cat.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Task Type</Label>
                    <Select
                      value={form.taskType}
                      onValueChange={(val) => updateField('taskType', val)}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {TASK_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-zinc-300 focus:bg-zinc-700 focus:text-white">
                            {t.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Priority</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(val) => updateField('priority', val)}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Select priority..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p} className="text-zinc-300 focus:bg-zinc-700 focus:text-white">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Severity</Label>
                    <Select
                      value={form.severity}
                      onValueChange={(val) => updateField('severity', val)}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Select severity..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {SEVERITIES.map((s) => (
                          <SelectItem key={s} value={s} className="text-zinc-300 focus:bg-zinc-700 focus:text-white">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-zinc-300">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(val) => updateField('status', val)}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Select status..." />
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
                </div>
              </CardContent>
            </Card>

            {/* Section 4 - Assignment */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Assigned By</Label>
                    <Input
                      value={`${currentUser.firstName} ${currentUser.lastName} (${currentUser.username})`}
                      disabled
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Assigned To</Label>
                    <Select
                      value={form.assignedToId}
                      onValueChange={(val) => updateField('assignedToId', val)}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Select user..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 max-h-64">
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id} className="text-zinc-300 focus:bg-zinc-700 focus:text-white">
                            {u.firstName} {u.lastName} (@{u.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 5 - Time & Points */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <Clock className="h-5 w-5 text-emerald-500" />
                  Time & Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedHours" className="text-zinc-300">
                      Estimated Hours
                    </Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.estimatedHours}
                      onChange={(e) => updateField('estimatedHours', e.target.value)}
                      placeholder="e.g. 8"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storyPoints" className="text-zinc-300">
                      Story Points (0-13)
                    </Label>
                    <Input
                      id="storyPoints"
                      type="number"
                      min="0"
                      max="13"
                      value={form.storyPoints}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val >= 0 && val <= 13) {
                          updateField('storyPoints', e.target.value);
                        } else if (e.target.value === '') {
                          updateField('storyPoints', '');
                        }
                      }}
                      placeholder="e.g. 5"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-zinc-300">
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => updateField('startDate', e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-zinc-300">
                      Due Date
                    </Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => updateField('dueDate', e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 6 - Additional */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <Tag className="h-5 w-5 text-emerald-500" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="environment" className="text-zinc-300">
                    Environment
                  </Label>
                  <Input
                    id="environment"
                    value={form.environment}
                    onChange={(e) => updateField('environment', e.target.value)}
                    placeholder="e.g. DEV, QA, STAGING, PRODUCTION"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dependencies" className="text-zinc-300">
                    Dependencies
                  </Label>
                  <Textarea
                    id="dependencies"
                    rows={3}
                    value={form.dependencies}
                    onChange={(e) => updateField('dependencies', e.target.value)}
                    placeholder="List task IDs or descriptions this depends on..."
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labels" className="text-zinc-300">
                    Labels
                  </Label>
                  <Input
                    id="labels"
                    value={form.labels}
                    onChange={(e) => updateField('labels', e.target.value)}
                    placeholder="e.g. frontend, urgent, v2.0 (comma-separated)"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <p className="text-xs text-zinc-500">
                    Separate multiple labels with commas
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Submit Bar */}
        <Separator className="bg-zinc-800" />
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {editTaskId ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {editTaskId ? 'Save Changes' : 'Create Task'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}