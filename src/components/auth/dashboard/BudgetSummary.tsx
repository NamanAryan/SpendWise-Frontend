import React, { useEffect, useState } from 'react';
import { 
  TrendingUp as IncomeIcon, 
  TrendingDown as ExpenseIcon, 
  PiggyBank as SavingsIcon,
  DollarSign as MoneyIcon
} from 'lucide-react';

// Define the types for the budget summary data
interface BudgetSummaryData {
  income: number;
  expenses: number;
  savings: number;
  totalBalance: number;
}

// Utility function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const BudgetSummary: React.FC = () => {
  const [budgetData, setBudgetData] = useState<BudgetSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBudgetSummary = async () => {
        try {
          const token = localStorage.getItem("token");
      
          const response = await fetch("/api/budget-summary", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
      
          if (!response.ok) {
            throw new Error("Unauthorized");
          }
      
          const data: BudgetSummaryData = await response.json();
          setBudgetData(data);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching budget summary:", error);
          setLoading(false);
        }
      };
      
    fetchBudgetSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!budgetData) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">Failed to load budget summary</span>
      </div>
    );
  }

  // Calculate additional insights
  const budgetHealthPercentage = Math.round(
    ((budgetData.income - budgetData.expenses) / budgetData.income) * 100
  );

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Budget Overview
        </h1>

        <div className="grid grid-cols-2 gap-4">
          {/* Income */}
          <div className="bg-green-100 rounded-lg p-4 flex items-center">
            <IncomeIcon className="mr-3 text-green-600" />
            <div>
              <p className="text-sm text-green-800">Income</p>
              <p className="text-lg font-semibold text-green-900">
                {formatCurrency(budgetData.income)}
              </p>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-red-100 rounded-lg p-4 flex items-center">
            <ExpenseIcon className="mr-3 text-red-600" />
            <div>
              <p className="text-sm text-red-800">Expenses</p>
              <p className="text-lg font-semibold text-red-900">
                {formatCurrency(budgetData.expenses)}
              </p>
            </div>
          </div>

          {/* Savings */}
          <div className="bg-blue-100 rounded-lg p-4 flex items-center">
            <SavingsIcon className="mr-3 text-blue-600" />
            <div>
              <p className="text-sm text-blue-800">Savings</p>
              <p className="text-lg font-semibold text-blue-900">
                {formatCurrency(budgetData.savings)}
              </p>
            </div>
          </div>

          {/* Total Balance */}
          <div className="bg-purple-100 rounded-lg p-4 flex items-center">
            <MoneyIcon className="mr-3 text-purple-600" />
            <div>
              <p className="text-sm text-purple-800">Total Balance</p>
              <p className="text-lg font-semibold text-purple-900">
                {formatCurrency(budgetData.totalBalance)}
              </p>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default BudgetSummary;