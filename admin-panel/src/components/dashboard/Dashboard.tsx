'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, Briefcase, DollarSign, AlertCircle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { UserRole } from '@/types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from '../ui/badge';
import { statsService } from '@/src/lib/api/statsService';
import { adminService } from '@/src/lib/api/adminService';
import { projectsService } from '@/src/lib/api/projectsService';
import { paymentsService } from '@/src/lib/api/paymentsService';
import { disputesService } from '@/src/lib/api/disputesService';
import { payoutsService } from '@/src/lib/api/payoutsService';
import { Skeleton } from '../ui/skeleton';

interface DashboardProps {
  role: UserRole;
}

// Role-specific welcome messages
const getRoleWelcome = (role: UserRole) => {
  const welcomeMessages = {
    'super_admin': 'Welcome back! Here\'s a complete overview of your platform.',
    'admin': 'Welcome back! Monitor projects and user activity.',
    'finance_manager': 'Welcome back! Track all financial operations and escrow.',
    'moderator': 'Welcome back! Review flagged content and user reports.',
    'support_agent': 'Welcome back! Manage support tickets and help users.',
  };
  return welcomeMessages[role];
};

// Format currency
const formatCurrency = (amount: number | undefined) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

// Format number with commas
const formatNumber = (num: number | undefined) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

// Get time ago
const getTimeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;
};

