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
} from "lucide-react";

interface Transaction {
  _id: string;
  Description: string;
  Amount: number;
  Date: string;
  Category: string;
  is_Need: string;
  Time_of_Day: string;
  Payment_Mode: string;
  Impulse_Tag: boolean;
  free_impulse_purchase?: boolean;
  User_ID: string;
  Source_App?: string;
  // UI helper fields
  type?: "income" | "expense";
  status?: "completed" | "pending";
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  completedStreaks: number;
  freeImpulsePurchases: number;
  activeVouchers: Voucher[];
  usedVouchers: Voucher[];
  lastNonImpulseDate?: string;
}

interface Voucher {
  _id: string;
  voucherType: "weekly" | "monthly";
  earnedAt: string;
  used: boolean;
  expiresAt: string;
}

interface DashboardData {
  financialStats: {
    totalExpenses: number;
    impulseExpenses: number;
    nonImpulseExpenses: number;
    totalAmount: number;
    impulseAmount: number;
    nonImpulseAmount: number;
    impulsePercentage: number;
    savedAmount: number;
    categoryBreakdown: any[];
  };
  streakInfo: {
    currentStreakEmoji: string;
    streakProgress: string;
    streakProgressPercent: number;
    nextMilestone: number;
    completedStreaks: number;
    freeImpulsePurchases: number;
    activeVouchers: number;
    freeImpulseProgress: string;
    freeImpulseProgressPercent: number;
    longestStreak: number;
  };
  recentTransactions: Transaction[];
  monthlyTrends: {
    month: string;
    totalSpent: number;
    impulseSpent: number;
    nonImpulseSpent: number;
    impulsePct: string;
  }[];
  rewards: {
    activeVouchers: Voucher[];
    freeImpulsePurchases: number;
  };
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
  Impulse_Tag: boolean;
}

type TabType = "dashboard" | "transactions" | "chat";

