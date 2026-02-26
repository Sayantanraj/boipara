import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { CustomDropdown } from '../components/CustomDropdown';
import { Upload, FileSpreadsheet, Package, TrendingUp, BookOpen, Plus, Minus, Edit, Trash2, Eye, IndianRupee, Star, Clock, CheckCircle2, AlertCircle, X, Truck, PackageCheck, Ban, Phone, MapPin, AlertTriangle, Download, RefreshCw, ShoppingCart, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { apiService } from '../../services/api';
import type { User, CartItem, Order, BuybackRequest, ReturnRequest } from '../types';
import { mockBooks, mockUsers } from '../data/mockData';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function SellerDashboard() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  
  // Mock data for demo - in real app, these would come from API
  const orders: Order[] = [];
  const buybackOrders: Order[] = [];
  
  // Real data from database
  const [approvedBuybackBooks, setApprovedBuybackBooks] = useState<BuybackRequest[]>([]);
  const [loadingBuybackBooks, setLoadingBuybackBooks] = useState(true);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(true);
  
  // Real orders from database
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // Load notifications from database
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return;
      try {
        setLoadingNotifications(true);
        const data = await apiService.getNotifications();
        console.log('📬 Seller notifications loaded:', data.length);
        setNotifications(data);
      } catch (error) {
        console.error('❌ Error loading notifications:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    loadNotifications();
    // Refresh notifications every 10 seconds for real-time updates
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await apiService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  const onUpdateOrderStatus = (orderId: string, newStatus: string) => {
    console.log('Update order status:', orderId, newStatus);
  };
  
  const onPurchaseBuybackBook = (buybackId: string, quantity: number) => {
    console.log('Purchase buyback book:', buybackId, quantity);
  };
  
  const onPlaceBuybackOrder = (orderData: any) => {
    console.log('Place buyback order:', orderData);
  };
  
  const onCancelBuybackOrder = (orderId: string) => {
    console.log('Cancel buyback order:', orderId);
  };
  
  const onSellerProcessReturn = async (returnId: string, refundAmount: number, sellerNotes?: string) => {
    try {
      await apiService.processReturn(returnId, refundAmount, sellerNotes);
      
      // Update local state to remove the processed return from pending list
      setReturnRequests(returnRequests.map(returnReq => 
        returnReq.id === returnId 
          ? { ...returnReq, status: 'refund-issued', refundAmount, sellerNotes }
          : returnReq
      ));
      
      toast.success('Return Processed!', {
        description: `Refund of ₹${refundAmount} has been issued to the customer.`
      });
    } catch (error: any) {
      console.error('Error processing return:', error);
      toast.error('Failed to process return', {
        description: error.message || 'Please try again'
      });
    }
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'add-book' | 'bulk-upload' | 'my-books' | 'orders' | 'returns' | 'buyback-books' | 'buyback-orders'>('overview');
  
  // Buyback cart and checkout state
  const [buybackCart, setBuybackCart] = useState<Array<{ book: BuybackRequest; quantity: number }>>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment' | 'confirmation'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('upi');
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.location || '',
    pincode: '',
  });
  
  // Quantity modal state
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedBuybackBook, setSelectedBuybackBook] = useState<BuybackRequest | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  
  // Buyback book quantities state - tracks quantity for each book before adding to cart
  const [buybackBookQuantities, setBuybackBookQuantities] = useState<{ [bookId: string]: number }>({});
  
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    category: 'Academic',
    description: '',
    price: '',
    mrp: '',
    stock: '',
    condition: 'new' as 'new' | 'like-new' | 'used',
    language: 'English',
    edition: '',
    publisher: '',
    deliveryDays: '3',
  });
  
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  
  // Bulk upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  
  // State for bulk images upload - maps ISBN to image file
  const [bulkImages, setBulkImages] = useState<{ [isbn: string]: string }>({});
  
  // New state for book management - Load from database on initialization
  const [addedBooks, setAddedBooks] = useState<any[]>([]);
  const [bookImages, setBookImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [bookImageFile, setBookImageFile] = useState<File | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  
  // Edit, View, Delete state
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [viewingBook, setViewingBook] = useState<any | null>(null);
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  
  // Order management state
  const [orderStatuses, setOrderStatuses] = useState<{ [key: string]: string }>(() => {
    // Load order statuses from localStorage on initialization
    const saved = localStorage.getItem('boiParaOrderStatuses');
    return saved ? JSON.parse(saved) : {
      'ORD-2024001': 'new',
      'ORD-2024002': 'accepted',
      'ORD-2024003': 'packed',
      'ORD-2024004': 'shipped',
      'ORD-2024005': 'delivered',
    };
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'new' | 'accepted' | 'packed' | 'shipped' | 'out-for-delivery' | 'rejected' | 'delivered'>('all');
  
  // Expanded orders for tracking
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  
  // Invoice preview state
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewingOrder, setPreviewingOrder] = useState<any | null>(null);

  // Save order statuses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('boiParaOrderStatuses', JSON.stringify(orderStatuses));
  }, [orderStatuses]);

  // Load seller's books from database
  useEffect(() => {
    const loadSellerBooks = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingBooks(true);
        const books = await apiService.getMyBooks();
        setAddedBooks(books);
        console.log('📚 Loaded seller books from database:', books.length);
      } catch (error) {
        console.error('Error loading seller books:', error);
        toast.error('Failed to load your books');
      } finally {
        setLoadingBooks(false);
      }
    };

    loadSellerBooks();
  }, [user?.id]);

  // Load seller's orders from database
  useEffect(() => {
    const loadSellerOrders = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingOrders(true);
        const orders = await apiService.getSellerOrders();
        setSellerOrders(orders);
        console.log('📦 Loaded seller orders from database:', orders.length);
      } catch (error) {
        console.error('Error loading seller orders:', error);
        toast.error('Failed to load your orders');
      } finally {
        setLoadingOrders(false);
      }
    };

    loadSellerOrders();
  }, [user?.id]);

  // Load seller's return requests from database
  useEffect(() => {
    const loadSellerReturns = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingReturns(true);
        const returns = await apiService.getSellerReturns();
        setReturnRequests(returns);
        console.log('🔄 Loaded seller returns from database:', returns.length);
      } catch (error) {
        console.error('Error loading seller returns:', error);
        toast.error('Failed to load return requests');
      } finally {
        setLoadingReturns(false);
      }
    };

    loadSellerReturns();
  }, [user?.id]);

  // Load approved buyback books from database
  useEffect(() => {
    const loadApprovedBuybackBooks = async () => {
      if (!user?.id || user.role !== 'seller') return;
      
      try {
        setLoadingBuybackBooks(true);
        const books = await apiService.getApprovedBuybackBooks();
        setApprovedBuybackBooks(books);
        console.log('📚 Loaded approved buyback books from database:', books.length);
      } catch (error) {
        console.error('Error loading approved buyback books:', error);
        toast.error('Failed to load buyback books');
      } finally {
        setLoadingBuybackBooks(false);
      }
    };

    loadApprovedBuybackBooks();
  }, [user?.id, user?.role]);

  // Initialize order statuses for new orders
  useEffect(() => {
    const newStatuses = { ...orderStatuses };
    let hasNewOrders = false;
    
    orders.forEach(order => {
      if (!newStatuses[order.id]) {
        newStatuses[order.id] = order.status || 'new';
        hasNewOrders = true;
      }
    });
    
    if (hasNewOrders) {
      setOrderStatuses(newStatuses);
    }
  }, [orders]);

  const sellerBooks = [...mockBooks.filter(b => b.sellerId === user?.id || b.sellerName === user?.storeName), ...addedBooks];
  const totalRevenue = sellerBooks.reduce((sum, book) => sum + (book.price * (book.stock > 0 ? 5 : 0)), 0);
  const totalBooks = sellerBooks.length;
  const totalOrders = 23; // Mock data
  const avgRating = 4.8;

  // Helper function to get current status (from orderStatuses state or order object)
  const getCurrentStatus = (order: any): string => {
    return orderStatuses[order.id] || order.status || 'new';
  };

  // Helper function to convert status to display-friendly label
  const getStatusDisplay = (status: string): string => {
    const statusMap: Record<string, string> = {
      'new': 'Pending',
      'pending': 'Pending',
      'Pending': 'Pending',
      'accepted': 'Processing',
      'processing': 'Processing',
      'Processing': 'Processing',
      'packed': 'Ready to Ship',
      'shipped': 'Shipped',
      'Shipped': 'Shipped',
      'out-for-delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  // Helper function to get status styling
  const getStatusStyle = (status: string): string => {
    const displayStatus = getStatusDisplay(status);
    if (displayStatus === 'Pending') return 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50';
    if (displayStatus === 'Processing' || displayStatus === 'Ready to Ship') return 'bg-blue-900/30 text-blue-400 border border-blue-700/50';
    if (displayStatus === 'Shipped') return 'bg-purple-900/30 text-purple-400 border border-purple-700/50';
    if (displayStatus === 'Out for Delivery') return 'bg-orange-900/30 text-orange-400 border border-orange-700/50';
    if (displayStatus === 'Delivered') return 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50';
    if (displayStatus === 'Rejected' || displayStatus === 'Cancelled') return 'bg-red-900/30 text-red-400 border border-red-700/50';
    return 'bg-gray-900/30 text-gray-400 border border-gray-700/50';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Cancel edit handler
  const handleCancelEdit = () => {
    setEditingBookId(null);
    setFormData({
      isbn: '',
      title: '',
      author: '',
      category: 'Academic',
      description: '',
      price: '',
      mrp: '',
      stock: '',
      condition: 'new',
      language: 'English',
      edition: '',
      publisher: '',
      deliveryDays: '3',
    });
    setBookImages([]);
    setMainImageIndex(0);
    setBookImageFile(null);
  };

  // Download invoice for buyback orders
  const handleDownloadBuybackInvoice = (order: Order) => {
    // Get admin/platform details
    const adminUser = mockUsers.find(u => u.role === 'admin');
    const platformName = adminUser?.storeName || 'BOI PARA';
    const platformAddress = adminUser?.storeAddress || 'College Street, Kolkata - 700073';
    const platformPhone = adminUser?.phone || '+91 8101637164';
    const platformEmail = adminUser?.supportEmail || 'reachsupport@boipara.com';

    const doc = new jsPDF();
    
    // Helper function to format numbers without using toLocaleString
    const formatPrice = (num: number): string => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    
    // Header - Platform Logo/Branding
    doc.setFillColor(61, 40, 23); // #3D2817
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(212, 175, 55); // #D4AF37
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(platformName, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(245, 230, 211); // #F5E6D3
    doc.text('Connecting Kolkata\'s Book Lovers', 105, 28, { align: 'center' });
    doc.text(`${platformAddress.split(',').slice(0, 2).join(',')} • ${platformEmail} • ${platformPhone}`, 105, 34, { align: 'center' });
    
    // Invoice Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BUYBACK ORDER INVOICE', 105, 55, { align: 'center' });
    
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
    
    // Buyer (Seller) Information
    doc.setFillColor(245, 230, 211); // #F5E6D3
    doc.rect(15, 100, 85, 35, 'F');
    doc.setDrawColor(139, 111, 71);
    doc.rect(15, 100, 85, 35);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('BUYER DETAILS:', 20, 108);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customerName || user?.name || 'N/A', 20, 116);
    doc.text('Store: ' + (user?.storeName || 'N/A'), 20, 122);
    doc.text('Phone: ' + (order.customerPhone || user?.phone || 'N/A'), 20, 128);
    
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
    doc.text('Thank you for your business with BOI PARA!', 105, 280, { align: 'center' });
    doc.text('This is a computer-generated invoice. No signature required.', 105, 285, { align: 'center' });
    
    // Save PDF
    doc.save('Invoice_' + order.id + '.pdf');
    toast.success('Invoice downloaded successfully!');
  };

  // Edit book handler
  const handleEditBook = (book: any) => {
    setEditingBookId(book._id || book.id);
    setFormData({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category: book.category,
      description: book.description,
      price: book.price.toString(),
      mrp: book.mrp.toString(),
      stock: book.stock.toString(),
      condition: book.condition,
      language: book.language || 'English',
      edition: book.edition || '',
      publisher: book.publisher || '',
      deliveryDays: book.deliveryDays?.toString() || '3',
    });
    const images = book.images || (book.image ? [book.image] : []);
    setBookImages(images);
    // Find the index of the main image (book.image) in the images array
    const mainIndex = images.findIndex((img: string) => img === book.image);
    setMainImageIndex(mainIndex >= 0 ? mainIndex : 0);
    setActiveTab('add-book');
  };

  // View book handler
  const handleViewBook = (book: any) => {
    setViewingBook(book);
  };

  // Delete book handler
  const handleDeleteBook = async (bookId: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      try {
        await apiService.deleteBook(bookId);
        setAddedBooks(addedBooks.filter(book => (book._id || book.id) !== bookId));
        toast.success('✅ Book deleted successfully!');
      } catch (error: any) {
        console.error('Error deleting book:', error);
        toast.error('Failed to delete book', {
          description: error.message || 'Please try again'
        });
      }
    }
  };

  // View order handler
  const handleViewOrder = (order: any) => {
    setViewingOrder(order);
  };

  // Order management handlers
  const handleAcceptOrder = async (orderId: string) => {
    try {
      await apiService.updateOrderStatus(orderId, 'accepted');
      setSellerOrders(sellerOrders.map(order => 
        order.id === orderId ? { ...order, status: 'accepted' } : order
      ));
      toast.success('Order Accepted!', {
        description: `Order ${orderId} has been accepted and is ready for packing.`,
      });
    } catch (error: any) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order', {
        description: error.message || 'Please try again'
      });
    }
  };

  const handleRejectOrder = (orderId: string) => {
    setRejectingOrderId(orderId);
    setShowRejectModal(true);
  };

  const confirmRejectOrder = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    if (rejectingOrderId) {
      try {
        await apiService.updateOrderStatus(rejectingOrderId, 'rejected');
        setSellerOrders(sellerOrders.map(order => 
          order.id === rejectingOrderId ? { ...order, status: 'rejected' } : order
        ));
        toast.error('Order Rejected', {
          description: `Order ${rejectingOrderId} has been rejected. Reason: ${rejectionReason}`,
        });
        setShowRejectModal(false);
        setRejectingOrderId(null);
        setRejectionReason('');
      } catch (error: any) {
        console.error('Error rejecting order:', error);
        toast.error('Failed to reject order', {
          description: error.message || 'Please try again'
        });
      }
    }
  };

  const handleMarkAsPacked = async (orderId: string) => {
    try {
      await apiService.updateOrderStatus(orderId, 'packed');
      setSellerOrders(sellerOrders.map(order => 
        order.id === orderId ? { ...order, status: 'packed' } : order
      ));
      toast.success('Order Packed!', {
        description: `Order ${orderId} has been packed and is ready for shipment.`,
      });
    } catch (error: any) {
      console.error('Error marking as packed:', error);
      toast.error('Failed to mark as packed', {
        description: error.message || 'Please try again'
      });
    }
  };

  const handleHandToDelivery = async (orderId: string) => {
    try {
      await apiService.updateOrderStatus(orderId, 'shipped');
      setSellerOrders(sellerOrders.map(order => 
        order.id === orderId ? { ...order, status: 'shipped' } : order
      ));
      toast.success('Order Shipped!', {
        description: `Order ${orderId} has been handed to the delivery partner.`,
      });
    } catch (error: any) {
      console.error('Error shipping order:', error);
      toast.error('Failed to ship order', {
        description: error.message || 'Please try again'
      });
    }
  };

  // TEST MODE: Simulate delivery partner API updates with database connection
  const handleSimulateOutForDelivery = async (orderId: string) => {
    try {
      await apiService.updateOrderStatus(orderId, 'out-for-delivery');
      setSellerOrders(sellerOrders.map(order => 
        order.id === orderId ? { ...order, status: 'out-for-delivery' } : order
      ));
      toast.info('TEST: Out for Delivery', {
        description: `Order ${orderId} is now out for delivery.`,
      });
    } catch (error: any) {
      console.error('Error updating to out-for-delivery:', error);
      toast.error('Failed to update status', {
        description: error.message || 'Please try again'
      });
    }
  };

  const handleSimulateDelivered = async (orderId: string) => {
    try {
      await apiService.updateOrderStatus(orderId, 'delivered');
      setSellerOrders(sellerOrders.map(order => 
        order.id === orderId ? { ...order, status: 'delivered' } : order
      ));
      toast.success('TEST: Delivered', {
        description: `Order ${orderId} has been delivered.`,
      });
    } catch (error: any) {
      console.error('Error updating to delivered:', error);
      toast.error('Failed to update status', {
        description: error.message || 'Please try again'
      });
    }
  };

  // Download invoice for customer (to include in package)
  const handleDownloadInvoice = async (order: any) => {
    await generateCustomerInvoice(order);
    toast.success('Customer Invoice Downloaded!', {
      description: 'Print this invoice and include it in the package',
    });
  };

  // Generate customer invoice (for package)
  const generateCustomerInvoice = async (order: any) => {
    const doc = new jsPDF();
    
    // Load platform settings from localStorage
    const savedSettings = localStorage.getItem('boiParaPlatformSettings');
    const platformSettings = savedSettings ? JSON.parse(savedSettings) : {
      businessName: 'BOI PARA',
      tagline: 'Connecting Kolkata\'s Book Lovers',
      address: 'College Street, Kolkata - 700073',
      email: 'contact@boipara.com',
      phone: '+91 8101637164',
      gstNumber: '',
      supportEmail: 'reachsupport@boipara.com'
    };
    
    // Helper function to format numbers
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
    doc.text(`${platformSettings.address} • ${platformSettings.email} • ${platformSettings.phone}`, 105, 34, { align: 'center' });
    
    // Invoice Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 105, 55, { align: 'center' });
    
    // Invoice Details Box
    doc.setDrawColor(139, 111, 71); // #8B6F47
    doc.setLineWidth(0.5);
    doc.rect(15, 65, 180, 25);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    const invoiceNumber = `INV-${order.id.replace('ORD-', '')}`;
    const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    
    doc.text(`Invoice #: ${invoiceNumber}`, 20, 72);
    doc.text(`Order ID: ${order.id}`, 20, 78);
    doc.text(`Date: ${order.date}`, 20, 84);
    doc.text(`Payment: ${order.paymentMethod}`, 120, 72);
    doc.text(`Generated: ${today}`, 120, 78);
    
    // Customer Details
    doc.setFillColor(245, 230, 211); // #F5E6D3
    doc.rect(15, 95, 180, 30, 'F');
    doc.setDrawColor(139, 111, 71);
    doc.rect(15, 95, 180, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 69, 19);
    doc.text('BILL TO:', 20, 102);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(order.customerName || 'Customer', 20, 109);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const addressLines = doc.splitTextToSize(order.shippingAddress, 160);
    doc.text(addressLines, 20, 115);
    doc.text(`Phone: ${order.customerPhone}`, 20, 115 + (addressLines.length * 4));
    
    // Items Table Header
    let yPos = 135;
    doc.setFillColor(139, 69, 19);
    doc.rect(15, yPos, 180, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Book Details', 20, yPos + 7);
    doc.text('Qty', 135, yPos + 7, { align: 'center' });
    doc.text('Price', 160, yPos + 7, { align: 'right' });
    doc.text('Amount', 190, yPos + 7, { align: 'right' });
    
    // Items
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    order.items.forEach((item: any, index: number) => {
      const book = item.book || item;
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, yPos, 180, 20, 'F');
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(book.title, 100);
      doc.text(titleLines[0], 20, yPos + 6);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`by ${book.author}`, 20, yPos + 11);
      doc.text(`ISBN: ${book.isbn} | Condition: ${book.condition === 'new' ? 'New' : book.condition === 'like-new' ? 'Like New' : 'Used'}`, 20, yPos + 15);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text(item.quantity.toString(), 135, yPos + 10, { align: 'center' });
      doc.text(`${formatPrice(book.price)}`, 160, yPos + 10, { align: 'right' });
      doc.text(`${formatPrice(book.price * item.quantity)}`, 190, yPos + 10, { align: 'right' });
      
      yPos += 20;
    });
    
    // Total Section
    yPos += 5;
    doc.setDrawColor(139, 111, 71);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 195, yPos);
    
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 69, 19);
    doc.text('TOTAL AMOUNT:', 140, yPos);
    doc.setFontSize(14);
    doc.setTextColor(212, 175, 55); // Gold color
    doc.text(`${formatPrice(order.total)}`, 190, yPos, { align: 'right' });
    
    // Footer
    yPos += 15;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1);
    doc.line(15, yPos, 195, yPos);
    
    yPos += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Thank you for shopping with ${platformSettings.businessName} - Your trusted book marketplace`, 105, yPos, { align: 'center' });
    
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`For queries, contact: ${platformSettings.supportEmail} | ${platformSettings.phone} | Visit us at ${platformSettings.address}`, 105, yPos, { align: 'center' });
    
    // Save the PDF
    doc.save(`Customer-Invoice-${order.id}.pdf`);
  };

  const generateSellerInvoice = async (order: any) => {
    // Load platform settings from localStorage
    const savedSettings = localStorage.getItem('boiParaPlatformSettings');
    const platformSettings = savedSettings ? JSON.parse(savedSettings) : {
      businessName: 'BOI PARA',
      tagline: 'Connecting Kolkata\'s Book Lovers',
      address: 'College Street, Kolkata - 700073',
      email: 'contact@boipara.com',
      phone: '+91 8101637164',
      gstNumber: '',
      supportEmail: 'reachsupport@boipara.com'
    };
    
    // Get admin/platform details
    const platformName = platformSettings.businessName;
    const platformAddress = platformSettings.address;
    const platformPhone = platformSettings.phone;
    const platformEmail = platformSettings.supportEmail;
    const platformGST = platformSettings.gstNumber || 'Not Available';
    const platformGTIN = 'Not Available';
    const platformBusinessReg = 'Not Available';

    // Create a temporary div for the invoice
    const invoiceDiv = document.createElement('div');
    invoiceDiv.style.position = 'absolute';
    invoiceDiv.style.left = '-9999px';
    invoiceDiv.style.top = '0';
    invoiceDiv.style.width = '400px'; // Compact width for package slip
    invoiceDiv.style.padding = '0';
    invoiceDiv.style.margin = '0';
    invoiceDiv.style.backgroundColor = '#FFFFFF';
    invoiceDiv.style.fontFamily = 'Arial, sans-serif';
    invoiceDiv.style.color = '#000000';

    const today = new Date().toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const invoiceNumber = `INV-${order.id.replace('ORD', '')}`;

    // Calculate platform commission (assuming 10% commission)
    const platformCommission = Math.round(order.total * 0.1);
    const sellerPayout = order.total - platformCommission;

    invoiceDiv.innerHTML = `
      <div style="background: #FFFFFF; width: 400px; font-family: Arial, sans-serif;">
        
        <!-- Header with Gradient -->
        <div style="background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); padding: 10px 16px; text-align: center;">
          <h1 style="color: white; font-size: 16px; font-weight: 700; margin: 0 0 2px 0; letter-spacing: 2px; font-family: Georgia, serif;">${platformName}</h1>
          <p style="color: #FDE68A; font-size: 7px; letter-spacing: 1.5px; margin: 0;">${platformAddress.split(',').slice(-2).join(' •').toUpperCase()}</p>
        </div>

        <!-- Main Content -->
        <div style="all: initial; display: block; padding: 12px 16px;">

          <!-- Seller & Order Info -->
          <div style="all: initial; display: block; margin-bottom: 10px;">
            <div style="all: initial; display: block; background: #FFF8F0; border: 1px solid #8B6F47; border-radius: 4px; padding: 8px; margin-bottom: 6px;">
              <p style="all: initial; display: block; color: #2C1810; margin: 0 0 4px 0; font-size: 10px; font-weight: 700; line-height: 1.2;">${user?.storeName || user?.name || 'Seller'}</p>
              <p style="all: initial; display: block; color: #6B5537; margin: 0 0 2px 0; font-size: 7px; line-height: 1.3;">${user?.storeAddress || user?.location || 'College Street, Kolkata'}</p>
              <p style="all: initial; display: block; color: #6B5537; margin: 0; font-size: 7px; line-height: 1.3;">${user?.phone || 'N/A'}</p>
            </div>
            
            <div style="all: initial; display: block; background: #FFF8F0; border: 1px solid #8B6F47; border-radius: 4px; padding: 8px;">
              <p style="all: initial; display: block; margin: 0 0 2px 0; line-height: 1.2;"><span style="color: #6B5537; font-size: 7px; font-weight: 600;">Order:</span> <span style="color: #2C1810; font-size: 8px; font-weight: 700;">${order.id}</span></p>
              <p style="all: initial; display: block; margin: 0; line-height: 1.2;"><span style="color: #6B5537; font-size: 7px; font-weight: 600;">Date:</span> <span style="color: #2C1810; font-size: 7px;">${order.date}</span></p>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="all: initial; display: block; background: #FFF8F0; border-left: 2px solid #D4AF37; padding: 8px; border-radius: 4px; margin-bottom: 10px;">
            <p style="all: initial; display: block; color: #2C1810; margin: 0 0 3px 0; font-size: 9px; font-weight: 700; line-height: 1.2;">SHIP TO:</p>
            <p style="all: initial; display: block; color: #2C1810; margin: 0 0 2px 0; font-size: 9px; font-weight: 700; line-height: 1.2;">${order.customerName}</p>
            <p style="all: initial; display: block; color: #6B5537; margin: 0 0 2px 0; font-size: 7px; line-height: 1.3;">${order.customerPhone}</p>
            <p style="all: initial; display: block; color: #6B5537; margin: 0; font-size: 7px; line-height: 1.4;">${order.shippingAddress}</p>
          </div>

          <!-- Order Items Table -->
          <div style="all: initial; display: block; margin-bottom: 10px; border: 1px solid #8B6F47; border-radius: 4px; overflow: hidden;">
            <table style="all: initial; display: table; width: 100%; border-collapse: collapse; background: #FFFFFF;">
              <thead>
                <tr style="all: initial; display: table-row; background: #2C1810;">
                  <th style="all: initial; display: table-cell; color: #F5E6D3; text-align: left; padding: 5px 6px; font-size: 7px; font-weight: 700; line-height: 1.2;">Item</th>
                  <th style="all: initial; display: table-cell; color: #F5E6D3; text-align: center; padding: 5px 6px; font-size: 7px; font-weight: 700; width: 25px; line-height: 1.2;">Qty</th>
                  <th style="all: initial; display: table-cell; color: #F5E6D3; text-align: right; padding: 5px 6px; font-size: 7px; font-weight: 700; width: 45px; line-height: 1.2;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((item: any, index: number) => {
                  const book = item.book || item;
                  const title = book.title;
                  const author = book.author || 'N/A';
                  const condition = book.condition || 'N/A';
                  const price = book.price;
                  const quantity = item.quantity;
                  const itemTotal = price * quantity;
                  const bgColor = index % 2 === 0 ? '#FFFFFF' : '#FFF8F0';
                  
                  const conditionDisplay = condition === 'new' ? 'New' : condition === 'like-new' ? 'Like New' : condition === 'used' ? 'Used' : condition;
                  
                  return `
                    <tr style="all: initial; display: table-row; background: ${bgColor};">
                      <td style="all: initial; display: table-cell; padding: 5px 6px; border-bottom: 1px solid #E5DDD3; vertical-align: top;">
                        <div style="all: initial; display: block; color: #2C1810; font-size: 8px; font-weight: 700; margin-bottom: 1px; line-height: 1.2;">${title}</div>
                        <div style="all: initial; display: block; color: #6B5537; font-size: 6px; line-height: 1.2;">${author} • ${conditionDisplay}</div>
                      </td>
                      <td style="all: initial; display: table-cell; color: #6B5537; text-align: center; padding: 5px 6px; font-size: 8px; border-bottom: 1px solid #E5DDD3; font-weight: 700; vertical-align: top; line-height: 1.3;">${quantity}</td>
                      <td style="all: initial; display: table-cell; color: #2C1810; text-align: right; padding: 5px 6px; font-size: 8px; font-weight: 700; border-bottom: 1px solid #E5DDD3; vertical-align: top; line-height: 1.3;">₹${itemTotal}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Financial Summary -->
          <div style="all: initial; display: block; margin-bottom: 8px;">
            <div style="all: initial; display: block; background: #FFFFFF; border: 1px solid #8B6F47; border-radius: 4px; overflow: hidden;">
              <div style="all: initial; display: block; padding: 8px; background: #FFF8F0;">
                <div style="all: initial; display: table; width: 100%; margin-bottom: 4px;">
                  <div style="all: initial; display: table-row;">
                    <div style="all: initial; display: table-cell; color: #6B5537; font-size: 8px; font-weight: 600; padding: 2px 0; line-height: 1.2;">Order Total</div>
                    <div style="all: initial; display: table-cell; color: #2C1810; font-size: 9px; text-align: right; font-weight: 700; padding: 2px 0; line-height: 1.2;">₹${order.total}</div>
                  </div>
                </div>
                <div style="all: initial; display: table; width: 100%; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed #D4AF37;">
                  <div style="all: initial; display: table-row;">
                    <div style="all: initial; display: table-cell; color: #6B5537; font-size: 8px; font-weight: 600; padding: 2px 0; line-height: 1.2;">Platform Fee (10%)</div>
                    <div style="all: initial; display: table-cell; color: #DC2626; font-size: 9px; text-align: right; font-weight: 700; padding: 2px 0; line-height: 1.2;">- ₹${platformCommission}</div>
                  </div>
                </div>
                <div style="all: initial; display: block; background: #D4AF37; padding: 6px 8px; border-radius: 3px;">
                  <div style="all: initial; display: table; width: 100%;">
                    <div style="all: initial; display: table-row;">
                      <div style="all: initial; display: table-cell; color: #2C1810; font-size: 9px; font-weight: 700; line-height: 1.2;">Your Earnings</div>
                      <div style="all: initial; display: table-cell; color: #2C1810; font-size: 12px; text-align: right; font-weight: 800; line-height: 1.2;">₹${sellerPayout}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Terms -->
          <div style="all: initial; display: block; background: #FFF8F0; border: 1px solid #D4AF37; border-radius: 4px; padding: 6px 8px; margin-bottom: 6px;">
            <p style="all: initial; display: block; color: #6B5537; margin: 0; font-size: 6px; line-height: 1.4;">Pack securely • Verify customer • Earnings in 2-3 days after delivery</p>
          </div>

        </div>

        <!-- Footer -->
        <div style="all: initial; display: block; background: #F3F4F6; padding: 8px 16px; border-top: 2px solid #8B4513; text-align: center;">
          <p style="all: initial; display: block; color: #8B4513; font-size: 8px; margin: 0 0 2px 0; font-weight: 700; line-height: 1.2;">Thank you for being part of ${platformName}!</p>
          <p style="all: initial; display: block; color: #6B7280; font-size: 6px; margin: 0; line-height: 1.3;">${platformEmail} | ${platformPhone}</p>
        </div>
      </div>
    `;

    document.body.appendChild(invoiceDiv);

    try {
      // Wait for the DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate canvas from the invoice div
      const canvas = await html2canvas(invoiceDiv, {
        scale: 2.5,
        backgroundColor: '#FFFFFF',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Create compact PDF (half A4 size - perfect for package slip)
      const pdf = new jsPDF('p', 'mm', [105, 148]); // A6 size (half of A4)
      const pdfWidth = 105;
      const pdfHeight = 148;
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const imgData = canvas.toDataURL('image/png');
      
      // Check if content fits on one page
      if (imgHeight <= pdfHeight) {
        // Single page - add with proper positioning
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Multi-page handling
        let heightLeft = imgHeight;
        let position = 0;
        
        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        
        // Add additional pages if needed
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      }
      
      // Download PDF
      pdf.save(`BOI-PARA-Seller-Invoice-${order.id}.pdf`);
      
    } catch (error) {
      console.error('Error generating seller invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      // Clean up
      document.body.removeChild(invoiceDiv);
    }
  };

  // Debug: Log orders to console
  console.log('SellerDashboard - Received orders:', orders);
  console.log('SellerDashboard - User ID:', user?.id);
  console.log('SellerDashboard - Seller orders from database:', sellerOrders);
  
  // Use real orders from database instead of combining with mock orders
  const allOrders = sellerOrders;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const bookData = {
        isbn: formData.isbn,
        title: formData.title,
        author: formData.author,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        mrp: parseFloat(formData.mrp),
        stock: parseInt(formData.stock),
        condition: formData.condition,
        language: formData.language,
        edition: formData.edition,
        publisher: formData.publisher,
        deliveryDays: parseInt(formData.deliveryDays),
        images: bookImages,
        image: bookImages[mainImageIndex] || bookImages[0],
      };

      if (editingBookId) {
        // Update existing book
        const updatedBook = await apiService.updateBook(editingBookId, bookData);
        setAddedBooks(addedBooks.map(book => 
          book._id === editingBookId ? updatedBook : book
        ));
        toast.success('✅ Book updated successfully!', {
          description: 'Your changes are now live on BOI PARA.'
        });
        setEditingBookId(null);
      } else {
        // Add new book
        const newBook = await apiService.createBook(bookData);
        setAddedBooks([...addedBooks, newBook]);
        toast.success('✅ Book added successfully!', {
          description: 'Your book is now live on BOI PARA.'
        });
      }
      
      // Reset form
      setFormData({
        isbn: '',
        title: '',
        author: '',
        category: 'Academic',
        description: '',
        price: '',
        mrp: '',
        stock: '',
        condition: 'new',
        language: 'English',
        edition: '',
        publisher: '',
        deliveryDays: '3',
      });
      setBookImages([]);
      setMainImageIndex(0);
      setBookImageFile(null);
    } catch (error: any) {
      console.error('Error saving book:', error);
      toast.error('Failed to save book', {
        description: error.message || 'Please try again'
      });
    }
  };

  // Template download functions
  const downloadCSVTemplate = () => {
    const template = `ISBN,Title,Author,Category,Description,Price,MRP,Stock,Condition,Language,Edition,Publisher,DeliveryDays
978-81-12345-67-8,Sample Book Title,Sample Author,Academic,This is a sample description,299,399,50,new,English,2024 Edition,Sample Publisher,3
978-81-98765-43-2,Another Book,Another Author,Competitive Exams,Another sample description,450,599,25,like-new,English,2023 Edition,Another Publisher,4`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BOI_PARA_Book_Upload_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = () => {
    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['ISBN', 'Title', 'Author', 'Category', 'Description', 'Price', 'MRP', 'Stock', 'Condition', 'Language', 'Edition', 'Publisher', 'DeliveryDays'],
      ['978-81-12345-67-8', 'Sample Book Title', 'Sample Author', 'Academic', 'This is a sample description', 299, 399, 50, 'new', 'English', '2024 Edition', 'Sample Publisher', 3],
      ['978-81-98765-43-2', 'Another Book', 'Another Author', 'Competitive Exams', 'Another sample description', 450, 599, 25, 'like-new', 'English', '2023 Edition', 'Another Publisher', 4]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Books');
    XLSX.writeFile(wb, 'BOI_PARA_Book_Upload_Template.xlsx');
  };

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadStatus('idle');
      setUploadResults({ success: 0, failed: 0, errors: [] });
    }
  };

  // Bulk upload processor
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedFile) {
      toast.error('⚠️ Please select a CSV/Excel file to upload');
      return;
    }

    setUploadStatus('processing');
    console.log('📦 Starting bulk upload process...');
    console.log('📄 File details:', {
      name: uploadedFile.name,
      type: uploadedFile.type,
      size: uploadedFile.size
    });

    // Check if file is Excel or CSV
    const isExcel = uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls') || 
                    uploadedFile.type.includes('spreadsheet') || uploadedFile.type.includes('excel');
    
    console.log('📊 File type detected:', isExcel ? 'Excel' : 'CSV');

    if (isExcel) {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '', // Default value for empty cells
            blankrows: false // Skip blank rows
          });
          
          console.log('\n=== EXCEL PARSING COMPLETE ===');
          console.log('📊 Total rows (including header):', jsonData.length);
          console.log('📊 First row (headers):', jsonData[0]);
          
          // Log ALL rows to see what we're getting
          console.log('\n=== ALL ROWS FROM EXCEL ===');
          jsonData.forEach((row, idx) => {
            console.log(`Row ${idx}:`, row);
          });
          
          // Convert to object format with headers
          const headers = (jsonData[0] as string[]).map(h => String(h).trim());
          console.log('📋 Total rows in Excel:', jsonData.length);
          console.log('📋 Headers:', headers);
          
          const rows = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const obj: any = {};
            let hasData = false;
            
            headers.forEach((header, index) => {
              const value = row[index];
              if (value !== undefined && value !== null && String(value).trim() !== '') {
                obj[header] = String(value).trim();
                hasData = true;
              } else {
                obj[header] = '';
              }
            });
            
            if (hasData) {
              console.log(`✅ Row ${i + 1}:`, obj);
              rows.push(obj);
            } else {
              console.log(`❌ Row ${i + 1}: EMPTY - SKIPPED`);
            }
          }
          
          console.log('📊 Valid data rows after filtering:', rows.length);
          console.log('\n=== FILTERED ROWS ===');
          rows.forEach((row, idx) => {
            console.log(`Filtered Row ${idx + 1}:`, row);
          });
          
          await processBulkData(rows, headers);
        } catch (error: any) {
          console.error('❌ Excel parsing error:', error);
          setUploadStatus('error');
          setUploadResults({
            success: 0,
            failed: 0,
            errors: [`Failed to parse Excel file: ${error.message}`]
          });
          toast.error('Failed to parse Excel file');
        }
      };
      reader.readAsBinaryString(uploadedFile);
    } else {
      // Handle CSV files
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: 'greedy', // Skip all empty lines
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(), // Trim all values
        complete: async (results) => {
          console.log('\n=== CSV PARSING COMPLETE ===');
          console.log('📊 Total rows parsed:', results.data.length);
          console.log('📊 Headers detected:', results.meta.fields);
          console.log('📊 Delimiter used:', results.meta.delimiter);
          
          await processBulkData(results.data, results.meta.fields || []);
        },
        error: (error) => {
          console.error('❌ CSV Parsing Error:', error);
          setUploadStatus('error');
          setUploadResults({
            success: 0,
            failed: 0,
            errors: [`Failed to parse CSV file: ${error.message}`]
          });
          toast.error('Failed to parse CSV file');
        }
      });
    }
  };

  // Process bulk data (common for both CSV and Excel)
  const processBulkData = async (data: any[], headers: string[]) => {
    console.log('\n=== PROCESSING DATA ===');
    console.log('📊 Headers:', headers);
    console.log('📊 Total rows received:', data.length);
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ User not logged in!');
      setUploadStatus('error');
      setUploadResults({
        success: 0,
        failed: 0,
        errors: ['You must be logged in to upload books. Please login and try again.']
      });
      toast.error('Please login to upload books');
      return;
    }
    
    // Filter out completely empty rows
    const validData = data.filter(row => {
      const values = Object.values(row);
      return values.some(val => val !== null && val !== undefined && String(val).trim() !== '');
    });
    
    console.log('📊 Valid rows after filtering empty:', validData.length);
    console.log('\n=== FIRST 3 ROWS SAMPLE ===');
    validData.slice(0, 3).forEach((row, idx) => {
      console.log(`\nRow ${idx + 1}:`, row);
      console.log('Keys in row:', Object.keys(row));
      console.log('Values:', Object.values(row));
    });
    
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;
    const booksToCreate: any[] = [];
    
    for (const [index, row] of validData.entries()) {
      const rowNum = index + 2;
      console.log(`\n🔍 Processing Row ${rowNum}:`);
      console.log('Raw row data:', JSON.stringify(row, null, 2));
      
      try {
        // Helper function to get field value with case-insensitive lookup
        const getField = (fieldNames: string[]) => {
          for (const name of fieldNames) {
            const value = (row as any)[name];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
              console.log(`  ✓ Found '${name}': "${value}"`);
              return String(value).trim();
            }
          }
          console.log(`  ✗ Missing fields: ${fieldNames.join(', ')}`);
          return null;
        };

        // Get field values with multiple possible names
        console.log('  Searching for ISBN...');
        const isbn = getField(['ISBN', 'isbn', 'Isbn']);
        
        console.log('  Searching for Title...');
        const title = getField(['Title', 'title', 'TITLE', 'Book Title', 'BookTitle']);
        
        console.log('  Searching for Author...');
        const author = getField(['Author', 'author', 'AUTHOR', 'Authors']);
        
        console.log('  Searching for Price...');
        const price = getField(['Price', 'price', 'PRICE', 'Selling Price', 'SellingPrice']);
        
        console.log('  Searching for Stock...');
        const stock = getField(['Stock', 'stock', 'STOCK', 'Quantity', 'quantity', 'QUANTITY']);

        console.log(`\n  📝 Extracted values:`);
        console.log(`     ISBN: ${isbn}`);
        console.log(`     Title: ${title}`);
        console.log(`     Author: ${author}`);
        console.log(`     Price: ${price}`);
        console.log(`     Stock: ${stock}`);

        // Validate required fields - use defaults for missing values
        const finalIsbn = isbn || `ISBN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const finalTitle = title || 'Untitled Book';
        const finalAuthor = author || 'Unknown Author';
        const finalPrice = price && !isNaN(Number(price)) ? Number(price) : 100;
        const finalStock = stock && !isNaN(Number(stock)) ? Number(stock) : 1;

        // Log if defaults were used
        if (!isbn) console.log(`  ⚠️ Row ${rowNum}: Missing ISBN, generated: ${finalIsbn}`);
        if (!title) console.log(`  ⚠️ Row ${rowNum}: Missing Title, using default`);
        if (!author) console.log(`  ⚠️ Row ${rowNum}: Missing Author, using default`);
        if (!price || isNaN(Number(price))) console.log(`  ⚠️ Row ${rowNum}: Invalid Price, using default: ₹${finalPrice}`);
        if (!stock || isNaN(Number(stock))) console.log(`  ⚠️ Row ${rowNum}: Invalid Stock, using default: ${finalStock}`);

        // Get optional fields - accept any category value (including unknown/custom categories)
        const category = getField(['Category', 'category', 'CATEGORY']) || 'Academic';
        const description = getField(['Description', 'description', 'DESCRIPTION']) || `${finalTitle} by ${finalAuthor}`;
        const mrp = getField(['MRP', 'mrp', 'Mrp', 'Original Price', 'OriginalPrice']);
        const conditionField = getField(['Condition', 'condition', 'CONDITION']);
        const language = getField(['Language', 'language', 'LANGUAGE']) || 'English';
        const edition = getField(['Edition', 'edition', 'EDITION']) || '';
        const publisher = getField(['Publisher', 'publisher', 'PUBLISHER']) || '';
        const deliveryDays = getField(['DeliveryDays', 'deliveryDays', 'Delivery Days', 'DeliveryDays']);

        // Accept any condition value, default to 'new'
        const validConditions = ['new', 'like-new', 'used'];
        const conditionLower = conditionField ? conditionField.toLowerCase() : 'new';
        const condition = validConditions.includes(conditionLower) ? conditionLower : 'new';

        // Find matching image by ISBN
        const isbnTrimmed = finalIsbn.toString().trim();
        const bookImage = bulkImages[isbnTrimmed] || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300';
        
        if (!bulkImages[isbnTrimmed]) {
          console.log(`  ⚠️ No image found for ISBN ${isbnTrimmed}, using default`);
        } else {
          console.log(`  ✓ Image found for ISBN ${isbnTrimmed}`);
        }

        // Create book object - accept any category name (known or unknown)
        const bookData = {
          isbn: isbnTrimmed,
          title: finalTitle.toString().trim(),
          author: finalAuthor.toString().trim(),
          category: category.toString().trim(), // Accept any category value
          description: description.toString().trim(),
          price: finalPrice,
          mrp: mrp && !isNaN(Number(mrp)) ? parseFloat(mrp.toString()) : finalPrice * 1.2,
          stock: finalStock,
          condition: condition as 'new' | 'like-new' | 'used',
          language: language.toString().trim(),
          edition: edition.toString().trim(),
          publisher: publisher.toString().trim(),
          deliveryDays: deliveryDays && !isNaN(Number(deliveryDays)) ? parseInt(deliveryDays.toString()) : 3,
          image: bookImage,
        };

        booksToCreate.push(bookData);
        console.log(`  ✅ Book prepared successfully:`, bookData.title);
      } catch (error: any) {
        console.error(`  ❌ Error preparing book at row ${rowNum}:`, error);
        errors.push(`Row ${rowNum}: ${error.message || 'Failed to prepare book'}`);
        failedCount++;
      }
    }

    console.log('\n=== PROCESSING SUMMARY ===');
    console.log(`📚 Books to create: ${booksToCreate.length}`);
    console.log(`❌ Failed rows: ${failedCount}`);
    console.log(`⚠️ Errors:`, errors);
    
    // Log each book being sent
    console.log('\n=== BOOKS TO SEND TO API ===');
    booksToCreate.forEach((book, idx) => {
      console.log(`Book ${idx + 1}:`, {
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        price: book.price,
        stock: book.stock
      });
    });

    // Bulk create books if any are valid
    if (booksToCreate.length > 0) {
      try {
        console.log('\n🚀 Sending to API...');
        const result = await apiService.bulkCreateBooks(booksToCreate);
        successCount = result.results.success;
        failedCount += result.results.failed;
        errors.push(...result.results.errors);
        
        // Update local state with new books
        setAddedBooks([...addedBooks, ...result.books]);
        console.log(`💾 Added ${result.books.length} books to state`);
        toast.success(`Successfully uploaded ${successCount} book(s)!`);
      } catch (error: any) {
        console.error('❌ Bulk upload API error:', error);
        errors.push(`API Error: ${error.message}`);
        failedCount = booksToCreate.length;
      }
    } else {
      console.log('\n⚠️ No valid books to upload');
    }

    // Update results
    setUploadResults({
      success: successCount,
      failed: failedCount,
      errors: errors.slice(0, 10) // Show max 10 errors
    });

    setUploadStatus(failedCount === 0 ? 'success' : (successCount > 0 ? 'success' : 'error'));
    
    // Clear the uploaded file and images
    setUploadedFile(null);
    setBulkImages({});
    
    // Reset file inputs
    const csvInput = document.getElementById('csv-upload') as HTMLInputElement;
    const imageInput = document.getElementById('bulk-images-upload') as HTMLInputElement;
    if (csvInput) csvInput.value = '';
    if (imageInput) imageInput.value = '';
    
    console.log('\n=== UPLOAD COMPLETE ===\n');
  };

  // Buyback cart handler functions
  // Helper function to get quantity for a specific book (defaults to 1)
  const getBuybackBookQuantity = (bookId: string) => {
    return buybackBookQuantities[bookId] || 1;
  };

  // Increment quantity for a specific book
  const handleIncrementBuybackQuantity = (bookId: string, maxStock: number) => {
    const currentQty = getBuybackBookQuantity(bookId);
    if (currentQty < maxStock) {
      setBuybackBookQuantities({
        ...buybackBookQuantities,
        [bookId]: currentQty + 1
      });
    } else {
      toast.error(`Maximum ${maxStock} copies available`);
    }
  };

  // Decrement quantity for a specific book
  const handleDecrementBuybackQuantity = (bookId: string) => {
    const currentQty = getBuybackBookQuantity(bookId);
    if (currentQty > 1) {
      setBuybackBookQuantities({
        ...buybackBookQuantities,
        [bookId]: currentQty - 1
      });
    }
  };

  const handleAddToBuybackCart = (book: BuybackRequest) => {
    const quantity = getBuybackBookQuantity(book.id);
    
    setBuybackCart(prevCart => {
      const existingItem = prevCart.find(item => item.book.id === book.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        toast.success(`Updated cart: ${newQuantity} copies of "${book.bookTitle}"`);
        return prevCart.map(item =>
          item.book.id === book.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        toast.success(`Added ${quantity} cop${quantity > 1 ? 'ies' : 'y'} of "${book.bookTitle}" to cart`);
        return [...prevCart, { book, quantity }];
      }
    });
    
    setBuybackBookQuantities(prev => ({
      ...prev,
      [book.id]: 1
    }));
    
    console.log('✅ Cart updated successfully');
  };

  const handleBuyNowBuybackBook = (book: BuybackRequest) => {
    const quantity = getBuybackBookQuantity(book.id);
    
    // Clear existing cart and add only this book
    setBuybackCart([{ book, quantity }]);
    
    // Open checkout modal directly at address step
    setShowCheckoutModal(true);
    setCheckoutStep('address');
    
    toast.success(`Proceeding to checkout with ${quantity} cop${quantity > 1 ? 'ies' : 'y'}`);
  };

  const handleConfirmAddToCart = () => {
    if (!selectedBuybackBook) return;

    const quantity = quantityToAdd;
    if (quantity > 0 && quantity <= (selectedBuybackBook.stock || 0)) {
      const existingItem = buybackCart.find(item => item.book.id === selectedBuybackBook.id);
      if (existingItem) {
        setBuybackCart(buybackCart.map(item =>
          item.book.id === selectedBuybackBook.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ));
        toast.success(`Updated cart: ${existingItem.quantity + quantity} copies total`);
      } else {
        setBuybackCart([...buybackCart, { book: selectedBuybackBook, quantity }]);
        toast.success(`Added ${quantity} cop${quantity > 1 ? 'ies' : 'y'} to cart`);
      }
      setShowQuantityModal(false);
      setSelectedBuybackBook(null);
    } else if (quantity > (selectedBuybackBook.stock || 0)) {
      toast.error(`Only ${selectedBuybackBook.stock} copies available!`);
    }
  };

  const handleRemoveFromBuybackCart = (bookId: string) => {
    setBuybackCart(buybackCart.filter(item => item.book.id !== bookId));
    toast.info('Removed from cart');
  };

  const handleUpdateBuybackCartQuantity = (bookId: string, newQuantity: number) => {
    const item = buybackCart.find(item => item.book.id === bookId);
    if (!item) return;
    
    if (newQuantity <= 0) {
      handleRemoveFromBuybackCart(bookId);
      return;
    }
    
    if (newQuantity > (item.book.stock || 0)) {
      toast.error(`Only ${item.book.stock} copies available!`);
      return;
    }
    
    setBuybackCart(buybackCart.map(cartItem =>
      cartItem.book.id === bookId
        ? { ...cartItem, quantity: newQuantity }
        : cartItem
    ));
  };

  const handleProceedToCheckout = () => {
    if (buybackCart.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }
    setShowCheckoutModal(true);
    setCheckoutStep('address');
  };

  const handlePlaceOrder = () => {
    const total = buybackCart.reduce((sum, item) => sum + (item.book.sellingPrice || 0) * item.quantity, 0);
    
    const orderData = {
      id: `BBO-${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      userId: user?.id || 'guest',
      type: 'buyback',
      items: buybackCart.map(item => ({
        bookId: item.book.id,
        quantity: item.quantity,
        book: {
          ...item.book,
          title: item.book.bookTitle,
          price: item.book.sellingPrice || 0,
        }
      })),
      total,
      status: 'pickup-scheduled',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      shippingAddress: deliveryAddress.address,
      customerName: deliveryAddress.name,
      customerPhone: deliveryAddress.phone,
      paymentMethod: paymentMethod.toUpperCase(),
      trackingNumber: `BUY${Date.now().toString().slice(-10)}`,
    };

    if (onPlaceBuybackOrder) {
      onPlaceBuybackOrder(orderData);
    }

    // Update stock
    buybackCart.forEach(item => {
      if (onPurchaseBuybackBook) {
        onPurchaseBuybackBook(item.book.id, item.quantity);
      }
    });

    setCheckoutStep('confirmation');
    setBuybackCart([]);
    
    toast.success('Order placed successfully!');
    
    // Close modal after 3 seconds
    setTimeout(() => {
      setShowCheckoutModal(false);
      setCheckoutStep('cart');
      setActiveTab('buyback-orders');
    }, 3000);
  };

  const buybackCartTotal = buybackCart.reduce((sum, item) => sum + (item.book.sellingPrice || 0) * item.quantity, 0);
  const buybackCartItemsCount = buybackCart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate real-time performance statistics
  const totalBooksSold = sellerOrders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
  }, 0);

  const uniqueCustomers = new Set(sellerOrders.map(order => order.customerName)).size;

  const averageOrderValue = sellerOrders.length > 0 
    ? Math.round(sellerOrders.reduce((sum, order) => sum + order.total, 0) / sellerOrders.length)
    : 0;

  // Calculate growth percentages (mock calculation - in real app, compare with previous period)
  const booksSoldGrowth = sellerOrders.length > 0 ? Math.round((totalBooksSold / sellerOrders.length) * 3) : 0;
  const customersGrowth = Math.min(Math.round((uniqueCustomers / Math.max(sellerOrders.length, 1)) * 30), 99);
  const avgOrderGrowth = sellerOrders.length > 0 ? Math.round(Math.random() * 15) + 5 : 0;

  // Calculate additional live stats for overview cards
  const revenueGrowth = totalRevenue > 0 ? Math.round((totalRevenue / Math.max(sellerOrders.length, 1)) / 100) : 12;
  const pendingOrdersCount = sellerOrders.filter(order => 
    orderStatuses[order.id] === 'new' || orderStatuses[order.id] === 'accepted'
  ).length;
  const totalReviews = sellerOrders.filter(order => 
    orderStatuses[order.id] === 'delivered'
  ).length;

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <Navbar 
        user={user} 
        cart={cart} 
        notifications={notifications}
        onLogout={logout}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllRead}
        onDeleteNotification={handleDeleteNotification}
      />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2C1810] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Seller Dashboard
          </h1>
          <p className="text-[#6B5537]">
            Welcome back, <span className="font-semibold">{user?.storeName || user?.name}</span>!
          </p>
        </div>

        {/* Stats Cards */}
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-lg p-4 sm:p-6 border-2 border-[#8B6F47] shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#D4AF37] p-2.5 rounded-lg">
                  <TrendingUp className="size-5 sm:size-6 text-[#2C1810]" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-[#D4C5AA]">Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#D4AF37]">₹{totalRevenue.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-emerald-400">+{revenueGrowth}% from last month</p>
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
                <div className="bg-emerald-700 p-2.5 rounded-lg">
                  <Package className="size-5 sm:size-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-[#D4C5AA]">Orders</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#F5E6D3]">{totalOrders}</p>
                </div>
              </div>
              <p className="text-xs text-emerald-400">{pendingOrdersCount} pending</p>
            </div>

            <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-lg p-4 sm:p-6 border-2 border-[#8B6F47] shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#D4AF37] p-2.5 rounded-lg">
                  <Star className="size-5 sm:size-6 text-[#2C1810]" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-[#D4C5AA]">Rating</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#D4AF37]">{avgRating}</p>
                </div>
              </div>
              <p className="text-xs text-[#D4C5AA]">From {totalReviews} reviews</p>
            </div>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="bg-[#3D2817] rounded-lg border-2 border-[#8B6F47] shadow-xl mb-6 overflow-x-auto">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <TrendingUp className="size-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('add-book')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === 'add-book'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <Plus className="size-4" />
              Add Book
            </button>
            <button
              onClick={() => setActiveTab('bulk-upload')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === 'bulk-upload'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <FileSpreadsheet className="size-4" />
              Bulk Upload
            </button>
            <button
              onClick={() => setActiveTab('my-books')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === 'my-books'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <BookOpen className="size-4" />
              My Books
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <Package className="size-4" />
              Orders
              {allOrders.filter(order => getCurrentStatus(order) === 'new' || getCurrentStatus(order) === 'pending').length > 0 && (
                <span className="bg-[#D4AF37] text-[#2C1810] text-xs font-bold px-2 py-0.5 rounded-full">
                  {allOrders.filter(order => getCurrentStatus(order) === 'new' || getCurrentStatus(order) === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === 'returns'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <RotateCcw className="size-4" />
              Returns
              {returnRequests.filter(r => r.status === 'approved-by-admin').length > 0 && (
                <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {returnRequests.filter(r => r.status === 'approved-by-admin').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('buyback-books')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === 'buyback-books'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <RefreshCw className="size-4" />
              Buyback Books
              {approvedBuybackBooks.length > 0 && (
                <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {approvedBuybackBooks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('buyback-orders')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === 'buyback-orders'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:bg-[#2C1810]'
              }`}
            >
              <PackageCheck className="size-4" />
              My Buyback Orders
              {buybackOrders.length > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {buybackOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
              <h2 className="text-2xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Quick Actions
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('add-book')}
                  className="flex items-center gap-3 p-4 bg-[#2C1810] hover:bg-[#4D3827] border-2 border-[#8B6F47] rounded-lg transition-all"
                >
                  <Plus className="size-6 text-[#D4AF37]" />
                  <div className="text-left">
                    <p className="font-bold text-[#F5E6D3]">Add New Book</p>
                    <p className="text-xs text-[#D4C5AA]">Single book upload</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('bulk-upload')}
                  className="flex items-center gap-3 p-4 bg-[#2C1810] hover:bg-[#4D3827] border-2 border-[#8B6F47] rounded-lg transition-all"
                >
                  <Upload className="size-6 text-[#D4AF37]" />
                  <div className="text-left">
                    <p className="font-bold text-[#F5E6D3]">Bulk Upload</p>
                    <p className="text-xs text-[#D4C5AA]">Upload via CSV/Excel</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="flex items-center gap-3 p-4 bg-[#2C1810] hover:bg-[#4D3827] border-2 border-[#8B6F47] rounded-lg transition-all"
                >
                  <Package className="size-6 text-[#D4AF37]" />
                  <div className="text-left">
                    <p className="font-bold text-[#F5E6D3]">View Orders</p>
                    <p className="text-xs text-[#D4C5AA]">Manage pending orders</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Performance */}
            <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
              <h2 className="text-2xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                This Month's Performance
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                  <p className="text-sm text-[#D4C5AA] mb-1">Books Sold</p>
                  <p className="text-3xl font-bold text-[#F5E6D3]">{totalBooksSold}</p>
                  <p className="text-xs text-emerald-400 mt-1">↑ {booksSoldGrowth}% increase</p>
                </div>
                <div className="p-4 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                  <p className="text-sm text-[#D4C5AA] mb-1">New Customers</p>
                  <p className="text-3xl font-bold text-[#F5E6D3]">{uniqueCustomers}</p>
                  <p className="text-xs text-emerald-400 mt-1">↑ {customersGrowth}% increase</p>
                </div>
                <div className="p-4 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                  <p className="text-sm text-[#D4C5AA] mb-1">Avg. Order Value</p>
                  <p className="text-3xl font-bold text-[#F5E6D3]">₹{averageOrderValue.toLocaleString()}</p>
                  <p className="text-xs text-emerald-400 mt-1">↑ {avgOrderGrowth}% increase</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Add Book Tab */}
        {activeTab === 'add-book' ? (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            {/* Edit Mode Banner */}
            {editingBookId && (
              <div className="mb-6 p-4 bg-blue-900/30 border-2 border-blue-500 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Edit className="size-6 text-blue-400" />
                  <div>
                    <p className="font-bold text-blue-400">Edit Mode Active</p>
                    <p className="text-sm text-blue-300">You are editing: {formData.title || 'Untitled Book'}</p>
                  </div>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-md transition-all"
                >
                  Cancel Edit
                </button>
              </div>
            )}

            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              {editingBookId ? 'Edit Book' : 'Add New Book'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">ISBN *</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="978-81-XXXXX-XX-X"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Condition *</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
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
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
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
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="Author name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Category *</label>
                  <select
                    name="category"
                    value={showCustomCategory ? 'Others' : formData.category}
                    onChange={(e) => {
                      if (e.target.value === 'Others') {
                        setShowCustomCategory(true);
                        setFormData({ ...formData, category: '' });
                      } else {
                        setShowCustomCategory(false);
                        setCustomCategory('');
                        handleInputChange(e);
                      }
                    }}
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
                    <option value="Others">Others</option>
                  </select>
                  {showCustomCategory && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => {
                        setCustomCategory(e.target.value);
                        setFormData({ ...formData, category: e.target.value });
                      }}
                      className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968] mt-2"
                      placeholder="Enter custom category"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Book Images Upload - Multiple */}
              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Book Images (Multiple)</label>
                <div className="border-2 border-dashed border-[#8B6F47] rounded-lg p-6 bg-[#2C1810] hover:border-[#D4AF37] transition-all">
                  <div className="flex flex-col items-center">
                    <BookOpen className="size-12 text-[#8B6F47] mb-3" />
                    <p className="text-[#F5E6D3] font-semibold mb-1">Upload Book Images</p>
                    <p className="text-xs text-[#D4C5AA] mb-3">JPG, PNG or WEBP • Multiple images allowed</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      id="book-images"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const imageUrls: string[] = [];
                          let filesProcessed = 0;
                          
                          Array.from(files).forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              imageUrls.push(event.target?.result as string);
                              filesProcessed++;
                              
                              if (filesProcessed === files.length) {
                                setBookImages(imageUrls);
                                setMainImageIndex(0);
                                toast.success(`${imageUrls.length} image(s) uploaded`);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                      }}
                    />
                    <label
                      htmlFor="book-images"
                      className="px-6 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded-md cursor-pointer transition-all"
                    >
                      Choose Images
                    </label>
                  </div>
                </div>
                {bookImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-[#D4AF37] mb-2 font-semibold">Selected Images ({bookImages.length}):</p>
                    <p className="text-xs text-[#D4C5AA] mb-3">Click on an image to set it as main cover</p>
                    <div className="flex gap-3 flex-wrap">
                      {bookImages.map((img, index) => (
                        <div key={index} className="relative">
                          <button
                            type="button"
                            onClick={() => setMainImageIndex(index)}
                            className={`relative rounded-lg border-2 transition-all hover:scale-105 ${
                              mainImageIndex === index 
                                ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50' 
                                : 'border-[#8B6F47] opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt={`Book ${index + 1}`} className="w-24 h-32 object-cover rounded" />
                            {mainImageIndex === index && (
                              <div className="absolute top-1 right-1 bg-[#D4AF37] text-[#2C1810] px-2 py-0.5 rounded text-xs font-bold">
                                MAIN
                              </div>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = bookImages.filter((_, i) => i !== index);
                              setBookImages(newImages);
                              if (mainImageIndex >= newImages.length) {
                                setMainImageIndex(Math.max(0, newImages.length - 1));
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 transition-all"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
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
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="Original price"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Selling Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="Your price"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
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
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
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
                    name="edition"
                    value={formData.edition}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="e.g., 2024 Edition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Publisher</label>
                  <input
                    type="text"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                    placeholder="Publisher name"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Delivery Days *</label>
                  <select
                    name="deliveryDays"
                    value={formData.deliveryDays}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3]"
                    required
                  >
                    <option value="2">2 Days</option>
                    <option value="3">3 Days</option>
                    <option value="4">4 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-3 rounded-md transition-all shadow-lg flex items-center justify-center gap-2 border border-[#D4AF37]/30"
              >
                {editingBookId ? (
                  <>
                    <Edit className="size-5" />
                    Update Book
                  </>
                ) : (
                  <>
                    <Plus className="size-5" />
                    Add Book to Inventory
                  </>
                )}
              </button>

              {editingBookId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full bg-[#2C1810] hover:bg-[#4D3827] border-2 border-[#8B6F47] text-[#F5E6D3] font-bold py-3 rounded-md transition-all flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
        ) : null}

        {/* Bulk Upload Tab */}
        {activeTab === 'bulk-upload' ? (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Bulk Upload Books
            </h2>
            
            <div className="mb-6 p-4 bg-[#2C1810] border-2 border-[#D4AF37]/50 rounded-lg">
              <h3 className="font-bold text-[#D4AF37] mb-2 flex items-center gap-2">
                <FileSpreadsheet className="size-5" />
                Upload Instructions
              </h3>
              <ul className="text-sm text-[#D4C5AA] space-y-1 ml-6 list-disc">
                <li>Download the sample CSV/Excel template</li>
                <li>Fill in book details (ISBN, Title, Author, Price, etc.)</li>
                <li>Upload the completed file below</li>
                <li>Upload book cover images with ISBN as filename (e.g., 978-81-12345-67-8.jpg)</li>
                <li>We'll process and add all books to your inventory</li>
              </ul>
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Download Template</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={downloadCSVTemplate}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-md transition-all"
                  >
                    <FileSpreadsheet className="size-5" />
                    Download CSV Template
                  </button>
                  <button
                    type="button"
                    onClick={downloadExcelTemplate}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-md transition-all"
                  >
                    <FileSpreadsheet className="size-5" />
                    Download Excel Template
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Upload CSV/Excel File</label>
                <div className="border-2 border-dashed border-[#8B6F47] rounded-lg p-8 text-center bg-[#2C1810] hover:border-[#D4AF37] transition-all">
                  <FileSpreadsheet className="size-12 text-[#8B6F47] mx-auto mb-4" />
                  <p className="text-[#F5E6D3] font-semibold mb-2">Drop your CSV/Excel file here</p>
                  <p className="text-sm text-[#D4C5AA] mb-4">or click to browse</p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    id="csv-upload"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-block px-6 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded-md cursor-pointer transition-all"
                  >
                    Choose File
                  </label>
                  {uploadedFile && (
                    <p className="text-sm text-emerald-400 mt-3">✓ {uploadedFile.name}</p>
                  )}
                </div>
              </div>

              {/* Bulk Image Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Upload Book Cover Images (Optional)</label>
                <div className="mb-3 p-3 bg-[#2C1810] border border-[#8B6F47]/50 rounded-lg">
                  <p className="text-xs text-[#D4C5AA] flex items-center gap-2">
                    <BookOpen className="size-4 text-[#D4AF37]" />
                    <strong className="text-[#D4AF37]">Important:</strong> Name your image files with the ISBN number (e.g., 978-81-12345-67-8.jpg)
                  </p>
                </div>
                <div className="border-2 border-dashed border-[#8B6F47] rounded-lg p-8 text-center bg-[#2C1810] hover:border-[#D4AF37] transition-all">
                  <BookOpen className="size-12 text-[#8B6F47] mx-auto mb-4" />
                  <p className="text-[#F5E6D3] font-semibold mb-2">Upload multiple book cover images</p>
                  <p className="text-sm text-[#D4C5AA] mb-4">JPG, PNG or WEBP (Multiple files allowed)</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="bulk-images-upload"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        console.log(`📸 Processing ${files.length} images...`);
                        const imageMap: { [isbn: string]: string } = {};
                        
                        // Process each image file
                        for (let i = 0; i < files.length; i++) {
                          const file = files[i];
                          // Extract ISBN from filename (e.g., "978-81-12345-67-8.jpg" -> "978-81-12345-67-8")
                          const isbn = file.name.replace(/\.(jpg|jpeg|png|webp)$/i, '').trim();
                          
                          // Convert image to base64
                          const reader = new FileReader();
                          await new Promise((resolve) => {
                            reader.onloadend = () => {
                              imageMap[isbn] = reader.result as string;
                              console.log(`✅ Loaded image for ISBN: ${isbn}`);
                              resolve(null);
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                        
                        setBulkImages(imageMap);
                        toast.success(`${files.length} images loaded successfully!`);
                      }
                    }}
                  />
                  <label
                    htmlFor="bulk-images-upload"
                    className="inline-block px-6 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded-md cursor-pointer transition-all"
                  >
                    Choose Images
                  </label>
                  {Object.keys(bulkImages).length > 0 && (
                    <p className="text-sm text-emerald-400 mt-3">
                      ✓ {Object.keys(bulkImages).length} image(s) loaded
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-3 rounded-md transition-all shadow-lg flex items-center justify-center gap-2 border border-[#D4AF37]/30"
              >
                <Upload className="size-5" />
                Upload and Process Books
              </button>

              {/* Upload status */}
              {uploadStatus !== 'idle' && (
                <div className="mt-4">
                  {uploadStatus === 'processing' && (
                    <div className="flex items-center gap-2 text-sm text-[#D4C5AA]">
                      <Clock className="size-4" />
                      Processing...
                    </div>
                  )}
                  {uploadStatus === 'success' && (
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle2 className="size-4" />
                      {uploadResults.success} books added successfully
                      {uploadResults.failed > 0 && (
                        <span className="text-red-400">, {uploadResults.failed} failed</span>
                      )}
                    </div>
                  )}
                  {uploadStatus === 'error' && (
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <AlertCircle className="size-4" />
                      Upload failed
                      {uploadResults.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-400 mt-1">
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        ) : null}

        {/* My Books Tab */}
        {activeTab === 'my-books' ? (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              My Book Listings ({sellerBooks.length})
            </h2>
            {loadingBooks ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-[#D4C5AA]">Loading your books...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sellerBooks.map((book) => (
                  <div key={book._id || book.id} className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                    <div className="flex gap-4">
                      <img src={book.image} alt={book.title} className="w-20 h-28 object-cover rounded border border-[#8B6F47]" />
                      <div className="flex-1">
                        <h3 className="font-bold text-[#F5E6D3] mb-1">{book.title}</h3>
                        <p className="text-sm text-[#D4C5AA] mb-2">{book.author}</p>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-sm bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-700/50">
                            {book.condition.toUpperCase()}
                          </span>
                          <span className="text-sm text-[#D4C5AA]">ISBN: {book.isbn}</span>
                          <span className="text-sm text-[#D4C5AA]">Stock: {book.stock}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-[#D4AF37]">₹{book.price}</span>
                          {book.mrp > book.price && (
                            <span className="text-sm text-[#A08968] line-through">₹{book.mrp}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleEditBook(book)}
                          className="p-2 bg-[#8B6F47] hover:bg-[#D4AF37] rounded transition-colors"
                          title="Edit book"
                        >
                          <Edit className="size-4 text-[#F5E6D3]" />
                        </button>
                        <button 
                          onClick={() => handleViewBook(book)}
                          className="p-2 bg-blue-700 hover:bg-blue-600 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="size-4 text-white" />
                        </button>
                        <button 
                          onClick={() => handleDeleteBook(book._id || book.id)}
                          className="p-2 bg-red-700 hover:bg-red-600 rounded transition-colors"
                          title="Delete book"
                        >
                          <Trash2 className="size-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {sellerBooks.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="size-16 text-[#8B6F47] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-[#D4AF37] mb-2">No Books Added Yet</h3>
                    <p className="text-[#D4C5AA] mb-4">Start by adding your first book to the inventory</p>
                    <button
                      onClick={() => setActiveTab('add-book')}
                      className="bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-bold px-6 py-2 rounded-lg transition-all"
                    >
                      Add Your First Book
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Orders Tab */}
        {activeTab === 'orders' ? (
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Order Management
              </h2>
              
              {/* Order Filter */}
              <CustomDropdown
                value={orderFilter}
                onChange={(value) => setOrderFilter(value as any)}
                options={[
                  { value: 'all', label: 'All Orders' },
                  { value: 'new', label: 'New Orders' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'packed', label: 'Packed' },
                  { value: 'shipped', label: 'Shipped' },
                  { value: 'out-for-delivery', label: 'Out for Delivery' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'delivered', label: 'Delivered' },
                ]}
              />
            </div>

            {loadingOrders ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-[#D4C5AA]">Loading your orders...</p>
              </div>
            ) : (
              <>
                {/* Order Statistics */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                  <div className="p-3 bg-[#2C1810] rounded-lg border border-orange-700 min-w-[140px] flex-shrink-0">
                    <p className="text-xs text-[#D4C5AA]">New Orders</p>
                    <p className="text-2xl font-bold text-orange-400">{sellerOrders.filter(o => o.status === 'new' || o.status === 'pending').length}</p>
                  </div>
                  <div className="p-3 bg-[#2C1810] rounded-lg border border-blue-700 min-w-[140px] flex-shrink-0">
                    <p className="text-xs text-[#D4C5AA]">Accepted</p>
                    <p className="text-2xl font-bold text-blue-400">{sellerOrders.filter(o => o.status === 'accepted').length}</p>
                  </div>
                  <div className="p-3 bg-[#2C1810] rounded-lg border border-purple-700 min-w-[140px] flex-shrink-0">
                    <p className="text-xs text-[#D4C5AA]">Packed</p>
                    <p className="text-2xl font-bold text-purple-400">{sellerOrders.filter(o => o.status === 'packed').length}</p>
                  </div>
                  <div className="p-3 bg-[#2C1810] rounded-lg border border-purple-700 min-w-[140px] flex-shrink-0">
                    <p className="text-xs text-[#D4C5AA]">Shipped</p>
                    <p className="text-2xl font-bold text-purple-400">{sellerOrders.filter(o => o.status === 'shipped').length}</p>
                  </div>
                  <div className="p-3 bg-[#2C1810] rounded-lg border border-emerald-700 min-w-[140px] flex-shrink-0">
                    <p className="text-xs text-[#D4C5AA]">Delivered</p>
                    <p className="text-2xl font-bold text-emerald-400">{sellerOrders.filter(o => o.status === 'delivered').length}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {sellerOrders
                    .filter(order => orderFilter === 'all' || order.status === orderFilter || (orderFilter === 'new' && (order.status === 'new' || order.status === 'pending')))
                    .map((order) => {
                    const currentStatus = order.status;
                    
                    return (
                      <div key={order.id} className={`bg-[#2C1810] rounded-lg p-4 border-2 ${
                        currentStatus === 'new' || currentStatus === 'pending' ? 'border-yellow-700' :
                        currentStatus === 'accepted' ? 'border-blue-700' :
                        currentStatus === 'packed' ? 'border-purple-700' :
                        currentStatus === 'shipped' ? 'border-purple-700' :
                        currentStatus === 'out-for-delivery' ? 'border-orange-700' :
                        currentStatus === 'delivered' ? 'border-emerald-700' :
                        currentStatus === 'rejected' ? 'border-red-700' :
                        'border-[#8B6F47]'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-[#F5E6D3] text-lg">Order #{order.id}</p>
                            <p className="text-sm text-[#D4C5AA]">{order.date} • {order.customerName}</p>
                            <p className="text-xs text-[#A08968]">{order.customerPhone}</p>
                          </div>
                          <span className={`px-3 py-1.5 rounded text-sm font-bold ${getStatusStyle(currentStatus)}`}>
                            {getStatusDisplay(currentStatus)}
                          </span>
                        </div>

                        {/* Order Items Summary */}
                        <div className="mb-3 p-3 bg-[#3D2817] rounded border border-[#8B6F47]">
                          <p className="text-xs text-[#D4AF37] font-bold mb-2">Items ({order.items.length}):</p>
                          {order.items.map((item: any, idx) => {
                            const book = item.book;
                            const title = book.title;
                            const price = book.price;
                            const quantity = item.quantity;
                            
                            return (
                              <div key={idx} className="flex justify-between text-sm text-[#D4C5AA] mb-1">
                                <span>{title} x{quantity}</span>
                                <span className="text-[#F5E6D3]">₹{price * quantity}</span>
                              </div>
                            );
                          })}
                          <div className="border-t border-[#8B6F47] mt-2 pt-2 flex justify-between">
                            <span className="font-bold text-[#D4AF37]">Total:</span>
                            <span className="font-bold text-[#D4AF37] text-lg">₹{order.total}</span>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <p className="text-xs text-[#A08968] mb-3 flex items-center gap-1"><MapPin className="size-3" /> {order.shippingAddress}</p>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="px-4 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded transition-all text-sm flex items-center gap-2"
                          >
                            <Eye className="size-4" />
                            View Details
                          </button>

                          {(currentStatus === 'new' || currentStatus === 'pending') && (
                            <>
                              <button
                                onClick={() => handleAcceptOrder(order.id)}
                                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded transition-all text-sm flex items-center gap-2"
                              >
                                <CheckCircle2 className="size-4" />
                                Accept Order
                              </button>
                              <button
                                onClick={() => handleRejectOrder(order.id)}
                                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded transition-all text-sm flex items-center gap-2"
                              >
                                <Ban className="size-4" />
                                Reject Order
                              </button>
                            </>
                          )}

                          {currentStatus === 'accepted' && (
                            <>
                              <button
                                onClick={() => handleDownloadInvoice(order)}
                                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded transition-all text-sm flex items-center gap-2"
                              >
                                <Download className="size-4" />
                                View Invoice
                              </button>
                              <button
                                onClick={() => generateSellerInvoice(order)}
                                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded transition-all text-sm flex items-center gap-2"
                              >
                                <FileSpreadsheet className="size-4" />
                                Print for Package
                              </button>
                              <button
                                onClick={() => handleMarkAsPacked(order.id)}
                                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded transition-all text-sm flex items-center gap-2"
                              >
                                <PackageCheck className="size-4" />
                                Mark as Packed
                              </button>
                            </>
                          )}

                          {currentStatus === 'packed' && (
                            <button
                              onClick={() => handleHandToDelivery(order.id)}
                              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded transition-all text-sm flex items-center gap-2"
                            >
                              <Truck className="size-4" />
                              Hand to Delivery Partner
                            </button>
                          )}

                          {currentStatus === 'shipped' && (
                            <button
                              onClick={() => handleSimulateOutForDelivery(order.id)}
                              className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white font-semibold rounded transition-all text-sm flex items-center gap-2"
                            >
                              <Truck className="size-4" />
                              TEST: Simulate Out for Delivery
                            </button>
                          )}

                          {currentStatus === 'out-for-delivery' && (
                            <button
                              onClick={() => handleSimulateDelivered(order.id)}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded transition-all text-sm flex items-center gap-2"
                            >
                              <CheckCircle2 className="size-4" />
                              TEST: Simulate Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {sellerOrders.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="size-16 text-[#8B6F47] mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-[#D4AF37] mb-2">No Orders Yet</h3>
                      <p className="text-[#D4C5AA]">Orders for your books will appear here</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* View Book Modal */}
      {viewingBook && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setViewingBook(null)}>
          <div className="bg-[#3D2817] rounded-lg border-2 border-[#8B6F47] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Book Details
                </h2>
                <button 
                  onClick={() => setViewingBook(null)}
                  className="text-[#D4C5AA] hover:text-[#D4AF37] transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  {viewingBook.image && (
                    <img src={viewingBook.image} alt={viewingBook.title} className="w-full h-80 object-cover rounded-lg border-2 border-[#8B6F47]" />
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#F5E6D3] mb-2">{viewingBook.title}</h3>
                    <p className="text-[#D4C5AA]">by {viewingBook.author}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-[#D4AF37]">₹{viewingBook.price}</span>
                    {viewingBook.mrp > viewingBook.price && (
                      <span className="text-[#A08968] line-through">₹{viewingBook.mrp}</span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-[#8B6F47]">
                      <span className="text-[#D4C5AA]">ISBN:</span>
                      <span className="text-[#F5E6D3] font-semibold">{viewingBook.isbn}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#8B6F47]">
                      <span className="text-[#D4C5AA]">Category:</span>
                      <span className="text-[#F5E6D3] font-semibold">{viewingBook.category}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#8B6F47]">
                      <span className="text-[#D4C5AA]">Condition:</span>
                      <span className="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-700/50 font-semibold">
                        {viewingBook.condition.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#8B6F47]">
                      <span className="text-[#D4C5AA]">Stock:</span>
                      <span className="text-[#F5E6D3] font-semibold">{viewingBook.stock} units</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#8B6F47]">
                      <span className="text-[#D4C5AA]">Language:</span>
                      <span className="text-[#F5E6D3] font-semibold">{viewingBook.language || 'English'}</span>
                    </div>
                    {viewingBook.edition && (
                      <div className="flex justify-between py-2 border-b border-[#8B6F47]">
                        <span className="text-[#D4C5AA]">Edition:</span>
                        <span className="text-[#F5E6D3] font-semibold">{viewingBook.edition}</span>
                      </div>
                    )}
                    {viewingBook.publisher && (
                      <div className="flex justify-between py-2 border-b border-[#8B6F47]">
                        <span className="text-[#D4C5AA]">Publisher:</span>
                        <span className="text-[#F5E6D3] font-semibold">{viewingBook.publisher}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <h4 className="text-[#D4AF37] font-bold mb-2">Description:</h4>
                    <p className="text-sm text-[#D4C5AA] leading-relaxed">{viewingBook.description}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    handleEditBook(viewingBook);
                    setViewingBook(null);
                  }}
                  className="flex-1 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-bold py-2.5 rounded-md transition-all flex items-center justify-center gap-2"
                >
                  <Edit className="size-4" />
                  Edit Book
                </button>
                <button
                  onClick={() => setViewingBook(null)}
                  className="flex-1 bg-[#2C1810] hover:bg-[#4D3827] border-2 border-[#8B6F47] text-[#F5E6D3] font-bold py-2.5 rounded-md transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setViewingOrder(null)}>
          <div className="bg-[#3D2817] rounded-lg border-2 border-[#8B6F47] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Order Details
                </h2>
                <button 
                  onClick={() => setViewingOrder(null)}
                  className="text-[#D4C5AA] hover:text-[#D4AF37] transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[#D4C5AA]">Order ID:</p>
                  <p className="text-[#F5E6D3] font-semibold">{viewingOrder.id}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[#D4C5AA]">Date:</p>
                  <p className="text-[#F5E6D3] font-semibold">{viewingOrder.date}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[#D4C5AA]">Customer Name:</p>
                  <p className="text-[#F5E6D3] font-semibold">{viewingOrder.customerName}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[#D4C5AA]">Customer Email:</p>
                  <p className="text-[#F5E6D3] font-semibold">{viewingOrder.customerEmail}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[#D4C5AA]">Customer Phone:</p>
                  <p className="text-[#F5E6D3] font-semibold">{viewingOrder.customerPhone}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[#D4C5AA]">Status:</p>
                  <span className={`px-3 py-1 rounded text-sm font-bold ${getStatusStyle(getCurrentStatus(viewingOrder))}`}>
                    {getStatusDisplay(getCurrentStatus(viewingOrder))}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-[#D4AF37] font-bold mb-2">Items:</h3>
                <div className="space-y-2">
                  {viewingOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <p className="text-[#F5E6D3] font-semibold">{item.title} by {item.author}</p>
                      <p className="text-[#D4C5AA]">Qty: {item.quantity}, Price: ₹{item.book?.price || item.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-[#D4AF37] font-bold mb-2">Order Summary:</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[#D4C5AA]">Subtotal:</p>
                    <p className="text-[#F5E6D3] font-semibold">₹{viewingOrder.subtotal || viewingOrder.items.reduce((sum: number, item: any) => sum + item.book.price * item.quantity, 0)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[#D4C5AA]">Shipping:</p>
                    <p className="text-[#F5E6D3] font-semibold">
                      {(() => {
                        const subtotal = viewingOrder.subtotal || viewingOrder.items.reduce((sum: number, item: any) => sum + item.book.price * item.quantity, 0);
                        const shipping = subtotal >= 500 ? 0 : 40;
                        return shipping === 0 ? 'FREE' : `₹${shipping}`;
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[#D4C5AA]">Total:</p>
                    <p className="text-[#F5E6D3] font-semibold">
                      ₹{(() => {
                        const subtotal = viewingOrder.subtotal || viewingOrder.items.reduce((sum: number, item: any) => sum + item.book.price * item.quantity, 0);
                        const shipping = subtotal >= 500 ? 0 : 40;
                        return subtotal + shipping;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-[#D4AF37] font-bold mb-2">Shipping Address:</h3>
                <p className="text-[#F5E6D3] font-semibold">{viewingOrder.shippingAddress}</p>
              </div>

              <div className="mt-4">
                <h3 className="text-[#D4AF37] font-bold mb-2">Payment Method:</h3>
                <p className="text-[#F5E6D3] font-semibold">{viewingOrder.paymentMethod}</p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setViewingOrder(null)}
                  className="flex-1 bg-[#2C1810] hover:bg-[#4D3827] border-2 border-[#8B6F47] text-[#F5E6D3] font-bold py-2.5 rounded-md transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-[#3D2817] rounded-lg border-2 border-red-700 shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-red-400" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Reject Order #{rejectingOrderId}
                </h2>
                <button 
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="text-[#D4C5AA] hover:text-[#D4AF37] transition-colors"
                >
                  <X className="size-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-[#D4C5AA] mb-4">
                  Please provide a reason for rejecting this order. This will be communicated to the customer.
                </p>

                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
                  Rejection Reason *
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-[#F5E6D3] mb-3"
                >
                  <option value="">Select a reason...</option>
                  <option value="Out of stock">Out of stock</option>
                  <option value="Book condition not as described">Book condition not as described</option>
                  <option value="Unable to deliver to address">Unable to deliver to address</option>
                  <option value="Price error on listing">Price error on listing</option>
                  <option value="Duplicate order">Duplicate order</option>
                  <option value="Other">Other</option>
                </select>

                {rejectionReason === 'Other' && (
                  <textarea
                    placeholder="Please specify the reason..."
                    className="w-full px-4 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-[#F5E6D3] placeholder-[#A08968] resize-none"
                    rows={3}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 bg-[#2C1810] hover:bg-[#4D3827] border-2 border-[#8B6F47] text-[#F5E6D3] font-bold py-2.5 rounded-md transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRejectOrder}
                  className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2.5 rounded-md transition-all"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === 'returns' && (
        <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
          <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Return Requests ({returnRequests.filter(r => r.status === 'approved-by-admin').length} Pending)
          </h2>
          <p className="text-[#D4C5AA] mb-4 text-sm">
            Process return requests that have been approved by admin
          </p>

          {loadingReturns ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
              <p className="text-[#D4C5AA]">Loading return requests...</p>
            </div>
          ) : returnRequests.filter(r => r.status === 'approved-by-admin').length > 0 ? (
            <div className="space-y-4">
              {returnRequests.filter(r => r.status === 'approved-by-admin').map((returnRequest) => (
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
                      {returnRequest.adminNotes && (
                        <p className="text-sm text-blue-300 mt-2 bg-blue-900/20 p-2 rounded border border-blue-700/50">
                          <span className="font-semibold">Admin Notes:</span> {returnRequest.adminNotes}
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded text-sm font-bold bg-blue-900/30 text-blue-400 border border-blue-700/50">
                      Approved by Admin
                    </span>
                  </div>
                  
                  <div className="border-t border-[#8B6F47] pt-3 mt-3">
                    <p className="text-sm text-[#D4C5AA] mb-2">
                      <span className="font-semibold text-[#F5E6D3]">Items to return:</span> {returnRequest.items.length} item{returnRequest.items.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {returnRequest.items.map((item, idx) => (
                        <div key={idx} className="bg-[#3D2817] px-3 py-1.5 rounded text-xs text-[#D4C5AA] border border-[#8B6F47]">
                          {item.book.title} (x{item.quantity}) - ₹{item.book.price * item.quantity}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-[#D4C5AA]">
                        <span className="font-semibold text-[#F5E6D3]">Total Refund Amount:</span> 
                        <span className="text-[#D4AF37] text-lg font-bold ml-2">
                          ₹{returnRequest.items.reduce((sum, item) => sum + (item.book.price * item.quantity), 0)}
                        </span>
                      </div>
                      <button
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded text-sm transition-all"
                        onClick={() => {
                          const refundAmount = returnRequest.items.reduce((sum, item) => sum + (item.book.price * item.quantity), 0);
                          onSellerProcessReturn(returnRequest.id, refundAmount, 'Return processed and refund issued');
                        }}
                      >
                        <CheckCircle2 className="inline size-4 mr-1" />
                        Process Return & Issue Refund
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-[#2C1810] rounded-lg border border-[#8B6F47] text-center">
              <RotateCcw className="w-12 h-12 text-[#8B6F47] mx-auto mb-3" />
              <p className="text-[#D4C5AA]">No pending return requests</p>
              <p className="text-[#A08968] text-sm mt-2">Return requests approved by admin will appear here</p>
            </div>
          )}

          {/* Return History */}
          {returnRequests.filter(r => r.status !== 'approved-by-admin' && r.status !== 'pending-admin').length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Return History
              </h3>
              <div className="space-y-3">
                {returnRequests.filter(r => r.status !== 'approved-by-admin' && r.status !== 'pending-admin').map((returnRequest) => (
                  <div key={returnRequest.id} className="p-4 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-[#F5E6D3]">{returnRequest.id}</p>
                        <p className="text-sm text-[#D4C5AA]">{returnRequest.requestDate} • {returnRequest.customerName}</p>
                        <p className="text-xs text-[#D4C5AA] mt-1">Order: {returnRequest.orderId}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm font-bold ${
                        returnRequest.status === 'refund-issued' ? 'bg-purple-900/30 text-purple-400 border border-purple-700/50' :
                        returnRequest.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50' :
                        returnRequest.status === 'rejected-by-admin' ? 'bg-red-900/30 text-red-400 border border-red-700/50' :
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

      {/* Buyback Books Tab */}
      {activeTab === 'buyback-books' ? (
        <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Approved Buyback Books
              </h2>
              <p className="text-[#D4C5AA] text-sm mt-1">
                Purchase quality books from our buyback inventory
              </p>
            </div>
            <div className="bg-emerald-900/30 border-2 border-emerald-700 rounded-lg px-4 py-2">
              <p className="text-emerald-400 font-bold text-lg">
                {loadingBuybackBooks ? '...' : approvedBuybackBooks.filter(book => book.status === 'approved' && (book.stock || 0) > 0).length} Available
              </p>
            </div>
          </div>

          {loadingBuybackBooks ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
              <p className="text-[#D4C5AA]">Loading buyback books...</p>
            </div>
          ) : approvedBuybackBooks.filter(book => book.status === 'approved' && (book.stock || 0) > 0).length === 0 ? (
            <div className="text-center py-16">
              <RefreshCw className="size-16 text-[#8B6F47] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#D4AF37] mb-2">No Buyback Books Available</h3>
              <p className="text-[#D4C5AA]">Check back later for new buyback books from the platform</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedBuybackBooks
                .filter(book => book.status === 'approved' && (book.stock || 0) > 0)
                .map((book) => (
                <div key={book.id} className="bg-[#2C1810] rounded-lg border border-[#8B6F47] overflow-hidden hover:border-[#D4AF37] transition-all">
                  {/* Book Image */}
                  <div className="relative h-48 bg-[#8B6F47]/20">
                    <img 
                      src={book.image} 
                      alt={book.bookTitle} 
                      className="w-full h-full object-cover"
                    />
                    {/* Condition Badge */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                      book.condition === 'like-new' 
                        ? 'bg-emerald-600 text-white' 
                        : book.condition === 'good'
                        ? 'bg-blue-600 text-white'
                        : 'bg-orange-600 text-white'
                    }`}>
                      {book.condition.toUpperCase()}
                    </div>
                    {/* Stock Badge */}
                    <div className="absolute top-2 left-2 bg-[#D4AF37] text-[#2C1810] px-2 py-1 rounded-full text-xs font-bold">
                      {book.stock} in stock
                    </div>
                  </div>

                  {/* Book Details */}
                  <div className="p-4">
                    <h3 className="font-bold text-[#F5E6D3] mb-1 line-clamp-2" title={book.bookTitle}>
                      {book.bookTitle}
                    </h3>
                    <p className="text-sm text-[#D4C5AA] mb-2">by {book.author}</p>
                    
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#A08968]">ISBN:</span>
                        <span className="text-[#D4C5AA] font-mono">{book.isbn}</span>
                      </div>
                      {book.category && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#A08968]">Category:</span>
                          <span className="text-[#D4AF37]">{book.category}</span>
                        </div>
                      )}
                      {book.publisher && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#A08968]">Publisher:</span>
                          <span className="text-[#D4C5AA]">{book.publisher}</span>
                        </div>
                      )}
                      {book.language && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#A08968]">Language:</span>
                          <span className="text-[#D4C5AA]">{book.language}</span>
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="bg-[#3D2817] rounded-lg p-3 mb-3 border border-[#8B6F47]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#A08968] text-xs">Your Cost:</span>
                        <div className="text-right">
                          <p className="text-[#D4AF37] font-bold text-lg">₹{book.sellingPrice}</p>
                          <p className="text-emerald-400 text-xs">
                            {Math.round(((1 - (book.sellingPrice || 0) / 1000) * 100))}% off MRP
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between mb-3 bg-[#2C1810] rounded-lg border-2 border-[#8B6F47] p-2">
                      <span className="text-[#D4C5AA] text-sm font-semibold">Quantity:</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDecrementBuybackQuantity(book.id)}
                          disabled={getBuybackBookQuantity(book.id) <= 1}
                          className="bg-[#8B6F47] hover:bg-[#A08968] p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="size-4 text-white" />
                        </button>
                        <span className="font-bold text-[#F5E6D3] min-w-[2.5rem] text-center text-lg">
                          {getBuybackBookQuantity(book.id)}
                        </span>
                        <button
                          onClick={() => handleIncrementBuybackQuantity(book.id, book.stock || 0)}
                          disabled={getBuybackBookQuantity(book.id) >= (book.stock || 0)}
                          className="bg-[#8B6F47] hover:bg-[#A08968] p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="size-4 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Purchase Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAddToBuybackCart(book)}
                        className="bg-gradient-to-r from-[#8B6F47] to-[#A08968] hover:from-[#A08968] hover:to-[#8B6F47] text-white font-bold py-2.5 rounded-md transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <ShoppingCart className="size-4" />
                        Add to Cart
                      </button>

                      <button
                        onClick={() => handleBuyNowBuybackBook(book)}
                        className="bg-gradient-to-r from-[#D4AF37] to-[#F4C430] hover:from-[#F4C430] hover:to-[#D4AF37] text-[#2C1810] font-bold py-2.5 rounded-md transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Package className="size-4" />
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart Summary and Checkout Button - Always show if cart has items */}
          {buybackCart.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-[#8B6F47]/40 to-[#A08968]/40 border-2 border-[#D4AF37] rounded-lg p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-[#8B6F47] p-3 rounded-full">
                  <ShoppingCart className="size-6 text-white" />
                </div>
                <div>
                  <p className="text-[#D4AF37] font-bold text-lg">Cart Ready ({buybackCart.length} items)</p>
                  <p className="text-[#D4C5AA] text-sm">{buybackCartItemsCount} books • ₹{buybackCartTotal.toLocaleString()}</p>
                  <div className="text-xs text-[#A08968] mt-1">
                    {buybackCart.map((item, idx) => (
                      <span key={item.book.id}>
                        {item.book.bookTitle} (x{item.quantity}){idx < buybackCart.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleProceedToCheckout}
                className="bg-gradient-to-r from-[#8B6F47] to-[#A08968] hover:from-[#A08968] hover:to-[#8B6F47] text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg flex items-center gap-2"
              >
                <CheckCircle2 className="size-5" />
                Proceed to Checkout
              </button>
            </div>
          )}



          {/* Info Box */}
          <div className="mt-6 bg-blue-900/30 border-2 border-blue-700 rounded-lg p-4">
            <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
              <RefreshCw className="size-4" />
              About Buyback Books
            </h3>
            <ul className="text-[#D4C5AA] text-sm space-y-1 list-disc list-inside">
              <li>These books were bought back from customers by BOI PARA admin</li>
              <li>All books are quality-checked and condition-verified</li>
              <li>Purchase at wholesale prices and resell on your own or through the platform</li>
              <li>Stock is limited - order quickly to secure inventory</li>
              <li>Payment and delivery terms same as regular platform orders</li>
            </ul>
          </div>
        </div>
      ) : null}

      {/* Buyback Orders Tab */}
      {activeTab === 'buyback-orders' ? (
        <div className="space-y-6">
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              My Buyback Orders ({buybackOrders.length})
            </h2>
            
            {buybackOrders.length === 0 ? (
              <div className="text-center py-16">
                <PackageCheck className="size-16 text-[#8B6F47] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#D4AF37] mb-2">No Buyback Orders Yet</h3>
                <p className="text-[#D4C5AA] mb-4">Start ordering from our buyback inventory</p>
                <button
                  onClick={() => setActiveTab('buyback-books')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2 rounded-lg transition-all"
                >
                  Browse Buyback Books
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {buybackOrders.map((order) => {
                  const getStatusInfo = (status: string) => {
                    switch (status) {
                      case 'pickup-scheduled':
                        return { label: 'Pickup Scheduled', color: 'blue', icon: Clock };
                      case 'picked-up':
                        return { label: 'Picked Up from Customer', color: 'indigo', icon: PackageCheck };
                      case 'in-transit':
                        return { label: 'In Transit to You', color: 'purple', icon: Truck };
                      case 'out-for-delivery':
                        return { label: 'Out for Delivery', color: 'orange', icon: Truck };
                      case 'delivered':
                        return { label: 'Delivered', color: 'emerald', icon: CheckCircle2 };
                      case 'cancelled':
                        return { label: 'Cancelled', color: 'red', icon: Ban };
                      default:
                        return { label: status, color: 'gray', icon: Package };
                    }
                  };

                  const statusInfo = getStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div key={order.id} className="bg-[#2C1810] rounded-lg border-2 border-[#8B6F47] p-5">
                      {/* Order Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-[#D4AF37] font-bold text-lg">Order {order.id}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${statusInfo.color}-900/30 text-${statusInfo.color}-400 border border-${statusInfo.color}-700/50 flex items-center gap-1`}>
                              <StatusIcon className="size-3" />
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-[#D4C5AA] text-sm">Placed on: {order.date}</p>
                          <p className="text-[#D4C5AA] text-sm">Tracking: {order.trackingNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#A08968] text-sm">Total Amount</p>
                          <p className="text-[#D4AF37] font-bold text-2xl">₹{order.total.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-4 space-y-2">
                        <p className="text-[#A08968] text-sm font-semibold mb-2">Items:</p>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-[#3D2817] p-3 rounded border border-[#8B6F47]">
                            <img src={item.book.image} alt={item.book.title} className="w-12 h-16 object-cover rounded" />
                            <div className="flex-1">
                              <p className="text-[#F5E6D3] font-semibold text-sm">{item.book.title}</p>
                              <p className="text-[#D4C5AA] text-xs">Qty: {item.quantity} × ₹{item.book.price}</p>
                            </div>
                            <p className="text-[#D4AF37] font-bold">₹{(item.book.price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address */}
                      <div className="bg-[#3D2817] p-3 rounded border border-[#8B6F47] mb-4">
                        <p className="text-[#A08968] text-xs font-semibold mb-1">Delivery Address:</p>
                        <p className="text-[#F5E6D3] text-sm">{order.customerName}</p>
                        <p className="text-[#D4C5AA] text-sm">{order.shippingAddress}</p>
                        <p className="text-[#D4C5AA] text-sm">{order.customerPhone}</p>
                      </div>

                      {/* Action Buttons - Side by Side */}
                      <div className="flex gap-3">
                        {/* Download Invoice Button */}
                        <button
                          onClick={() => handleDownloadBuybackInvoice(order)}
                          className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded transition-all flex items-center justify-center gap-2"
                        >
                          <Download className="size-4" />
                          Download Invoice
                        </button>

                        {/* Track Order Button */}
                        <button
                          onClick={() => {
                            setExpandedOrders(prev => 
                              prev.includes(order.id) 
                                ? prev.filter(id => id !== order.id)
                                : [...prev, order.id]
                            );
                          }}
                          className="flex-1 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold py-2.5 rounded transition-all flex items-center justify-center gap-2"
                        >
                          <Truck className="size-4" />
                          {expandedOrders.includes(order.id) ? 'Hide Tracking' : 'Track Order'}
                        </button>
                      </div>

                      {/* Tracking Steps - Collapsible */}
                      {expandedOrders.includes(order.id) && (
                        <div className="mt-4 space-y-4">
                          <div className="bg-[#3D2817] p-4 rounded border border-[#8B6F47]">
                            <p className="text-[#A08968] text-xs font-semibold mb-3">Order Tracking:</p>
                            <div className="space-y-2">
                              {['pickup-scheduled', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered'].map((step, idx) => {
                                const stepInfo = getStatusInfo(step);
                                const StepIcon = stepInfo.icon;
                                const isCompleted = ['pickup-scheduled', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered'].indexOf(order.status) >= idx;
                                const isCurrent = order.status === step;
                                
                                return (
                                  <div key={step} className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isCurrent ? 'bg-[#D4AF37]' : isCompleted ? 'bg-[#8B6F47]/40' : 'bg-[#2C1810]'}`}>
                                      <StepIcon className={`size-4 ${isCurrent ? 'text-[#2C1810]' : isCompleted ? 'text-[#D4AF37]' : 'text-[#8B6F47]'}`} />
                                    </div>
                                    <p className={`text-sm ${isCurrent ? 'text-[#D4AF37] font-bold' : isCompleted ? 'text-[#D4C5AA]' : 'text-[#8B6F47]'}`}>
                                      {stepInfo.label}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Action Buttons inside tracking */}
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel this order?')) {
                                  if (onCancelBuybackOrder) {
                                    onCancelBuybackOrder(order.id);
                                    toast.info('Order cancelled');
                                  }
                                }
                              }}
                              className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-2 rounded transition-all flex items-center justify-center gap-2"
                            >
                              <Ban className="size-4" />
                              Cancel Order
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCheckoutModal(false)}>
          <div className="bg-[#3D2817] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#D4AF37]" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#8B6F47] to-[#A08968] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                {checkoutStep === 'address' ? 'Delivery Address' : checkoutStep === 'payment' ? 'Payment Method' : 'Order Confirmed!'}
              </h2>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="text-white hover:text-gray-200 transition-colors p-1"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Address Step */}
              {checkoutStep === 'address' && (
                <div className="space-y-6">
                  <div className="bg-[#2C1810] rounded-lg p-5 border border-[#8B6F47]">
                    <h3 className="text-[#D4AF37] font-bold mb-4">Order Summary</h3>
                    <div className="space-y-3 mb-4">
                      {buybackCart.map((item) => (
                        <div key={item.book.id} className="bg-[#3D2817] p-3 rounded">
                          <div className="flex items-center gap-3 mb-2">
                            <img src={item.book.image} alt={item.book.bookTitle} className="w-12 h-16 object-cover rounded" />
                            <div className="flex-1">
                              <p className="text-[#F5E6D3] font-semibold text-sm">{item.book.bookTitle}</p>
                              <p className="text-[#D4C5AA] text-xs">₹{item.book.sellingPrice} each</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[#D4AF37] font-bold">₹{((item.book.sellingPrice || 0) * item.quantity).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                              <button
                                onClick={() => handleUpdateBuybackCartQuantity(item.book.id, item.quantity - 1)}
                                className="p-2 hover:bg-[#3D2817] rounded-l-lg transition-colors"
                              >
                                <Minus className="size-3 text-[#D4AF37]" />
                              </button>
                              <span className="font-bold text-[#F5E6D3] min-w-[2rem] text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateBuybackCartQuantity(item.book.id, item.quantity + 1)}
                                className="p-2 hover:bg-[#3D2817] rounded-r-lg transition-colors"
                                disabled={item.quantity >= (item.book.stock || 0)}
                              >
                                <Plus className="size-3 text-[#D4AF37]" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveFromBuybackCart(item.book.id)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-[#8B6F47] pt-3">
                      <div className="flex justify-between text-[#F5E6D3] font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-[#D4AF37]">₹{buybackCartTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#2C1810] rounded-lg p-5 border border-[#8B6F47]">
                    <h3 className="text-[#D4AF37] font-bold mb-4">Delivery Address</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[#D4C5AA] text-sm block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={deliveryAddress.name}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, name: e.target.value })}
                          className="w-full bg-[#3D2817] border border-[#8B6F47] rounded px-3 py-2 text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37]"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="text-[#D4C5AA] text-sm block mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={deliveryAddress.phone}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                          className="w-full bg-[#3D2817] border border-[#8B6F47] rounded px-3 py-2 text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37]"
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                      <div>
                        <label className="text-[#D4C5AA] text-sm block mb-1">Complete Address</label>
                        <textarea
                          value={deliveryAddress.address}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                          className="w-full bg-[#3D2817] border border-[#8B6F47] rounded px-3 py-2 text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37] h-24"
                          placeholder="Street, Area, City, State"
                        />
                      </div>
                      <div>
                        <label className="text-[#D4C5AA] text-sm block mb-1">Pincode</label>
                        <input
                          type="text"
                          value={deliveryAddress.pincode}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                          className="w-full bg-[#3D2817] border border-[#8B6F47] rounded px-3 py-2 text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37]"
                          placeholder="700001"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!deliveryAddress.name || !deliveryAddress.phone || !deliveryAddress.address || !deliveryAddress.pincode) {
                        toast.error('Please fill all address fields');
                        return;
                      }
                      setCheckoutStep('payment');
                    }}
                    className="w-full bg-gradient-to-r from-[#8B6F47] to-[#A08968] hover:from-[#A08968] hover:to-[#8B6F47] text-white font-bold py-3 rounded-lg transition-all"
                  >
                    Continue to Payment
                  </button>
                </div>
              )}

              {/* Payment Step */}
              {checkoutStep === 'payment' && (
                <div className="space-y-6">
                  <div className="bg-[#2C1810] rounded-lg p-5 border border-[#8B6F47]">
                    <h3 className="text-[#D4AF37] font-bold mb-4">Select Payment Method</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'upi', label: 'UPI Payment', desc: 'Pay using Google Pay, PhonePe, Paytm' },
                        { id: 'card', label: 'Credit/Debit Card', desc: 'Visa, Mastercard, RuPay' },
                        { id: 'netbanking', label: 'Net Banking', desc: 'All major banks supported' },
                        { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive' },
                      ].map((method) => (
                        <label
                          key={method.id}
                          className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            paymentMethod === method.id
                              ? 'border-emerald-600 bg-emerald-900/20'
                              : 'border-[#8B6F47] bg-[#3D2817] hover:border-[#D4AF37]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method.id}
                            checked={paymentMethod === method.id}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="mt-1"
                          />
                          <div>
                            <p className="text-[#F5E6D3] font-semibold">{method.label}</p>
                            <p className="text-[#D4C5AA] text-sm">{method.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCheckoutStep('address')}
                      className="flex-1 bg-[#8B6F47] hover:bg-[#A08968] text-white font-bold py-3 rounded-lg transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      className="flex-1 bg-gradient-to-r from-[#8B6F47] to-[#A08968] hover:from-[#A08968] hover:to-[#8B6F47] text-white font-bold py-3 rounded-lg transition-all"
                    >
                      Place Order - ₹{buybackCartTotal.toLocaleString()}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmation Step */}
              {checkoutStep === 'confirmation' && (
                <div className="text-center py-8">
                  <div className="bg-[#8B6F47] p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle2 className="size-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#D4AF37] mb-2">Order Placed Successfully!</h3>
                  <p className="text-[#D4C5AA] mb-4">Your buyback order has been confirmed.</p>
                  <p className="text-[#F5E6D3] text-sm mb-6">
                    Books will be picked up from the customer and delivered to your address.
                  </p>
                  <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47] inline-block">
                    <p className="text-[#A08968] text-sm">Total Amount</p>
                    <p className="text-[#D4AF37] font-bold text-3xl">₹{buybackCartTotal.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quantity Selection Modal */}
      {showQuantityModal && selectedBuybackBook && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowQuantityModal(false)}>
          <div className="bg-[#2C1810] rounded-lg shadow-2xl max-w-md w-full border border-[#8B6F47]" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-[#3D2817] px-5 py-4 flex items-center justify-between border-b border-[#8B6F47]">
              <h3 className="text-lg font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Select Quantity
              </h3>
              <button 
                onClick={() => setShowQuantityModal(false)}
                className="text-[#D4C5AA] hover:text-[#F5E6D3] transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-5">
              {/* Book Info */}
              <div className="flex gap-3 mb-5 pb-5 border-b border-[#8B6F47]">
                <img 
                  src={selectedBuybackBook.image} 
                  alt={selectedBuybackBook.bookTitle}
                  className="w-16 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="text-[#F5E6D3] font-semibold text-sm mb-1 line-clamp-2">{selectedBuybackBook.bookTitle}</h4>
                  <p className="text-[#D4C5AA] text-xs mb-2">{selectedBuybackBook.author}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[#D4AF37] font-bold">₹{selectedBuybackBook.sellingPrice}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      selectedBuybackBook.condition === 'Excellent' ? 'bg-emerald-900/30 text-emerald-400' :
                      selectedBuybackBook.condition === 'Good' ? 'bg-blue-900/30 text-blue-400' :
                      'bg-amber-900/30 text-amber-400'
                    }`}>
                      {selectedBuybackBook.condition}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Info */}
              <p className="text-[#D4C5AA] text-sm mb-4">
                Available Stock: <span className="text-[#D4AF37] font-semibold">{selectedBuybackBook.stock} copies</span>
              </p>

              {/* Quantity Selector */}
              <div className="mb-5">
                <label className="text-[#D4C5AA] text-sm block mb-2">Quantity:</label>
                <div className="flex items-center gap-2 bg-[#3D2817] rounded-lg border border-[#8B6F47]">
                  <button
                    onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                    disabled={quantityToAdd <= 1}
                    className="p-3 hover:bg-[#2C1810] rounded-l-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="size-4 text-[#D4AF37]" />
                  </button>
                  <span className="flex-1 text-center font-bold text-[#F5E6D3] text-lg">{quantityToAdd}</span>
                  <button
                    onClick={() => setQuantityToAdd(Math.min(selectedBuybackBook.stock || 1, quantityToAdd + 1))}
                    disabled={quantityToAdd >= (selectedBuybackBook.stock || 0)}
                    className="p-3 hover:bg-[#2C1810] rounded-r-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="size-4 text-[#D4AF37]" />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="bg-[#3D2817] border border-[#8B6F47] rounded-lg p-3 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-[#D4C5AA]">Total Amount:</span>
                  <span className="text-[#D4AF37] font-bold text-xl">
                    ₹{((selectedBuybackBook.sellingPrice || 0) * quantityToAdd).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQuantityModal(false)}
                  className="flex-1 bg-[#3D2817] hover:bg-[#2C1810] text-[#D4C5AA] hover:text-[#F5E6D3] font-semibold py-2.5 rounded-lg transition-all border border-[#8B6F47]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAddToCart}
                  className="flex-1 bg-gradient-to-r from-[#8B6F47] to-[#A08968] hover:from-[#A08968] hover:to-[#8B6F47] text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="size-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showInvoicePreview && previewingOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowInvoicePreview(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#8B4513] to-[#D2691E] px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Seller Invoice Preview
              </h2>
              <button 
                onClick={() => setShowInvoicePreview(false)}
                className="text-white hover:text-gray-200 transition-colors p-1"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Invoice Preview Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] bg-gray-50">
              <InvoicePreview order={previewingOrder} user={user} />
            </div>

            {/* Modal Footer with Download Button */}
            <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-t">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Download className="size-4" />
                Download this invoice to attach with your package
              </p>
              <button
                onClick={() => {
                  generateSellerInvoice(previewingOrder);
                  toast.success('Invoice downloaded!', {
                    description: 'Your seller invoice has been saved as PDF'
                  });
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#8B4513] to-[#D2691E] hover:from-[#A0522D] hover:to-[#E67E22] text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg"
              >
                <FileSpreadsheet className="size-5" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Invoice Preview Component
function InvoicePreview({ order, user }: { order: any; user: User | null }) {
  const today = new Date().toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const invoiceNumber = `INV-${order.id.replace('ORD-', '')}`;
  const platformCommission = Math.round(order.total * 0.1);
  const sellerPayout = order.total - platformCommission;

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#8B4513] to-[#D2691E] px-12 py-10 text-center">
        <h1 className="text-5xl font-bold text-white mb-2 tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
          BOI PARA
        </h1>
        <p className="text-amber-100 text-sm tracking-widest">COLLEGE STREET • KOLKATA</p>
        <div className="mx-auto mt-5 w-32 h-1 bg-yellow-400"></div>
      </div>

      <div className="px-12 py-10">
        {/* Invoice Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#8B4513] mb-1.5 tracking-widest leading-tight">SELLER INVOICE</h2>
          <p className="text-gray-600 text-base leading-snug">Invoice #{invoiceNumber}</p>
          <p className="text-gray-500 text-xs mt-0.5 leading-snug">Generated on {today}</p>
        </div>

        {/* Seller & Order Info */}
        <div className="grid grid-cols-2 gap-5 mb-6 border-2 border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-5">
            <p className="text-[#8B4513] font-bold text-[10px] uppercase tracking-wider mb-2.5 leading-tight">Seller Details</p>
            <p className="text-gray-900 font-bold text-base mb-1.5 leading-snug">{user?.storeName || user?.name || 'Seller'}</p>
            <p className="text-gray-600 text-xs mb-1 leading-snug">College Street, Kolkata</p>
            <p className="text-gray-600 text-xs leading-snug">Phone: {user?.phone || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 p-5">
            <p className="text-[#8B4513] font-bold text-[10px] uppercase tracking-wider mb-2.5 leading-tight">Order Details</p>
            <p className="text-gray-600 text-xs mb-1 leading-snug"><span className="text-gray-900 font-bold">Order ID:</span> {order.id}</p>
            <p className="text-gray-600 text-xs mb-1 leading-snug"><span className="text-gray-900 font-bold">Payment:</span> {order.paymentMethod}</p>
            <p className="text-gray-600 text-xs leading-snug"><span className="text-gray-900 font-bold">Order Date:</span> {order.date}</p>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-amber-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6">
          <p className="text-[#8B4513] font-bold text-xs uppercase tracking-wider mb-2.5 flex items-center gap-2 leading-tight">
            <Package className="size-3.5" />
            Ship To
          </p>
          <p className="text-gray-900 font-bold text-sm mb-1.5 leading-snug">{order.customerName}</p>
          <p className="text-gray-600 text-xs mb-1 flex items-center gap-2 leading-snug">
            <Phone className="size-3" />
            {order.customerPhone}
          </p>
          <p className="text-gray-600 text-xs flex items-center gap-2 leading-snug">
            <MapPin className="size-3" />
            {order.shippingAddress}
          </p>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full border-2 border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[#8B4513]">
                <th className="text-left text-white px-4 py-3 text-xs font-bold uppercase tracking-wider leading-tight">Book Details</th>
                <th className="text-center text-white px-4 py-3 text-xs font-bold uppercase tracking-wider w-16 leading-tight">Qty</th>
                <th className="text-right text-white px-4 py-3 text-xs font-bold uppercase tracking-wider w-24 leading-tight">Price</th>
                <th className="text-right text-white px-4 py-3 text-xs font-bold uppercase tracking-wider w-24 leading-tight">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any, index: number) => {
                const book = item.book || item;
                const title = book.title;
                const author = book.author || 'N/A';
                const isbn = book.isbn || 'N/A';
                const condition = book.condition || 'N/A';
                const price = book.price;
                const quantity = item.quantity;
                const itemTotal = price * quantity;
                
                const conditionDisplay = condition === 'new' ? 'New' : condition === 'like-new' ? 'Like New' : condition === 'used' ? 'Used' : condition;
                
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-b border-gray-200">
                      <div className="text-gray-900 font-bold text-sm mb-1 leading-snug">{title}</div>
                      <div className="text-gray-600 text-xs mb-0.5 leading-snug">By: {author}</div>
                      <div className="text-gray-500 text-[10px] leading-snug">ISBN: {isbn} • {conditionDisplay}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm font-bold text-center border-b border-gray-200 align-top leading-snug">{quantity}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm font-semibold text-right border-b border-gray-200 align-top leading-snug">₹{price}</td>
                    <td className="px-4 py-3 text-gray-900 font-bold text-sm text-right border-b border-gray-200 align-top leading-snug">₹{itemTotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end mb-6">
          <div className="w-80 border-2 border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b-2 border-gray-200">
              <p className="text-[#8B4513] font-bold text-xs uppercase tracking-wider leading-tight">Payment Breakdown</p>
            </div>
            <div className="p-5 bg-white">
              <div className="flex justify-between mb-2.5 pb-2.5 leading-snug">
                <span className="text-gray-600 text-sm">Order Total</span>
                <span className="text-gray-900 font-bold text-sm">₹{order.total}</span>
              </div>
              <div className="flex justify-between mb-3.5 pb-3.5 border-b-2 border-dashed border-gray-300 leading-snug">
                <span className="text-gray-600 text-sm">Platform Fee (10%)</span>
                <span className="text-red-600 font-bold text-sm">- ₹{platformCommission}</span>
              </div>
              <div className="bg-gradient-to-r from-green-600 to-green-500 p-3.5 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-sm leading-snug">Your Earnings</span>
                  <span className="text-white text-xl font-bold leading-snug">₹{sellerPayout}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-5">
          <p className="text-blue-900 font-bold text-xs uppercase tracking-wider mb-2.5 flex items-center gap-2 leading-tight">
            <AlertTriangle className="size-3.5" />
            Delivery Instructions
          </p>
          <ul className="text-gray-700 text-xs space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Ensure all items are securely packed and sealed before handover</li>
            <li>Print and attach this invoice inside the package</li>
            <li>Verify customer details are clearly marked on the package</li>
            <li>Obtain delivery partner signature with timestamp</li>
            <li>Keep a copy for your records and tracking</li>
          </ul>
        </div>

        {/* Payment Terms */}
        <div className="bg-yellow-50 border border-yellow-400 p-3.5 rounded-lg mb-6">
          <p className="text-yellow-900 text-xs flex items-center justify-center gap-2 leading-snug">
            <strong>Payment Terms:</strong> Your earnings will be transferred within 2-3 business days after successful delivery confirmation
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 px-12 py-8 border-t-4 border-[#8B4513] text-center">
        <p className="text-gray-500 text-xs mb-2">This is a computer-generated invoice. No signature required.</p>
        <p className="text-[#8B4513] font-bold mb-2">Thank you for being part of BOI PARA!</p>
        <p className="text-gray-600 text-sm">Questions? Contact us at reachsupport@boipara.com | +91 8101637164</p>
      </div>
    </div>
  );
}