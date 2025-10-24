import React, { useState } from "react";
import {
  Home,
  Package,
  BookOpen,
  Folder,
  FileText,
  Settings,
  Crown,
  User,
  Globe,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Ruler,
  X,
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  username: string;
  userRole: "superadmin" | "admin";
  onLogout: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
  username,
  userRole,
  onLogout,
  isMobileOpen,
  onMobileClose,
}) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    "catalog",
    "content",
  ]);

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    // Close mobile menu when a section is selected
    onMobileClose();
  };

  const allMenuItems: MenuItem[] = [
    {
      id: "home",
      label: "Bosh sahifa",
      icon: Home,
      roles: ["superadmin", "admin"],
    },
    {
      id: "products",
      label: "Mahsulotlar",
      icon: Package,
      roles: ["superadmin", "admin"],
    },
    {
      id: "catalog",
      label: "Katalog",
      icon: BookOpen,
      roles: ["superadmin", "admin"],
      children: [
        {
          id: "category",
          label: "Kategoriyalar",
          icon: Folder,
          roles: ["superadmin", "admin"],
        },
      ],
    },
    {
      id: "content",
      label: "Kontent",
      icon: FileText,
      roles: ["superadmin", "admin"],
      children: [
        {
          id: "carousel",
          label: "Karusel",
          icon: ImageIcon,
          roles: ["superadmin", "admin"],
        },
        {
          id: "countries",
          label: "Davlatlar",
          icon: Globe,
          roles: ["superadmin", "admin"],
        },
        {
          id: "units",
          label: "Birliklar",
          icon: Ruler,
          roles: ["superadmin", "admin"],
        },
      ],
    },
    {
      id: "settings",
      label: "Sozlamalar",
      icon: Settings,
      roles: ["superadmin", "admin"],
    },
  ];

  // Filter menu items based on user role
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter((item) => item.roles.includes(userRole))
      .map((item) => ({
        ...item,
        children: item.children ? filterMenuItems(item.children) : undefined,
      }));
  };

  const menuItems = filterMenuItems(allMenuItems);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  const isActiveOrHasActiveChild = (item: MenuItem): boolean => {
    if (item.id === activeSection) return true;
    if (item.children) {
      return item.children.some((child) => child.id === activeSection);
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem, isChild: boolean = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = isMenuExpanded(item.id);
    const isActive = isActiveOrHasActiveChild(item);

    if (hasChildren) {
      return (
        <div key={item.id} className="flex flex-col">
          <button
            className={`flex items-center px-6 py-4 bg-transparent border-none text-left text-base border-l-[3px] transition-all duration-300 ease-in-out cursor-pointer ${
              isActive
                ? "bg-white/15 text-white border-l-white"
                : "text-white/80 border-l-transparent hover:bg-white/10 hover:text-white"
            } ${isChild ? "pl-12 text-[0.95rem]" : ""}`}
            onClick={() => toggleMenu(item.id)}
          >
            <span
              className={`flex items-center justify-center ${
                isChild ? "mr-3" : "mr-4"
              }`}
            >
              <item.icon className={isChild ? "w-5 h-5" : "w-6 h-6"} />
            </span>
            <span className="font-medium flex-1">{item.label}</span>
            <span
              className={`ml-auto transition-transform duration-200 ${
                isExpanded ? "" : "rotate-0"
              }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          </button>
          {isExpanded && (
            <div className="flex flex-col bg-black/10">
              {item.children!.map((child) => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.id}
        className={`flex items-center px-6 py-4 bg-transparent border-none text-left text-base border-l-[3px] transition-all duration-300 ease-in-out cursor-pointer ${
          activeSection === item.id
            ? "bg-white/15 text-white border-l-white"
            : "text-white/80 border-l-transparent hover:bg-white/10 hover:text-white"
        } ${isChild ? "pl-12 text-[0.95rem]" : ""}`}
        onClick={() => handleSectionChange(item.id)}
      >
        <span
          className={`flex items-center justify-center ${
            isChild ? "mr-3" : "mr-4"
          }`}
        >
          <item.icon className={isChild ? "w-5 h-5" : "w-6 h-6"} />
        </span>
        <span className="font-medium flex-1">{item.label}</span>
      </button>
    );
  };

  // Display role text
  const roleText = userRole === "superadmin" ? "Super Admin" : "Administrator";
  const RoleIcon = userRole === "superadmin" ? Crown : User;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-[260px] h-screen bg-teal-700 text-white hidden md:flex flex-col fixed left-0 top-0 z-100 shadow-[2px_0_15px_rgba(0,0,0,0.08)] transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Close button for mobile */}
        <button
          className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors md:hidden"
          onClick={onMobileClose}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="px-6 py-8 border-b border-white/15">
          <h2 className="m-0 text-2xl font-semibold text-white">
            Agross Admin
          </h2>
        </div>
        <nav className="flex flex-col py-4 grow overflow-y-auto">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
        <div className="px-6 py-6 border-t border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <RoleIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-semibold text-white text-[0.95rem]">
                {username}
              </span>
              <span className="text-xs text-white/60">{roleText}</span>
            </div>
          </div>
          <button
            className="w-full px-4 py-2.5 bg-white/10 border-none rounded-md text-white cursor-pointer font-medium transition-all duration-200 hover:bg-white/15"
            onClick={onLogout}
          >
            Chiqish
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