export function Dashboard({ role }: DashboardProps) {
  // Fetch admin dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => statsService.getAdminDashboardStats(),
    enabled: role === 'super_admin' || role === 'admin',
  });

  // Fetch all users for total count
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users-count'],
    queryFn: () => adminService.getAllUsers({ limit: 1 }),
    enabled: role === 'super_admin' || role === 'admin',
  });

  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects-dashboard'],
    queryFn: () => projectsService.getAllProjects({ limit: 100 }),
    enabled: role === 'super_admin' || role === 'admin',
  });

  // Fetch payments for revenue
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments-completed'],
    queryFn: () => paymentsService.getAllPayments({ status: 'completed', limit: 1000 }),
    enabled: role === 'super_admin' || role === 'admin' || role === 'finance_manager',
  });

  // Fetch disputes
  const { data: disputesData, isLoading: disputesLoading } = useQuery({
    queryKey: ['disputes-open'],
    queryFn: () => disputesService.getAllDisputes({ status: 'open', limit: 100 }),
    enabled: role === 'super_admin' || role === 'admin',
  });

  // Fetch payouts for finance manager
  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: ['payouts-pending'],
    queryFn: () => payoutsService.getAllPayouts({ status: 'pending', limit: 100 }),
    enabled: role === 'finance_manager',
  });

  // Fetch admin logs for recent activity
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-logs-recent'],
    queryFn: () => adminService.getAdminLogs({ limit: 20 }),
    enabled: role === 'super_admin' || role === 'admin',
  });

  const isLoading = statsLoading || usersLoading || projectsLoading || paymentsLoading || disputesLoading;

  // Calculate stats from API data
  const totalUsers = usersData?.data?.total || usersData?.data?.length || 0;
  const activeProjects = projectsData?.data?.filter((p: any) => p.status === 'active' || p.status === 'bidding')?.length || 0;

  // Calculate total revenue from completed payments - payments are nested in data.payments
  const paymentsArray = paymentsData?.data?.payments || [];
  const totalRevenue = paymentsArray.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
  const openDisputes = disputesData?.data?.length || 0;

  // Finance Manager specific calculations
  const escrowHeld = paymentsArray.filter((p: any) => p.status === 'held' || p.status === 'pending')?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
  const pendingPayoutsAmount = payoutsData?.data?.reduce((sum: number, payout: any) => sum + (payout.amount || 0), 0) || 0;
  const pendingPayoutsCount = payoutsData?.data?.length || 0;

  // Process weekly activity from stats
  const activityData = statsData?.data?.weekly_activity?.map((item: any) => ({
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    users: item.users || 0,
    projects: item.projects || 0,
  })) || [
      { name: 'Mon', users: 0, projects: 0 },
      { name: 'Tue', users: 0, projects: 0 },
      { name: 'Wed', users: 0, projects: 0 },
      { name: 'Thu', users: 0, projects: 0 },
      { name: 'Fri', users: 0, projects: 0 },
      { name: 'Sat', users: 0, projects: 0 },
      { name: 'Sun', users: 0, projects: 0 },
    ];

  // Process user distribution from stats
  const userRolesData = statsData?.data?.user_distribution?.map((item: any, index: number) => {
    const colors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return {
      name: item.role || 'Unknown',
      value: item.count || 0,
      color: colors[index % colors.length],
    };
  }) || [];

  // Process recent activity from logs
  // Backend returns: { success: true, data: { logs: [...], pagination: {...} } }
  // So we need to access logsData?.data?.logs, not logsData?.data
  const logsArray = Array.isArray(logsData?.data?.logs)
    ? logsData.data.logs
    : Array.isArray(logsData?.data)
      ? logsData.data
      : [];
  const recentActivities = logsArray.slice(0, 5).map((log: any) => ({
    id: log.id,
    user: log.user?.full_name || log.userId || log.user_id || 'System',
    action: log.action || 'Activity',
    project: log.metadata?.project_name || log.metadata?.resource_type || '',
    time: getTimeAgo(log.createdAt || log.created_at || log.timestamp),
    status: log.action?.includes('completed') ? 'completed' : log.action?.includes('dispute') ? 'alert' : 'pending',
  }));

  const stats = [
    {
      title: 'Total Users',
      value: formatNumber(totalUsers),
      change: '+0%', // TODO: Calculate from previous period
      trend: 'up' as const,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Projects',
      value: formatNumber(activeProjects),
      change: '+0%', // TODO: Calculate from previous period
      trend: 'up' as const,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      change: '+0%', // TODO: Calculate from previous period
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Open Disputes',
      value: formatNumber(openDisputes),
      change: '-0%', // TODO: Calculate from previous period
      trend: 'down' as const,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2>Dashboard Overview</h2>
        <p className="text-gray-600">{getRoleWelcome(role)}</p>
      </div>

      {/* Stats Grid - Show different stats based on role */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : role === 'finance_manager' ? (
          // Finance Manager Stats
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600">Total Revenue</p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 text-sm">+0%</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600">Escrow Held</p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(escrowHeld)}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-gray-600 text-sm">{paymentsData?.data?.filter((p: any) => p.status === 'held' || p.status === 'pending')?.length || 0} transactions</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600">Pending Payouts</p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(pendingPayoutsAmount)}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-gray-600 text-sm">{pendingPayoutsCount} requests</span>
                    </div>
                  </div>
                  <div className="bg-yellow-50 text-yellow-600 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600">Completed</p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-gray-600 text-sm">This month</span>
                    </div>
                  </div>
                  <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : role === 'moderator' || role === 'support_agent' ? (
          // Moderator/Support Agent Stats - Using placeholder data as APIs may not have specific endpoints
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600">Pending Review</p>
                    <p className="mt-2 text-2xl font-semibold">0</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-orange-600 text-sm">Needs attention</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600">{role === 'support_agent' ? 'Open Tickets' : 'Reported Content'}</p>
                    <p className="mt-2 text-2xl font-semibold">0</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 text-sm">-0%</span>
                    </div>
                  </div>
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600">Verifications</p>
                    <p className="mt-2 text-2xl font-semibold">0</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-gray-600 text-sm">Awaiting review</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600">Resolved Today</p>
                    <p className="mt-2 text-2xl font-semibold">0</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 text-sm">+0%</span>
                    </div>
                  </div>
                  <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          // Super Admin & Admin Stats
          stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={stat.trend === 'up' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#2563EB" strokeWidth={2} name="Users" />
                  <Line type="monotone" dataKey="projects" stroke="#10B981" strokeWidth={2} name="Projects" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* User Roles Distribution */}
        {role !== 'finance_manager' && (
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : userRolesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userRolesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userRolesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No user distribution data available
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{activity.user}</span>
                      <Badge variant={
                        activity.status === 'completed' ? 'default' :
                          activity.status === 'alert' ? 'destructive' :
                            'secondary'
                      }>
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mt-1">
                      {activity.action}
                      {activity.project && ` • ${activity.project}`}
                    </p>
                  </div>
                  <span className="text-gray-500 text-sm">{activity.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