export default function Dashboard(): JSX.Element {
  const [score, setScore] = useState<number>(72);
  const [loading, setLoading] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile>({
    name: "Loading...",
    email: "loading@example.com",
    memberSince: "Loading...",
    lastLogin: "Loading...",
    balance: 0, // Initialize with zero balance
  });

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
    Date: new Date().toISOString().split("T")[0],
    Category: "",
    is_Need: "Need",
    Time_of_Day: "Morning",
    Payment_Mode: "UPI",
    Impulse_Tag: false,
  });

  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    completedStreaks: 0,
    freeImpulsePurchases: 0,
    activeVouchers: [],
    usedVouchers: [],
  });

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(true);
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [usingFreeImpulse, setUsingFreeImpulse] = useState<boolean>(false);

  // External chat URL
  const externalChatUrl = "https://example.com/financial-chat";

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
        setBalance(data.balance); // 👈 update your frontend state
      }
    } catch (error) {
      console.error("Error in handleAddMoney:", error);
    }
  };

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
    setTransactionsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await fetch("/api/expenses/my-expenses", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          // Transform backend data to match Transaction interface
          const formattedTransactions = data.expenses?.map((item: any) => ({
            _id: item._id,
            Description: item.Description,
            Amount: item.Amount,
            Date: item.Date,
            Category: item.Category,
            is_Need: item.is_Need,
            Time_of_Day: item.Time_of_Day,
            Payment_Mode: item.Payment_Mode,
            Impulse_Tag: item.Impulse_Tag,
            User_ID: item.User_ID,
            Source_App: item.Source_App,
            // Add these properties for UI display
            type: "expense", // Assume expenses by default
            status: "completed", // Default status
          })) || [];
          setTransactions(formattedTransactions);
        } else {
          console.error("Failed to fetch transactions");
        }
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Fetch comprehensive dashboard data
  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await fetch("/api/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDashboardData(data);

            // Update score based on financial health
            const impulsePct = data.financialStats.impulsePercentage;
            const newScore = Math.max(0, 100 - impulsePct * 1.5);
            setScore(Math.round(newScore));
          }
        } else {
          console.error("Failed to fetch dashboard data");
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Fetch streak data
  const fetchStreakData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await fetch("/api/streaks/mystreak", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.streak) {
            setStreakData({
              currentStreak: data.streak.currentStreak,
              longestStreak: data.streak.longestStreak,
              completedStreaks: data.streak.completedStreaks,
              freeImpulsePurchases: data.streak.freeImpulsePurchases,
              activeVouchers:
                data.streak.vouchersEarned?.filter(
                  (v: Voucher) =>
                    !v.used && new Date(v.expiresAt) > new Date()
                ) || [],
              usedVouchers:
                data.streak.vouchersEarned?.filter((v: Voucher) => v.used) ||
                [],
            });
          }
        }
      }
    } catch (err) {
      console.error("Error fetching streak data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchStreakData();
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

  const toggleFreeImpulse = () => {
    setUsingFreeImpulse(!usingFreeImpulse);
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      // Convert amount to negative for expenses
      const expenseAmount = -Math.abs(Number(formData.Amount));

      // Check if user has sufficient balance (skip check if using free impulse)
      if (!usingFreeImpulse && user.balance + expenseAmount < 0) {
        alert("Insufficient balance for this transaction.");
        setFormSubmitting(false);
        return;
      }

      const formattedData = {
        ...formData,
        Amount: expenseAmount,
        User_ID: user.email || "user@example.com",
        Source_App: "SpendWise",
        useFreeImpulse: formData.Impulse_Tag && usingFreeImpulse,
      };

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
          balance: data.expense?.Amount
            ? prevUser.balance + data.expense.Amount
            : prevUser.balance,
        }));

        // Check if a reward was earned
        if (data.reward) {
          alert(`${data.reward.message}`);
        }

        // Reset form
        setFormData({
          Description: "",
          Amount: 0,
          Date: new Date().toISOString().split("T")[0],
          Category: "",
          is_Need: "Need",
          Time_of_Day: "Morning",
          Payment_Mode: "UPI",
          Impulse_Tag: false,
        });

        // Reset free impulse state
        setUsingFreeImpulse(false);

        // Close the form and refresh transactions
        setShowTransactionForm(false);
        fetchTransactions();
        fetchStreakData();
        fetchDashboardData();

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

  const useVoucher = async (voucherId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/streaks/use-voucher/${voucherId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update streak data to reflect voucher usage
          fetchStreakData();
          alert("Voucher used successfully!");
          setSelectedVoucher(null);
        }
      } else {
        const error = await response.json();
        alert(error.message || "Failed to use voucher");
      }
    } catch (err) {
      console.error("Error using voucher:", err);
      alert("Error using voucher. Please try again.");
    }
  };

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
              <button className="w-full text-left px-4 py-2 rounded-md flex items-center hover:bg-gray-100 text-gray-700">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </button>
              <button
                className="w-full text-left px-4 py-2 rounded-md flex items-center hover:bg-gray-100 text-gray-700"
                onClick={redirectToChat}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Financial Chat
              </button>
              <button className="w-full text-left px-4 py-2 rounded-md flex items-center hover:bg-gray-100 text-gray-700">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>

          {/* Challenges Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 pb-0">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Your Challenges
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{challenge.title}</h4>
                    <span className="text-xs text-gray-500">
                      {challenge.reward}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        challenge.active ? "bg-blue-500" : "bg-green-500"
                      }`}
                      style={{ width: `${challenge.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{challenge.progress}% complete</span>
                    <span>{challenge.active ? "Active" : "Completed"}</span>
                  </div>
                </div>
              ))}
              <button className="w-full py-2 px-4 mt-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
                View All Challenges
              </button>
            </div>
          </div>
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
                      <input
                        type="text"
                        name="Category"
                        value={formData.Category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="E.g., Food, Transport"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Need/Want
                      </label>
                      <select
                        name="is_Need"
                        value={formData.is_Need}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                    <div className="space-y-2 flex items-center">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          name="Impulse_Tag"
                          checked={formData.Impulse_Tag}
                          onChange={handleInputChange}
                          className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        Impulse Purchase
                      </label>
                    </div>

                    <div className="space-y-2 flex items-center">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          name="useFreeImpulse"
                          checked={usingFreeImpulse}
                          onChange={toggleFreeImpulse}
                          className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        Use Free Impulse
                      </label>
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                          transform: `rotate(${score * 1.8}deg)`,
                        }}
                      ></div>
                      <div className="absolute inset-4 rounded-full bg-white flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold">{score}</span>
                        <span className="text-sm text-gray-500">
                          out of 100
                        </span>
                      </div>
                    </div>

                    {/* Status and Action Buttons */}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold mb-2">
                        {getHealthStatus()} Health
                      </h3>
                      <p className="text-gray-600 max-w-md mb-4">
                        {score >= 80
                          ? "Your finances are in excellent shape! Keep up the good habits."
                          : score >= 60
                          ? "You're doing well, but there's room for improvement in some areas."
                          : score >= 40
                          ? "Your finances need attention. Consider reviewing your budget."
                          : "Your finances require immediate attention. Seek financial advice if needed."}
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={refreshScore}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? "Refreshing..." : "Refresh Score"}
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Streak Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 pb-0">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    Your Impulse Streak
                  </h2>
                </div>
                <div className="p-4">
                  <div className="flex flex-col items-center text-center">
                    {/* Streak Circle */}
                    <div className="relative w-32 h-32 mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                      <div
                        className="absolute inset-0 rounded-full border-4 border-blue-500"
                        style={{
                          clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
                          transform: `rotate(${(streakData.currentStreak / 7) * 360}deg)`,
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold">
                          {streakData.currentStreak}
                        </span>
                        <span className="text-xs text-gray-500">day streak</span>
                      </div>
                    </div>

                    {/* Streak Info */}
                    <div className="space-y-2 w-full">
                      <div className="flex justify-between text-sm">
                        <span>Current Streak:</span>
                        <span className="font-semibold">
                          {streakData.currentStreak} days
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Longest Streak:</span>
                        <span className="font-semibold">
                          {streakData.longestStreak} days
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Completed Streaks:</span>
                        <span className="font-semibold">
                          {streakData.completedStreaks}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Next Milestone:</span>
                        <span className="font-semibold">
                          {7 - (streakData.currentStreak % 7)} days
                        </span>
                      </div>

                      {/* Progress to Next Weekly Streak */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress to weekly reward</span>
                          <span>{streakData.currentStreak}/7 days</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{
                              width: `${Math.min(
                                (streakData.currentStreak / 7) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Progress to Free Impulse Purchase */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress to free impulse</span>
                          <span>
                            {streakData.completedStreaks % 3}/3 streaks
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{
                              width: `${
                                ((streakData.completedStreaks % 3) / 3) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 pb-0">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Your Rewards
                  </h2>
                </div>
                <div className="p-4">
                  {/* Free Impulse Purchases */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        Free Impulse Purchases
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {streakData.freeImpulsePurchases} available
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Use these to make impulse purchases without breaking your
                      streak
                    </p>
                  </div>

                  {/* Vouchers */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Vouchers</span>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {streakData.activeVouchers.length} available
                      </span>
                    </div>

                    {streakData.activeVouchers.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Complete a 7-day streak to earn vouchers
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {streakData.activeVouchers
                          .slice(0, 2)
                          .map((voucher) => (
                            <div
                              key={voucher._id}
                              className="p-2 border border-blue-200 rounded-md bg-blue-50 flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium text-sm">
                                  {voucher.voucherType === "weekly"
                                    ? "Weekly Streak Voucher"
                                    : "Monthly Voucher"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Expires:{" "}
                                  {new Date(
                                    voucher.expiresAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedVoucher(voucher);
                                  setShowRewardModal(true);
                                }}
                                className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                              >
                                Use
                              </button>
                            </div>
                          ))}
                        {streakData.activeVouchers.length > 2 && (
                          <button
                            className="w-full text-blue-500 text-sm"
                            onClick={() => setShowRewardModal(true)}
                          >
                            View all {streakData.activeVouchers.length} vouchers
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Transactions Preview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 pb-0">
                  <h2 className="text-xl font-semibold">Recent Transactions</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Your most recent financial activity
                  </p>
                </div>
                <div className="p-4">
                  {transactionsLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className="h-16 bg-gray-200 rounded-lg"
                        ></div>
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
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
                      {transactions.slice(0, 3).map((transaction) => (
                        <div
                          key={transaction._id}
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
                                {transaction.Description || "Unnamed Transaction"}
                              </p>
                              <div className="flex gap-2 items-center mt-1">
                                <span className="text-xs text-gray-500">
                                  {transaction.Category || "Uncategorized"}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${getStatusColor(
                                    transaction.status || "completed"
                                  )}`}
                                >
                                  {transaction.status || "completed"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${getTypeColor(
                                transaction.type || "expense"
                              )}`}
                            >
                              {transaction.type === "income" ? "+" : "-"}$
                              {Math.abs(transaction.Amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <button
                        className="w-full mt-4 text-blue-500 hover:text-blue-600 py-2 font-medium"
                        onClick={() => setActiveTab("transactions")}
                      >
                        View All Transactions
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "transactions" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 pb-0">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">All Transactions</h2>
                  <button
                    onClick={() => setShowTransactionForm(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Transaction
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Your complete transaction history
                </p>
              </div>
              <div className="p-4">
                {transactionsLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className="h-16 bg-gray-200 rounded-lg"
                      ></div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
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
                    {transactions.map((transaction) => (
                      <div
                        key={transaction._id}
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
                              {transaction.Description}
                            </p>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-xs text-gray-500">
                                {transaction.Category}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(transaction.Date).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${getStatusColor(
                                  transaction.status || "completed"
                                )}`}
                              >
                                {transaction.status || "completed"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${getTypeColor(
                              transaction.type || "expense"
                            )}`}
                          >
                            {transaction.type === "income" ? "+" : "-"}$
                            {Math.abs(transaction.Amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rewards Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-xl font-semibold">Your Rewards</h3>
              <button
                onClick={() => setShowRewardModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Free Impulse Purchases */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-2">
                  Free Impulse Purchases
                </h4>
                <div className="flex justify-between items-center bg-green-50 rounded-lg p-4 border border-green-200">
                  <div>
                    <p className="font-medium">
                      {streakData.freeImpulsePurchases} Available
                    </p>
                    <p className="text-sm text-gray-600">
                      Use when adding an impulse transaction
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowRewardModal(false);
                      setShowTransactionForm(true);
                    }}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded-md"
                  >
                    Add Transaction
                  </button>
                </div>
              </div>

              {/* Active Vouchers */}
              <div>
                <h4 className="text-lg font-medium mb-2">Your Vouchers</h4>
                {streakData.activeVouchers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No active vouchers available
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {streakData.activeVouchers.map((voucher) => (
                      <div
                        key={voucher._id}
                        className={`p-3 rounded-lg border ${
                          selectedVoucher?._id === voucher._id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {voucher.voucherType === "weekly"
                                ? "Weekly Streak Voucher"
                                : "Monthly Challenge Voucher"}
                            </p>
                            <div className="flex gap-4 text-xs text-gray-500 mt-1">
                              <span>
                                Earned:{" "}
                                {new Date(voucher.earnedAt).toLocaleDateString()}
                              </span>
                              <span>
                                Expires:{" "}
                                {new Date(voucher.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => useVoucher(voucher._id)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md"
                          >
                            Use
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
