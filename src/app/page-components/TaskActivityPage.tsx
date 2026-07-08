'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  PlusCircle, RefreshCw, MessageSquare, Clock, UserPlus,
  CheckCircle, Paperclip, Search, Filter, ChevronDown, X,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

/* ─── Types ─── */
interface TaskActivityPageProps {
  currentUser: { id: string; role: string };
}

type ActionType =
  | 'TASK_CREATED'
  | 'STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | 'TIME_LOGGED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'ATTACHMENT_UPLOADED';

interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: ActionType;
  taskId: string;
  taskTitle: string;
  description: string;
  timestamp: string;
  projectName?: string;
  metadata?: Record<string, string>;
}

const ACTION_CONFIG: Record<ActionType, { label: string; icon: typeof PlusCircle; colorClass: string; bgClass: string }> = {
  TASK_CREATED:       { label: 'Task Created',        icon: PlusCircle,   colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10' },
  STATUS_CHANGED:     { label: 'Status Changed',      icon: RefreshCw,    colorClass: 'text-blue-400',    bgClass: 'bg-blue-500/10' },
  COMMENT_ADDED:      { label: 'Comment Added',       icon: MessageSquare, colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10' },
  TIME_LOGGED:        { label: 'Time Logged',         icon: Clock,        colorClass: 'text-amber-400',   bgClass: 'bg-amber-500/10' },
  TASK_ASSIGNED:      { label: 'Task Assigned',       icon: UserPlus,     colorClass: 'text-blue-400',    bgClass: 'bg-blue-500/10' },
  TASK_COMPLETED:     { label: 'Task Completed',      icon: CheckCircle,  colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10' },
  ATTACHMENT_UPLOADED: { label: 'Attachment Uploaded', icon: Paperclip,    colorClass: 'text-zinc-400',    bgClass: 'bg-zinc-500/10' },
};

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Actions' },
  { value: 'TASK_CREATED', label: 'Task Created' },
  { value: 'STATUS_CHANGED', label: 'Status Changed' },
  { value: 'COMMENT_ADDED', label: 'Comment Added' },
  { value: 'TIME_LOGGED', label: 'Time Logged' },
  { value: 'TASK_ASSIGNED', label: 'Task Assigned' },
  { value: 'TASK_COMPLETED', label: 'Task Completed' },
  { value: 'ATTACHMENT_UPLOADED', label: 'Attachment Uploaded' },
];

const PAGE_SIZE = 20;

/* ─── Mock data generator ─── */
function generateMockActivities(page: number, pageSize: number): ActivityEntry[] {
  const names = ['John Smith', 'Sarah Chen', 'Mike Johnson', 'Lisa Park', 'Tom Wilson', 'Emily Davis'];
  const actions: ActionType[] = ['TASK_CREATED', 'STATUS_CHANGED', 'COMMENT_ADDED', 'TIME_LOGGED', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'ATTACHMENT_UPLOADED'];
  const tasks = [
    'Implement user authentication flow',
    'Design dashboard layout components',
    'Fix login redirect bug',
    'Write API documentation',
    'Setup CI/CD pipeline',
    'Create notification system',
    'Optimize database queries',
    'Add dark mode support',
    'Refactor payment module',
    'Implement search functionality',
  ];
  const projects = ['Website Redesign', 'Mobile App', 'API Platform', 'Internal Tools'];

  const items: ActivityEntry[] = [];
  const offset = (page - 1) * pageSize;

  for (let i = 0; i < pageSize; i++) {
    const idx = offset + i;
    const action = actions[idx % actions.length];
    const name = names[idx % names.length];
    const task = tasks[idx % tasks.length];
    const minutesAgo = (idx * 23 + 5);

    const descriptions: Record<ActionType, string> = {
      TASK_CREATED: `created the task`,
      STATUS_CHANGED: `changed status from "In Progress" to "Review"`,
      COMMENT_ADDED: `added a comment: "Looks good, approving this change."`,
      TIME_LOGGED: `logged 2.5 hours of work`,
      TASK_ASSIGNED: `assigned the task to ${names[(idx + 1) % names.length]}`,
      TASK_COMPLETED: `marked the task as completed`,
      ATTACHMENT_UPLOADED: `uploaded "screenshot-${idx + 1}.png"`,
    };

    items.push({
      id: `activity-${idx}`,
      userId: `user-${idx % names.length}`,
      userName: name,
      action,
      taskId: `task-${idx % tasks.length}`,
      taskTitle: task,
      description: descriptions[action],
      timestamp: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
      projectName: projects[idx % projects.length],
    });
  }

  return items;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function TaskActivityPage({ currentUser }: TaskActivityPageProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  /* ─── Fetch activities ─── */
  const fetchActivities = useCallback(async (pageNum: number, append: boolean) => {
    if (!append) setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
      if (actionFilter !== 'all') params.set('actionType', actionFilter);
      if (userFilter !== 'all') params.set('userId', userFilter);
      if (projectFilter !== 'all') params.set('project', projectFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/tasks/activity?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.activities ?? [];
        if (items.length < PAGE_SIZE) setHasMore(false);
        else setHasMore(true);
        setActivities(prev => (append ? [...prev, ...items] : items));
      } else {
        // Fallback to mock data
        const mock = generateMockActivities(pageNum, PAGE_SIZE);
        if (pageNum >= 5) setHasMore(false);
        else setHasMore(true);
        setActivities(prev => (append ? [...prev, ...mock] : mock));
      }
    } catch {
      // Fallback to mock data
      const mock = generateMockActivities(pageNum, PAGE_SIZE);
      if (pageNum >= 5) setHasMore(false);
      else setHasMore(true);
      setActivities(prev => (append ? [...prev, ...mock] : mock));
    } finally {
      setLoading(false);
    }
  }, [actionFilter, userFilter, projectFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    setPage(1);
    fetchActivities(1, false);
  }, [fetchActivities]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage, true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setUserFilter('all');
    setProjectFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = actionFilter !== 'all' || userFilter !== 'all' || projectFilter !== 'all' || dateFrom || dateTo || searchQuery;

  return (
    <div className="space-y-4">
      {/* Search + Filter Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 text-xs border-zinc-700 ${showFilters ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          onClick={() => setShowFilters(f => !f)}
        >
          <Filter className="w-3.5 h-3.5 mr-1.5" />
          Filters
          {hasActiveFilters && (
            <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 border-0">
              {[actionFilter !== 'all', userFilter !== 'all', projectFilter !== 'all', !!dateFrom, !!dateTo, !!searchQuery].filter(Boolean).length}
            </Badge>
          )}
        </Button>
        <Badge variant="secondary" className="h-9 px-3 bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">
          <Activity className="w-3.5 h-3.5 mr-1.5" />
          {activities.length} activities
        </Badge>
      </div>

      {/* Filter Row */}
      {showFilters && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40 h-8 bg-zinc-800 border-zinc-700 text-white text-xs">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {ACTION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-zinc-300">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-40 h-8 bg-zinc-800 border-zinc-700 text-white text-xs">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all" className="text-zinc-300">All Users</SelectItem>
                  <SelectItem value="user-0" className="text-zinc-300">John Smith</SelectItem>
                  <SelectItem value="user-1" className="text-zinc-300">Sarah Chen</SelectItem>
                  <SelectItem value="user-2" className="text-zinc-300">Mike Johnson</SelectItem>
                  <SelectItem value="user-3" className="text-zinc-300">Lisa Park</SelectItem>
                  <SelectItem value="user-4" className="text-zinc-300">Tom Wilson</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-40 h-8 bg-zinc-800 border-zinc-700 text-white text-xs">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all" className="text-zinc-300">All Projects</SelectItem>
                  <SelectItem value="Website Redesign" className="text-zinc-300">Website Redesign</SelectItem>
                  <SelectItem value="Mobile App" className="text-zinc-300">Mobile App</SelectItem>
                  <SelectItem value="API Platform" className="text-zinc-300">API Platform</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-36 h-8 bg-zinc-800 border-zinc-700 text-white text-xs"
                placeholder="From"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-36 h-8 bg-zinc-800 border-zinc-700 text-white text-xs"
                placeholder="To"
              />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-400 hover:text-white" onClick={clearFilters}>
                  <X className="w-3 h-3 mr-1" />Clear All
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Feed */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-zinc-800" />

        <div className="space-y-0">
          {loading && page === 1 ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
            </div>
          ) : activities.length === 0 ? (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <Activity className="w-10 h-10 text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-400">No activities found</p>
                <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters or search query</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {activities.map((entry, idx) => {
                const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.TASK_CREATED;
                const Icon = config.icon;
                const isSameUser = idx > 0 && activities[idx - 1].userId === entry.userId;

                return (
                  <div key={entry.id} className="relative pl-12 pr-2 py-3 group hover:bg-zinc-800/20 rounded-lg transition-colors">
                    {/* Timeline dot */}
                    <div className={`absolute left-4 top-4 w-[18px] h-[18px] rounded-full flex items-center justify-center z-10 border-2 border-zinc-950 ${config.bgClass}`}>
                      <Icon className={`w-3 h-3 ${config.colorClass}`} />
                    </div>

                    {/* Content */}
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                          {getInitials(entry.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">{entry.userName}</span>
                          <span className="text-sm text-zinc-400">{entry.description}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <button
                            className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline font-medium transition-colors truncate max-w-[300px]"
                            onClick={() => {/* navigate to task */}}
                          >
                            {entry.taskTitle}
                          </button>
                          {entry.projectName && (
                            <>
                              <span className="text-zinc-600">·</span>
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-zinc-800 text-zinc-500 border-0">
                                {entry.projectName}
                              </Badge>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-zinc-500">
                            {formatDistanceToNow(parseISO(entry.timestamp), { addSuffix: true })}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-4 px-1.5 border-current/20 bg-transparent ${config.colorClass}`}
                          >
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Load More */}
      {!loading && hasMore && activities.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-400 hover:text-white"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full mr-2" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-2" />
            )}
            Load More Activities
          </Button>
        </div>
      )}

      {/* Loading indicator for "load more" */}
      {loading && page > 1 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}