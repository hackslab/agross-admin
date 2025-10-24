import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import Home from "./components/pages/Home";
import Products from "./components/pages/Products";
import Category from "./components/pages/Category";
import Settings from "./components/pages/Settings";
import Countries from "./components/pages/Countries";
import Carousel from "./components/pages/Carousel";
import Units from "./components/pages/Units";
import { getAdminProfile, logoutAdmin, tokenManager } from "./services/api";

function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState<"superadmin" | "admin">("admin");
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Validate existing session on mount
    const validateSession = async () => {
      const token = tokenManager.get();
      const savedUserId = localStorage.getItem("userId");
      const savedUsername = localStorage.getItem("username");
      const savedRole = localStorage.getItem("userRole") as
        | "superadmin"
        | "admin";

      if (token && savedUserId && savedUsername && savedRole) {
        try {
          // Validate token with backend by fetching current profile
          // The getAdminProfile() function will decode the JWT and fetch the profile
          const profile = await getAdminProfile();

          // Token is valid, restore session
          setUsername(profile.username);
          setUserId(profile.id);
          setUserRole(profile.isSuperadmin ? "superadmin" : "admin");
          setIsLoggedIn(true);
        } catch (error) {
          // Token is invalid or expired, clear everything
          console.error("Session validation failed:", error);
          handleSessionExpired();
        }
      } else {
        // No complete session data found, clear any partial data
        if (token || savedUserId || savedUsername || savedRole) {
          handleSessionExpired();
        }
      }

      setIsValidatingSession(false);
    };

    validateSession();
  }, []);

  const handleLogin = (user: string, isSuperadmin: boolean, id: string) => {
    const role = isSuperadmin ? "superadmin" : "admin";

    // Update component state
    setUsername(user);
    setUserId(id);
    setUserRole(role);
    setIsLoggedIn(true);

    // Persist session data in localStorage for session restoration
    localStorage.setItem("username", user);
    localStorage.setItem("userId", id);
    localStorage.setItem("userRole", role);
  };

  const handleLogout = () => {
    // Clear token and all localStorage data
    logoutAdmin();
    localStorage.removeItem("userId");

    // Reset component state
    setIsLoggedIn(false);
    setUsername("");
    setUserId("");
    setUserRole("admin");
    setActiveSection("home");
  };

  const handleSessionExpired = () => {
    // Called when token validation fails (401 error)
    logoutAdmin();
    localStorage.removeItem("userId");

    // Reset component state
    setIsLoggedIn(false);
    setUsername("");
    setUserId("");
    setUserRole("admin");
    setActiveSection("home");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <Home />;
      case "products":
        return <Products />;
      case "category":
        return <Category />;
      case "settings":
        return (
          <Settings username={username} userRole={userRole} userId={userId} />
        );
      case "countries":
        return <Countries />;
      case "carousel":
        return <Carousel />;
      case "units":
        return <Units />;
      default:
        return <Home />;
    }
  };

  // Show loading spinner while validating session
  if (isValidatingSession) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1a1a2e] text-white text-lg">
        Yuklanmoqda...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Toaster position="bottom-right" richColors expand={false} closeButton />
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          username={username}
          userRole={userRole}
          onLogout={handleLogout}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Mobile header with hamburger menu */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 z-30 md:hidden">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-gray-800">
            Agross Admin
          </h1>
        </div>

        <main className="flex-1 min-h-screen md:ml-[260px] pt-16 md:pt-0">
          {renderContent()}
        </main>
      </div>
    </>
  );
}

export default App;
