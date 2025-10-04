import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Target } from "lucide-react";

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsGoalProgress: number;
  expensesByCategory: Array<{ name: string; value: number }>;
  monthlyTrend: Array<{ month: string; income: number; expenses: number }>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    savingsGoalProgress: 0,
    expensesByCategory: [],
    monthlyTrend: [],
  });

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch income
      const { data: incomeData } = await supabase
        .from("income_sources")
        .select("amount, frequency")
        .eq("user_id", user.id);

      // Calculate total income (normalize to monthly)
      const totalIncome = incomeData?.reduce((sum, item) => {
        const amount = parseFloat(item.amount);
        if (item.frequency === "yearly") return sum + amount / 12;
        if (item.frequency === "monthly") return sum + amount;
        return sum;
      }, 0) || 0;

      // Fetch expenses
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("amount, category")
        .eq("user_id", user.id);

      const totalExpenses = expensesData?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;

      // Expenses by category
      const expensesByCategory = expensesData?.reduce((acc: any[], item) => {
        const existing = acc.find(e => e.name === item.category);
        if (existing) {
          existing.value += parseFloat(item.amount);
        } else {
          acc.push({ name: item.category, value: parseFloat(item.amount) });
        }
        return acc;
      }, []) || [];

      // Fetch savings goals
      const { data: savingsData } = await supabase
        .from("savings_goals")
        .select("target_amount, current_amount")
        .eq("user_id", user.id);

      const totalTargetSavings = savingsData?.reduce((sum, item) => sum + parseFloat(item.target_amount), 0) || 0;
      const totalCurrentSavings = savingsData?.reduce((sum, item) => sum + parseFloat(item.current_amount), 0) || 0;
      const savingsGoalProgress = totalTargetSavings > 0 ? (totalCurrentSavings / totalTargetSavings) * 100 : 0;

      setDashboardData({
        totalIncome,
        totalExpenses,
        totalSavings: totalCurrentSavings,
        savingsGoalProgress,
        expensesByCategory,
        monthlyTrend: [
          { month: "Jan", income: totalIncome * 0.8, expenses: totalExpenses * 0.7 },
          { month: "Feb", income: totalIncome * 0.9, expenses: totalExpenses * 0.8 },
          { month: "Mar", income: totalIncome, expenses: totalExpenses },
        ],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(200, 95%, 45%)', 'hsl(175, 70%, 50%)', 'hsl(14, 90%, 65%)', 'hsl(190, 85%, 55%)', 'hsl(210, 40%, 96%)'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const availableFunds = dashboardData.totalIncome - dashboardData.totalExpenses;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Travel Finance Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dashboardData.totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Monthly average</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dashboardData.totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Trip spending</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available Funds</CardTitle>
              <TrendingUp className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${availableFunds.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Ready to spend</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Savings Progress</CardTitle>
              <Target className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.savingsGoalProgress.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Goal completion</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No expense data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Income vs Expenses Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="hsl(200, 95%, 45%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="hsl(14, 90%, 65%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;