import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, BookOpen, LogOut, Package, MapPin, Heart, GraduationCap, FileText, Settings, Scroll, Star, Coins, Wrench, Ruler, Menu, X, Bell, Truck, Gift, AlertCircle, TrendingDown, HelpCircle } from 'lucide-react';
import type { User as UserType, Notification } from '../types';
import { useState, useEffect } from 'react';
import { LocationSelector } from './LocationSelector';
import { toast } from 'sonner';
import { useCart } from '../../contexts/CartContext';
import SearchBar from './SearchBar';

interface NavbarProps {
  user: UserType | null;
  wishlist?: string[];
  notifications?: Notification[];
  onLogout: () => void;
  onMarkNotificationRead?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onMarkAllRead?: () => void;
  onLocationChange?: (location: string) => void;
  onOpenPlatformSettings?: () => void;
}

export function Navbar({ user, wishlist = [], notifications = [], onLogout, onMarkNotificationRead, onDeleteNotification, onMarkAllRead, onLocationChange, onOpenPlatformSettings }: NavbarProps) {
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(user?.location || 'Newtown, Kolkata');

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-container')) {
        setShowNotifications(false);
      }
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showUserMenu]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const cartCount = getCartCount();
  const userLocation = currentLocation;

  const handleLocationChange = (newLocation: string) => {
    setCurrentLocation(newLocation);
    if (onLocationChange) {
      onLocationChange(newLocation);
    }
    // Save to localStorage for persistence
    localStorage.setItem('userLocation', newLocation);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${searchQuery}`);
      setShowSearch(false);
    }
  };

  const getDashboardLink = () => {
    if (user?.role === 'seller') return '/seller/dashboard';
    if (user?.role === 'admin') return '/admin/dashboard';
    return '/orders';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return Package;
      case 'promotion': return Gift;
      case 'wishlist': return TrendingDown;
      case 'buyback': return Coins;
      case 'system': return AlertCircle;
      default: return Bell;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (onMarkNotificationRead && !notification.read) {
      onMarkNotificationRead(notification.id);
    }
    
    // Navigate based on notification type and link
    if (notification.link) {
      navigate(notification.link);
    } else if (notification.type === 'order' && notification.orderId) {
      navigate('/orders');
    } else if (notification.type === 'wishlist') {
      navigate('/wishlist');
    } else if (notification.type === 'buyback') {
      navigate('/buyback');
    }
    
    setShowNotifications(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#2C1810] shadow-2xl border-b-2 border-[#8B6F47]">
      {/* Main Navbar */}
      <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Logo - BOI PARA */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
            <div className="bg-gradient-to-br from-[#8B6F47] to-[#6B5537] p-2 sm:p-2.5 rounded-lg shadow-lg">
              <BookOpen className="size-5 sm:size-6 text-[#F5E6D3]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5E6D3]" style={{ fontFamily: "'Playfair Display', serif" }}>
                BOI PARA
              </h1>
              <p className="hidden sm:block text-xs text-[#D4AF37] font-medium">From College Street to Your Doorstep</p>
            </div>
          </Link>

          {/* Location - Desktop */}
          <button
            onClick={() => setShowLocationSelector(true)}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#3D2817] rounded-md border border-[#8B6F47] hover:border-[#D4AF37] transition-colors cursor-pointer"
          >
            <MapPin className="size-4 text-[#D4AF37]" />
            <div>
              <p className="text-xs text-[#A08968]">Delivering to</p>
              <p className="text-sm font-semibold text-[#F5E6D3]">{userLocation.split(',')[0]}</p>
            </div>
          </button>

          {/* Search Bar - Desktop */}
          <SearchBar />

          {/* Mobile Search Icon */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md"
          >
            <Search className="size-5 text-[#D4AF37]" />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-3 ml-auto">
            {/* Wishlist */}
            {user?.role !== 'admin' && (
              <Link
                to="/wishlist"
                className="hidden sm:flex relative p-2 rounded-md bg-[#3D2817] border-2 border-[#8B6F47] hover:border-[#D4AF37] transition-colors"
              >
                <Heart className="size-5 sm:size-6 text-[#D4AF37]" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full size-5 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-1.5 sm:px-3 py-2 rounded-md bg-[#3D2817] border-2 border-[#8B6F47] hover:border-[#D4AF37] transition-colors"
              >
                <User className="size-5 text-[#D4AF37]" />
                <span className="hidden sm:inline text-sm font-medium text-[#F5E6D3]">
                  {user ? user.name.split(' ')[0] : 'Sign In'}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#3D2817] rounded-lg shadow-xl border-2 border-[#8B6F47] py-2 z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-[#8B6F47]">
                        <p className="font-medium text-[#F5E6D3] truncate">{user.name}</p>
                        <p className="text-xs text-[#A08968] break-all">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[#4D3827] transition-colors text-sm text-[#F5E6D3]"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="size-4 text-[#D4AF37]" />
                        <span>View Profile</span>
                      </Link>
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[#4D3827] transition-colors text-sm text-[#F5E6D3]"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Package className="size-4 text-[#D4AF37]" />
                        <span>
                          {user.role === 'seller' ? 'Seller Dashboard' : user.role === 'admin' ? 'Admin Dashboard' : 'My Orders'}
                        </span>
                      </Link>
                      <Link
                        to="/help"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[#4D3827] transition-colors text-sm text-[#F5E6D3] sm:hidden"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <HelpCircle className="size-4 text-[#D4AF37]" />
                        <span>Help Desk</span>
                      </Link>
                      {user.role === 'admin' && onOpenPlatformSettings && (
                        <button
                          onClick={() => {
                            onOpenPlatformSettings();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#4D3827] transition-colors text-sm text-[#F5E6D3]"
                        >
                          <Settings className="size-4 text-[#D4AF37]" />
                          <span>Platform Settings</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-900/30 transition-colors text-red-400 text-sm"
                      >
                        <LogOut className="size-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="block px-4 py-2 hover:bg-[#4D3827] transition-colors text-sm text-[#F5E6D3]"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Sign In / Register
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative notification-container">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center gap-2 px-1.5 sm:px-3 py-2 rounded-md bg-[#3D2817] border-2 border-[#8B6F47] hover:border-[#D4AF37] transition-colors"
              >
                <Bell className="size-5 text-[#D4AF37]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#2C1810] text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#3D2817] rounded-lg shadow-xl border-2 border-[#8B6F47] py-2 z-50 max-h-[500px] overflow-y-auto">
                  <div className="px-4 py-2 border-b border-[#8B6F47] flex items-center justify-between">
                    <p className="font-medium text-[#F5E6D3]">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-[#D4AF37] text-[#2C1810] px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="size-8 text-[#8B6F47] mx-auto mb-2" />
                      <p className="text-sm text-[#A08968]">No notifications yet</p>
                    </div>
                  ) : (
                    <>
                      {notifications.map(n => {
                        const IconComponent = getNotificationIcon(n.type);
                        return (
                          <button
                            key={n.id}
                            className={`w-full flex items-start gap-3 px-4 py-3 border-b border-[#8B6F47]/30 last:border-0 cursor-pointer ${
                              n.read ? 'bg-transparent hover:bg-[#4D3827]/50' : 'bg-[#4D3827]/30 hover:bg-[#4D3827]'
                            } transition-colors text-left`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <div className={`flex-shrink-0 p-2 rounded-lg ${
                              n.type === 'order' ? 'bg-blue-900/30' :
                              n.type === 'promotion' ? 'bg-purple-900/30' :
                              n.type === 'wishlist' ? 'bg-pink-900/30' :
                              n.type === 'buyback' ? 'bg-emerald-900/30' :
                              'bg-orange-900/30'
                            }`}>
                              <IconComponent className={`size-4 ${
                                n.type === 'order' ? 'text-blue-400' :
                                n.type === 'promotion' ? 'text-purple-400' :
                                n.type === 'wishlist' ? 'text-pink-400' :
                                n.type === 'buyback' ? 'text-emerald-400' :
                                'text-orange-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm mb-0.5 ${n.read ? 'text-[#D4C5AA]' : 'text-[#F5E6D3]'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-[#A08968] line-clamp-2 mb-1">
                                {n.message}
                              </p>
                              <p className="text-xs text-[#8B6F47]">{n.time}</p>
                            </div>
                            {!n.read && (
                              <div className="flex-shrink-0 w-2 h-2 bg-[#D4AF37] rounded-full mt-1"></div>
                            )}
                          </button>
                        );
                      })}
                      {unreadCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onMarkAllRead) onMarkAllRead();
                          }}
                          className="w-full px-4 py-2 mt-1 text-sm text-[#D4AF37] hover:bg-[#4D3827] transition-colors font-medium"
                        >
                          Mark All as Read
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist - Mobile */}
            {user?.role !== 'admin' && (
              <Link
                to="/wishlist"
                className="sm:hidden relative p-2 rounded-md bg-[#3D2817] border-2 border-[#8B6F47] hover:border-[#D4AF37] transition-colors"
              >
                <Heart className="size-5 text-[#D4AF37]" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full size-5 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
            )}

            {/* Help & Support Button - Desktop Only */}
            <Link
              to="/help"
              className="hidden sm:block p-2 rounded-md bg-[#3D2817] border-2 border-[#8B6F47] hover:border-[#D4AF37] transition-colors"
              title="Help & Support"
            >
              <HelpCircle className="size-5 text-[#D4AF37]" />
            </Link>

            {/* Cart */}
            {user?.role !== 'admin' && (
              <Link
                to="/cart"
                className="relative flex items-center gap-2 px-1.5 sm:px-3 py-2 rounded-md bg-[#3D2817] border-2 border-[#8B6F47] hover:border-[#D4AF37] transition-colors"
              >
                <div className="relative">
                  <ShoppingCart className="size-5 sm:size-6 text-[#D4AF37]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#2C1810] text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                      {cartCount}
                    </span>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <LocationSelector
          currentLocation={userLocation}
          onLocationChange={handleLocationChange}
          onClose={() => setShowLocationSelector(false)}
        />
      )}

      {/* Mobile Search Expandable */}
      {showSearch && (
        <div className="md:hidden px-4 pb-3">
          <SearchBar />
        </div>
      )}

      {/* Quick Categories Bar */}
      <div className="bg-[#3D2817] border-t border-[#8B6F47]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Mobile: Hamburger Menu */}
          <div className="md:hidden relative">
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="w-full flex items-center justify-between py-2.5 text-sm font-medium text-[#F5E6D3] hover:text-[#D4AF37] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Menu className="size-5" />
                <span>Browse Categories</span>
              </div>
              {showCategoryMenu ? <X className="size-5" /> : <span className="text-[#D4AF37]">▼</span>}
            </button>

            {/* Mobile Dropdown Menu */}
            {showCategoryMenu && (
              <div className="absolute top-full left-0 right-0 bg-[#2C1810] border-2 border-[#8B6F47] rounded-b-lg shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
                <Link
                  to="/browse"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-[#F5E6D3] hover:text-[#D4AF37] transition-colors border-b border-[#8B6F47]"
                  onClick={() => setShowCategoryMenu(false)}
                >
                  <BookOpen className="size-5" />
                  <span className="font-medium">All Books</span>
                </Link>
                <Link
                  to="/browse?category=Academic"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-[#F5E6D3] hover:text-[#D4AF37] transition-colors border-b border-[#8B6F47]"
                  onClick={() => setShowCategoryMenu(false)}
                >
                  <GraduationCap className="size-5" />
                  <span className="font-medium">Academic</span>
                </Link>
                <Link
                  to="/browse?category=Competitive Exams"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-[#F5E6D3] hover:text-[#D4AF37] transition-colors border-b border-[#8B6F47]"
                  onClick={() => setShowCategoryMenu(false)}
                >
                  <FileText className="size-5" />
                  <span className="font-medium">Competitive Exams</span>
                </Link>
                <Link
                  to="/browse?category=Engineering"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-[#F5E6D3] hover:text-[#D4AF37] transition-colors border-b border-[#8B6F47]"
                  onClick={() => setShowCategoryMenu(false)}
                >
                  <Ruler className="size-5" />
                  <span className="font-medium">Engineering</span>
                </Link>
                <Link
                  to="/browse?category=Medical"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-[#F5E6D3] hover:text-[#D4AF37] transition-colors border-b border-[#8B6F47]"
                  onClick={() => setShowCategoryMenu(false)}
                >
                  <Heart className="size-5" />
                  <span className="font-medium">Medical</span>
                </Link>
                <Link
                  to="/browse?category=Rare%20%26%20Vintage"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-[#F5E6D3] hover:text-[#D4AF37] transition-colors border-b border-[#8B6F47]"
                  onClick={() => setShowCategoryMenu(false)}
                >
                  <Scroll className="size-5" />
                  <span className="font-medium">Rare Books</span>
                </Link>
                <Link
                  to="/browse?bestsellers=true"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-[#D4AF37] hover:text-[#FFD700] transition-colors border-b border-[#8B6F47]"
                  onClick={() => setShowCategoryMenu(false)}
                >
                  <Star className="size-5" />
                  <span className="font-semibold">Best Sellers</span>
                </Link>
                <Link
                  to="/buyback"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-emerald-400 hover:text-emerald-300 transition-colors border-b border-[#8B6F47]"
                  onClick={() => setShowCategoryMenu(false)}
                >
                  <Coins className="size-5" />
                  <span className="font-semibold">Sell Books</span>
                </Link>
                {user && (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-[#F5E6D3] hover:text-[#D4AF37] transition-colors border-b border-[#8B6F47]"
                      onClick={() => setShowCategoryMenu(false)}
                    >
                      <User className="size-5" />
                      <span className="font-medium">View Profile</span>
                    </Link>
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-[#F5E6D3] hover:text-[#D4AF37] transition-colors border-b border-[#8B6F47]"
                      onClick={() => setShowCategoryMenu(false)}
                    >
                      <Package className="size-5" />
                      <span className="font-medium">
                        {user.role === 'seller' ? 'Seller Dashboard' : user.role === 'admin' ? 'Admin Dashboard' : 'My Orders'}
                      </span>
                    </Link>
                    {user.role !== 'admin' && (
                      <Link
                        to="/wishlist"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-[#F5E6D3] hover:text-[#D4AF37] transition-colors border-b border-[#8B6F47]"
                        onClick={() => setShowCategoryMenu(false)}
                      >
                        <Heart className="size-5" />
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Wishlist</span>
                          {wishlist.length > 0 && (
                            <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                              {wishlist.length}
                            </span>
                          )}
                        </div>
                      </Link>
                    )}
                    <Link
                      to="/help"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#3D2817] text-[#F5E6D3] hover:text-[#D4AF37] transition-colors border-b border-[#8B6F47]"
                      onClick={() => setShowCategoryMenu(false)}
                    >
                      <HelpCircle className="size-5" />
                      <span className="font-medium">Help & Support</span>
                    </Link>
                    <button
                      onClick={() => {
                        onLogout();
                        setShowCategoryMenu(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-900/30 text-red-400 transition-colors"
                    >
                      <LogOut className="size-5" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Desktop: Horizontal Scrolling */}
          {user?.role !== 'admin' && user?.role !== 'seller' && (
            <div className="hidden md:flex items-center gap-4 sm:gap-6 py-2.5 text-sm overflow-x-auto scrollbar-hide">
              <Link to="/browse" className={`flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors ${location.pathname === '/browse' && !location.search ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-[#F5E6D3] hover:text-[#D4AF37]'}`}>
                <BookOpen className="size-4" />
                <span>All Books</span>
              </Link>
              <Link to="/browse?category=Academic" className={`flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors ${location.search.includes('category=Academic') ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-[#F5E6D3] hover:text-[#D4AF37]'}`}>
                <GraduationCap className="size-4" />
                <span>Academic</span>
              </Link>
              <Link to="/browse?category=Competitive Exams" className={`flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors ${location.search.includes('category=Competitive') ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-[#F5E6D3] hover:text-[#D4AF37]'}`}>
                <FileText className="size-4" />
                <span>Exams</span>
              </Link>
              <Link to="/browse?category=Engineering" className={`flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors ${location.search.includes('category=Engineering') ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-[#F5E6D3] hover:text-[#D4AF37]'}`}>
                <Ruler className="size-4" />
                <span>Engineering</span>
              </Link>
              <Link to="/browse?category=Medical" className={`flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors ${location.search.includes('category=Medical') ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-[#F5E6D3] hover:text-[#D4AF37]'}`}>
                <Heart className="size-4" />
                <span>Medical</span>
              </Link>
              <Link to="/browse?category=Rare%20%26%20Vintage" className={`flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors ${location.search.includes('category=Rare') ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-[#F5E6D3] hover:text-[#D4AF37]'}`}>
                <Scroll className="size-4" />
                <span>Rare Books</span>
              </Link>
              <Link to="/browse?bestsellers=true" className={`flex items-center gap-1.5 whitespace-nowrap font-semibold transition-colors ${location.search.includes('bestsellers=true') ? 'text-[#FFD700] border-b-2 border-[#D4AF37] pb-1' : 'text-[#D4AF37] hover:text-[#FFD700]'}`}>
                <Star className="size-4" />
                <span>Best Sellers</span>
              </Link>
              <Link to="/buyback" className={`flex items-center gap-1.5 whitespace-nowrap font-semibold transition-colors ${location.pathname === '/buyback' ? 'text-amber-300 border-b-2 border-amber-400 pb-1' : 'text-amber-400 hover:text-amber-300'}`}>
                <Coins className="size-4" />
                <span>Sell Books</span>
              </Link>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}