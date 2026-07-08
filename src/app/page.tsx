'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard, FolderOpen, FileText, Sparkles, TestTube2, GitBranch,
  BarChart3, Users, Settings, Brain, Sun, Moon, Bell, Menu, LogOut,
  UserCircle, KeyRound, X, PanelLeftClose, PanelLeft, Bug,
  ClipboardList, ListTodo, KanbanSquare, CalendarDays, Activity, PlusCircle, ChevronDown, ChevronRight, Timer, FileBarChart,
} from 'lucide-react';

import LoginPage from '@/app/page-components/LoginPage';
import DashboardPage from '@/app/page-components/DashboardPage';
import ProjectsPage from '@/app/page-components/ProjectsPage';
import DocumentsPage from '@/app/page-components/DocumentsPage';
import AiGeneratorPage from '@/app/page-components/AiGeneratorPage';
import TestCasesPage from '@/app/page-components/TestCasesPage';
import RtmPage from '@/app/page-components/RtmPage';
import ReportsPage from '@/app/page-components/ReportsPage';
import UsersPage from '@/app/page-components/UsersPage';
import SettingsPage from '@/app/page-components/SettingsPage';
import DefectsPage from '@/app/page-components/DefectsPage';
import TaskDashboardPage from '@/app/page-components/TaskDashboardPage';
import MyTasksPage from '@/app/page-components/MyTasksPage';
import TeamTasksPage from '@/app/page-components/TeamTasksPage';
import CreateTaskPage from '@/app/page-components/CreateTaskPage';
import TaskDetailPage from '@/app/page-components/TaskDetailPage';
import SprintTasksPage from '@/app/page-components/SprintTasksPage';
import TaskCalendarPage from '@/app/page-components/TaskCalendarPage';
import TaskReportsPage from '@/app/page-components/TaskReportsPage';
import TaskActivityPage from '@/app/page-components/TaskActivityPage';

/* ──────────── Types ──────────── */
interface AppContextType {
  currentPage: string;
  navigate: (page: string) => void;
}
const AppContext = createContext<AppContextType>({ currentPage: 'dashboard', navigate: () => {} });
export const useApp = () => useContext(AppContext);

/* ──────────── Navigation Config ──────────── */
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'generator', label: 'AI Generator', icon: Sparkles },
  { id: 'testcases', label: 'Test Cases', icon: TestTube2 },
  { id: 'rtm', label: 'RTM', icon: GitBranch },
  { id: 'defects', label: 'Defects', icon: Bug },
  { id: 'daily-tasks', label: 'Daily Tasks', icon: ClipboardList },
  { id: 'task-dashboard', label: 'Task Dashboard', icon: LayoutDashboard, parent: 'daily-tasks' },
  { id: 'my-tasks', label: 'My Tasks', icon: ListTodo, parent: 'daily-tasks' },
  { id: 'team-tasks', label: 'Team Tasks', icon: Users, parent: 'daily-tasks' },
  { id: 'create-task', label: 'Create Task', icon: PlusCircle, parent: 'daily-tasks' },
  { id: 'sprint-tasks', label: 'Sprint Board', icon: KanbanSquare, parent: 'daily-tasks' },
  { id: 'task-calendar', label: 'Calendar', icon: CalendarDays, parent: 'daily-tasks' },
  { id: 'task-reports', label: 'Task Reports', icon: FileBarChart, parent: 'daily-tasks' },
  { id: 'task-activity', label: 'Activity Log', icon: Activity, parent: 'daily-tasks' },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const topNavItems = navItems.filter(n => !n.parent);
const dailyTaskSubItems = navItems.filter(n => n.parent === 'daily-tasks');

