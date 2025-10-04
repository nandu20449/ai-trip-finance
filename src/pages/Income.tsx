import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface IncomeSource {
  id: string;
  source_name: string;
  amount: string;
  frequency: string;
}

const Income = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIncome, setNewIncome] = useState({
    source_name: "",
    amount: "",
    frequency: "monthly",
  });

  useEffect(() => {
    checkAuth();
    fetchIncomeSources();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchIncomeSources = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("income_sources")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIncomeSources(data || []);
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

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("income_sources")
        .insert({
          user_id: user.id,
          source_name: newIncome.source_name,
          amount: parseFloat(newIncome.amount),
          frequency: newIncome.frequency,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Income source added successfully.",
      });

      setNewIncome({ source_name: "", amount: "", frequency: "monthly" });
      fetchIncomeSources();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      const { error } = await supabase
        .from("income_sources")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Income source deleted.",
      });

      fetchIncomeSources();
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
        <h1 className="text-3xl font-bold mb-6">Income & Fund Analyzer</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Income Form */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Income Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddIncome} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source_name">Source Name</Label>
                  <Input
                    id="source_name"
                    placeholder="e.g., Salary, Freelance"
                    value={newIncome.source_name}
                    onChange={(e) => setNewIncome({ ...newIncome, source_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newIncome.frequency}
                    onValueChange={(value) => setNewIncome({ ...newIncome, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">Add Income Source</Button>
              </form>
            </CardContent>
          </Card>

          {/* Income Sources List */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Your Income Sources</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeSources.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No income sources yet. Add your first income source to get started!
                </p>
              ) : (
                <div className="space-y-3">
                  {incomeSources.map((income) => (
                    <div
                      key={income.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-semibold">{income.source_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${parseFloat(income.amount).toFixed(2)} - {income.frequency}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteIncome(income.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Income;