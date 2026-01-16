import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Map as MapIcon, 
  ShieldAlert, 
  Users, 
  Package,
  ClipboardList,
  RadioTower,
  LogOut, 
  Settings,
  Bell
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const DashboardLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiredScope: null }, 
    { name: 'My Reports', href: '/dashboard/reports', icon: ShieldAlert, requiredScope: 'incident:create' }, 
    { name: 'Task Board', href: '/dashboard/tasks', icon: ClipboardList, requiredScope: 'task:accept' },
    { name: 'Command Center', href: '/dashboard/command', icon: RadioTower, requiredScope: 'incident:verify' },
    { name: 'Incidents Map', href: '/dashboard/map', icon: MapIcon, requiredScope: 'incident:read' },
    { name: 'Resources', href: '/dashboard/resources', icon: Package, requiredScope: 'incident:read' },
    { name: 'User Management', href: '/dashboard/users', icon: Users, requiredScope: 'user:read' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-slate-800",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center px-6 font-bold text-xl tracking-wider text-blue-500 bg-slate-950/50 backdrop-blur-sm">
          ResQ<span className="text-white">System</span>
        </div>

        <div className="flex flex-col justify-between h-[calc(100%-4rem)]">
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {navigation.map((item) => {
              if (item.requiredScope && !hasPermission(item.requiredScope)) return null;

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden",
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn(
                        "w-5 h-5 mr-3 transition-colors",
                         isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"
                      )} />
                      {item.name}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-900/30">
            <div className="flex items-center mb-4 px-2 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-white max-w-[140px] truncate">{user?.email}</p>
                <p className="text-xs text-slate-400 truncate">
                   {user?.scopes?.includes('admin:access') ? 'Administrator' : 'Responder'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen bg-slate-50/50">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white/80 backdrop-blur-md px-6 shadow-sm border-b border-slate-200/60">
          <button
            type="button"
            className="text-slate-500 hover:text-slate-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center ml-auto space-x-6">
             <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors outline-none"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="font-semibold text-slate-900">Notifications</h3>
                      <button className="text-xs text-blue-600 font-medium hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <div className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex gap-3">
                            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                            <div>
                                <p className="text-sm text-slate-800 font-medium">Welcome to ResQ</p>
                                <p className="text-xs text-slate-500 mt-1">Thank you for joining our disaster response network.</p>
                                <p className="text-[10px] text-slate-400 mt-2">Just now</p>
                            </div>
                          </div>
                      </div>
                      <div className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex gap-3">
                            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-transparent" />
                            <div>
                                <p className="text-sm text-slate-800 font-medium">System Ready</p>
                                <p className="text-xs text-slate-500 mt-1">All systems are operational and ready for deployment.</p>
                                <p className="text-[10px] text-slate-400 mt-2">2 hours ago</p>
                            </div>
                          </div>
                      </div>
                    </div>
                  </div>
                )}
             </div>
             
             <div className="h-6 w-px bg-slate-200" />
             
             <div className="flex items-center space-x-3 relative">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                </div>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold hover:ring-2 hover:ring-blue-200 transition-all outline-none"
                >
                    {user?.email?.charAt(0).toUpperCase()}
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-slate-50 sm:hidden">
                       <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                       <p className="text-xs text-slate-500 capitalize">{user?.roles?.[0]?.name || 'User'}</p>
                    </div>
                    <Link 
                      to="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                )}
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