/* ──────────── Sidebar Content (shared between desktop & mobile) ──────────── */
function SidebarNav({
  currentPage, navigate, collapsed, currentUser,
}: {
  currentPage: string;
  navigate: (p: string) => void;
  collapsed: boolean;
  currentUser: { id: string; username: string; email: string; firstName: string; lastName: string; role: string } | null;
}) {
  const [taskMenuOpen, setTaskMenuOpen] = useState(false);
  const isDailyTaskPage = dailyTaskSubItems.some(i => i.id === currentPage);

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-emerald-500" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-white leading-tight">AI TestGen Pro</h1>
            <p className="text-[10px] text-zinc-500 leading-tight">Test Case Generator</p>
          </div>
        )}
      </div>

      <Separator className="bg-zinc-800/50 mx-3" />

      {/* Nav Items */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {topNavItems.map(item => {
            if (item.id === 'daily-tasks') {
              // Daily Task Management group with submenu
              return (
                <div key="daily-tasks-group">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => !collapsed && setTaskMenuOpen(!taskMenuOpen)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isDailyTaskPage
                              ? 'text-emerald-400 border border-emerald-500/20 bg-emerald-500/5'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent'
                          } ${collapsed ? 'justify-center' : ''}`}
                        >
                          <ClipboardList className={`w-5 h-5 shrink-0 ${isDailyTaskPage ? 'text-emerald-400' : ''}`} />
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-left">Daily Tasks</span>
                              {taskMenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </>
                          )}
                        </button>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" className="bg-zinc-900 border-zinc-700 text-white text-xs">
                          Daily Task Management
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  {!collapsed && taskMenuOpen && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-zinc-800 pl-3">
                      {dailyTaskSubItems.map(sub => {
                        const subActive = currentPage === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => navigate(sub.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-all ${
                              subActive
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                            }`}
                          >
                            <sub.icon className="w-4 h-4 shrink-0" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = currentPage === item.id;
            return (
              <TooltipProvider key={item.id} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="bg-zinc-900 border-zinc-700 text-white text-xs">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && currentUser && (
        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                {currentUser.firstName[0]}{currentUser.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.firstName} {currentUser.lastName}</p>
              <p className="text-xs text-zinc-500 truncate">{currentUser.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────── Main App Shell ──────────── */
function AppShell() {
  const { theme, setTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount] = useState(3);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const navigate = useCallback((page: string) => {
    setCurrentPage(page);
    setMobileOpen(false);
  }, []);

  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; email: string; firstName: string; lastName: string; role: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    // Demo credentials that always work (for qa_lead and qa_engineer too)
    const demoUsers: Record<string, { password: string; user: { id: string; username: string; email: string; firstName: string; lastName: string; role: string } }> = {
      admin: { password: 'Admin@12345', user: { id: 'demo-admin', username: 'admin', email: 'admin@testcasegen.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN' } },
      qa_lead: { password: 'Password@123', user: { id: 'demo-qalead', username: 'qa_lead', email: 'qa.lead@testcasegen.com', firstName: 'Sarah', lastName: 'Chen', role: 'QA_LEAD' } },
      qa_engineer: { password: 'Password@123', user: { id: 'demo-qaeng', username: 'qa_engineer', email: 'qa.engineer@testcasegen.com', firstName: 'Mike', lastName: 'Johnson', role: 'QA_ENGINEER' } },
    };

    // Try API login first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setAuthToken(data.token);
        setIsAuthenticated(true);
        return true;
      }
    } catch (err) {
      console.log('API login failed, using fallback:', err);
    }

    // Fallback: check demo credentials directly
    const demo = demoUsers[username.trim()];
    if (demo && demo.password === password) {
      setCurrentUser(demo.user);
      setAuthToken('mock-jwt-' + demo.user.id);
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  const handleViewTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentPage('task-detail');
  }, []);

  const handleCreateTask = useCallback(() => {
    setSelectedTaskId(null);
    setCurrentPage('create-task');
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const pageTitle = [...topNavItems, ...dailyTaskSubItems].find(n => n.id === currentPage)?.label ||
    (selectedTaskId ? 'Task Detail' : 'Dashboard');

  const renderPage = () => {
    if (selectedTaskId && currentPage === 'task-detail' && currentUser) {
      return <TaskDetailPage taskId={selectedTaskId} currentUser={currentUser} onBack={() => { setSelectedTaskId(null); setCurrentPage('my-tasks'); }} />;
    }
    switch (currentPage) {
      case 'dashboard': return <DashboardPage onNavigate={navigate} />;
      case 'projects': return <ProjectsPage />;
      case 'documents': return <DocumentsPage />;
      case 'generator': return <AiGeneratorPage />;
      case 'testcases': return <TestCasesPage />;
      case 'rtm': return <RtmPage />;
      case 'defects': return <DefectsPage />;
      case 'task-dashboard': return currentUser ? <TaskDashboardPage currentUser={currentUser} /> : null;
      case 'my-tasks': return currentUser ? <MyTasksPage currentUser={currentUser} onCreateTask={handleCreateTask} onViewTask={handleViewTask} /> : null;
      case 'team-tasks': return currentUser ? <TeamTasksPage currentUser={currentUser} /> : null;
      case 'create-task': return currentUser ? <CreateTaskPage currentUser={currentUser} editTaskId={undefined} onTaskCreated={(id) => handleViewTask(id)} onBack={() => setCurrentPage('my-tasks')} /> : null;
      case 'edit-task': return currentUser && selectedTaskId ? <CreateTaskPage currentUser={currentUser} editTaskId={selectedTaskId} onTaskCreated={(id) => handleViewTask(id)} onBack={() => { setSelectedTaskId(null); setCurrentPage('my-tasks'); }} /> : null;
      case 'sprint-tasks': return currentUser ? <SprintTasksPage currentUser={currentUser} /> : null;
      case 'task-calendar': return currentUser ? <TaskCalendarPage currentUser={currentUser} onViewTask={handleViewTask} /> : null;
      case 'task-reports': return currentUser ? <TaskReportsPage currentUser={currentUser} /> : null;
      case 'task-activity': return currentUser ? <TaskActivityPage currentUser={currentUser} /> : null;
      case 'reports': return <ReportsPage />;
      case 'users': return <UsersPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <AppContext.Provider value={{ currentPage, navigate }}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col border-r border-zinc-800/50 bg-zinc-950/50 transition-all duration-300 shrink-0 ${
            sidebarCollapsed ? 'w-[68px]' : 'w-64'
          }`}
        >
          <SidebarNav currentPage={currentPage} navigate={navigate} collapsed={sidebarCollapsed} currentUser={currentUser} />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0 bg-zinc-950 border-zinc-800">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarNav currentPage={currentPage} navigate={navigate} collapsed={false} currentUser={currentUser} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-zinc-800/50 bg-zinc-950/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {/* Mobile menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400 hover:text-white">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              {/* Collapse toggle (desktop) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(c => !c)}
                className="hidden lg:flex text-zinc-400 hover:text-white"
              >
                {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </Button>

              <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-zinc-400 hover:text-white"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white">
                    <Bell className="w-5 h-5" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {notificationCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-zinc-900 border-zinc-700">
                  <div className="px-3 py-2 border-b border-zinc-700">
                    <p className="text-sm font-medium text-white">Notifications</p>
                  </div>
                  <div className="py-1">
                    <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 px-3 text-zinc-300 focus:bg-zinc-800 focus:text-white">
                      <span className="text-sm font-medium">Generation Complete</span>
                      <span className="text-xs text-zinc-500">12 test cases generated for E-Commerce Platform</span>
                      <span className="text-xs text-zinc-600">5 minutes ago</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 px-3 text-zinc-300 focus:bg-zinc-800 focus:text-white">
                      <span className="text-sm font-medium">Document Processed</span>
                      <span className="text-xs text-zinc-500">API_Spec_E-Commerce.yaml has been processed</span>
                      <span className="text-xs text-zinc-600">23 minutes ago</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 px-3 text-zinc-300 focus:bg-zinc-800 focus:text-white">
                      <span className="text-sm font-medium">New Team Member</span>
                      <span className="text-xs text-zinc-500">Lisa Park joined the project</span>
                      <span className="text-xs text-zinc-600">1 hour ago</span>
                    </DropdownMenuItem>
                  </div>
                  <div className="border-t border-zinc-700 px-3 py-2">
                    <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">View all notifications</button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-zinc-800">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-emerald-500/15 text-emerald-400 text-xs font-bold">JS</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium text-white">John Smith</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-700">
                  <div className="px-3 py-2 border-b border-zinc-700">
                    <p className="text-sm font-medium text-white">John Smith</p>
                    <p className="text-xs text-zinc-500">john.smith@company.com</p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('settings')} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                    <UserCircle className="w-4 h-4 mr-2" />Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('settings')} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                    <KeyRound className="w-4 h-4 mr-2" />Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  <DropdownMenuItem
                    onClick={() => { setIsAuthenticated(false); setCurrentUser(null); setAuthToken(null); }}
                    className="text-red-400 focus:bg-zinc-800 focus:text-red-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {renderPage()}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}

/* ──────────── Root with ThemeProvider ──────────── */
export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <AppShell />
    </ThemeProvider>
  );
}