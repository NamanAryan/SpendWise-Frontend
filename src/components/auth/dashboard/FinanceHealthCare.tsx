import React, { useState } from "react";
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  CreditCard,
  Zap,
} from "lucide-react";

interface Transaction {
  id: string | number;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: "income" | "expense";
  Impulse_Tag?: boolean; // Using the same property name as backend
}

interface FinancialHealthScoreProps {
  score: number;
  getHealthStatus: () => string;
  getHealthColor: () => string;
  user: { balance: number };
  transactions: Transaction[];
  setShowTransactionForm: (value: boolean) => void;
}

const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({
  score,
  getHealthStatus,
  getHealthColor,
  user,
  transactions,
  setShowTransactionForm,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Get score breakdown using the getScoreBreakdown function
  const { balanceScore, transactionScore, savingsScore, consistencyScore } =
    getScoreBreakdown();

  // Function to determine message based on component score
  const getComponentMessage = (component: string, score: number): string => {
    switch (component) {
      case "balance":
        if (score >= 30) return "Excellent account balance";
        if (score >= 20) return "Good account balance";
        if (score >= 10) return "Moderate account balance";
        return "Low account balance";
      case "transaction":
        if (score >= 15) return "Healthy income-to-expense ratio";
        if (score >= 10) return "Balanced income-to-expense ratio";
        return "Income is lower than expenses";
      case "savings":
        if (score >= 15) return "Strong saving habits";
        if (score >= 10) return "Moderate saving habits";
        return "Limited savings";
      case "consistency":
        if (score >= 15) return "Very consistent spending patterns";
        if (score >= 10) return "Moderately consistent spending";
        return "Inconsistent spending patterns";
      default:
        return "";
    }
  };

  // Function to get detailed health message based on score
  const getDetailedHealthMessage = (): string => {
    if (score >= 80) {
      return "Your finances are in excellent shape! You have a healthy balance, good saving habits, and consistent spending patterns. Keep up the good work!";
    } else if (score >= 60) {
      return "You're doing well financially, but there's room for improvement. Consider building more savings or reducing some discretionary expenses.";
    } else if (score >= 40) {
      return "Your finances need attention. Try to increase your income-to-expense ratio and build more consistent spending habits.";
    } else {
      return "Your financial health requires immediate attention. Focus on building your balance and creating a budget to track expenses.";
    }
  };

  // Calculate score breakdown for display
  function getScoreBreakdown(): {
    balanceScore: number;
    transactionScore: number;
    savingsScore: number;
    consistencyScore: number;
  } {
    // Balance component (40% of total score)
    let balanceScore = 0;
    if (user.balance >= 5000) balanceScore = 40;
    else if (user.balance >= 3000) balanceScore = 30;
    else if (user.balance >= 1000) balanceScore = 20;
    else if (user.balance >= 500) balanceScore = 10;
    else balanceScore = Math.max(5, Math.floor(user.balance / 100));

    // Recent transactions
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Transaction patterns (20% of total score)
    const incomes = recentTransactions.filter((t) => t.amount > 0);
    const expenses = recentTransactions.filter((t) => t.amount < 0);

    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = Math.abs(
      expenses.reduce((sum, t) => sum + t.amount, 0) || 0
    );

    let transactionScore = 0;
    if (totalExpense === 0) {
      transactionScore = 20;
    } else {
      const ratio = totalIncome / totalExpense;
      if (ratio >= 1.5) transactionScore = 20;
      else if (ratio >= 1.2) transactionScore = 15;
      else if (ratio >= 1.0) transactionScore = 10;
      else if (ratio >= 0.8) transactionScore = 5;
      else transactionScore = 0;
    }

    // Savings component (20% of total score)
    const netFlow = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
    let savingsScore = 0;

    if (netFlow > 0) {
      const savingsRate = netFlow / (totalIncome || 1);
      if (savingsRate >= 0.3) savingsScore = 20;
      else if (savingsRate >= 0.2) savingsScore = 15;
      else if (savingsRate >= 0.1) savingsScore = 10;
      else savingsScore = 5;
    } else {
      const burnRate = Math.abs(netFlow) / (user.balance || 1);
      if (burnRate >= 0.5) savingsScore = 0;
      else if (burnRate >= 0.3) savingsScore = 3;
      else if (burnRate >= 0.1) savingsScore = 5;
      else savingsScore = 8;
    }

    // Consistency component (20% of total score)
    let consistencyScore = 10; // Default

    if (expenses.length >= 2) {
      const expenseAmounts = expenses.map((t) => Math.abs(t.amount));
      const avgExpense =
        expenseAmounts.reduce((sum, amount) => sum + amount, 0) /
        expenseAmounts.length;
      const variance =
        expenseAmounts.reduce(
          (sum, amount) => sum + Math.pow(amount - avgExpense, 2),
          0
        ) / expenseAmounts.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / (avgExpense || 1);

      if (cv < 0.2) consistencyScore = 20;
      else if (cv < 0.4) consistencyScore = 15;
      else if (cv < 0.6) consistencyScore = 10;
      else if (cv < 0.8) consistencyScore = 5;
      else consistencyScore = 0;
    }

    return { balanceScore, transactionScore, savingsScore, consistencyScore };
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 pb-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Financial Health Score
            </h2>
            <button
              onClick={() => setShowTransactionForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Your overall financial wellness indicator (updated weekly)
          </p>
        </div>
        <div className="p-4">
          <div className="flex flex-col items-center py-6">
            {/* Circular Progress Bar */}
            <div className="relative w-48 h-48 mb-6">
              <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
              <div
                className={`absolute inset-0 rounded-full border-8 ${getHealthColor()} border-opacity-90`}
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
                  transform: `rotate(${score * 3.6}deg)`,
                }}
              ></div>
              <div className="absolute inset-4 rounded-full bg-white flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{score}</span>
                <span className="text-sm text-gray-500">out of 100</span>
              </div>
            </div>

            {/* Status and Message */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold mb-2">
                {getHealthStatus()} Financial Health
              </h3>
              <p className="text-gray-600 max-w-md mb-4">
                {getDetailedHealthMessage()}
              </p>
            </div>

            {/* Details Toggle Button */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              {showDetails ? "Hide Details" : "Show Details"}
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Detailed Breakdown */}
            {showDetails && (
              <div className="w-full mt-6 space-y-4">
                <h4 className="font-medium text-lg">Score Components</h4>

                {/* Balance Component */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Account Balance</span>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="font-semibold">{balanceScore}/40</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${(balanceScore / 40) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {getComponentMessage("balance", balanceScore)}
                  </p>
                </div>

                {/* Transaction Component */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Income vs. Expenses</span>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="font-semibold">{transactionScore}/20</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: `${(transactionScore / 20) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {getComponentMessage("transaction", transactionScore)}
                  </p>
                </div>

                {/* Savings Component */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Savings Potential</span>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="font-semibold">{savingsScore}/20</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${(savingsScore / 20) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {getComponentMessage("savings", savingsScore)}
                  </p>
                </div>

                {/* Consistency Component */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Spending Consistency</span>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="font-semibold">{consistencyScore}/20</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-yellow-500 h-full rounded-full"
                      style={{ width: `${(consistencyScore / 20) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {getComponentMessage("consistency", consistencyScore)}
                  </p>
                </div>

                {/* Improvement Tips */}
                <div className="mt-6">
                  <h4 className="font-medium text-lg mb-3">Improvement Tips</h4>
                  <ul className="space-y-2 text-gray-700">
                    {balanceScore < 30 && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>
                          Aim to build your emergency fund to at least $1,000,
                          then gradually increase it to 3-6 months of expenses.
                        </span>
                      </li>
                    )}
                    {transactionScore < 15 && (
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">•</span>
                        <span>
                          Look for ways to increase income or reduce
                          non-essential expenses to improve your
                          income-to-expense ratio.
                        </span>
                      </li>
                    )}
                    {savingsScore < 10 && (
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 font-bold">•</span>
                        <span>
                          Try to save at least 10% of your income each month by
                          setting up automatic transfers.
                        </span>
                      </li>
                    )}
                    {consistencyScore < 15 && (
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500 font-bold">•</span>
                        <span>
                          Create a budget to maintain more consistent spending
                          patterns and avoid large unexpected expenses.
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Section with Impulse Purchase indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Recent Transactions
          </h2>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const reversedTransactions: Transaction[] = [
                      ...transactions,
                    ].reverse();
                    return reversedTransactions
                      .slice(0, 5)
                      .map((transaction: Transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <span>{transaction.description}</span>
                              {transaction.type === "expense" &&
                                transaction.Impulse_Tag && (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center">
                                    <Zap className="w-3 h-3 mr-1" />
                                    impulsive
                                  </span>
                                )}
                            </div>
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              transaction.type === "income"
                                ? "text-green-600 font-semibold"
                                : "text-red-600 font-semibold"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}$
                            {Math.abs(transaction.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100">
                              {transaction.category}
                            </span>
                          </td>
                        </tr>
                      ));
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions found.</p>
              <button
                onClick={() => setShowTransactionForm(true)}
                className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Add Your First Transaction
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FinancialHealthScore;
