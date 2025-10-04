import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userFinancialData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch user's financial data
    const [incomeData, expensesData, savingsData] = await Promise.all([
      supabase.from('income_sources').select('*').eq('user_id', user.id),
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('savings_goals').select('*').eq('user_id', user.id),
    ]);

    const totalIncome = incomeData.data?.reduce((sum: number, item: any) => {
      const amount = parseFloat(item.amount);
      if (item.frequency === 'yearly') return sum + amount / 12;
      if (item.frequency === 'monthly') return sum + amount;
      return sum;
    }, 0) || 0;

    const totalExpenses = expensesData.data?.reduce((sum: number, item: any) => 
      sum + parseFloat(item.amount), 0) || 0;

    const expensesByCategory = expensesData.data?.reduce((acc: any, item: any) => {
      acc[item.category] = (acc[item.category] || 0) + parseFloat(item.amount);
      return acc;
    }, {}) || {};

    const savingsGoals = savingsData.data || [];

    const systemPrompt = `You are an AI Travel Finance Coach. Analyze the user's financial data and provide personalized recommendations to optimize their travel spending. Focus on:
1. Budget optimization strategies
2. Cheaper alternatives for travel expenses
3. Savings suggestions to reach travel goals faster
4. Spending pattern insights
5. Actionable advice to stay within budget

Be encouraging, specific, and practical in your recommendations.`;

    const userPrompt = userFinancialData || `Here's my current financial situation:
- Monthly Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Available Funds: $${(totalIncome - totalExpenses).toFixed(2)}
- Expenses by Category: ${JSON.stringify(expensesByCategory, null, 2)}
- Savings Goals: ${savingsGoals.length} active goals

Please analyze my travel budget and provide personalized recommendations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const aiData = await response.json();
    const recommendation = aiData.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ recommendation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-coach function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});