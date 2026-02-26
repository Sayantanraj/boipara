import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Users, Store, BookOpen, IndianRupee, TrendingUp, Package, AlertCircle, CheckCircle, Clock, Shield, X, Star, MapPin, Award, Mail, Calendar, ShoppingBag, Tag, Download, RefreshCw, FileText, RotateCcw } from 'lucide-react';
import type { User, CartItem, BuybackRequest, Order, PendingBook, ReturnRequest } from '../types';
import { mockBooks, mockSellers, mockUsers } from '../data/mockData';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

interface Activity {
  id: string;
  type: 'user' | 'seller' | 'order' | 'buyback' | 'book';
  text: string;
  timestamp: Date;
  color: 'blue' | 'emerald' | 'green' | 'orange' | 'yellow';
}

interface BuybackSale {
  id: string;
  sellerId: string;
  sellerName: string;
  buybackBookId: string;
  bookTitle: string;
  author: string;
  isbn: string;
  price: number;
  quantity: number;
  total: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  
  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);
  
  // Mock wishlist for navbar
  const [wishlist] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'sellers' | 'books' | 'customerOrders' | 'sellerOrders' | 'returns' | 'buybackSales' | 'buyback' | 'settings'>('overview');
  
  // Real users from database
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Real sellers from database
  const [allSellers, setAllSellers] = useState<User[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
  
  // Seller books and stats state
  const [sellerBooks, setSellerBooks] = useState<any[]>([]);
  const [loadingSellerBooks, setLoadingSellerBooks] = useState(false);
  const [sellerStats, setSellerStats] = useState<any>(null);
  const [loadingSellerStats, setLoadingSellerStats] = useState(false);
  
  // Real books from database
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  
  // Real customer orders from database
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(true);
  
  // Real seller orders from database
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loadingSellerOrders, setLoadingSellerOrders] = useState(true);
  
  // Real returns from database
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(true);
  
  // Load users from database
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const users = await apiService.getAllUsers();
        setAllUsers(users);
        console.log('📊 Loaded users from database:', users.length);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Load sellers from database
  useEffect(() => {
    const loadSellers = async () => {
      try {
        setLoadingSellers(true);
        const sellers = await apiService.getAllSellers();
        setAllSellers(sellers);
        console.log('🏪 Loaded sellers from database:', sellers.length);
      } catch (error) {
        console.error('Error loading sellers:', error);
        toast.error('Failed to load sellers');
      } finally {
        setLoadingSellers(false);
      }
    };

    loadSellers();
  }, []);

  // Load books from database
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoadingBooks(true);
        const response = await apiService.getBooks({ limit: 100 });
        setAllBooks(response.books || []);
        console.log('📚 Loaded books from database:', response.books?.length || 0);
      } catch (error) {
        console.error('Error loading books:', error);
        toast.error('Failed to load books');
      } finally {
        setLoadingBooks(false);
      }
    };

    loadBooks();
  }, []);

  // Load customer orders from database
  useEffect(() => {
    const loadCustomerOrders = async () => {
      try {
        setLoadingCustomerOrders(true);
        console.log('🔄 Admin: Fetching customer orders...');
        console.log('🔑 Token exists:', !!localStorage.getItem('token'));
        console.log('👤 User role:', user?.role);
        
        const orders = await apiService.getAllOrders();
        console.log('✅ Admin: Received orders:', orders.length);
        console.log('📦 Sample order:', orders[0]);
        
        setCustomerOrders(orders);
      } catch (error) {
        console.error('❌ Error loading customer orders:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          hasToken: !!localStorage.getItem('token'),
          userRole: user?.role
        });
        toast.error('Failed to load customer orders: ' + error.message);
        setCustomerOrders([]);
      } finally {
        setLoadingCustomerOrders(false);
      }
    };

    if (user && user.role === 'admin') {
      loadCustomerOrders();
    }
  }, [user]);

  // Load seller orders from database
  useEffect(() => {
    const loadSellerOrders = async () => {
      try {
        setLoadingSellerOrders(true);
        const orders = await apiService.getAllSellerOrders();
        setSellerOrders(orders);
        console.log('🏪 Loaded seller orders from database:', orders.length);
      } catch (error) {
        console.error('Error loading seller orders:', error);
        toast.error('Failed to load seller orders');
      } finally {
        setLoadingSellerOrders(false);
      }
    };

    loadSellerOrders();
  }, []);

  // Load return requests from database
  useEffect(() => {
    const loadReturnRequests = async () => {
      try {
        setLoadingReturns(true);
        const returns = await apiService.getAllReturns();
        setReturnRequests(returns);
        console.log('🔄 Loaded return requests from database:', returns.length);
      } catch (error) {
        console.error('Error loading return requests:', error);
        toast.error('Failed to load return requests');
      } finally {
        setLoadingReturns(false);
      }
    };

    loadReturnRequests();
  }, []);

  // Load buyback requests from database
  useEffect(() => {
    const loadBuybackRequests = async () => {
      try {
        setLoadingBuybackRequests(true);
        console.log('🔄 Loading buyback requests...');
        console.log('Current user:', user);
        console.log('Auth token exists:', !!localStorage.getItem('token'));
        
        const requests = await apiService.getAllBuybackRequests();
        setBuybackRequests(requests);
        console.log('📦 Loaded buyback requests from database:', requests.length);
        console.log('Sample request:', requests[0]);
      } catch (error) {
        console.error('Error loading buyback requests:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          response: error.response,
          hasToken: !!localStorage.getItem('token'),
          userRole: user?.role
        });
        toast.error(`Failed to load buyback requests: ${error.message}`);
        setBuybackRequests([]); // Set empty array on error
      } finally {
        setLoadingBuybackRequests(false);
      }
    };

    // Only load if user is admin
    if (user && user.role === 'admin') {
      loadBuybackRequests();
    }
  }, [user]);

  // Refresh buyback requests when tab changes to buyback
  useEffect(() => {
    if (activeTab === 'buyback' && user && user.role === 'admin') {
      const refreshBuybackRequests = async () => {
        try {
          console.log('🔄 Tab switched to buyback, refreshing data...');
          const requests = await apiService.getAllBuybackRequests();
          setBuybackRequests(requests);
          console.log('🔄 Refreshed buyback requests:', requests.length);
        } catch (error) {
          console.error('Error refreshing buyback requests on tab change:', error);
          console.error('Tab refresh error:', {
            message: error.message,
            hasToken: !!localStorage.getItem('token'),
            userRole: user?.role
          });
        }
      };
      refreshBuybackRequests();
    }
  }, [activeTab, user]);

  // Platform Settings State
  const [platformSettings, setPlatformSettings] = useState(() => {
    const saved = localStorage.getItem('boiParaPlatformSettings');
    return saved ? JSON.parse(saved) : {
      businessName: 'BOI PARA',
      tagline: 'Connecting Kolkata\'s Book Lovers',
      address: 'College Street, Kolkata - 700073',
      email: 'contact@boipara.com',
      phone: '+91 8101637164',
      gstNumber: '',
      supportEmail: 'reachsupport@boipara.com'
    };
  });
  
  // Save platform settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('boiParaPlatformSettings', JSON.stringify(platformSettings));
  }, [platformSettings]);
  
  // Modal states
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [showSellerBooks, setShowSellerBooks] = useState(false);
  const [showSellerStats, setShowSellerStats] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showReturnDetails, setShowReturnDetails] = useState(false);
  const [showReturnActionModal, setShowReturnActionModal] = useState(false);
  const [returnAction, setReturnAction] = useState<'approve' | 'reject'>('approve');
  const [returnAdminNotes, setReturnAdminNotes] = useState('');
  
  // Book edit modal states
  const [showBookEditModal, setShowBookEditModal] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [bookFormData, setBookFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    category: 'Academic',
    condition: 'new',
    description: '',
    mrp: '',
    price: '',
    stock: '',
    language: 'English',
    edition: '',
    publisher: ''
  });
  
  // Action states
  const [suspendedSellers, setSuspendedSellers] = useState<string[]>([]);
  const [suspendedUsers, setSuspendedUsers] = useState<string[]>([]);
  const [removedBooks, setRemovedBooks] = useState<string[]>(() => {
    const saved = localStorage.getItem('boiParaRemovedBooks');
    return saved ? JSON.parse(saved) : [];
  });
  const [sellingPrices, setSellingPrices] = useState<{ [key: string]: string }>({});
  const [priceChangeReasons, setPriceChangeReasons] = useState<{ [key: string]: string }>({});
  const [buybackStatuses, setBuybackStatuses] = useState<{ [key: number]: 'approved' | 'rejected' | 'pending' }>({});
  
  // Activity tracking
  const [activities, setActivities] = useState<Activity[]>([]);

  // Load seller-added books from localStorage
  const [sellerAddedBooks, setSellerAddedBooks] = useState<any[]>(() => {
    const saved = localStorage.getItem('sellerBooks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading seller books:', error);
        return [];
      }
    }
    return [];
  });

  // Re-load seller books when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sellerBooks');
      if (saved) {
        try {
          setSellerAddedBooks(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading seller books:', error);
        }
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically (for same-tab updates)
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Save removed books to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('boiParaRemovedBooks', JSON.stringify(removedBooks));
  }, [removedBooks]);

  // Mock buyback sales data (Admin selling buyback books to sellers)
  const [buybackSales] = useState<BuybackSale[]>([
    {
      id: 'BS-001',
      sellerId: 's1',
      sellerName: 'College Street Books',
      buybackBookId: 'bb1',
      bookTitle: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      isbn: '978-0262033848',
      price: 850,
      quantity: 2,
      total: 1700,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
      status: 'completed'
    },
    {
      id: 'BS-002',
      sellerId: 's2',
      sellerName: 'Academic Publishers',
      buybackBookId: 'bb2',
      bookTitle: 'The Art of Computer Programming',
      author: 'Donald Knuth',
      isbn: '978-0201896831',
      price: 1200,
      quantity: 1,
      total: 1200,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
      status: 'completed'
    },
    {
      id: 'BS-003',
      sellerId: 's1',
      sellerName: 'College Street Books',
      buybackBookId: 'bb3',
      bookTitle: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '978-0132350884',
      price: 450,
      quantity: 3,
      total: 1350,
      date: new Date().toLocaleDateString('en-IN'),
      status: 'pending'
    }
  ]);

  const totalUsers = allUsers.filter(u => u.role === 'customer').length;
  const totalSellers = allSellers.length;
  const totalBooks = allBooks.length;
  const totalRevenue = customerOrders.reduce((sum, order) => {
    if (order.status === 'delivered' || order.status === 'completed') {
      return sum + order.total;
    }
    return sum;
  }, 0);
  const pendingOrders = 8;
  // Real buyback requests from database
  const [buybackRequests, setBuybackRequests] = useState<BuybackRequest[]>([]);
  const [loadingBuybackRequests, setLoadingBuybackRequests] = useState(true);
  const pendingBuybacks = buybackRequests.filter(r => r.status === 'pending').length;

  // Calculate total books sold from all completed/delivered orders
  const totalBooksSold = customerOrders.reduce((total, order) => {
    if (order.status === 'delivered' || order.status === 'completed') {
      return total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0);
    }
    return total;
  }, 0);

  // Separate customer orders (regular orders) and seller orders (orders where sellers buy buyback books)
  // Customer orders are now loaded from database instead of using the orders prop
  // const customerOrders = orders; // OLD: using prop data
  
  // Seller orders are now loaded from database instead of using the buybackOrders prop
  // const sellerOrders = Object.values(buybackOrders).flat(); // OLD: using prop data
  
  // Filter return requests that are pending admin approval
  const pendingReturns = returnRequests.filter(r => r.status === 'pending-admin');

  // Add new activity helper function
  const addActivity = (type: Activity['type'], text: string, color: Activity['color']) => {
    const newActivity: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      text,
      timestamp: new Date(),
      color
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 15)); // Keep only last 15 activities
  };

  // Generate initial activities based on real data
  useEffect(() => {
    if (allUsers.length === 0 || customerOrders.length === 0 || buybackRequests.length === 0) return;
    
    const initialActivities: Activity[] = [];
    
    // Recent user registrations
    const recentUsers = allUsers.filter(u => u.role === 'customer').slice(-2);
    recentUsers.forEach((user, index) => {
      initialActivities.push({
        id: `user-${user.id || user._id}`,
        type: 'user',
        text: `New user registered: ${user.name}`,
        timestamp: new Date(Date.now() - (index + 1) * 5 * 60 * 1000),
        color: 'blue'
      });
    });
    
    // Recent orders
    const recentOrders = customerOrders.slice(-2);
    recentOrders.forEach((order, index) => {
      initialActivities.push({
        id: `order-${order.id}`,
        type: 'order',
        text: `Order #${order.id.slice(-6)} ${order.status === 'delivered' ? 'delivered' : 'placed'} - ₹${order.total}`,
        timestamp: new Date(Date.now() - (index + 2) * 15 * 60 * 1000),
        color: order.status === 'delivered' ? 'green' : 'blue'
      });
    });
    
    // Recent buyback requests
    const recentBuybacks = buybackRequests.slice(-2);
    recentBuybacks.forEach((request, index) => {
      initialActivities.push({
        id: `buyback-${request.id}`,
        type: 'buyback',
        text: `Buyback request for "${request.bookTitle}" ${request.status === 'approved' ? 'approved' : request.status === 'rejected' ? 'rejected' : 'submitted'}`,
        timestamp: new Date(Date.now() - (index + 4) * 30 * 60 * 1000),
        color: request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'orange' : 'orange'
      });
    });
    
    // Recent sellers
    const recentSellers = allSellers.slice(-1);
    recentSellers.forEach((seller, index) => {
      initialActivities.push({
        id: `seller-${seller.id || seller._id}`,
        type: 'seller',
        text: `${seller.storeName || seller.name} joined as seller`,
        timestamp: new Date(Date.now() - (index + 6) * 45 * 60 * 1000),
        color: 'emerald'
      });
    });
    
    // Sort by timestamp (newest first) and limit to 6
    const sortedActivities = initialActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 6);
    
    setActivities(sortedActivities);
  }, [allUsers, customerOrders, buybackRequests, allSellers]);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem('adminActivities', JSON.stringify(activities));
    }
  }, [activities]);

  // Track order changes in real-time
  useEffect(() => {
    const lastOrderCount = localStorage.getItem('lastOrderCount');
    const currentCount = customerOrders.length;
    
    if (lastOrderCount && parseInt(lastOrderCount) < currentCount) {
      const newOrder = customerOrders[customerOrders.length - 1];
      addActivity('order', `New order #${newOrder.id} placed - ₹${newOrder.total}`, 'green');
      toast.success('New order received!');
    }
    
    localStorage.setItem('lastOrderCount', currentCount.toString());
  }, [customerOrders.length]);

  // Track order status changes
  useEffect(() => {
    customerOrders.forEach(order => {
      const lastStatus = localStorage.getItem(`order_${order.id}_status`);
      if (lastStatus && lastStatus !== order.status) {
        const statusText = 
          order.status === 'delivered' ? 'delivered' :
          order.status === 'shipped' ? 'shipped' :
          order.status === 'processing' ? 'being processed' :
          order.status === 'packed' ? 'packed' :
          order.status === 'cancelled' ? 'cancelled' :
          'updated';
        
        addActivity('order', `Order #${order.id} is now ${statusText}`, 
          order.status === 'delivered' ? 'green' : 
          order.status === 'cancelled' ? 'orange' : 'blue');
      }
      localStorage.setItem(`order_${order.id}_status`, order.status);
    });
  }, [customerOrders]);

  // Track buyback requests in real-time
  useEffect(() => {
    const lastBuybackCount = localStorage.getItem('lastBuybackCount');
    const currentCount = buybackRequests.length;
    
    if (lastBuybackCount && parseInt(lastBuybackCount) < currentCount) {
      const newRequest = buybackRequests[buybackRequests.length - 1];
      addActivity('buyback', `New buyback request for "${newRequest.bookTitle}" - ₹${newRequest.offeredPrice}`, 'orange');
    }
    
    localStorage.setItem('lastBuybackCount', currentCount.toString());
  }, [buybackRequests.length]);

  // Track buyback status changes
  useEffect(() => {
    buybackRequests.forEach(request => {
      const lastStatus = localStorage.getItem(`buyback_${request.id}_status`);
      if (lastStatus && lastStatus !== request.status) {
        if (request.status === 'approved') {
          addActivity('buyback', `Buyback request for "${request.bookTitle}" approved - ₹${request.sellingPrice || request.offeredPrice}`, 'green');
        } else if (request.status === 'rejected') {
          addActivity('buyback', `Buyback request for "${request.bookTitle}" rejected`, 'orange');
        } else if (request.status === 'completed') {
          addActivity('buyback', `Buyback for "${request.bookTitle}" completed`, 'green');
        }
      }
      localStorage.setItem(`buyback_${request.id}_status`, request.status);
    });
  }, [buybackRequests]);

  // Track seller orders (buyback orders)
  useEffect(() => {
    const lastSellerOrderCount = localStorage.getItem('lastSellerOrderCount');
    const currentCount = sellerOrders.length;
    
    if (lastSellerOrderCount && parseInt(lastSellerOrderCount) < currentCount) {
      const newOrder = sellerOrders[sellerOrders.length - 1];
      const seller = mockSellers.find(s => s.id === newOrder.userId) || mockUsers.find(u => u.id === newOrder.userId);
      const sellerName = seller?.storeName || seller?.name || 'Seller';
      addActivity('order', `${sellerName} purchased buyback books - ₹${newOrder.total}`, 'green');
    }
    
    localStorage.setItem('lastSellerOrderCount', currentCount.toString());
  }, [sellerOrders.length]);



  // Download invoice handler
  const handleDownloadInvoice = (order: Order, isSellerOrder: boolean = false) => {
    const doc = new jsPDF();
    
    // Helper function to format numbers without using toLocaleString
    const formatPrice = (num: number): string => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    
    // Header - BOI PARA Logo/Branding
    doc.setFillColor(61, 40, 23); // #3D2817
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(212, 175, 55); // #D4AF37
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(platformSettings.businessName, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(245, 230, 211); // #F5E6D3
    doc.text(platformSettings.tagline, 105, 28, { align: 'center' });
    doc.text(`${platformSettings.address} • ${platformSettings.supportEmail} • ${platformSettings.phone}`, 105, 34, { align: 'center' });
    
    // Invoice Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(isSellerOrder ? 'BUYBACK ORDER INVOICE' : 'ORDER INVOICE', 105, 55, { align: 'center' });
    
    // Invoice Details Box
    doc.setDrawColor(139, 111, 71); // #8B6F47
    doc.setLineWidth(0.5);
    doc.rect(15, 65, 180, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice No: ' + order.id, 20, 73);
    doc.text('Date: ' + order.date, 20, 80);
    doc.text('Payment: ' + (order.paymentMethod || 'UPI'), 20, 87);
    
    doc.text('Tracking: ' + (order.trackingNumber || 'N/A'), 120, 73);
    doc.text('Status: ' + order.status.toUpperCase(), 120, 80);
    
    // Customer/Seller Information
    doc.setFillColor(245, 230, 211); // #F5E6D3
    doc.rect(15, 100, 85, 35, 'F');
    doc.setDrawColor(139, 111, 71);
    doc.rect(15, 100, 85, 35);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(isSellerOrder ? 'BUYER DETAILS:' : 'CUSTOMER DETAILS:', 20, 108);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const customerName = order.customerName || 
      (order.userId && order.userId !== 'guest' ? mockUsers.find(u => u.id === order.userId)?.name : null) || 
      'Guest User';
    const customerEmail = order.customerEmail || 
      (order.userId && order.userId !== 'guest' ? mockUsers.find(u => u.id === order.userId)?.email : null) || 
      'N/A';
    const customerPhone = order.customerPhone || 
      (order.userId && order.userId !== 'guest' ? mockUsers.find(u => u.id === order.userId)?.phone : null) || 
      'N/A';
    
    doc.text(customerName, 20, 116);
    doc.text('Email: ' + customerEmail, 20, 122);
    doc.text('Phone: ' + customerPhone, 20, 128);
    
    // Shipping Address
    doc.setFillColor(245, 230, 211);
    doc.rect(110, 100, 85, 35, 'F');
    doc.rect(110, 100, 85, 35);
    
    doc.setFont('helvetica', 'bold');
    doc.text('SHIPPING ADDRESS:', 115, 108);
    
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(order.shippingAddress || 'N/A', 75);
    doc.text(addressLines, 115, 116);
    
    // Items Table Header
    let yPos = 145;
    doc.setFillColor(212, 175, 55); // #D4AF37
    doc.rect(15, yPos, 180, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Book Title', 20, yPos + 7);
    doc.text('Qty', 130, yPos + 7);
    doc.text('Price', 150, yPos + 7);
    doc.text('Subtotal', 175, yPos + 7);
    
    // Items
    yPos += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    order.items.forEach((item, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setDrawColor(139, 111, 71);
      doc.line(15, yPos, 195, yPos);
      
      const title = doc.splitTextToSize(item.book.title, 100);
      doc.text(title[0] + (title.length > 1 ? '...' : ''), 20, yPos + 7);
      doc.text(String(item.quantity), 130, yPos + 7);
      doc.text('₹' + String(item.book.price), 150, yPos + 7);
      doc.text('₹' + String(item.book.price * item.quantity), 175, yPos + 7);
      
      yPos += 10;
    });
    
    // Total Section
    yPos += 5;
    doc.setDrawColor(139, 111, 71);
    doc.setLineWidth(1);
    doc.line(15, yPos, 195, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL AMOUNT:', 130, yPos);
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(14);
    doc.text('₹' + formatPrice(order.total), 175, yPos);
    
    // Footer
    doc.setTextColor(139, 111, 71);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Thank you for your business with ${platformSettings.businessName}!`, 105, 280, { align: 'center' });
    doc.text('This is a computer-generated invoice. No signature required.', 105, 285, { align: 'center' });
    
    // Save PDF
    doc.save('Invoice_' + order.id + '.pdf');
    toast.success('Invoice downloaded successfully!');
  };

  /* REMOVED DUPLICATE - buyback tracking already exists at lines 232-303
  // Track buyback request changes
  useEffect(() => {
    const lastBuybackCount = localStorage.getItem('lastBuybackCount');
    const currentCount = buybackRequests.length;
    
    if (lastBuybackCount && parseInt(lastBuybackCount) < currentCount) {
      const newRequest = buybackRequests[buybackRequests.length - 1];
      const book = mockBooks.find(b => b.id === newRequest.bookId);
      addActivity('buyback', `New buyback request for "${book?.title || 'Unknown Book'}"`, 'orange');
      toast.info('New buyback request received!');
    }
    
    localStorage.setItem('lastBuybackCount', currentCount.toString());
  }, [buybackRequests.length]);

  // Track buyback status changes
  useEffect(() => {
    buybackRequests.forEach((request, index) => {
      const lastStatus = localStorage.getItem(`buyback_${request.bookId}_${index}_status`);
      if (lastStatus && lastStatus !== request.status) {
        const book = mockBooks.find(b => b.id === request.bookId);
        if (request.status === 'approved') {
          addActivity('buyback', `Buyback approved for "${book?.title}" - ₹${request.sellingPrice || request.estimatedPrice}`, 'green');
        } else if (request.status === 'rejected') {
          addActivity('buyback', `Buyback rejected for "${book?.title}"`, 'orange');
        }
      }
      localStorage.setItem(`buyback_${request.bookId}_${index}_status`, request.status);
    });
  }, [buybackRequests]);
  */

  // Track book inventory changes
  useEffect(() => {
    const lastBookCount = localStorage.getItem('lastBookCount');
    const currentCount = mockBooks.length;
    
    if (lastBookCount && parseInt(lastBookCount) < currentCount) {
      const newBook = mockBooks[mockBooks.length - 1];
      const seller = mockSellers.find(s => s.id === newBook.sellerId);
      addActivity('book', `New book added: "${newBook.title}" by ${seller?.storeName}`, 'emerald');
    }
    
    localStorage.setItem('lastBookCount', currentCount.toString());
  }, [mockBooks.length]);

  // Auto-refresh activity timestamps every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev => [...prev]); // Trigger re-render to update relative times
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Helper function to format relative time
  const getRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - timestamp.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Handler functions
  const handleViewSellerBooks = async (sellerId: string) => {
    setSelectedSeller(sellerId);
    setLoadingSellerBooks(true);
    setShowSellerBooks(true);
    
    try {
      const books = await apiService.getSellerBooks(sellerId);
      setSellerBooks(books);
    } catch (error) {
      console.error('Error loading seller books:', error);
      toast.error('Failed to load seller books');
      setSellerBooks([]);
    } finally {
      setLoadingSellerBooks(false);
    }
  };

  const handleViewSellerStats = async (sellerId: string) => {
    setSelectedSeller(sellerId);
    setLoadingSellerStats(true);
    setShowSellerStats(true);
    
    try {
      const stats = await apiService.getSellerStats(sellerId);
      setSellerStats(stats);
    } catch (error) {
      console.error('Error loading seller stats:', error);
      toast.error('Failed to load seller statistics');
      setSellerStats(null);
    } finally {
      setLoadingSellerStats(false);
    }
  };

  const handleSuspendSeller = (sellerId: string) => {
    const seller = allSellers.find(s => (s.id || s._id) === sellerId);
    if (suspendedSellers.includes(sellerId)) {
      setSuspendedSellers(suspendedSellers.filter(id => id !== sellerId));
      addActivity('seller', `${seller?.storeName || seller?.name} account reactivated`, 'emerald');
      toast.success(`${seller?.storeName || seller?.name} has been reactivated`);
    } else {
      setSuspendedSellers([...suspendedSellers, sellerId]);
      addActivity('seller', `${seller?.storeName || seller?.name} account suspended`, 'orange');
      toast.warning(`${seller?.storeName || seller?.name} has been suspended`);
    }
  };

  const handleViewUserProfile = (userId: string) => {
    setSelectedUser(userId);
    setShowUserProfile(true);
  };

  const handleSuspendUser = (userId: string) => {
    const user = allUsers.find(u => (u.id || u._id) === userId);
    if (suspendedUsers.includes(userId)) {
      setSuspendedUsers(suspendedUsers.filter(id => id !== userId));
      addActivity('user', `User ${user?.name} account reactivated`, 'blue');
      toast.success(`${user?.name} has been reactivated`);
    } else {
      setSuspendedUsers([...suspendedUsers, userId]);
      addActivity('user', `User ${user?.name} account suspended`, 'orange');
      toast.warning(`${user?.name} has been suspended`);
    }
  };

  const handleRemoveBook = (bookId: string) => {
    const book = allBooks.find(b => b.id === bookId);
    if (removedBooks.includes(bookId)) {
      setRemovedBooks(removedBooks.filter(id => id !== bookId));
      addActivity('book', `"${book?.title}" restored to marketplace`, 'emerald');
      toast.success(`${book?.title} has been restored`);
    } else {
      setRemovedBooks([...removedBooks, bookId]);
      addActivity('book', `"${book?.title}" removed from marketplace`, 'orange');
      toast.warning(`${book?.title} has been removed`);
    }
  };

  const handleViewOrderDetails = (orderId: string) => {
    setSelectedOrder(orderId);
    setShowOrderDetails(true);
  };

  const handleViewReturnDetails = (returnRequest: ReturnRequest) => {
    setSelectedReturn(returnRequest);
    setShowReturnDetails(true);
  };

  const handleOpenReturnActionModal = (returnRequest: ReturnRequest, action: 'approve' | 'reject') => {
    setSelectedReturn(returnRequest);
    setReturnAction(action);
    setReturnAdminNotes('');
    setShowReturnActionModal(true);
  };

  const handleConfirmReturnAction = async () => {
    if (!selectedReturn) return;

    try {
      const newStatus = returnAction === 'approve' ? 'approved-by-admin' : 'rejected-by-admin';
      await apiService.updateReturnStatus(selectedReturn.id, newStatus, returnAdminNotes);
      
      // Update local state
      setReturnRequests(prev => prev.map(r => 
        r.id === selectedReturn.id 
          ? { ...r, status: newStatus, adminNotes: returnAdminNotes }
          : r
      ));
      
      toast.success(`Return ${returnAction === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error updating return status:', error);
      toast.error('Failed to update return status');
    }

    setShowReturnActionModal(false);
    setShowReturnDetails(false);
    setSelectedReturn(null);
    setReturnAdminNotes('');
  };

  const handleGenerateAdminInvoice = (order: Order) => {
    // Generate admin invoice for buyback sales (admin is the seller)
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return;

    // Get seller information
    const seller = mockSellers.find(s => s.id === order.userId) || mockUsers.find(u => u.id === order.userId);
    const sellerName = seller?.storeName || seller?.name || 'Unknown Seller';
    const sellerId = order.userId;

    // Calculate subtotal and prepare items rows
    const itemsRows = order.items.map(item => `
      <tr>
        <td>
          <strong>${item.book.title}</strong><br>
          <span style="color: #666; font-size: 13px;">by ${item.book.author}</span>
        </td>
        <td style="font-family: monospace;">${item.book.isbn}</td>
        <td><span style="background: #e3f2fd; color: #1565c0; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">BUYBACK</span></td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">₹${item.book.price.toFixed(2)}</td>
        <td style="text-align: right; font-weight: bold;">₹${(item.book.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    // Determine status color
    const statusStyle = 
      order.status === 'delivered' ? 'background: #d4edda; color: #155724;' :
      order.status === 'pending' || order.status === 'new' ? 'background: #fff3cd; color: #856404;' :
      order.status === 'cancelled' || order.status === 'rejected' ? 'background: #f8d7da; color: #721c24;' :
      'background: #cfe2ff; color: #084298;';

    // Use platform settings in invoice
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admin Sales Invoice - ${order.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: #f5f5f5;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            border-bottom: 3px solid #D4AF37;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: start;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2C1810;
            font-family: 'Playfair Display', serif;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h1 {
            color: #D4AF37;
            font-size: 28px;
            margin-bottom: 5px;
          }
          .invoice-number {
            color: #666;
            font-size: 14px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #2C1810;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .info-box {
            background: #f9f9f9;
            padding: 15px;
            border-left: 3px solid #D4AF37;
          }
          .info-box p {
            margin: 5px 0;
            color: #333;
            font-size: 14px;
          }
          .info-label {
            color: #666;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .table th {
            background: #2C1810;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            color: #333;
          }
          .table tr:hover {
            background: #f9f9f9;
          }
          .total-section {
            margin-top: 30px;
            text-align: right;
          }
          .total-row {
            display: flex;
            justify-content: flex-end;
            padding: 8px 0;
            font-size: 14px;
          }
          .total-label {
            width: 150px;
            text-align: right;
            padding-right: 20px;
            color: #666;
          }
          .total-value {
            width: 120px;
            text-align: right;
            font-weight: bold;
          }
          .grand-total {
            border-top: 2px solid #D4AF37;
            margin-top: 10px;
            padding-top: 10px;
            font-size: 18px;
            color: #D4AF37;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            ${statusStyle}
          }
          .admin-badge {
            display: inline-block;
            background: #D4AF37;
            color: white;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 10px;
          }
          @media print {
            body { padding: 0; background: white; }
            .invoice-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div>
              <div class="logo">${platformSettings.businessName}</div>
              <p style="color: #666; font-size: 14px; margin-top: 5px;">${platformSettings.tagline}</p>
              <span class="admin-badge">ADMIN SALES INVOICE</span>
            </div>
            <div class="invoice-title">
              <h1>SALES INVOICE</h1>
              <p class="invoice-number">Invoice #${order.id}</p>
              <p class="invoice-number">Date: ${order.date}</p>
              <div style="margin-top: 10px;">
                <span class="status-badge">${order.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="info-grid">
              <div class="info-box">
                <p class="info-label">From (Seller)</p>
                <p style="font-weight: bold; color: #2C1810; font-size: 16px;">${platformSettings.businessName} - Admin</p>
                <p>${platformSettings.tagline}</p>
                <p>Platform Buyback Division</p>
                <p>Email: ${platformSettings.email}</p>
              </div>
              <div class="info-box">
                <p class="info-label">To (Buyer)</p>
                <p style="font-weight: bold; color: #2C1810; font-size: 16px;">${sellerName}</p>
                <p>Seller ID: ${sellerId}</p>
                <p>Business Type: Book Seller</p>
              </div>
            </div>
          </div>

          <div class="section">
            <p class="section-title">Transaction Details</p>
            <table class="table">
              <thead>
                <tr>
                  <th>Book Details</th>
                  <th>ISBN</th>
                  <th>Type</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Subtotal:</span>
              <span class="total-value">₹${order.total.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Platform Fee:</span>
              <span class="total-value">₹0.00</span>
            </div>
            <div class="total-row grand-total">
              <span class="total-label">Grand Total:</span>
              <span class="total-value">₹${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>${platformSettings.businessName}</strong> - ${platformSettings.tagline}</p>
            <p>Thank you for being a valued seller partner!</p>
            <p style="margin-top: 10px;">This is a computer-generated invoice for buyback book sales from platform to sellers.</p>
            <p style="margin-top: 5px; color: #999;">For queries, contact: ${platformSettings.supportEmail}</p>
          </div>
        </div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
    
    addActivity('order', `Admin invoice generated for ${sellerName} - ${order.id}`, 'green');
    toast.success('Admin sales invoice generated!');
  };

  const handleBuybackAction = async (requestId: string, action: 'approved' | 'rejected', sellingPrice?: number, priceChangeReason?: string) => {
    try {
      if (action === 'approved') {
        await apiService.approveBuybackRequest(requestId, sellingPrice || 0, priceChangeReason);
        setBuybackRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved', sellingPrice, priceChangeReason }
            : req
        ));
        toast.success('Buyback request approved!');
        addActivity('buyback', `Buyback request approved for "${buybackRequests.find(r => r.id === requestId)?.bookTitle}" - ₹${sellingPrice}`, 'green');
      } else {
        await apiService.rejectBuybackRequest(requestId);
        setBuybackRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected' }
            : req
        ));
        toast.error('Buyback request rejected');
        addActivity('buyback', `Buyback request rejected for "${buybackRequests.find(r => r.id === requestId)?.bookTitle}"`, 'orange');
      }
      
      // Refresh the data from server to ensure consistency
      setTimeout(async () => {
        try {
          const refreshedRequests = await apiService.getAllBuybackRequests();
          setBuybackRequests(refreshedRequests);
        } catch (error) {
          console.error('Error refreshing buyback requests:', error);
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Error updating buyback request:', error);
      toast.error('Failed to update buyback request');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <Navbar 
        user={user} 
        cart={cart} 
        wishlist={wishlist}
        onLogout={logout}
        onOpenPlatformSettings={() => setActiveTab('settings')}
      />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="size-8 text-[#D4AF37]" />
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2C1810]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Admin Dashboard
            </h1>
          </div>
          <p className="text-[#6B5537]">
            Welcome, <span className="font-semibold">{user?.name}</span> • BOI PARA Platform Control
          </p>
        </div>

        {/* Stats Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-lg p-4 sm:p-6 border-2 border-[#8B6F47] shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-600 p-2.5 rounded-lg">
                  <Users className="size-5 sm:size-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-[#D4C5AA]">Total Users</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#F5E6D3]">{totalUsers}</p>
                </div>
              </div>
              <p className="text-xs text-blue-400">+23 this week</p>
            </div>

            <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-lg p-4 sm:p-6 border-2 border-[#8B6F47] shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-600 p-2.5 rounded-lg">
                  <Store className="size-5 sm:size-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-[#D4C5AA]">Active Sellers</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#F5E6D3]">{totalSellers}</p>
                </div>
              </div>
              <p className="text-xs text-emerald-400">College Street vendors</p>
            </div>

            <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-lg p-4 sm:p-6 border-2 border-[#8B6F47] shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#8B6F47] p-2.5 rounded-lg">
                  <BookOpen className="size-5 sm:size-6 text-[#F5E6D3]" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-[#D4C5AA]">Total Books</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#F5E6D3]">{totalBooks}</p>
                </div>
              </div>
              <p className="text-xs text-[#D4C5AA]">Active listings</p>
            </div>

            <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-lg p-4 sm:p-6 border-2 border-[#8B6F47] shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#D4AF37] p-2.5 rounded-lg">
                  <TrendingUp className="size-5 sm:size-6 text-[#2C1810]" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-[#D4C5AA]">Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#D4AF37]">₹{(totalRevenue / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <p className="text-xs text-emerald-400">+18% this month</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-[#3D2817] rounded-lg border-2 border-[#8B6F47] shadow-xl mb-6">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-all flex-1 ${
                activeTab === 'overview'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <TrendingUp className="size-3.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-all flex-1 ${
                activeTab === 'users'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <Users className="size-3.5" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('sellers')}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-all flex-1 ${
                activeTab === 'sellers'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <Store className="size-3.5" />
              Sellers
            </button>
            <button
              onClick={() => setActiveTab('books')}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-all flex-1 ${
                activeTab === 'books'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <BookOpen className="size-3.5" />
              Books
            </button>
            <button
              onClick={() => setActiveTab('customerOrders')}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-all flex-1 ${
                activeTab === 'customerOrders'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <ShoppingBag className="size-3.5" />
              Customer Orders
            </button>
            <button
              onClick={() => setActiveTab('sellerOrders')}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-all flex-1 ${
                activeTab === 'sellerOrders'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <Store className="size-3.5" />
              Seller Orders
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-all flex-1 ${
                activeTab === 'returns'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <RotateCcw className="size-3.5" />
              Returns
            </button>
            <button
              onClick={() => setActiveTab('buybackSales')}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-all flex-1 ${
                activeTab === 'buybackSales'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <RefreshCw className="size-3.5" />
              Buyback Sales
            </button>
            <button
              onClick={() => setActiveTab('buyback')}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-all flex-1 ${
                activeTab === 'buyback'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <AlertCircle className="size-3.5" />
              Buyback ({pendingBuybacks})
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Platform Health */}
            <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
              <h2 className="text-2xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Platform Health
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="size-5 text-emerald-400" />
                    <p className="text-sm text-[#D4C5AA]">Active Orders</p>
                  </div>
                  <p className="text-3xl font-bold text-[#F5E6D3]">47</p>
                  <p className="text-xs text-emerald-400 mt-1">Processing smoothly</p>
                </div>
                <div className="p-4 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="size-5 text-green-400" />
                    <p className="text-sm text-[#D4C5AA]">Books Sold</p>
                  </div>
                  <p className="text-3xl font-bold text-[#F5E6D3]">{totalBooksSold}</p>
                  <p className="text-xs text-green-400 mt-1">Total completed sales</p>
                </div>
                <div className="p-4 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="size-5 text-orange-400" />
                    <p className="text-sm text-[#D4C5AA]">Buyback Requests</p>
                  </div>
                  <p className="text-3xl font-bold text-[#F5E6D3]">{pendingBuybacks}</p>
                  <p className="text-xs text-orange-400 mt-1">Awaiting approval</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
              <h2 className="text-2xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Recent Activity
              </h2>
              <div className="space-y-2">
                {activities.length > 0 ? (
                  activities.map((activity, index) => {
                    // Select icon based on activity type
                    const ActivityIcon = 
                      activity.type === 'user' ? Users :
                      activity.type === 'seller' ? Store :
                      activity.type === 'order' ? Package :
                      activity.type === 'buyback' ? RefreshCw :
                      BookOpen;
                    
                    // Select minimal colors based on activity type
                    const iconColor = 
                      activity.type === 'user' ? 'text-blue-400' :
                      activity.type === 'seller' ? 'text-emerald-400' :
                      activity.type === 'order' ? 'text-green-400' :
                      activity.type === 'buyback' ? 'text-orange-400' :
                      'text-[#D4AF37]';
                    
                    // Show pulse on recent activities (less than 1 minute old)
                    const isRecent = new Date().getTime() - new Date(activity.timestamp).getTime() < 60000;
                    
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-2.5 hover:bg-[#2C1810]/50 rounded transition-colors group">
                        <div className="relative">
                          <ActivityIcon className={`size-4 mt-0.5 ${iconColor}`} />
                          {isRecent && index < 3 && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#F5E6D3] leading-tight">{activity.text}</p>
                          <p className="text-xs text-[#8B6F47] mt-0.5">{getRelativeTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-[#8B6F47] mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-[#8B6F47]">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
                <h2 className="text-xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Top Selling Books
                </h2>
                <div className="space-y-3">
                  {allBooks.slice(0, 5).map((book, i) => (
                    <div key={book._id} className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-[#8B6F47]">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#F5E6D3] truncate text-sm">{book.title}</p>
                        <p className="text-xs text-[#D4C5AA]">{book.author}</p>
                      </div>
                      <span className="text-sm font-bold text-[#D4AF37]">₹{book.price}</span>
                    </div>
                  ))}
                  {allBooks.length === 0 && (
                    <p className="text-[#D4C5AA] text-sm">No books available</p>
                  )}
                </div>
              </div>

              <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
                <h2 className="text-xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Top Sellers
                </h2>
                <div className="space-y-3">
                  {allSellers.slice(0, 5).map((seller, i) => (
                    <div key={seller.id || seller._id} className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-[#8B6F47]">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#F5E6D3] truncate text-sm">{seller.storeName || seller.name}</p>
                        <p className="text-xs text-[#D4C5AA]">{seller.location || 'Location not set'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-[#D4AF37]">Active</span>
                        <span className="text-[#D4AF37]">★</span>
                      </div>
                    </div>
                  ))}
                  {allSellers.length === 0 && (
                    <p className="text-[#D4C5AA] text-sm">No sellers available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Platform Users ({totalUsers})
            </h2>
            {loadingUsers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-[#D4C5AA]">Loading users...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allUsers.filter(u => u.role === 'customer').map((user) => (
                  <div key={user.id || user._id} className="flex items-center justify-between p-4 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
                        <Users className="size-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-[#F5E6D3]">{user.name}</p>
                        <p className="text-sm text-[#D4C5AA]">{user.email}</p>
                        {user.location && <p className="text-xs text-[#A08968] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {user.location}
                        </p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded text-sm transition-all"
                        onClick={() => handleViewUserProfile(user.id || user._id)}
                      >
                        View Profile
                      </button>
                      <button
                        className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded text-sm transition-all"
                        onClick={() => handleSuspendUser(user.id || user._id)}
                      >
                        {suspendedUsers.includes(user.id || user._id) ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>
                  </div>
                ))}
                {allUsers.filter(u => u.role === 'customer').length === 0 && (
                  <div className="text-center py-8">
                    <Users className="size-16 text-[#8B6F47] mx-auto mb-4" />
                    <p className="text-[#D4C5AA]">No users found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sellers Tab */}
        {activeTab === 'sellers' && (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Platform Sellers ({totalSellers})
            </h2>
            {loadingSellers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-[#D4C5AA]">Loading sellers...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allSellers.map((seller) => (
                  <div key={seller.id || seller._id} className="p-4 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-700 rounded-lg flex items-center justify-center">
                          <Store className="size-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#F5E6D3] text-lg">{seller.storeName || seller.name}</h3>
                          <p className="text-sm text-[#D4C5AA]">{seller.name}</p>
                          <p className="text-xs text-[#A08968] flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {seller.location || 'Location not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center p-2 bg-[#3D2817] rounded border border-[#8B6F47]">
                        <p className="text-sm text-[#D4C5AA]">Phone</p>
                        <p className="text-sm font-bold text-[#F5E6D3]">{seller.phone || 'N/A'}</p>
                      </div>
                      <div className="text-center p-2 bg-[#3D2817] rounded border border-[#8B6F47]">
                        <p className="text-sm text-[#D4C5AA]">Email</p>
                        <p className="text-sm font-bold text-[#F5E6D3]">{seller.email}</p>
                      </div>
                      <div className="text-center p-2 bg-[#3D2817] rounded border border-[#8B6F47]">
                        <p className="text-sm text-[#D4C5AA]">Status</p>
                        <p className="text-sm font-bold text-emerald-400">Active</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-4 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded text-sm transition-all"
                        onClick={() => handleViewSellerBooks(seller.id || seller._id)}
                      >
                        View Books
                      </button>
                      <button
                        className="flex-1 px-4 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-white font-semibold rounded text-sm transition-all"
                        onClick={() => handleViewSellerStats(seller.id || seller._id)}
                      >
                        View Stats
                      </button>
                      <button
                        className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded text-sm transition-all"
                        onClick={() => handleSuspendSeller(seller.id || seller._id)}
                      >
                        {suspendedSellers.includes(seller.id || seller._id) ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>
                  </div>
                ))}
                {allSellers.length === 0 && (
                  <div className="text-center py-8">
                    <Store className="size-16 text-[#8B6F47] mx-auto mb-4" />
                    <p className="text-[#D4C5AA]">No sellers found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Books Tab */}
        {activeTab === 'books' && (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              All Books ({totalBooks})
            </h2>
            {loadingBooks ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-[#D4C5AA]">Loading books...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allBooks.length > 0 ? (
                  allBooks.map((book) => (
                    <div key={book._id} className="flex items-center gap-4 p-3 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                      <img 
                        src={book.image || '/api/placeholder/64/80'} 
                        alt={book.title} 
                        className="w-16 h-20 object-cover rounded border border-[#8B6F47]"
                        onError={(e) => {
                          e.currentTarget.src = '/api/placeholder/64/80';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#F5E6D3] truncate">{book.title}</h3>
                        <p className="text-sm text-[#D4C5AA]">{book.author}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700/50">
                            {book.condition?.toUpperCase() || 'NEW'}
                          </span>
                          <span className="text-xs text-[#A08968]">{book.sellerId?.storeName || book.sellerId?.name || 'Unknown Seller'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#D4AF37]">₹{book.price}</p>
                        <p className="text-xs text-[#D4C5AA]">Stock: {book.stock || 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded transition-all"
                          onClick={() => navigate(`/product/${book._id}`)}
                        >
                          View
                        </button>
                        <button
                          className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold rounded transition-all"
                          onClick={() => handleRemoveBook(book._id)}
                        >
                          {removedBooks.includes(book._id) ? 'Restore' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="size-16 text-[#8B6F47] mx-auto mb-4" />
                    <p className="text-[#D4C5AA]">No books found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Customer Orders Tab */}
        {activeTab === 'customerOrders' && (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Customer Orders ({customerOrders.length})
              </h2>
              <button
                onClick={async () => {
                  try {
                    setLoadingCustomerOrders(true);
                    console.log('🔄 Manually refreshing customer orders...');
                    const orders = await apiService.getAllOrders();
                    setCustomerOrders(orders);
                    console.log('✅ Refreshed:', orders.length, 'orders');
                    toast.success(`Refreshed ${orders.length} customer orders!`);
                  } catch (error) {
                    console.error('Refresh error:', error);
                    toast.error(`Failed to refresh: ${error.message}`);
                  } finally {
                    setLoadingCustomerOrders(false);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded transition-all"
              >
                <RefreshCw className="size-4" />
                Refresh
              </button>
            </div>
            {loadingCustomerOrders ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-[#D4C5AA]">Loading customer orders...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerOrders && customerOrders.length > 0 ? (
                  customerOrders.slice(0, 8).map((order) => (
                    <div key={order.id} className="p-4 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-[#F5E6D3]">{order.id}</p>
                          <p className="text-sm text-[#D4C5AA]">{order.date} • {order.customerName || 'Guest User'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded text-sm font-bold ${
                          order.status === 'new' || order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50' :
                          order.status === 'processing' || order.status === 'accepted' || order.status === 'packed' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' :
                          order.status === 'delivered' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50' :
                          order.status === 'shipped' ? 'bg-purple-900/30 text-purple-400 border border-purple-700/50' :
                          'bg-red-900/30 text-red-400 border border-red-700/50'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#D4C5AA]">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {order.items[0]?.book?.sellerName || 'Multiple Sellers'}
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-[#D4AF37] font-bold">₹{order.total}</p>
                          <button
                            className="px-4 py-1.5 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded text-sm transition-all"
                            onClick={() => handleViewOrderDetails(order.id)}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 bg-[#2C1810] rounded-lg border border-[#8B6F47] text-center">
                    <ShoppingBag className="w-12 h-12 text-[#8B6F47] mx-auto mb-3" />
                    <p className="text-[#D4C5AA]">No customer orders yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Seller Orders Tab */}
        {activeTab === 'sellerOrders' && (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Seller Orders ({sellerOrders.length})
            </h2>
            <p className="text-[#D4C5AA] mb-4 text-sm">
              Orders placed by customers to sellers on the platform
            </p>
            {loadingSellerOrders ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-[#D4C5AA]">Loading seller orders...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sellerOrders && sellerOrders.length > 0 ? (
                  sellerOrders.slice(0, 8).map((order) => (
                    <div key={order.id} className="p-4 bg-[#2C1810] rounded-lg border border-emerald-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-[#F5E6D3]">{order.id}</p>
                          <p className="text-sm text-[#D4C5AA]">
                            {order.date} • {order.customerName || 'Unknown Seller'}
                          </p>
                          <p className="text-xs text-emerald-400 mt-1">
                            <Store className="inline size-3 mr-1" />
                            Customer Order
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded text-sm font-bold ${
                          order.status === 'new' || order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50' :
                          order.status === 'processing' || order.status === 'accepted' || order.status === 'packed' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' :
                          order.status === 'delivered' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50' :
                          order.status === 'shipped' ? 'bg-purple-900/30 text-purple-400 border border-purple-700/50' :
                          'bg-red-900/30 text-red-400 border border-red-700/50'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#D4C5AA]">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {order.items[0]?.book?.sellerName || 'Seller'}
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-[#D4AF37] font-bold">₹{order.total}</p>
                          <button
                            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded text-sm transition-all"
                            onClick={() => handleViewOrderDetails(order.id)}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 bg-[#2C1810] rounded-lg border border-[#8B6F47] text-center">
                    <Store className="w-12 h-12 text-[#8B6F47] mx-auto mb-3" />
                    <p className="text-[#D4C5AA]">No seller orders yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Returns Tab */}
        {activeTab === 'returns' && (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Return Requests ({pendingReturns.length} Pending Admin Approval)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const debugInfo = {
                      user: user?.name || 'Not logged in',
                      userRole: user?.role || 'No role',
                      tokenExists: !!localStorage.getItem('token'),
                      apiBase: 'http://localhost:3001/api',
                      returnRequestsCount: returnRequests.length,
                      pendingReturnsCount: pendingReturns.length,
                      loadingState: loadingReturns,
                      endpoint: '/returns/admin/all-returns'
                    };
                    
                    console.log('🔍 Returns Debug Info:', debugInfo);
                    
                    toast.info('Returns Debug Information', {
                      description: `User: ${debugInfo.user} (${debugInfo.userRole}) | Token: ${debugInfo.tokenExists ? 'Yes' : 'No'} | Returns: ${debugInfo.returnRequestsCount} | Pending: ${debugInfo.pendingReturnsCount}`,
                      duration: 8000
                    });
                    
                    console.table(debugInfo);
                  }}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded transition-all"
                >
                  Debug
                </button>
                <button
                  onClick={async () => {
                    try {
                      setLoadingReturns(true);
                      console.log('🔄 Manually refreshing return requests...');
                      console.log('User role:', user?.role);
                      console.log('Token exists:', !!localStorage.getItem('token'));
                      
                      const returns = await apiService.getAllReturns();
                      setReturnRequests(returns);
                      console.log('✅ Successfully refreshed:', returns.length, 'return requests');
                      toast.success(`Refreshed ${returns.length} return requests!`);
                    } catch (error) {
                      console.error('Error refreshing return requests:', error);
                      console.error('Refresh error details:', {
                        message: error.message,
                        status: error.status,
                        token: !!localStorage.getItem('token'),
                        userRole: user?.role,
                        apiUrl: 'http://localhost:3001/api/returns/admin/all-returns'
                      });
                      toast.error(`Failed to refresh: ${error.message}`);
                    } finally {
                      setLoadingReturns(false);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded transition-all"
                >
                  <RefreshCw className="size-4" />
                  Refresh
                </button>
              </div>
            </div>
            <p className="text-[#D4C5AA] mb-4 text-sm">
              Review and approve/reject return requests from customers
            </p>
            {loadingReturns ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-[#D4C5AA]">Loading returns...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReturns && pendingReturns.length > 0 ? (
                  pendingReturns.map((returnRequest) => (
                    <div key={returnRequest.id} className="p-4 bg-[#2C1810] rounded-lg border border-orange-700/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-bold text-[#F5E6D3]">{returnRequest.id}</p>
                          <p className="text-sm text-[#D4C5AA]">
                            {returnRequest.requestDate} • {returnRequest.customerName}
                          </p>
                          <p className="text-xs text-orange-400 mt-1">
                            <RotateCcw className="inline size-3 mr-1" />
                            Order: {returnRequest.orderId}
                          </p>
                          <p className="text-sm text-[#D4C5AA] mt-2">
                            <span className="font-semibold text-[#F5E6D3]">Reason:</span> {returnRequest.reason}
                          </p>
                          {returnRequest.description && (
                            <p className="text-sm text-[#D4C5AA] mt-1">
                              <span className="font-semibold text-[#F5E6D3]">Details:</span> {returnRequest.description}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 rounded text-sm font-bold bg-orange-900/30 text-orange-400 border border-orange-700/50">
                          Pending Review
                        </span>
                      </div>
                      <div className="border-t border-[#8B6F47] pt-3 mt-3">
                        <p className="text-sm text-[#D4C5AA] mb-2">
                          <span className="font-semibold text-[#F5E6D3]">Items to return:</span> {returnRequest.items.length} item{returnRequest.items.length !== 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {returnRequest.items.map((item, idx) => (
                            <div key={idx} className="bg-[#3D2817] px-3 py-1.5 rounded text-xs text-[#D4C5AA] border border-[#8B6F47]">
                              {item.book.title} (x{item.quantity})
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-[#D4C5AA]">
                            Seller: <span className="text-[#D4AF37] font-semibold">{returnRequest.sellerName}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              className="px-4 py-1.5 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded text-sm transition-all"
                              onClick={() => handleViewReturnDetails(returnRequest)}
                            >
                              View Details
                            </button>
                            <button
                              className="px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white font-semibold rounded text-sm transition-all"
                              onClick={() => handleOpenReturnActionModal(returnRequest, 'reject')}
                            >
                              <X className="inline size-4 mr-1" />
                              Reject
                            </button>
                            <button
                              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded text-sm transition-all"
                              onClick={() => handleOpenReturnActionModal(returnRequest, 'approve')}
                            >
                              <CheckCircle className="inline size-4 mr-1" />
                              Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 bg-[#2C1810] rounded-lg border border-[#8B6F47] text-center">
                    <RotateCcw className="w-12 h-12 text-[#8B6F47] mx-auto mb-3" />
                    <p className="text-[#D4C5AA]">No pending return requests</p>
                  </div>
                )}
              </div>
            )}

            {/* Show all return requests history */}
            {returnRequests && returnRequests.length > pendingReturns.length && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Return History
                </h3>
                <div className="space-y-3">
                  {returnRequests.filter(r => r.status !== 'pending-admin').map((returnRequest) => (
                    <div key={returnRequest.id} className="p-4 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-[#F5E6D3]">{returnRequest.id}</p>
                          <p className="text-sm text-[#D4C5AA]">{returnRequest.requestDate} • {returnRequest.customerName}</p>
                          <p className="text-xs text-[#D4C5AA] mt-1">Order: {returnRequest.orderId}</p>
                        </div>
                        <span className={`px-3 py-1 rounded text-sm font-bold ${
                          returnRequest.status === 'approved-by-admin' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' :
                          returnRequest.status === 'rejected-by-admin' ? 'bg-red-900/30 text-red-400 border border-red-700/50' :
                          returnRequest.status === 'refund-issued' ? 'bg-purple-900/30 text-purple-400 border border-purple-700/50' :
                          returnRequest.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50' :
                          'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50'
                        }`}>
                          {returnRequest.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                      {returnRequest.adminNotes && (
                        <p className="text-sm text-[#D4C5AA] mt-2">
                          <span className="font-semibold text-[#F5E6D3]">Admin Notes:</span> {returnRequest.adminNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buyback Sales Tab */}
        {activeTab === 'buybackSales' && (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Buyback Sales - Admin to Sellers ({buybackRequests.length})
            </h2>
            <p className="text-[#D4C5AA] mb-4 text-sm">
              All buyback requests in the system
            </p>
            <div className="space-y-3">
              {buybackRequests.length > 0 ? (
                buybackRequests.map((request) => (
                  <div key={request.id} className="p-4 bg-[#2C1810] rounded-lg border border-[#D4AF37]/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-[#F5E6D3]">{request.id}</p>
                        <p className="text-sm text-[#D4C5AA]">{request.date} • Available for Sale</p>
                        <p className="text-xs text-[#D4AF37] mt-1">
                          <IndianRupee className="inline size-3 mr-1" />
                          Buyback Inventory
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm font-bold ${
                        request.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50' :
                        request.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50' :
                        'bg-red-900/30 text-red-400 border border-red-700/50'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-[#F5E6D3]">
                        {request.bookTitle}
                      </p>
                      <p className="text-xs text-[#D4C5AA]">by {request.author} • ISBN: {request.isbn}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#D4C5AA]">
                        Condition: {request.condition}
                      </p>
                      <div className="flex items-center gap-3">
                        <p className="text-[#D4AF37] font-bold">₹{request.sellingPrice || request.offeredPrice}</p>
                        <button
                          className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#F5E6D3] text-[#2C1810] font-semibold rounded text-sm transition-all"
                          onClick={() => {
                            toast.info('This would generate a sales listing for sellers to purchase');
                          }}
                        >
                          Create Listing
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 bg-[#2C1810] rounded-lg border border-[#8B6F47] text-center">
                  <RefreshCw className="w-12 h-12 text-[#8B6F47] mx-auto mb-3" />
                  <p className="text-[#D4C5AA]">No buyback requests found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Buyback Tab */}
        {activeTab === 'buyback' && (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Buyback Requests ({pendingBuybacks} Pending)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const debugInfo = {
                      user: user?.name || 'Not logged in',
                      userRole: user?.role || 'No role',
                      tokenExists: !!localStorage.getItem('token'),
                      apiBase: 'http://localhost:3001/api',
                      buybackRequestsCount: buybackRequests.length,
                      loadingState: loadingBuybackRequests,
                      pendingCount: pendingBuybacks,
                      endpoint: '/buyback/admin/all-requests'
                    };
                    
                    console.log('🔍 Debug Info:', debugInfo);
                    
                    // Show debug info in a toast for better visibility
                    toast.info('Debug Information', {
                      description: `User: ${debugInfo.user} (${debugInfo.userRole}) | Token: ${debugInfo.tokenExists ? 'Yes' : 'No'} | Requests: ${debugInfo.buybackRequestsCount} | Loading: ${debugInfo.loadingState ? 'Yes' : 'No'}`,
                      duration: 8000
                    });
                    
                    // Also log detailed info to console
                    console.table(debugInfo);
                  }}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded transition-all"
                >
                  Debug
                </button>
                <button
                  onClick={async () => {
                    try {
                      setLoadingBuybackRequests(true);
                      console.log('🔄 Manually refreshing buyback requests...');
                      console.log('User role:', user?.role);
                      console.log('Token exists:', !!localStorage.getItem('token'));
                      
                      const requests = await apiService.getAllBuybackRequests();
                      setBuybackRequests(requests);
                      console.log('✅ Successfully refreshed:', requests.length, 'requests');
                      toast.success(`Refreshed ${requests.length} buyback requests!`);
                    } catch (error) {
                      console.error('Error refreshing buyback requests:', error);
                      console.error('Refresh error details:', {
                        message: error.message,
                        status: error.status,
                        token: !!localStorage.getItem('token'),
                        userRole: user?.role,
                        apiUrl: 'http://localhost:3001/api/buyback/admin/all-requests'
                      });
                      toast.error(`Failed to refresh: ${error.message}`);
                    } finally {
                      setLoadingBuybackRequests(false);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded transition-all"
                >
                  <RefreshCw className="size-4" />
                  Refresh
                </button>
              </div>
            </div>
            
            {loadingBuybackRequests ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-[#D4C5AA]">Loading buyback requests...</p>
              </div>
            ) : buybackRequests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="size-16 text-[#8B6F47] mx-auto mb-4" />
                <p className="text-[#D4C5AA] text-lg">No buyback requests found</p>
                <p className="text-[#8B6F47] text-sm mt-2">
                  {user?.role !== 'admin' ? 'Admin access required' : 'Database might be empty or connection issue'}
                </p>
                <button
                  onClick={async () => {
                    try {
                      setLoadingBuybackRequests(true);
                      const requests = await apiService.getAllBuybackRequests();
                      setBuybackRequests(requests);
                      toast.success('Data refreshed!');
                    } catch (error) {
                      console.error('Retry error:', error);
                      toast.error('Still unable to load data');
                    } finally {
                      setLoadingBuybackRequests(false);
                    }
                  }}
                  className="mt-4 px-4 py-2 bg-[#D4AF37] hover:bg-[#8B6F47] text-[#2C1810] font-semibold rounded transition-all"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {buybackRequests.map((request) => (
                  <div key={request.id} className={`p-4 bg-[#2C1810] rounded-lg border ${
                    request.status === 'approved' ? 'border-emerald-700' : 
                    request.status === 'rejected' ? 'border-red-700' : 
                    'border-[#8B6F47]'
                  }`}>
                    <div className="flex gap-4">
                      {/* Book Image */}
                      <img 
                        src={request.image} 
                        alt={request.bookTitle} 
                        className="w-20 h-28 object-cover rounded border border-[#8B6F47]"
                      />
                      
                      {/* Book Details */}
                      <div className="flex-1">
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-[#F5E6D3]">{request.bookTitle}</h3>
                            {request.status !== 'pending' && (
                              <span className={`text-xs px-3 py-1 rounded font-bold ${
                                request.status === 'approved' 
                                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50' 
                                  : 'bg-red-900/30 text-red-400 border border-red-700/50'
                              }`}>
                                {request.status.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#D4C5AA] mb-1">by {request.author}</p>
                          <p className="text-sm text-[#D4C5AA]">ISBN: {request.isbn}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs px-2 py-1 rounded border font-bold ${
                              request.condition === 'like-new' 
                                ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700/50' 
                                : request.condition === 'good'
                                ? 'bg-blue-900/30 text-blue-400 border-blue-700/50'
                                : 'bg-orange-900/30 text-orange-400 border-orange-700/50'
                            }`}>
                              {request.condition?.toUpperCase() || 'N/A'}
                            </span>
                            <span className="text-sm text-[#D4C5AA]">Submitted: {request.date}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-6 mt-3">
                          <div>
                            <p className="text-sm text-[#D4C5AA]">Offered Price</p>
                            <p className="text-2xl font-bold text-[#D4AF37]">₹{request.offeredPrice}</p>
                          </div>
                          
                          {request.status === 'pending' ? (
                            <div className="flex-1 space-y-3">
                              <div className="flex gap-2 items-center">
                                <div className="flex-1">
                                  <label className="block text-xs text-[#D4C5AA] mb-1">Selling Price (₹)</label>
                                  <input
                                    type="number"
                                    placeholder="Selling price"
                                    value={sellingPrices[request.id] !== undefined ? sellingPrices[request.id] : request.offeredPrice}
                                    onChange={(e) => setSellingPrices({ ...sellingPrices, [request.id]: e.target.value })}
                                    className="w-32 px-4 py-2 bg-[#3D2817] border border-[#8B6F47] rounded text-[#F5E6D3] text-sm focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>
                                <div className="flex gap-2 self-end">
                                  <button
                                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded text-sm transition-all"
                                    onClick={() => {
                                      const price = parseFloat(sellingPrices[request.id]) || request.offeredPrice;
                                      const reason = priceChangeReasons[request.id] || '';
                                      
                                      handleBuybackAction(request.id, 'approved', price, reason);
                                      setSellingPrices({ ...sellingPrices, [request.id]: '' });
                                      setPriceChangeReasons({ ...priceChangeReasons, [request.id]: '' });
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded text-sm transition-all"
                                    onClick={() => handleBuybackAction(request.id, 'rejected')}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                              
                              {/* Show reason field only if price changed */}
                              {(sellingPrices[request.id] && parseFloat(sellingPrices[request.id]) !== request.offeredPrice) && (
                                <div>
                                  <label className="block text-xs text-[#D4C5AA] mb-1">Reason for Price Change *</label>
                                  <textarea
                                    placeholder="Explain why the price was adjusted..."
                                    value={priceChangeReasons[request.id] || ''}
                                    onChange={(e) => setPriceChangeReasons({ ...priceChangeReasons, [request.id]: e.target.value })}
                                    className="w-full px-3 py-2 bg-[#3D2817] border border-[#8B6F47] rounded text-[#F5E6D3] text-sm focus:outline-none focus:border-[#D4AF37] resize-none"
                                    rows={2}
                                  />
                                  <p className="text-xs text-yellow-400 mt-1">
                                    Price changed from ₹{request.offeredPrice} to ₹{sellingPrices[request.id]}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-right">
                              {request.status === 'approved' && request.sellingPrice && (
                                <div className="mb-2">
                                  <p className="text-sm text-[#D4C5AA]">Selling Price</p>
                                  <p className="text-lg font-bold text-emerald-400">₹{request.sellingPrice}</p>
                                  {request.priceChangeReason && (
                                    <div className="mt-2 p-2 bg-[#3D2817] rounded border border-yellow-700/50">
                                      <p className="text-xs text-yellow-400 font-semibold">Price Adjustment:</p>
                                      <p className="text-xs text-[#D4C5AA] mt-1">{request.priceChangeReason}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Platform Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Platform Settings
            </h2>
            <p className="text-[#D4C5AA] mb-6 text-sm">
              Configure business details that will appear on invoices and platform communications
            </p>
            
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={platformSettings.businessName}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, businessName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#2C1810] border border-[#8B6F47] rounded text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37] transition-all"
                  placeholder="BOI PARA"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
                  Tagline *
                </label>
                <input
                  type="text"
                  value={platformSettings.tagline}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, tagline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#2C1810] border border-[#8B6F47] rounded text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37] transition-all"
                  placeholder="Connecting Kolkata's Book Lovers"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
                  Business Address *
                </label>
                <textarea
                  value={platformSettings.address}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#2C1810] border border-[#8B6F47] rounded text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37] transition-all resize-none"
                  rows={2}
                  placeholder="College Street, Kolkata - 700073"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={platformSettings.email}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border border-[#8B6F47] rounded text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37] transition-all"
                    placeholder="contact@boipara.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={platformSettings.phone}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border border-[#8B6F47] rounded text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37] transition-all"
                    placeholder="+91 8101637164"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
                  Support Email *
                </label>
                <input
                  type="email"
                  value={platformSettings.supportEmail}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#2C1810] border border-[#8B6F47] rounded text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37] transition-all"
                  placeholder="reachsupport@boipara.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  value={platformSettings.gstNumber}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, gstNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#2C1810] border border-[#8B6F47] rounded text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37] transition-all"
                  placeholder="Enter GST number if applicable"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    toast.success('Settings Saved!', {
                      description: 'Platform settings have been updated successfully'
                    });
                  }}
                  className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#C5A028] text-[#2C1810] font-bold rounded transition-all"
                >
                  Save Settings
                </button>
                <button
                  onClick={() => {
                    const defaultSettings = {
                      businessName: 'BOI PARA',
                      tagline: 'Connecting Kolkata\'s Book Lovers',
                      address: 'College Street, Kolkata - 700073',
                      email: 'contact@boipara.com',
                      phone: '+91 8101637164',
                      gstNumber: '',
                      supportEmail: 'reachsupport@boipara.com'
                    };
                    setPlatformSettings(defaultSettings);
                    toast.info('Settings Reset', {
                      description: 'Platform settings have been reset to defaults'
                    });
                  }}
                  className="px-6 py-2.5 bg-[#2C1810] hover:bg-[#3D2817] border border-[#8B6F47] text-[#D4C5AA] font-semibold rounded transition-all"
                >
                  Reset to Default
                </button>
              </div>

              <div className="mt-6 p-4 bg-[#2C1810] rounded border border-[#D4AF37]/30">
                <p className="text-sm text-[#D4AF37] font-semibold mb-2 flex items-center gap-2">
                  <FileText className="size-4" />
                  These details will appear on:
                </p>
                <ul className="text-sm text-[#D4C5AA] space-y-1 ml-4">
                  <li>• Customer invoices (included in packages)</li>
                  <li>• Seller invoices (admin sales to sellers)</li>
                  <li>• Email communications</li>
                  <li>• Platform footer and contact information</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSellerBooks && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl w-[90%] max-w-4xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Books by {allSellers.find(s => (s.id || s._id) === selectedSeller)?.storeName || 'Seller'}
              </h2>
              <button
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded text-sm transition-all"
                onClick={() => {
                  setShowSellerBooks(false);
                  setSellerBooks([]);
                  setSelectedSeller(null);
                }}
              >
                <X className="size-4" />
              </button>
            </div>
            
            {loadingSellerBooks ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-[#D4C5AA]">Loading seller books...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sellerBooks.length > 0 ? (
                  sellerBooks.map((book) => (
                    <div key={book._id} className="flex items-center gap-4 p-3 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                      <img 
                        src={book.image || '/api/placeholder/64/80'} 
                        alt={book.title} 
                        className="w-16 h-20 object-cover rounded border border-[#8B6F47]" 
                        onError={(e) => {
                          e.currentTarget.src = '/api/placeholder/64/80';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#F5E6D3] truncate">{book.title}</h3>
                        <p className="text-sm text-[#D4C5AA]">{book.author}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700/50">
                            {book.condition?.toUpperCase() || 'NEW'}
                          </span>
                          <span className="text-xs text-[#A08968]">{book.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#D4AF37]">₹{book.price}</p>
                        <p className="text-xs text-[#D4C5AA]">Stock: {book.stock || 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded transition-all"
                          onClick={() => navigate(`/product/${book._id}`)}
                        >
                          View
                        </button>
                        <button
                          className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold rounded transition-all"
                          onClick={() => handleRemoveBook(book._id)}
                        >
                          {removedBooks.includes(book._id) ? 'Restore' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="size-16 text-[#8B6F47] mx-auto mb-4" />
                    <p className="text-[#D4C5AA]">No books found for this seller</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showSellerStats && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-2xl p-8 border border-[#8B6F47]/30 shadow-2xl w-[90%] max-w-5xl backdrop-blur max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b border-[#8B6F47]/30">
              <div>
                <h2 className="text-3xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Seller Performance
                </h2>
                <p className="text-[#D4C5AA] text-sm">
                  {sellerStats?.seller?.storeName || allSellers.find(s => (s.id || s._id) === selectedSeller)?.storeName || 'Seller'}
                </p>
              </div>
              <button
                className="p-2.5 bg-red-900/50 hover:bg-red-800 text-white rounded-lg transition-all hover:scale-105 border border-red-700/50"
                onClick={() => {
                  setShowSellerStats(false);
                  setSellerStats(null);
                  setSelectedSeller(null);
                }}
              >
                <X className="size-5" />
              </button>
            </div>

            {loadingSellerStats ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-[#D4C5AA] text-lg">Loading seller statistics...</p>
              </div>
            ) : sellerStats ? (
              /* Stats Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Books */}
                <div className="group relative bg-[#2C1810]/60 rounded-xl p-6 border border-[#8B6F47]/40 hover:border-[#D4AF37]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-start gap-5">
                    <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#8B6F47] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="size-7 text-[#2C1810]" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#D4C5AA] uppercase tracking-wide mb-1.5">Total Books</h3>
                      <p className="text-2xl font-bold text-[#F5E6D3] mb-0.5">{sellerStats.totalBooks}</p>
                    </div>
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="group relative bg-[#2C1810]/60 rounded-xl p-6 border border-[#8B6F47]/40 hover:border-[#D4AF37]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-start gap-5">
                    <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#8B6F47] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <IndianRupee className="size-7 text-[#2C1810]" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#D4C5AA] uppercase tracking-wide mb-1.5">Total Revenue</h3>
                      <p className="text-2xl font-bold text-[#F5E6D3] mb-0.5">₹{sellerStats.totalRevenue.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* Total Sales */}
                <div className="group relative bg-[#2C1810]/60 rounded-xl p-6 border border-[#8B6F47]/40 hover:border-[#D4AF37]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-start gap-5">
                    <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#8B6F47] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Package className="size-7 text-[#2C1810]" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#D4C5AA] uppercase tracking-wide mb-1.5">Total Sales</h3>
                      <p className="text-2xl font-bold text-[#F5E6D3] mb-0.5">{sellerStats.totalSales}</p>
                    </div>
                  </div>
                </div>

                {/* Average Rating */}
                <div className="group relative bg-[#2C1810]/60 rounded-xl p-6 border border-[#8B6F47]/40 hover:border-[#D4AF37]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-start gap-5">
                    <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#8B6F47] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Star className="size-7 text-[#2C1810]" strokeWidth={2.5} fill="#2C1810" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#D4C5AA] uppercase tracking-wide mb-1.5">Average Rating</h3>
                      <p className="text-2xl font-bold text-[#F5E6D3] mb-0.5 flex items-center gap-1.5">
                        {sellerStats.avgRating}
                        <Star className="size-5 text-[#D4AF37] fill-[#D4AF37]" />
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Performing Books - Full Width */}
                <div className="md:col-span-2 group relative bg-[#2C1810]/60 rounded-xl p-6 border border-[#8B6F47]/40 hover:border-[#D4AF37]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-start gap-5">
                    <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#8B6F47] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Award className="size-7 text-[#2C1810]" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#D4C5AA] uppercase tracking-wide mb-1.5">Top Performing Books</h3>
                      {sellerStats.topBooks && sellerStats.topBooks.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {sellerStats.topBooks.map((book: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 text-sm bg-[#1A0F08]/50 rounded-lg p-3">
                              <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#2C1810] flex items-center justify-center font-bold text-xs">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <span className="text-[#F5E6D3] font-semibold">{book.title}</span>
                                <p className="text-xs text-[#D4C5AA] mt-0.5">by {book.author} • {book.sales} sold</p>
                              </div>
                              <span className="text-[#D4AF37] font-bold">₹{book.price}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#D4C5AA] mt-2">No sales data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="size-16 text-[#8B6F47] mx-auto mb-4" />
                <p className="text-[#D4C5AA] text-lg">Failed to load seller statistics</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showUserProfile && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-2xl p-8 border border-[#8B6F47]/30 shadow-2xl w-[90%] max-w-4xl backdrop-blur max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b border-[#8B6F47]/30">
              <div>
                <h2 className="text-3xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  User Profile
                </h2>
                <p className="text-[#D4C5AA] text-sm">
                  {mockUsers.find(u => u.id === selectedUser)?.name}
                </p>
              </div>
              <button
                className="p-2.5 bg-red-900/50 hover:bg-red-800 text-white rounded-lg transition-all hover:scale-105 border border-red-700/50"
                onClick={() => setShowUserProfile(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Profile Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(allUsers.find(u => (u.id || u._id) === selectedUser) || {}).map(([key, value]) => {
                // Only show relevant fields
                if (!['name', 'email', 'location', 'role', 'id', '_id'].includes(key)) return null;
                
                return (
                  <div 
                    key={key} 
                    className="group relative bg-[#2C1810]/60 rounded-xl p-6 border border-[#8B6F47]/40 hover:border-[#D4AF37]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/10 overflow-hidden"
                  >
                    {/* Background Gradient Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative flex items-start gap-5">
                      {/* Icon */}
                      <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#8B6F47] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {key === 'name' ? (
                          <Users className="size-7 text-[#2C1810]" strokeWidth={2.5} />
                        ) : key === 'email' ? (
                          <Mail className="size-7 text-[#2C1810]" strokeWidth={2.5} />
                        ) : key === 'location' ? (
                          <MapPin className="size-7 text-[#2C1810]" strokeWidth={2.5} />
                        ) : key === 'role' ? (
                          <Shield className="size-7 text-[#2C1810]" strokeWidth={2.5} />
                        ) : (
                          <Users className="size-7 text-[#2C1810]" strokeWidth={2.5} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[#D4C5AA] uppercase tracking-wide mb-1.5">
                          {key === 'name' ? 'Full Name' :
                          key === 'email' ? 'Email Address' :
                          key === 'location' ? 'Location' :
                          key === 'role' ? 'User Role' :
                          key === 'id' ? 'User ID' :
                          key}
                        </h3>
                        <p className="text-lg font-semibold text-[#F5E6D3] break-words">
                          {key === 'role' ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full text-[#D4AF37] text-sm font-bold">
                              <Shield className="size-4" />
                              {String(value).toUpperCase()}
                            </span>
                          ) : (
                            String(value)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order History Section */}
            {(() => {
              const userOrders = customerOrders.filter(order => order.userId === selectedUser);
              const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
              
              // Calculate favorite categories
              const categoryCount: { [key: string]: number } = {};
              userOrders.forEach(order => {
                order.items.forEach(item => {
                  const book = mockBooks.find(b => b.id === item.bookId);
                  if (book?.category) {
                    categoryCount[book.category] = (categoryCount[book.category] || 0) + item.quantity;
                  }
                });
              });
              
              const favoriteCategory = Object.keys(categoryCount).length > 0
                ? Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0][0]
                : 'N/A';

              return (
                <>
                  {/* Analytics Overview */}
                  <div className="mt-8 pt-8 border-t border-[#8B6F47]/30">
                    <h3 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Purchase Analytics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* Total Orders */}
                      <div className="bg-[#2C1810]/60 rounded-xl p-5 border border-[#8B6F47]/40">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="size-5 text-white" strokeWidth={2.5} />
                          </div>
                          <p className="text-sm text-[#D4C5AA] uppercase tracking-wide">Total Orders</p>
                        </div>
                        <p className="text-3xl font-bold text-[#F5E6D3]">{userOrders.length}</p>
                      </div>

                      {/* Total Spent */}
                      <div className="bg-[#2C1810]/60 rounded-xl p-5 border border-[#8B6F47]/40">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
                            <IndianRupee className="size-5 text-white" strokeWidth={2.5} />
                          </div>
                          <p className="text-sm text-[#D4C5AA] uppercase tracking-wide">Total Spent</p>
                        </div>
                        <p className="text-3xl font-bold text-[#F5E6D3]">₹{totalSpent.toLocaleString('en-IN')}</p>
                      </div>

                      {/* Favorite Category */}
                      <div className="bg-[#2C1810]/60 rounded-xl p-5 border border-[#8B6F47]/40">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#8B6F47] rounded-lg flex items-center justify-center">
                            <Tag className="size-5 text-[#2C1810]" strokeWidth={2.5} />
                          </div>
                          <p className="text-sm text-[#D4C5AA] uppercase tracking-wide">Favorite Genre</p>
                        </div>
                        <p className="text-xl font-bold text-[#F5E6D3]">{favoriteCategory}</p>
                      </div>
                    </div>

                    {/* Order History List */}
                    <h4 className="text-xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Order History
                    </h4>
                    {userOrders.length === 0 ? (
                      <div className="bg-[#2C1810]/40 rounded-xl p-8 border border-[#8B6F47]/30 text-center">
                        <Package className="size-12 text-[#8B6F47] mx-auto mb-3" />
                        <p className="text-[#D4C5AA]">No orders placed yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((order) => (
                          <div 
                            key={order.id}
                            className="bg-[#2C1810]/60 rounded-xl p-5 border border-[#8B6F47]/40 hover:border-[#D4AF37]/60 transition-all"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h5 className="text-lg font-bold text-[#F5E6D3] mb-1">Order #{order.id.slice(-8).toUpperCase()}</h5>
                                <p className="text-sm text-[#D4C5AA] flex items-center gap-2">
                                  <Calendar className="size-4" />
                                  {new Date(order.date).toLocaleDateString('en-IN', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-[#D4AF37]">₹{order.total.toLocaleString('en-IN')}</p>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                                  order.status === 'delivered' ? 'bg-green-500/20 text-green-400 border border-green-500/40' :
                                  order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                                  order.status === 'packed' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' :
                                  order.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                                  order.status === 'rejected' || order.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                                  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                                }`}>
                                  {order.status === 'delivered' && <CheckCircle className="size-3" />}
                                  {order.status === 'rejected' && <X className="size-3" />}
                                  {order.status === 'pending' && <Clock className="size-3" />}
                                  {order.status.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-2">
                              {order.items.map((item, idx) => {
                                const book = mockBooks.find(b => b.id === item.bookId);
                                return (
                                  <div key={idx} className="flex items-center gap-3 p-3 bg-[#1A0F08]/50 rounded-lg">
                                    <BookOpen className="size-5 text-[#D4AF37]" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[#F5E6D3] font-medium truncate">{book?.title || 'Unknown Book'}</p>
                                      <p className="text-xs text-[#D4C5AA]">
                                        {book?.category} • Qty: {item.quantity}
                                      </p>
                                    </div>
                                    <p className="text-[#D4AF37] font-bold">₹{item.book.price * item.quantity}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {showOrderDetails && selectedOrder && (() => {
        // Search in both customer orders and seller orders
        let order = customerOrders.find(o => o.id === selectedOrder);
        let isSellerOrder = false;
        
        // If not found in customer orders, search in seller orders
        if (!order) {
          order = sellerOrders.find(o => o.id === selectedOrder);
          isSellerOrder = true;
        }
        
        if (!order) return null;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-[#3D2817] via-[#2C1810] to-[#3D2817] rounded-2xl p-8 border-2 border-[#D4AF37] shadow-2xl w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-[#8B6F47]/50">
                <div>
                  <h2 className="text-3xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {isSellerOrder ? 'Seller Order Details' : 'Customer Order Details'}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono text-[#F5E6D3] bg-[#8B6F47]/20 px-3 py-1 rounded-lg border border-[#8B6F47]">
                      {order.id}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${
                      order.status === 'new' || order.status === 'pending' ? 'bg-yellow-900/40 text-yellow-300 border-yellow-600' :
                      order.status === 'processing' || order.status === 'accepted' || order.status === 'packed' ? 'bg-blue-900/40 text-blue-300 border-blue-600' :
                      order.status === 'delivered' ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600' :
                      order.status === 'shipped' ? 'bg-purple-900/40 text-purple-300 border-purple-600' :
                      'bg-red-900/40 text-red-300 border-red-600'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                    {isSellerOrder && (
                      <span className="px-3 py-1.5 bg-emerald-900/40 text-emerald-300 border-2 border-emerald-600 rounded-full text-xs font-bold">
                        BUYBACK ORDER
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="p-2.5 bg-red-700/90 hover:bg-red-600 text-white font-semibold rounded-lg transition-all hover:scale-110 shadow-lg"
                  onClick={() => setShowOrderDetails(false)}
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Customer/Seller Information */}
                <div className="bg-[#2C1810]/60 backdrop-blur-sm rounded-xl p-5 border border-[#8B6F47] shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#8B6F47] rounded-lg">
                      {isSellerOrder ? <Store className="size-5 text-white" /> : <Users className="size-5 text-white" />}
                    </div>
                    <h3 className="text-lg font-bold text-[#D4AF37]">
                      {isSellerOrder ? 'Seller/Buyer Details' : 'Customer Details'}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#A08968] uppercase tracking-wide mb-1">Name</p>
                      <p className="text-[#F5E6D3] font-semibold">
                        {order.customerName || 
                         (order.userId && order.userId !== 'guest' 
                           ? mockUsers.find(u => u.id === order.userId)?.name 
                           : null) || 
                         'Guest User'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#A08968] uppercase tracking-wide mb-1">Email</p>
                      <p className="text-[#D4C5AA] text-sm">
                        {order.customerEmail || 
                         (order.userId && order.userId !== 'guest' 
                           ? mockUsers.find(u => u.id === order.userId)?.email 
                           : null) || 
                         'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#A08968] uppercase tracking-wide mb-1">Phone</p>
                      <p className="text-[#D4C5AA] text-sm">
                        {order.customerPhone || 
                         (order.userId && order.userId !== 'guest' 
                           ? mockUsers.find(u => u.id === order.userId)?.phone 
                           : null) || 
                         'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div className="bg-[#2C1810]/60 backdrop-blur-sm rounded-xl p-5 border border-[#8B6F47] shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#8B6F47] rounded-lg">
                      <Package className="size-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-[#D4AF37]">Order Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#A08968] uppercase tracking-wide mb-1">Order Date</p>
                      <p className="text-[#F5E6D3] font-semibold flex items-center gap-2">
                        <Calendar className="size-4 text-[#8B6F47]" />
                        {order.date}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#A08968] uppercase tracking-wide mb-1">
                        {isSellerOrder ? 'Sold By (Admin)' : 'Seller'}
                      </p>
                      <p className="text-[#D4C5AA] text-sm flex items-center gap-2">
                        <Store className="size-4 text-[#8B6F47]" />
                        {isSellerOrder ? 'BOI PARA (Admin)' : (order.items[0]?.book?.sellerName || 'Multiple Sellers')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#A08968] uppercase tracking-wide mb-1">Payment Method</p>
                      <p className="text-[#D4C5AA] text-sm flex items-center gap-2">
                        <IndianRupee className="size-4 text-[#8B6F47]" />
                        {order.paymentMethod || 'UPI'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipping Address - Full Width */}
                <div className="bg-[#2C1810]/60 backdrop-blur-sm rounded-xl p-5 border border-[#8B6F47] shadow-md md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#8B6F47] rounded-lg">
                      <MapPin className="size-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-[#D4AF37]">Shipping Address</h3>
                  </div>
                  <p className="text-[#D4C5AA] leading-relaxed">{order.shippingAddress || 'N/A'}</p>
                </div>
              </div>
              
              {/* Order Items */}
              <div className="bg-[#2C1810]/60 backdrop-blur-sm rounded-xl p-5 border border-[#8B6F47] shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#8B6F47] rounded-lg">
                    <BookOpen className="size-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#D4AF37]">
                    {isSellerOrder ? 'Buyback Books' : 'Order Items'}
                  </h3>
                  <span className="ml-auto bg-[#8B6F47]/30 text-[#D4AF37] px-3 py-1 rounded-full text-sm font-semibold">
                    {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="group bg-[#1C0F08]/50 hover:bg-[#1C0F08] rounded-lg p-4 border border-[#8B6F47]/30 hover:border-[#D4AF37] transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-[#F5E6D3] group-hover:text-[#D4AF37] transition-colors mb-1">
                            {item.book.title}
                          </p>
                          <p className="text-sm text-[#A08968] mb-2">by {item.book.author}</p>
                          <div className="flex items-center gap-3 text-xs text-[#8B6F47]">
                            <span className="bg-[#8B6F47]/20 px-2 py-1 rounded">
                              Qty: {item.quantity}
                            </span>
                            <span className="bg-[#8B6F47]/20 px-2 py-1 rounded">
                              ₹{item.book.price} each
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#A08968] mb-1">Subtotal</p>
                          <p className="text-2xl font-bold text-[#D4AF37]">
                            ₹{item.book.price * item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t-2 border-[#8B6F47]/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#F5E6D3]">Total Amount</span>
                    <span className="text-3xl font-bold text-[#D4AF37]">₹{order.total}</span>
                  </div>
                </div>

                {/* Download Invoice Button */}
                <div className="mt-6">
                  <button
                    onClick={() => handleDownloadInvoice(order, isSellerOrder)}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#8B6F47] hover:from-[#8B6F47] hover:to-[#D4AF37] text-white font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Download className="size-5" />
                    Download Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Return Details Modal */}
      {showReturnDetails && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl w-[90%] max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Return Request Details
              </h2>
              <button
                className="p-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded transition-all"
                onClick={() => setShowReturnDetails(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Return Info */}
              <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[#A08968] uppercase tracking-wide mb-1">Return ID</p>
                    <p className="text-[#F5E6D3] font-semibold">{selectedReturn.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A08968] uppercase tracking-wide mb-1">Request Date</p>
                    <p className="text-[#F5E6D3] font-semibold">{selectedReturn.requestDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A08968] uppercase tracking-wide mb-1">Order ID</p>
                    <p className="text-[#F5E6D3] font-semibold">{selectedReturn.orderId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A08968] uppercase tracking-wide mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${
                      selectedReturn.status === 'pending-admin' ? 'bg-orange-900/30 text-orange-400 border border-orange-700/50' :
                      selectedReturn.status === 'approved-by-admin' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' :
                      'bg-red-900/30 text-red-400 border border-red-700/50'
                    }`}>
                      {selectedReturn.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                <h3 className="text-lg font-bold text-[#D4AF37] mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <p className="text-[#D4C5AA]"><span className="font-semibold text-[#F5E6D3]">Name:</span> {selectedReturn.customerName}</p>
                  <p className="text-[#D4C5AA]"><span className="font-semibold text-[#F5E6D3]">Seller:</span> {selectedReturn.sellerName}</p>
                </div>
              </div>

              {/* Return Reason */}
              <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                <h3 className="text-lg font-bold text-[#D4AF37] mb-3">Return Reason</h3>
                <p className="text-[#D4C5AA] mb-2"><span className="font-semibold text-[#F5E6D3]">Reason:</span> {selectedReturn.reason}</p>
                {selectedReturn.description && (
                  <p className="text-[#D4C5AA]"><span className="font-semibold text-[#F5E6D3]">Details:</span> {selectedReturn.description}</p>
                )}
              </div>

              {/* Items to Return */}
              <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                <h3 className="text-lg font-bold text-[#D4AF37] mb-3">Items to Return ({selectedReturn.items.length})</h3>
                <div className="space-y-3">
                  {selectedReturn.items.map((item, idx) => (
                    <div key={idx} className="bg-[#3D2817] rounded p-3 border border-[#8B6F47]">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-[#F5E6D3]">{item.book.title}</p>
                          <p className="text-sm text-[#D4C5AA]">by {item.book.author}</p>
                          <p className="text-xs text-[#A08968] mt-1">Quantity: {item.quantity}</p>
                        </div>
                        <p className="text-lg font-bold text-[#D4AF37]">₹{item.book.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Notes if any */}
              {selectedReturn.adminNotes && (
                <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                  <h3 className="text-lg font-bold text-[#D4AF37] mb-3">Admin Notes</h3>
                  <p className="text-[#D4C5AA]">{selectedReturn.adminNotes}</p>
                </div>
              )}

              {/* Actions */}
              {selectedReturn.status === 'pending-admin' && (
                <div className="flex gap-3">
                  <button
                    className="flex-1 px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded transition-all"
                    onClick={() => {
                      setShowReturnDetails(false);
                      handleOpenReturnActionModal(selectedReturn, 'reject');
                    }}
                  >
                    <X className="inline size-4 mr-2" />
                    Reject Return
                  </button>
                  <button
                    className="flex-1 px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded transition-all"
                    onClick={() => {
                      setShowReturnDetails(false);
                      handleOpenReturnActionModal(selectedReturn, 'approve');
                    }}
                  >
                    <CheckCircle className="inline size-4 mr-2" />
                    Approve Return
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return Action Modal (Approve/Reject) */}
      {showReturnActionModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl w-[90%] max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {returnAction === 'approve' ? 'Approve Return' : 'Reject Return'}
              </h2>
              <button
                className="p-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded transition-all"
                onClick={() => setShowReturnActionModal(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                <p className="text-[#D4C5AA] mb-2">
                  <span className="font-semibold text-[#F5E6D3]">Return ID:</span> {selectedReturn.id}
                </p>
                <p className="text-[#D4C5AA] mb-2">
                  <span className="font-semibold text-[#F5E6D3]">Customer:</span> {selectedReturn.customerName}
                </p>
                <p className="text-[#D4C5AA]">
                  <span className="font-semibold text-[#F5E6D3]">Items:</span> {selectedReturn.items.length} item(s)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
                  {returnAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  value={returnAdminNotes}
                  onChange={(e) => setReturnAdminNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#2C1810] border border-[#8B6F47] rounded text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37] transition-all resize-none"
                  rows={4}
                  placeholder={returnAction === 'approve' 
                    ? 'Add any notes about this approval...' 
                    : 'Please provide a reason for rejecting this return request...'}
                />
              </div>

              {returnAction === 'approve' && (
                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                  <p className="text-sm text-blue-300">
                    ℹ️ Approving this return will notify the seller to process the return. The seller will then arrange pickup and issue a refund.
                  </p>
                </div>
              )}

              {returnAction === 'reject' && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                  <p className="text-sm text-red-300">
                    ⚠️ Rejecting this return will close the request. The customer will be notified with your rejection reason.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  className="flex-1 px-6 py-3 bg-[#2C1810] hover:bg-[#3D2817] border border-[#8B6F47] text-[#D4C5AA] font-semibold rounded transition-all"
                  onClick={() => setShowReturnActionModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`flex-1 px-6 py-3 ${
                    returnAction === 'approve' 
                      ? 'bg-emerald-700 hover:bg-emerald-600' 
                      : 'bg-red-700 hover:bg-red-600'
                  } text-white font-bold rounded transition-all`}
                  onClick={handleConfirmReturnAction}
                  disabled={returnAction === 'reject' && !returnAdminNotes.trim()}
                >
                  {returnAction === 'approve' ? (
                    <>
                      <CheckCircle className="inline size-4 mr-2" />
                      Confirm Approval
                    </>
                  ) : (
                    <>
                      <X className="inline size-4 mr-2" />
                      Confirm Rejection
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Edit Modal */}
      {showBookEditModal && editingBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-2xl p-8 border border-[#8B6F47]/30 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Edit Book Details
              </h2>
              <button
                onClick={() => {
                  setShowBookEditModal(false);
                  setEditingBook(null);
                }}
                className="p-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded transition-all"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                
                // Update the book in localStorage
                const allBooks = [...mockBooks, ...sellerAddedBooks];
                const updatedBooks = allBooks.map(book => 
                  book.id === editingBook.id 
                    ? {
                        ...book,
                        isbn: bookFormData.isbn,
                        title: bookFormData.title,
                        author: bookFormData.author,
                        category: bookFormData.category,
                        condition: bookFormData.condition,
                        description: bookFormData.description,
                        mrp: Number(bookFormData.mrp),
                        price: Number(bookFormData.price),
                        stock: Number(bookFormData.stock),
                        language: bookFormData.language,
                        edition: bookFormData.edition,
                        publisher: bookFormData.publisher
                      }
                    : book
                );

                // Save to localStorage
                const sellerBooks = updatedBooks.filter(book => !mockBooks.some(mb => mb.id === book.id));
                localStorage.setItem('sellerBooks', JSON.stringify(sellerBooks));
                setSellerAddedBooks(sellerBooks);

                toast.success('Book updated successfully!');
                setShowBookEditModal(false);
                setEditingBook(null);
              }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">ISBN *</label>
                  <input
                    type="text"
                    value={bookFormData.isbn}
                    onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="978-81-XXXXX-XX-X"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Condition *</label>
                  <select
                    value={bookFormData.condition}
                    onChange={(e) => setBookFormData({ ...bookFormData, condition: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3]"
                    required
                  >
                    <option value="new">New</option>
                    <option value="like-new">Like New</option>
                    <option value="used">Used</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Book Title *</label>
                <input
                  type="text"
                  value={bookFormData.title}
                  onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                  placeholder="Enter book title"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Author *</label>
                  <input
                    type="text"
                    value={bookFormData.author}
                    onChange={(e) => setBookFormData({ ...bookFormData, author: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="Author name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Category *</label>
                  <select
                    value={bookFormData.category}
                    onChange={(e) => setBookFormData({ ...bookFormData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3]"
                    required
                  >
                    <option value="Academic">Academic</option>
                    <option value="Competitive Exams">Competitive Exams</option>
                    <option value="School Books">School Books</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Medical">Medical</option>
                    <option value="Literature">Literature</option>
                    <option value="Rare & Vintage">Rare & Vintage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Description *</label>
                <textarea
                  value={bookFormData.description}
                  onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                  placeholder="Detailed description of the book..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">MRP (₹) *</label>
                  <input
                    type="number"
                    value={bookFormData.mrp}
                    onChange={(e) => setBookFormData({ ...bookFormData, mrp: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="Original price"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={bookFormData.price}
                    onChange={(e) => setBookFormData({ ...bookFormData, price: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="Your price"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Stock *</label>
                  <input
                    type="number"
                    value={bookFormData.stock}
                    onChange={(e) => setBookFormData({ ...bookFormData, stock: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="Available qty"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Language</label>
                  <select
                    value={bookFormData.language}
                    onChange={(e) => setBookFormData({ ...bookFormData, language: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3]"
                  >
                    <option value="English">English</option>
                    <option value="Bengali">Bengali</option>
                    <option value="English & Bengali">English & Bengali</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Edition</label>
                  <input
                    type="text"
                    value={bookFormData.edition}
                    onChange={(e) => setBookFormData({ ...bookFormData, edition: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="e.g., 2024 Edition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Publisher</label>
                  <input
                    type="text"
                    value={bookFormData.publisher}
                    onChange={(e) => setBookFormData({ ...bookFormData, publisher: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="Publisher name"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#8B6F47] hover:from-[#8B6F47] hover:to-[#D4AF37] text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookEditModal(false);
                    setEditingBook(null);
                  }}
                  className="px-8 bg-[#2C1810] hover:bg-[#3D2817] text-[#F5E6D3] font-bold py-3 rounded-lg transition-all border-2 border-[#8B6F47]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}