import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, MessageSquare, LayoutDashboard, BarChart3 } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '資料集', icon: Database },
    { path: '/chat', label: 'AI 對話', icon: MessageSquare },
    { path: '/dashboard', label: '儀表板', icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white p-6 shadow-xl z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <BarChart3 className="w-8 h-8 text-blue-400" />
        <span className="text-xl font-bold tracking-tight">AI Data Platform</span>
      </div>
      
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="absolute bottom-8 left-6 right-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">MVP Version</p>
        <p className="text-sm text-slate-300">AI Analysis</p>
      </div>
    </nav>
  );
};

export default Navbar;
