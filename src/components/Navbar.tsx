import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Home,
  PlusCircle,
  Repeat,
  MessageCircle,
  User,
  BarChart3,
  Bell,
  Menu,
  X,
  LogOut,
  Heart,
  SearchCheck,
  Package,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useMessageStore } from '@/store/messageStore';

const navLinks = [
  { path: '/', label: '首页', icon: Home },
  { path: '/publish', label: '发布', icon: PlusCircle },
  { path: '/exchange', label: '交换', icon: Repeat },
  { path: '/messages', label: '消息', icon: MessageCircle },
  { path: '/profile', label: '我的', icon: User },
  { path: '/dashboard', label: '统计', icon: BarChart3 },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { currentUser, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useMessageStore();

  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount(currentUser.id);
    }
  }, [currentUser, fetchUnreadCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center">
              <Repeat className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent hidden sm:block">
              易换物
            </span>
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md mx-8 relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索你想要的物品..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm input-focus transition-all"
            />
          </form>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              const hasBadge = link.path === '/messages' && unreadCount > 0;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-text-secondary hover:text-primary-500 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-primary-500 text-white text-xs font-bold rounded-full px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/messages')}
              className="lg:hidden relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-6 h-6 text-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[16px] h-[16px] flex items-center justify-center bg-primary-500 text-white text-xs font-bold rounded-full px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-9 h-9 rounded-full object-cover border-2 border-primary-100"
                  />
                  <span className="hidden md:block text-sm font-medium text-text-primary">
                    {currentUser.username}
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-text-primary">
                          {currentUser.username}
                        </p>
                        <p className="text-xs text-text-muted">
                          信用分: {currentUser.creditScore}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-gray-50 hover:text-primary-500 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          个人中心
                        </Link>
                        <Link
                          to="/favorites"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-gray-50 hover:text-primary-500 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          我的收藏
                        </Link>
                        <Link
                          to="/wanted"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-gray-50 hover:text-primary-500 transition-colors"
                        >
                          <SearchCheck className="w-4 h-4" />
                          我的求物
                        </Link>
                        <Link
                          to="/notices"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-gray-50 hover:text-primary-500 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          到货提醒
                        </Link>
                        <div className="border-t border-gray-100 my-1" />
                        <Link
                          to="/reports"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-gray-50 hover:text-primary-500 transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          举报管理
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-warning-500 hover:bg-warning-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          退出登录
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 btn-gradient rounded-full text-sm font-medium"
              >
                登录
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-text-primary" />
              ) : (
                <Menu className="w-6 h-6 text-text-primary" />
              )}
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="md:hidden py-3 border-t border-gray-100"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索你想要的物品..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm input-focus transition-all"
            />
          </div>
        </form>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 pb-4 animate-slide-up">
            <nav className="grid grid-cols-3 gap-2 pt-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                const hasBadge = link.path === '/messages' && unreadCount > 0;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-text-secondary hover:text-primary-500 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{link.label}</span>
                    {hasBadge && (
                      <span className="absolute top-2 right-6 min-w-[16px] h-[16px] flex items-center justify-center bg-primary-500 text-white text-xs font-bold rounded-full px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
