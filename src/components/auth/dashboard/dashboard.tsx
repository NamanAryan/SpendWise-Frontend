import { useState, useEffect } from "react";
import {
  Shield,
  User,
  Home,
  CreditCard,
  PieChart,
  Settings,
  Bell,
  Trophy,
  LogOut,
  ExternalLink,
  Plus,
  X,
  FileText,
  BarChart,
} from "lucide-react";
import FinancialHealthScore from "./FinanceHealthCare";
interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: "income" | "expense";
  status: "completed" | "pending";
}
import { useNavigate } from "react-router-dom";

import ChallengesCard from "./Challenges";
import BudgetSummary from "./BudgetSummary";

interface Challenge {
  id: number;
  title: string;
  progress: number;
  reward: string;
  active: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  memberSince: string;
  lastLogin: string;
  address?: string;
  phone?: string;
  balance: number;
}

interface AddMoneyFormData {
  amount: number;
  source: string; // e.g., "Bank Transfer", "Credit Card", etc.
  notes?: string;
}

interface TransactionFormData {
  Description: string;
  Amount: number;
  Date: string;
  Category: string;
  is_Need: string;
  Time_of_Day: string;
  Payment_Mode: string;
  type: "income" | "expense";
  Impulse_Tag?: boolean; // Optional property for impulse prediction
}

