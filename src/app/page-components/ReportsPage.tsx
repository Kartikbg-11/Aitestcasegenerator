'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { mockTestCases, dashboardChartData } from '@/lib/mock-data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, TestTube2, FileText, CheckCircle2, Zap, TrendingUp, FileSpreadsheet, FileDown, FileBarChart } from 'lucide-react';

const priorityData = [
  { priority: 'Critical', count: mockTestCases.filter(tc => tc.priority === 'Critical').length, fill: '#ef4444' },
  { priority: 'High', count: mockTestCases.filter(tc => tc.priority === 'High').length, fill: '#f59e0b' },
  { priority: 'Medium', count: mockTestCases.filter(tc => tc.priority === 'Medium').length, fill: '#10b981' },
  { priority: 'Low', count: mockTestCases.filter(tc => tc.priority === 'Low').length, fill: '#71717a' },
];

const typeData = [
  { name: 'Functional', value: 142, fill: '#10b981' },
  { name: 'Integration', value: 68, fill: '#f59e0b' },
  { name: 'Regression', value: 45, fill: '#8b5cf6' },
  { name: 'API', value: 38, fill: '#06b6d4' },
  { name: 'Performance', value: 25, fill: '#ef4444' },
  { name: 'Security', value: 24, fill: '#ec4899' },
];

const automationData = [
  { name: 'Automated', value: 145, fill: '#10b981' },
  { name: 'Manual', value: 132, fill: '#71717a' },
  { name: 'Semi-Automated', value: 42, fill: '#f59e0b' },
  { name: 'Not Set', value: 23, fill: '#3f3f46' },
];

const severityData = [
  { severity: 'Critical', count: mockTestCases.filter(tc => tc.severity === 'Critical').length, fill: '#ef4444' },
  { severity: 'Major', count: mockTestCases.filter(tc => tc.severity === 'Major').length, fill: '#f59e0b' },
  { severity: 'Minor', count: mockTestCases.filter(tc => tc.severity === 'Minor').length, fill: '#3b82f6' },
  { severity: 'Trivial', count: mockTestCases.filter(tc => tc.severity === 'Trivial').length, fill: '#71717a' },
];

const priorityConfig = { Critical: { label: 'Critical', color: '#ef4444' }, High: { label: 'High', color: '#f59e0b' }, Medium: { label: 'Medium', color: '#10b981' }, Low: { label: 'Low', color: '#71717a' } };
const typeConfig = { Functional: { label: 'Functional', color: '#10b981' }, Integration: { label: 'Integration', color: '#f59e0b' }, Regression: { label: 'Regression', color: '#8b5cf6' }, API: { label: 'API', color: '#06b6d4' }, Performance: { label: 'Performance', color: '#ef4444' }, Security: { label: 'Security', color: '#ec4899' } };
const autoConfig = { Automated: { label: 'Automated', color: '#10b981' }, Manual: { label: 'Manual', color: '#71717a' }, 'Semi-Automated': { label: 'Semi-Automated', color: '#f59e0b' }, 'Not Set': { label: 'Not Set', color: '#3f3f46' } };
const sevConfig = { Critical: { label: 'Critical', color: '#ef4444' }, Major: { label: 'Major', color: '#f59e0b' }, Minor: { label: 'Minor', color: '#3b82f6' }, Trivial: { label: 'Trivial', color: '#71717a' } };

