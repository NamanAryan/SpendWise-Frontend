import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./components/auth/login";
import Register from "./components/auth/register";
import Dashboard from "./components/auth/dashboard/dashboard";

const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  
  // Check if token has the correct format (contains two dots)
  if (!token.includes('.') || token.split('.').length !== 3) {
    return false;
  }
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const decodedToken = JSON.parse(jsonPayload);
    return decodedToken.exp * 1000 > Date.now();
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  const isValid = isTokenValid(token);
  return isValid ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const isValid = isTokenValid(token);
  return isValid ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);
  
  if (hasError) {
    return <div>Something went wrong. Please try again later.</div>;
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          {/* Root Route - Check auth and redirect accordingly */}
          <Route 
            path="/" 
            element={
              isTokenValid(localStorage.getItem("token")) ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Add more protected routes here as needed */}
          </Route>
       
          {/* Catch all - Redirect to login if not authenticated, dashboard if authenticated */}
          <Route 
            path="*" 
            element={
              isTokenValid(localStorage.getItem("token")) ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
};

export default App;