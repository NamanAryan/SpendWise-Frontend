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

// Update Transaction interface to match the backend model
interface Transaction {
  _id: string;
  Description: string;
  Amount: number;
  Date: string;
  Category: string;
  is_Need: "Need" | "Want";
  Time_of_Day: "Morning" | "Afternoon" | "Evening" | "Night";
  Payment_Mode: string;
  Impulse_Tag: boolean;
  free_impulse_purchase?: boolean;
  User_ID: string;
  Source_App?: string;
  created_at?: string;
}

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
}

// Update TransactionFormData interface
interface TransactionFormData {
  Description: string;
  Amount: number;
  Date: string;
  Category: string;
  is_Need: string;
  Time_of_Day: string;
  Payment_Mode: string;
  Impulse_Tag: boolean;
  useFreeImpulse?: boolean;
}

type TabType = "dashboard" | "transactions" | "chat";

export default function Dashboard(): JSX.Element {
  const [score, setScore] = useState<number>(72);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile>({
    name: "Loading...",
    email: "loading@example.com",
    memberSince: "Loading...",
    lastLogin: "Loading...",
  });
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    Description: "",
    Amount: 0,
    Date: new Date().toISOString().split('T')[0],
    Category: "",
    is_Need: "Need",
    Time_of_Day: "Morning",
    Payment_Mode: "UPI",
    Impulse_Tag: false
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(true);
  const [streakData, setStreakData] = useState<any>(null);
  const [streakLoading, setStreakLoading] = useState<boolean>(true);

  // External chat URL
  const externalChatUrl = "https://example.com/financial-chat";

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      setUserLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        
        if (token) {
          const response = await fetch("/api/users/profile", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data && data.user) {
            const joinDate = new Date(data.user.createdAt || data.user.created_at || Date.now());

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
            });
          }
        }
      } catch (err) {
        console.error("Error in profile loading:", err);
        setError("Failed to load profile data");
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Update fetchTransactions function to correctly map data
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
          setDashboardData(data);
          
          // Update score based on financial stats
          if (data.financialStats) {
            // Calculate score based on impulse vs non-impulse ratio
            const impulsePercentage = parseFloat(data.financialStats.impulsePercentage || "0");
            const newScore = Math.max(0, Math.min(100, 100 - impulsePercentage));
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

  const fetchStreakData = async () => {
    setStreakLoading(true);
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
          setStreakData(data.streak);
        } else {
          console.error("Failed to fetch streak data");
        }
      }
    } catch (err) {
      console.error("Error fetching streak data:", err);
    } finally {
      setStreakLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchTransactions();
    fetchStreakData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Update transaction submission to match backend expectations
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      const userData = {
        ...formData,
        Source_App: "FinanceApp"
      };
      
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        // Reset form
        setFormData({
          Description: "",
          Amount: 0,
          Date: new Date().toISOString().split('T')[0],
          Category: "",
          is_Need: "Need",
          Time_of_Day: "Morning",
          Payment_Mode: "UPI",
          Impulse_Tag: false
        });
        
        // Close the form
        setShowTransactionForm(false);
        
        // Refresh all data
        fetchTransactions();
        fetchDashboardData();
        fetchStreakData();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to add transaction. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting transaction:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleLogout = () => {
    try {
      // Just remove token and redirect - no need for API call
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const redirectToChat = () => {
    window.open(externalChatUrl, "_blank");
  };

  const useFreeImpulse = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await fetch("/api/streaks/use-free-impulse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        });
        
        if (response.ok) {
          // Refresh all data
          fetchStreakData();
          fetchDashboardData();
          alert("Free impulse purchase used successfully!");
        } else {
          const errorData = await response.json();
          alert(errorData.message || "Failed to use free impulse purchase.");
        }
      }
    } catch (err) {
      console.error("Error using free impulse purchase:", err);
    }
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
    fetchDashboardData()
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - User Profile, Navigation, and Challenges */}
        <div className="lg:col-span-1 space-y-4">
          {/* User Profile Card */}
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
                    <div className="mt-4 text-sm text-gray-500 space-y-1">
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
                
                <form onSubmit={handleSubmitTransaction} className="p-6 space-y-4">
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

                    {formData.Impulse_Tag && streakData && streakData.freeImpulsePurchases > 0 && (
                      <div className="space-y-2 flex items-center">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            name="useFreeImpulse"
                            checked={!!formData.useFreeImpulse}
                            onChange={handleInputChange}
                            className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          Use a free impulse purchase ({streakData.freeImpulsePurchases} available)
                        </label>
                      </div>
                    )}
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
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Your Streak Progress
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Track your non-impulse purchase streak
                  </p>
                </div>
                <div className="p-4">
                  {streakLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ) : !streakData ? (
                    <p className="text-center py-4 text-gray-500">No streak data available</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Current Streak</p>
                          <p className="text-2xl font-bold">{streakData.currentStreak} days</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Longest Streak</p>
                          <p className="text-2xl font-bold">{streakData.longestStreak} days</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Free Impulse Purchases</p>
                          <p className="text-2xl font-bold">{streakData.freeImpulsePurchases}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Progress to next reward</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min((streakData.currentStreak % 7) / 7 * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {7 - (streakData.currentStreak % 7)} more days until you earn a reward!
                        </p>
                      </div>
                    </div>
                  )}
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
                  {transactions && transactions.length > 0 ? (
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
                  ) : null}
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
                      <div key={n} className="h-16 bg-gray-200 rounded-lg"></div>
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
    </div>
  );
}