export default function ReportsPage() {
  const exportFullCSV = () => {
    const sections: string[] = [];
    // Summary metrics
    sections.push('AI TEST CASE GENERATOR PRO - FULL REPORT');
    sections.push(`Generated: ${new Date().toLocaleString()}`);
    sections.push('');
    sections.push('=== SUMMARY METRICS ===');
    sections.push('Metric,Value');
    sections.push('Total Test Cases,342');
    sections.push('Documents Processed,48');
    sections.push('Requirements Covered,72%');
    sections.push('Automation Coverage,68%');
    sections.push('');
    // Priority breakdown
    sections.push('=== TEST CASES BY PRIORITY ===');
    sections.push('Priority,Count');
    priorityData.forEach(d => sections.push(`${d.priority},${d.count}`));
    sections.push('');
    // Type breakdown
    sections.push('=== TEST CASES BY TYPE ===');
    sections.push('Type,Count');
    typeData.forEach(d => sections.push(`${d.name},${d.value}`));
    sections.push('');
    // Automation coverage
    sections.push('=== AUTOMATION COVERAGE ===');
    sections.push('Status,Count,Percentage');
    const autoTotal = automationData.reduce((s, d) => s + d.value, 0);
    automationData.forEach(d => sections.push(`${d.name},${d.value},${((d.value / autoTotal) * 100).toFixed(1)}%`));
    sections.push('');
    // Severity distribution
    sections.push('=== SEVERITY DISTRIBUTION ===');
    sections.push('Severity,Count');
    severityData.forEach(d => sections.push(`${d.severity},${d.count}`));
    sections.push('');
    // All test cases detail
    sections.push('=== ALL TEST CASES DETAIL ===');
    const tcHeaders = ['TC ID', 'Module', 'Title', 'Priority', 'Severity', 'Type', 'Status', 'Automation'];
    sections.push(tcHeaders.join(','));
    mockTestCases.forEach(tc => {
      const row = [tc.tcId, tc.module, tc.title, tc.priority, tc.severity, tc.type, tc.status, tc.automationCandidate || 'Not Set'];
      sections.push(row.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));
    });
    const csv = sections.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full_test_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportFullJSON = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      title: 'AI Test Case Generator Pro - Full Report',
      summary: {
        totalTestCases: 342,
        documentsProcessed: 48,
        requirementsCovered: '72%',
        automationCoverage: '68%',
      },
      priorityBreakdown: priorityData,
      typeBreakdown: typeData,
      automationCoverage: automationData,
      severityDistribution: severityData,
      monthlyTrend: dashboardChartData.monthlyTrend,
      testCases: mockTestCases.map(tc => ({
        tcId: tc.tcId, module: tc.module, title: tc.title,
        priority: tc.priority, severity: tc.severity, type: tc.type,
        status: tc.status, automationCandidate: tc.automationCandidate,
        preconditions: tc.preconditions, expectedResult: tc.expectedResult,
        steps: tc.steps,
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full_test_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportFullTXT = () => {
    const lines: string[] = [];
    const pad = (s: string, n: number) => s.padEnd(n);
    lines.push('============================================================');
    lines.push('        AI TEST CASE GENERATOR PRO - FULL REPORT          ');
    lines.push('============================================================');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('------------------------------------------------------------');
    lines.push('  SUMMARY METRICS                                            ');
    lines.push('------------------------------------------------------------');
    lines.push(`  Total Test Cases:        342`);
    lines.push(`  Documents Processed:     48`);
    lines.push(`  Requirements Covered:    72%`);
    lines.push(`  Automation Coverage:     68%`);
    lines.push('');
    lines.push('------------------------------------------------------------');
    lines.push('  TEST CASES BY PRIORITY                                   ');
    lines.push('------------------------------------------------------------');
    priorityData.forEach(d => {
      lines.push(`  ${pad(d.priority, 12)} ${String(d.count).padStart(4)} test cases`);
    });
    lines.push('');
    lines.push('------------------------------------------------------------');
    lines.push('  TEST CASES BY TYPE                                        ');
    lines.push('------------------------------------------------------------');
    typeData.forEach(d => {
      lines.push(`  ${pad(d.name, 20)} ${String(d.value).padStart(4)} test cases`);
    });
    lines.push('');
    lines.push('------------------------------------------------------------');
    lines.push('  AUTOMATION COVERAGE                                       ');
    lines.push('------------------------------------------------------------');
    const autoTotal = automationData.reduce((s, d) => s + d.value, 0);
    automationData.forEach(d => {
      const pct = ((d.value / autoTotal) * 100).toFixed(1);
      lines.push(`  ${pad(d.name, 20)} ${String(d.value).padStart(4)} (${pct}%)`);
    });
    lines.push('');
    lines.push('------------------------------------------------------------');
    lines.push('  SEVERITY DISTRIBUTION                                      ');
    lines.push('------------------------------------------------------------');
    severityData.forEach(d => {
      lines.push(`  ${pad(d.severity, 12)} ${String(d.count).padStart(4)} test cases`);
    });
    lines.push('');
    lines.push('------------------------------------------------------------');
    lines.push('  ALL TEST CASES DETAIL                                      ');
    lines.push('------------------------------------------------------------');
    mockTestCases.forEach((tc, i) => {
      lines.push(`  [${i + 1}] ${tc.tcId} | ${tc.title}`);
      lines.push(`      Module: ${tc.module}`);
      lines.push(`      Priority: ${tc.priority} | Severity: ${tc.severity} | Type: ${tc.type}`);
      lines.push(`      Status: ${tc.status} | Automation: ${tc.automationCandidate || 'Not Set'}`);
      if (tc.preconditions) lines.push(`      Preconditions: ${tc.preconditions}`);
      if (tc.expectedResult) lines.push(`      Expected: ${tc.expectedResult}`);
      lines.push('');
    });
    lines.push('============================================================');
    lines.push('  END OF REPORT                                              ');
    lines.push('============================================================');
    const txt = lines.join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full_test_report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10"><TestTube2 className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <p className="text-2xl font-bold text-white">342</p>
                <p className="text-sm text-zinc-400">Total Test Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10"><FileText className="w-5 h-5 text-cyan-400" /></div>
              <div>
                <p className="text-2xl font-bold text-white">48</p>
                <p className="text-sm text-zinc-400">Documents Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10"><CheckCircle2 className="w-5 h-5 text-green-400" /></div>
              <div>
                <p className="text-2xl font-bold text-white">72%</p>
                <p className="text-sm text-zinc-400">Requirements Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10"><Zap className="w-5 h-5 text-amber-400" /></div>
              <div>
                <p className="text-2xl font-bold text-white">68%</p>
                <p className="text-sm text-zinc-400">Automation Coverage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Bar Chart */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Test Cases by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={priorityConfig} className="h-[280px] w-full">
              <BarChart data={priorityData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="priority" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Type Pie Chart */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Test Cases by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={typeConfig} className="h-[280px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={typeData} cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Automation Donut */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Automation Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={autoConfig} className="h-[280px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={automationData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {automationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Severity Bar Chart */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={sevConfig} className="h-[280px] w-full">
              <BarChart data={severityData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="severity" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={30}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Download className="w-4 h-4 mr-2" />Export Full Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-900 border-zinc-700">
            <DropdownMenuItem onClick={exportFullCSV} className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-400" />
              Export as CSV (Excel Compatible)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportFullJSON} className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
              <FileDown className="w-4 h-4 mr-2 text-blue-400" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportFullTXT} className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
              <FileBarChart className="w-4 h-4 mr-2 text-amber-400" />
              Export as Text Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}