import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, TrendingUp } from "lucide-react";

interface SavingsGoal {
  id: string;
  goal_name: string;
  target_amount: string;
  current_amount: string;
  target_date: string;
}

const Savings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    goal_name: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
  });

  useEffect(() => {
    checkAuth();
    fetchSavingsGoals();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchSavingsGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("target_date", { ascending: true });

      if (error) throw error;
      setSavingsGoals(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("savings_goals")
        .insert({
          user_id: user.id,
          goal_name: newGoal.goal_name,
          target_amount: parseFloat(newGoal.target_amount),
          current_amount: parseFloat(newGoal.current_amount),
          target_date: newGoal.target_date,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Savings goal added successfully.",
      });

      setNewGoal({
        goal_name: "",
        target_amount: "",
        current_amount: "0",
        target_date: "",
      });
      fetchSavingsGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateProgress = async (id: string, newAmount: string) => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .update({ current_amount: parseFloat(newAmount) })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Progress updated.",
      });

      fetchSavingsGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Savings goal deleted.",
      });

      fetchSavingsGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Savings Goals Planner</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Goal Form */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Savings Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal_name">Goal Name</Label>
                  <Input
                    id="goal_name"
                    placeholder="e.g., Paris Trip 2025"
                    value={newGoal.goal_name}
                    onChange={(e) => setNewGoal({ ...newGoal, goal_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_amount">Target Amount</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_amount">Current Amount</Label>
                  <Input
                    id="current_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newGoal.current_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, current_amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_date">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">Add Savings Goal</Button>
              </form>
            </CardContent>
          </Card>

          {/* Savings Goals List */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Your Savings Goals</CardTitle>
            </CardHeader>
            <CardContent>
              {savingsGoals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No savings goals yet. Create your first goal to start planning!
                </p>
              ) : (
                <div className="space-y-4">
                  {savingsGoals.map((goal) => {
                    const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
                    const daysUntilTarget = Math.ceil(
                      (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const monthlyNeeded = daysUntilTarget > 0
                      ? ((parseFloat(goal.target_amount) - parseFloat(goal.current_amount)) / (daysUntilTarget / 30))
                      : 0;

                    return (
                      <div
                        key={goal.id}
                        className="p-4 border border-border rounded-lg bg-muted/50 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-lg">{goal.goal_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Target: {new Date(goal.target_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              ${parseFloat(goal.current_amount).toFixed(2)} / ${parseFloat(goal.target_amount).toFixed(2)}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground text-right">
                            {progress.toFixed(0)}% complete
                          </p>
                        </div>

                        {monthlyNeeded > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-accent/10 rounded">
                            <TrendingUp className="w-4 h-4 text-accent" />
                            <p className="text-sm">
                              Save <span className="font-bold">${monthlyNeeded.toFixed(2)}/month</span> to reach goal
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Add amount"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                const newTotal = parseFloat(goal.current_amount) + parseFloat(input.value || "0");
                                handleUpdateProgress(goal.id, newTotal.toString());
                                input.value = "";
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={(e) => {
                              const input = (e.currentTarget.previousSibling as HTMLInputElement);
                              const newTotal = parseFloat(goal.current_amount) + parseFloat(input.value || "0");
                              handleUpdateProgress(goal.id, newTotal.toString());
                              input.value = "";
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Savings;