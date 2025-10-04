import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Sparkles, Loader2 } from "lucide-react";

const AICoach = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [userQuestion, setUserQuestion] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const getRecommendations = async (customQuestion?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { 
          userFinancialData: customQuestion || null 
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setRecommendation(data.recommendation);
      toast({
        title: "Success",
        description: "AI recommendations generated!",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = () => {
    if (!userQuestion.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question first.",
        variant: "destructive",
      });
      return;
    }
    getRecommendations(userQuestion);
    setUserQuestion("");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-adventure mb-4 shadow-glow">
              <Bot className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">AI Travel Finance Coach</h1>
            <p className="text-muted-foreground">
              Get personalized recommendations to optimize your travel budget
            </p>
          </div>

          <div className="grid gap-6">
            {/* Quick Analysis Card */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Quick Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get instant AI-powered recommendations based on your current financial data.
                </p>
                <Button
                  onClick={() => getRecommendations()}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      Analyze My Budget
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Custom Question Card */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Ask a Specific Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="E.g., How can I save $2000 for a trip to Japan in 6 months?"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  rows={3}
                  disabled={loading}
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Answer...
                    </>
                  ) : (
                    "Get AI Advice"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Recommendations Display */}
            {recommendation && (
              <Card className="shadow-medium border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-foreground">
                      {recommendation}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sample Questions */}
            {!recommendation && (
              <Card className="shadow-soft bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">Sample Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• How can I reduce my travel expenses?</li>
                    <li>• What's the best way to save for my upcoming trip?</li>
                    <li>• Are there cheaper alternatives for my hotel bookings?</li>
                    <li>• How much should I budget for food during my trip?</li>
                    <li>• What are some tips to stay within my travel budget?</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoach;