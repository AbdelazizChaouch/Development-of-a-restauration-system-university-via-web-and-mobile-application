import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserPermissions, Permission } from '../services/auth.service';
import { 
  ChartBarIcon, 
  UsersIcon, 
  TicketIcon, 
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CreditCardIcon,
  PlusIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { fetchFromApi } from '../services/api.service';
import '../styles/Dashboard.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
);

// Define available features by role
interface FeatureItem {
  name: string;
  path: string;
  availableFor: string[];
  limitations?: {
    [role: string]: string;
  };
}

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface Activity {
  id: number;
  user: string;
  action: string;
  amount: string;
  time: string;
  icon: React.ReactNode;
}

interface ActivityLog {
  id: string;
  user_name: string;
  action: string;
  details: any;
  created_at: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
  }[];
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [activeCards, setActiveCards] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [todayOrders, setTodayOrders] = useState<number>(0);
  const [dailyRevenue, setDailyRevenue] = useState<number>(0);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [distributionChartData, setDistributionChartData] = useState<ChartData>({
    labels: [],
    datasets: []
  });
  
  // Enhanced stats data with trends
  const stats: StatCard[] = [
    {
      title: "Total Students",
      value: totalStudents.toLocaleString(),
      icon: <UserGroupIcon className="h-6 w-6" />,
      color: "blue"
    },
    {
      title: "Active Cards",
      value: activeCards.toLocaleString(),
      icon: <CreditCardIcon className="h-6 w-6" />,
      color: "green"
    },
    {
      title: "Total Revenue",
      value: `${totalRevenue.toLocaleString()} DT`,
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: "purple"
    },
    {
      title: "Total Tickets",
      value: totalTickets.toLocaleString(),
      icon: <TicketIcon className="h-6 w-6" />,
      color: "blue"
    },
    {
      title: "Orders for today",
      value: todayOrders.toLocaleString(),
      icon: <TicketIcon className="h-6 w-6" />,
      color: "green"
    },
    {
      title: "Daily Revenue",
      value: `${dailyRevenue.toLocaleString()} DT`,
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: "purple"
    }
  ];
  
  // Enhanced activity data with icons
  const recentActivity = activityLogs.map((log) => {
    let icon = <ClockIcon className="h-5 w-5" />;
    let amount = '';

    // Determine icon and amount based on action type
    switch (log.action) {
      case 'add_funds':
        icon = <CurrencyDollarIcon className="h-5 w-5" />;
        amount = `${log.details.amount} DT`;
        break;
      case 'subtract_funds':
        icon = <CurrencyDollarIcon className="h-5 w-5" />;
        amount = `${log.details.amount} DT`;
        break;
      case 'create_card':
        icon = <CreditCardIcon className="h-5 w-5" />;
        amount = 'New card';
        break;
      case 'update_card':
        icon = <CreditCardIcon className="h-5 w-5" />;
        amount = 'Updated card';
        break;
      default:
        icon = <ClockIcon className="h-5 w-5" />;
    }

    return {
      id: log.id,
      user: log.user_name || 'System',
      action: log.action.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      amount,
      time: new Date(log.created_at).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      icon
    };
  });
  
  useEffect(() => {
    if (user) {
      const loadPermissions = async () => {
        setLoading(true);
        try {
          const userPermissions = await getUserPermissions(user.id);
          setPermissions(userPermissions);
        } catch (error) {
          console.error('Failed to load permissions', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadPermissions();
    }
  }, [user]);
  
  useEffect(() => {
    const fetchTotalStudents = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetchFromApi<{ total: number }>(`/students/count?_t=${timestamp}`);
        console.log('Students count response:', response);
        if (response && response.total !== undefined) {
        setTotalStudents(response.total);
        } else {
          console.error('Invalid response format for students count:', response);
        }
      } catch (error) {
        console.error('Failed to fetch total students:', error);
        setTotalStudents(0);
      }
    };

    const fetchActiveCards = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetchFromApi<{ count: number }>(`/cards/count/active?_t=${timestamp}`);
        console.log('Active cards count response:', response);
        if (response && response.count !== undefined) {
          setActiveCards(response.count);
        } else {
          console.error('Invalid response format for active cards count:', response);
        }
      } catch (error) {
        console.error('Failed to fetch active cards count:', error);
        setActiveCards(0);
      }
    };

    const fetchTotalRevenue = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetchFromApi<{ total: number }>(`/cards/revenue/total?_t=${timestamp}`);
        console.log('Total revenue response:', response);
        if (response && response.total !== undefined) {
          setTotalRevenue(response.total);
        } else {
          console.error('Invalid response format for total revenue:', response);
        }
      } catch (error) {
        console.error('Failed to fetch total revenue:', error);
        setTotalRevenue(0);
      }
    };

    const fetchTotalTickets = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetchFromApi<{ data: { total: number } }>(`/tickets/total?_t=${timestamp}`);
        console.log('Total tickets response:', response);
        if (response && response.data && response.data.total !== undefined) {
          setTotalTickets(response.data.total);
        } else {
          console.error('Invalid response format for total tickets:', response);
        }
      } catch (error) {
        console.error('Failed to fetch total tickets:', error);
        setTotalTickets(0);
      }
    };

    const fetchTodayOrders = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetchFromApi<{ data: { total: number } }>(`/tickets/today?_t=${timestamp}`);
        console.log('Today\'s orders response:', response);
        if (response && response.data && response.data.total !== undefined) {
          setTodayOrders(response.data.total);
        } else {
          console.error('Invalid response format for today\'s orders:', response);
        }
      } catch (error) {
        console.error('Failed to fetch today\'s orders:', error);
        setTodayOrders(0);
      }
    };

    const fetchDailyRevenue = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetchFromApi<any>(`/cards/revenue/daily?_t=${timestamp}`);
        console.log('Daily revenue response:', response);
        
        // Check both possible response formats
        if (response && response.data && response.data.total !== undefined) {
          // Format: { data: { total: number } }
          setDailyRevenue(response.data.total);
        } else if (response && response.total !== undefined) {
          // Format: { total: number }
          setDailyRevenue(response.total);
        } else {
          console.error('Invalid response format for daily revenue:', response);
          setDailyRevenue(0);
        }
      } catch (error) {
        console.error('Failed to fetch daily revenue:', error);
        setDailyRevenue(0);
      }
    };

    const fetchActivityLogs = async () => {
      try {
        setLoadingLogs(true);
        const timestamp = new Date().getTime();
        const response = await fetchFromApi<{ data: ActivityLog[] }>(`/university-card-logs?limit=5&_t=${timestamp}`);
        console.log('Activity logs response:', response);
        if (response && response.data) {
          setActivityLogs(response.data);
        } else {
          console.error('Invalid response format for activity logs:', response);
        }
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
        setActivityLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    };

    const fetchTicketDistribution = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetchFromApi<{ data: any[] }>(`/tickets?_t=${timestamp}`);
        if (response && response.data) {
          // Group tickets by order type
          const ticketTypes = response.data.reduce((acc: { [key: string]: number }, ticket) => {
            acc[ticket.order_type] = (acc[ticket.order_type] || 0) + 1;
            return acc;
          }, {});

          const distributionData: ChartData = {
            labels: Object.keys(ticketTypes),
            datasets: [
              {
                label: 'Ticket Distribution',
                data: Object.values(ticketTypes),
                backgroundColor: [
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(16, 185, 129, 0.8)',
                  'rgba(168, 85, 247, 0.8)',
                  'rgba(251, 146, 60, 0.8)'
                ]
              }
            ]
          };
          setDistributionChartData(distributionData);
        }
      } catch (error) {
        console.error('Failed to fetch ticket distribution:', error);
      }
    };

    fetchTotalStudents();
    fetchActiveCards();
    fetchTotalRevenue();
    fetchTotalTickets();
    fetchTodayOrders();
    fetchDailyRevenue();
    fetchActivityLogs();
    fetchTicketDistribution();
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };
  
  const navigateToFeature = (path: string) => {
    navigate(path);
  };
  
  const handleViewAllLogs = () => {
    navigate('/card-activity-logs');
  };

  const handleAddStudent = () => {
    navigate('/students');
  };

  const handleCreateCard = () => {
    navigate('/university-cards');
  };
  
  const handleReclamation = () => {
    navigate('/reclamations');
  };
  
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      }
    }
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <div className={`dashboard-container ${darkMode ? 'dark-theme' : ''}`}>
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Welcome back, {user.name}</h1>
          <p className="subtitle">Here's what's happening with your dashboard today.</p>
        </div>
        <div className="header-right">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="main-content">
          <div className="charts-grid">
          <div className="card">
            <div className="card-header">
                <h2>Ticket Distribution</h2>
              </div>
              <div className="chart-container" style={{ height: '380px', padding: '16px 24px' }}>
                <Pie 
                  data={distributionChartData} 
                  options={{
                    ...pieChartOptions,
                    plugins: {
                      ...pieChartOptions.plugins,
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          padding: 16,
                          font: {
                            size: 11,
                            family: "'Inter', sans-serif"
                          },
                          usePointStyle: true,
                          pointStyle: 'circle'
                        }
                      },
                      tooltip: {
                        padding: 12,
                        titleFont: {
                          size: 12,
                          family: "'Inter', sans-serif"
                        },
                        bodyFont: {
                          size: 11,
                          family: "'Inter', sans-serif"
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Activity Logs</h2>
                <button className="view-all" onClick={handleViewAllLogs}>View All</button>
              </div>
              <div className="activity-list" style={{ padding: '16px 24px' }}>
              {recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {activity.icon}
                  </div>
                  <div className="activity-details">
                    <p className="activity-text">
                      <span className="user-name">{activity.user}</span>
                      <span className="action">{activity.action}</span>
                      {activity.amount && <span className="amount">{activity.amount}</span>}
                    </p>
                    <p className="activity-time">{activity.time}</p>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-content">
          <div className="card">
            <div className="card-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions">
              <button className="action-button" onClick={handleAddStudent}>
                <AcademicCapIcon className="h-6 w-6" />
                <span>Add Student</span>
                <PlusIcon className="h-4 w-4" />
              </button>
              <button className="action-button" onClick={handleCreateCard}>
                <CreditCardIcon className="h-6 w-6" />
                <span>Add Funds</span>
                <PlusIcon className="h-4 w-4" />
              </button>
              {user.role === 'staff' && (
                <button className="action-button" onClick={handleReclamation}>
                  <ExclamationCircleIcon className="h-6 w-6" />
                  <span>Reclamations</span>
                  <PlusIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 

// Update the styles
const styles = `
  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 0 0 24px 0;
  }

  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .chart-container {
    background: white;
    border-radius: 0 0 12px 12px;
    transition: transform 0.2s;
    position: relative;
    flex: 1;
  }

  .activity-list {
    flex: 1;
    overflow-y: auto;
  }

  .activity-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .activity-item:last-child {
    border-bottom: none;
  }

  .activity-icon {
    margin-right: 16px;
    color: #64748b;
  }

  .activity-details {
    flex: 1;
  }

  .activity-text {
    margin: 0;
    font-size: 14px;
    color: #1e293b;
  }

  .user-name {
    font-weight: 600;
    margin-right: 8px;
  }

  .action {
    color: #64748b;
    margin-right: 8px;
  }

  .amount {
    color: #3b82f6;
    font-weight: 500;
  }

  .activity-time {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: #94a3b8;
  }

  .chart-container:hover {
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 100px 24px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .card-header h2 {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .view-all {
    font-size: 13px;
    color: #3b82f6;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background-color 0.2s;
  }

  .view-all:hover {
    background-color: #f1f5f9;
  }

  @media (max-width: 1024px) {
    .charts-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .chart-container {
      height: 340px !important;
    }
  }

  @media (max-width: 640px) {
    .chart-container {
      height: 300px !important;
      padding: 12px 16px !important;
    }

    .card-header {
      padding: 12px 16px;
    }

    .activity-list {
      padding: 12px 16px !important;
    }
  }
`; 