export default function Dashboard(): JSX.Element {
  const [isNeed, setIsNeed] = useState("Need"); // default to "Need"

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [score, setScore] = useState<number>(0);
  type TabType = "dashboard" | "transactions" | "chat";
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile>({
    name: "Loading...",
    email: "loading@example.com",
    memberSince: "Loading...",
    lastLogin: "Loading...",
    balance: 0, // Initialize with zero balance
  });
  const navigate = useNavigate();
  const redirectToBudgetSummary = () => {
    navigate("/budget-summary");
  };

  const [showAddMoneyForm, setShowAddMoneyForm] = useState<boolean>(false);
  const [addMoneySubmitting, setAddMoneySubmitting] = useState<boolean>(false);
  const [addMoneyFormData, setAddMoneyFormData] = useState<AddMoneyFormData>({
    amount: 0,
    source: "Bank Transfer",
    notes: "",
  });

  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransactionForm, setShowTransactionForm] =
    useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    Description: "",
    Amount: 0,
    Date: "",
    Category: "",
    is_Need: "Need",
    Time_of_Day: "Morning",
    Payment_Mode: "",
    type: "expense", // or 'income' by default
  });

  // External chat URL
  const externalChatUrl = "https://client-two-woad-92.vercel.app/";

  const handleAddMoneyInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setAddMoneyFormData({
      ...addMoneyFormData,
      [name]: name === "amount" ? Number(value) : value,
    });
  };

  const calculateFinanceHealthScore = (
    balance: number,
    transactions: Array<any>
  ): number => {
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Get the 5 most recent transactions

    // Base score components
    let balanceScore = 0;
    let transactionScore = 0;
    let savingsScore = 0;
    let consistencyScore = 0;

    // 1. Balance component (40% of total score)
    if (balance >= 5000) balanceScore = 40;
    else if (balance >= 3000) balanceScore = 30;
    else if (balance >= 1000) balanceScore = 20;
    else if (balance >= 500) balanceScore = 10;
    else balanceScore = Math.max(5, Math.floor(balance / 100)); // 1 point per $100, minimum 5

    // 2. Transaction patterns (20% of total score)
    const incomes = recentTransactions.filter((t) => t.amount > 0);
    const expenses = recentTransactions.filter((t) => t.amount < 0);

    // Calculate income to expense ratio
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = Math.abs(
      expenses.reduce((sum, t) => sum + t.amount, 0) || 0
    );

    if (totalExpense === 0) {
      transactionScore = 20; // No expenses is great for the score
    } else {
      const ratio = totalIncome / totalExpense;
      if (ratio >= 1.5) transactionScore = 20;
      else if (ratio >= 1.2) transactionScore = 15;
      else if (ratio >= 1.0) transactionScore = 10;
      else if (ratio >= 0.8) transactionScore = 5;
      else transactionScore = 0;
    }

    // 3. Savings potential (20% of total score)
    // Net flow from recent transactions
    const netFlow = recentTransactions.reduce((sum, t) => sum + t.amount, 0);

    if (netFlow > 0) {
      // Positive flow indicates savings
      const savingsRate = netFlow / (totalIncome || 1); // Avoid division by zero
      if (savingsRate >= 0.3) savingsScore = 20;
      else if (savingsRate >= 0.2) savingsScore = 15;
      else if (savingsRate >= 0.1) savingsScore = 10;
      else savingsScore = 5;
    } else {
      // Negative flow - reduce score based on severity
      const burnRate = Math.abs(netFlow) / (balance || 1); // Avoid division by zero
      if (burnRate >= 0.5) savingsScore = 0;
      else if (burnRate >= 0.3) savingsScore = 3;
      else if (burnRate >= 0.1) savingsScore = 5;
      else savingsScore = 8;
    }

    // 4. Consistency score (20% of total score)
    if (recentTransactions.length >= 3) {
      // Check spending consistency
      const expenseAmounts = expenses.map((t) => Math.abs(t.amount));

      if (expenseAmounts.length >= 2) {
        const avgExpense =
          expenseAmounts.reduce((sum, amount) => sum + amount, 0) /
          expenseAmounts.length;
        const variance =
          expenseAmounts.reduce(
            (sum, amount) => sum + Math.pow(amount - avgExpense, 2),
            0
          ) / expenseAmounts.length;
        const stdDev = Math.sqrt(variance);

        // Calculate coefficient of variation (lower is more consistent)
        const cv = stdDev / (avgExpense || 1); // Avoid division by zero

        if (cv < 0.2) consistencyScore = 20; // Very consistent spending
        else if (cv < 0.4) consistencyScore = 15;
        else if (cv < 0.6) consistencyScore = 10;
        else if (cv < 0.8) consistencyScore = 5;
        else consistencyScore = 0; // Very inconsistent spending
      } else {
        consistencyScore = 10; // Not enough expense data for consistency
      }
    } else {
      consistencyScore = 10; // Not enough transaction data for consistency
    }

    // Calculate final score (sum of all components)
    const finalScore =
      balanceScore + transactionScore + savingsScore + consistencyScore;

    // Clamp the score between 0 and 100
    return Math.max(0, Math.min(100, finalScore));
  };

  // 2. Replace your existing useEffect for score calculation

  useEffect(() => {
    if (transactions.length > 0 || user.balance !== undefined) {
      const newScore = calculateFinanceHealthScore(user.balance, transactions);
      setScore(newScore);
    }
  }, [transactions, user.balance]);

  // 3. Create a function to get detailed score breakdown
  const getScoreBreakdown = (): {
    balanceScore: number;
    transactionScore: number;
    savingsScore: number;
    consistencyScore: number;
  } => {
    // Calculate component scores for display purposes
    let balanceScore = 0;
    if (user.balance >= 5000) balanceScore = 40;
    else if (user.balance >= 3000) balanceScore = 30;
    else if (user.balance >= 1000) balanceScore = 20;
    else if (user.balance >= 500) balanceScore = 10;
    else balanceScore = Math.max(5, Math.floor(user.balance / 100));

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const incomes = recentTransactions.filter((t) => t.amount > 0);
    const expenses = recentTransactions.filter((t) => t.amount < 0);

    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = Math.abs(
      expenses.reduce((sum, t) => sum + t.amount, 0) || 0
    );

    // Calculate transaction score
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

    // Calculate savings score
    let savingsScore = 0;
    const netFlow = recentTransactions.reduce((sum, t) => sum + t.amount, 0);

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

    // Calculate consistency score
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
  };

  // 4. Enhanced getHealthStatus function with more detailed messages
  // Removed duplicate declaration of getHealthStatus

  // 5. Function to get detailed health message

  // Add this to your useEffect section
  useEffect(() => {
    if (transactions.length > 0 && user.balance !== undefined) {
      const newScore = calculateFinanceHealthScore(user.balance, transactions);
      setScore(newScore);
    }
  }, [transactions, user.balance]);

  const handleAddMoney = async (amount: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No auth token found.");
        return;
      }

      const response = await fetch("/api/expenses/balance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newBalance: amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to update balance:", data.message);
      } else {
        console.log("Balance updated successfully:", data.balance);
        setBalance(data.balance); // update UI state
        window.location.reload(); //
      }
    } catch (error) {
      console.error("Error in handleAddMoney:", error);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    if (userData && typeof userData.balalnce === "number") {
      setBalance(userData.balalnce); // Use correct spelling if it's "balance"
    }
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      setUserLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        console.log("Token available:", !!token);

        // Default user with zero balance
        setUser({
          name: "User",
          email: "user@example.com",
          memberSince: new Date().toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          lastLogin: "Just now",
          address: "",
          phone: "",
          balance: 0,
        });

        if (token) {
          try {
            const response = await fetch("/api/users/profile", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });

            console.log("API response status:", response.status);

            const rawText = await response.text();

            if (
              rawText.trim().startsWith("{") ||
              rawText.trim().startsWith("[")
            ) {
              try {
                const data = JSON.parse(rawText);
                console.log("Successfully parsed user data:", data);

                if (data && data.user) {
                  const joinDate = new Date(data.user.createdAt || Date.now());

                  setUser({
                    name: data.user.fullName || "",
                    email: data.user.email || "",
                    memberSince: joinDate.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    }),
                    lastLogin: "Just now",
                    address: data.user.address || "",
                    phone: data.user.phone ? data.user.phone.toString() : "",
                    balance: data.user.balance || 0,
                  });
                } else {
                  console.warn(
                    "API response missing expected user data structure:",
                    data
                  );
                }
              } catch (jsonError) {
                console.error("Error parsing response as JSON:", jsonError);
              }
            } else {
              console.warn(
                "API response is not JSON format:",
                rawText.substring(0, 100)
              );
            }
          } catch (apiError) {
            console.error("API request failed:", apiError);
          }
        }
      } catch (err) {
        console.error("Error in profile loading:", err);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/expenses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Raw transaction data from API:", data[0]);
        const formatted = data.map((item: any) => ({
          id: item._id,
          description: item.Description,
          amount: item.Amount,
          date: item.Date,
          category: item.Category,
          type: item.Amount > 0 ? "income" : "expense",
          Impulse_Tag: item.Impulse_Tag,
        }));
        console.log("Fetched transactions:", formatted);

        setTransactions(formatted);
      } else {
        console.error("Failed to fetch transactions");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if the transaction is a 'Want'
    if (formData.is_Need === "Want") {
      const confirmPurchase = window.confirm(
        "This is an impulsive purchase. Are you sure you want to proceed?"
      );

      // If user cancels, stop submission
      if (!confirmPurchase) {
        return;
      }
    }

    setFormSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      // Determine if it's an expense or income
      const isExpense = formData.type === "expense";
      // Make amount negative for expense, positive for income
      const adjustedAmount = isExpense
        ? -Math.abs(Number(formData.Amount))
        : Math.abs(Number(formData.Amount));
      // Check balance only for expenses
      if (isExpense && user.balance + adjustedAmount < 0) {
        alert("Insufficient balance for this transaction.");
        setFormSubmitting(false);
        return;
      }
      // Create formatted data with base fields
      let formattedData = {
        ...formData,
        Amount: adjustedAmount,
        User_ID: user.email || "user@example.com",
        Source_App: "FinanceApp",
      };
      // Predict impulse purchase only for expenses
      if (isExpense) {
        const isImpulse = predictImpulseSimple(formattedData);
        formattedData = {
          ...formattedData,
          Impulse_Tag: isImpulse,
        };
      }
      console.log("Submitting transaction data:", formattedData);
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(formattedData),
      });
      console.log("Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        // Update user balance in state
        setUser((prevUser) => ({
          ...prevUser,
          balance: data.newBalance,
        }));
        // Reset form
        setFormData({
          Description: "",
          Amount: 0,
          Date: new Date().toISOString().split("T")[0],
          Category: "",
          is_Need: "Need",
          Time_of_Day: "Morning",
          Payment_Mode: "UPI",
          type: "expense", // default to expense
        });
        // Close form and refresh data
        setShowTransactionForm(false);
        fetchTransactions();
        alert("Transaction added successfully!");
      } else {
        const errorData = await response.text();
        console.error("Server error:", errorData);
        alert(
          `Failed to add transaction: ${response.status} ${response.statusText}`
        );
      }
    } catch (err) {
      console.error("Error submitting transaction:", err);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Add the impulse prediction function
  function predictImpulseSimple(transaction: any): boolean {
    const categoryRisk: { [key: string]: number } = {
      Shopping: 0.7,
      Entertainment: 0.8,
      Dining: 0.6,
      Travel: 0.5,
      Health: 0.1,
      Groceries: 0.2,
      Utilities: 0.1,
      Income: 0.0,
    };

    const timeRiskMap: { [key: string]: number } = {
      Night: 0.7,
      Evening: 0.5,
      Afternoon: 0.3,
      Morning: 0.2,
    };

    // Get the base risks
    const catRisk = categoryRisk[transaction.Category] || 0.5;
    const timeRisk = timeRiskMap[transaction.Time_of_Day] || 0.3;

    // Calculate amount factor - higher risk for larger amounts
    const amount = Math.abs(transaction.Amount);
    const amountFactor = amount > 5000 ? 0.6 : 0.3;

    // Need vs Want factor
    const needFactor = transaction.is_Need === "Need" ? 0.2 : 0.7;

    // Weekend factor
    const date = new Date(transaction.Date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const weekendFactor = isWeekend ? 0.6 : 0.4;

    // Calculate weighted impulse score
    const impulseScore =
      catRisk * 0.3 +
      timeRisk * 0.15 +
      amountFactor * 0.2 +
      needFactor * 0.25 +
      weekendFactor * 0.1;

    console.log("Impulse prediction factors:", {
      category: transaction.Category,
      catRisk,
      timeRisk,
      amountFactor,
      needFactor,
      weekendFactor,
      impulseScore,
    });

    // Return true if the score is above threshold
    return impulseScore > 0.5;
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  const redirectToChat = () => {
    window.open(externalChatUrl, "_blank");
  };

  const challenges: Challenge[] = [
    {
      id: 1,
      title: "No Spend Weekend",
      progress: 65,
      reward: "50 points",
      active: true,
    },
    {
      id: 2,
      title: "Save $200 This Month",
      progress: 40,
      reward: "75 points",
      active: true,
    },
    {
      id: 3,
      title: "Track All Expenses",
      progress: 100,
      reward: "30 points",
      active: false,
    },
    {
      id: 4,
      title: "Increase Credit Score",
      progress: 25,
      reward: "100 points",
      active: true,
    },
  ];

  // Helper functions
  const getHealthStatus = (): string => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const getHealthColor = (): string => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTypeColor = (type: string): string => {
    return type === "income" ? "text-green-600" : "text-red-600";
  };

  const getStatusColor = (status: string): string => {
    return status === "completed"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  };

  const refreshScore = (): void => {
    setLoading(true);
    setTimeout(() => {
      setScore(Math.floor(Math.random() * 100));
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - User Profile, Navigation, and Challenges */}
        <div className="lg:col-span-1 space-y-4">
          {/* User Profile Card */}

          {/* Add Money Form Modal */}
          {showAddMoneyForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center border-b p-4">
                  <h3 className="text-xl font-semibold">
                    Add Money to Account
                  </h3>
                  <button
                    onClick={() => setShowAddMoneyForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddMoney(addMoneyFormData.amount);
                  }}
                  className="p-6 space-y-4"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          name="amount"
                          value={addMoneyFormData.amount}
                          onChange={handleAddMoneyInputChange}
                          required
                          min="0.01"
                          step="0.01"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddMoneyForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addMoneySubmitting}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium disabled:opacity-50"
                    >
                      {addMoneySubmitting ? "Processing..." : "Add Money"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Updated User Profile Card with Balance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mb-4 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
                {userLoading ? (
                  <div className="animate-pulse space-y-2 w-full">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-sm">{error}</div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>

                    {/* Balance Display */}
                    <div className="mt-4 mb-3 py-3 px-4 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-sm text-gray-600 mb-1">
                        Current Balance
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        ${user.balance.toFixed(2)}
                      </p>
                    </div>

                    {/* Add Money Button */}
                    <button
                      onClick={() => setShowAddMoneyForm(true)}
                      className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Set Balance
                    </button>

                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Member since {user.memberSince}</p>
                      <p>Last login {user.lastLogin}</p>
                      {user.phone && <p>Phone: {user.phone}</p>}
                      {user.address && <p>Address: {user.address}</p>}
                    </div>
                  </>
                )}

                {/* Always show logout button regardless of loading state */}
                <button
                  onClick={handleLogout}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 space-y-2">
              <button
                className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                  activeTab === "dashboard"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveTab("dashboard")}
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </button>
              <button
                className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                  activeTab === "transactions"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveTab("transactions")}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Transactions
              </button>
              <button className="w-full text-left px-4 py-2 rounded-md flex items-center hover:bg-gray-100 text-gray-700">
                <PieChart className="w-4 h-4 mr-2" />
                Analytics
              </button>
              <button
                className="w-full text-left px-4 py-2 rounded-md flex items-center hover:bg-gray-100 text-gray-700"
                onClick={redirectToChat}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Financial Chat
              </button>
              <a
                href="/budget-summary"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left px-4 py-2 rounded-md flex items-center hover:bg-gray-100 text-gray-700"
              >
                <BarChart className="w-4 h-4 mr-2" />
                Budget Summary
              </a>
            </div>
          </div>

          {/* Challenges Card */}
          <ChallengesCard />
          <BudgetSummary />
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Transaction Form */}
          {showTransactionForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center border-b p-4">
                  <h3 className="text-xl font-semibold">Add New Transaction</h3>
                  <button
                    onClick={() => setShowTransactionForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={handleSubmitTransaction}
                  className="p-6 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <input
                        type="text"
                        name="Description"
                        value={formData.Description}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="E.g., Grocery shopping"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <input
                        type="number"
                        name="Amount"
                        value={formData.Amount}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    {/* Transaction Type Dropdown */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Transaction Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Type</option>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <input
                        type="date"
                        name="Date"
                        value={formData.Date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        name="Category"
                        value={formData.Category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Category</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Dining">Dining</option>
                        <option value="Travel">Travel</option>
                        <option value="Health">Health</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Income">Income</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Need/Want
                      </label>
                      <select
                        value={isNeed}
                        onChange={(e) => {
                          const value = e.target.value;
                          setIsNeed(value);

                          // Show alert immediately if it's a "Want"
                          if (value === "Want") {
                            alert(
                              "⚠️ This is an impulsive purchase. Are you sure it's necessary?"
                            );
                          }
                        }}
                        className="border p-2 rounded"
                      >
                        <option value="Need">Need</option>
                        <option value="Want">Want</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Time of Day
                      </label>
                      <select
                        name="Time_of_Day"
                        value={formData.Time_of_Day}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                        <option value="Night">Night</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Mode
                      </label>
                      <input
                        type="text"
                        name="Payment_Mode"
                        value={formData.Payment_Mode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="E.g., UPI, Cash, Card"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTransactionForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium disabled:opacity-50"
                    >
                      {formSubmitting ? "Submitting..." : "Add Transaction"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <>
              {/* Financial Health Score */}
              <FinancialHealthScore
                score={score}
                getHealthStatus={getHealthStatus}
                getHealthColor={getHealthColor}
                user={user}
                transactions={transactions}
                setShowTransactionForm={setShowTransactionForm}
              />
            </>
          )}

          {activeTab === "transactions" && (
            <div className="p-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No transactions found</p>
                  <button
                    onClick={() => setShowTransactionForm(true)}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium"
                  >
                    Add Transaction
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...transactions].reverse().map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`flex justify-between items-center p-3 rounded-lg transition-colors ${
                        transaction.type === "income"
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-red-50 hover:bg-red-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            transaction.type === "income"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {transaction.description}
                          </p>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="text-xs text-gray-500">
                              {transaction.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${getStatusColor(
                                transaction.status
                              )}`}
                            >
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${getTypeColor(
                            transaction.type
                          )}`}
                        >
                          {transaction.type === "income" ? "+" : "-"}$
                          {Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
