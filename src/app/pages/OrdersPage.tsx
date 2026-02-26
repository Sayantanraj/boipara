import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Invoice } from '../components/Invoice';
import { ReturnRequestModal } from '../components/ReturnRequestModal';
import { Package, Clock, Truck, CheckCircle, X, MapPin, CreditCard, FileText, PackageCheck, ClipboardList, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { Order, TrackingUpdate } from '../types';
import { mockUsers } from '../data/mockData';
import { toast } from 'sonner';

export function OrdersPage() {
  const { user, logout, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [returningOrder, setReturningOrder] = useState<Order | null>(null);
  const [viewingReturnStatus, setViewingReturnStatus] = useState<any | null>(null);

  // Get admin user for invoice
  const adminUser = mockUsers.find(u => u.role === 'admin') || null;

  // Helper function to check if order has return request
  const hasReturnRequest = (orderId: string) => {
    return returnRequests.some(returnReq => returnReq.orderId === orderId);
  };

  // Helper function to get return request for order
  const getReturnRequest = (orderId: string) => {
    return returnRequests.find(returnReq => returnReq.orderId === orderId);
  };

  // Load orders and return requests from API
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        console.log('OrdersPage: No user logged in');
        return;
      }
      
      console.log('OrdersPage: Loading orders for user:', user.id);
      
      try {
        const [ordersData, returnsData] = await Promise.all([
          apiService.getMyOrders(),
          apiService.getMyReturnRequests()
        ]);
        
        console.log('OrdersPage: Received orders data:', ordersData);
        console.log('OrdersPage: Number of orders:', ordersData.orders?.length || 0);
        
        setOrders(ordersData.orders || []);
        setReturnRequests(returnsData || []);
      } catch (error) {
        console.error('OrdersPage: Error loading data:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // View order handler
  const handleViewOrder = (order: Order) => {
    setViewingOrder(order);
  };

  // Cancel order handler
  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?\n\nThis action cannot be undone.')) {
      try {
        await apiService.cancelOrder(orderId);
        toast.success('Order cancelled successfully!');
        setViewingOrder(null);
        // Reload orders
        const data = await apiService.getMyOrders();
        setOrders(data.orders || []);
      } catch (error) {
        console.error('Error cancelling order:', error);
        toast.error('Failed to cancel order');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="size-5 text-[#9FC131]" />;
      case 'shipped': return <Truck className="size-5 text-[#D4AF37]" />;
      case 'cancelled': return <X className="size-5 text-[#C17767]" />;
      case 'rejected': return <X className="size-5 text-[#C17767]" />;
      case 'packed': return <Package className="size-5 text-[#8B6F47]" />;
      case 'accepted': return <CheckCircle className="size-5 text-[#9FC131]" />;
      case 'new': return <Clock className="size-5 text-[#D4AF37]" />;
      default: return <Clock className="size-5 text-[#D4AF37]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-[#9FC131]/20 border-[#9FC131]/50 text-[#9FC131]';
      case 'shipped': return 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]';
      case 'cancelled': return 'bg-[#C17767]/20 border-[#C17767]/50 text-[#C17767]';
      case 'rejected': return 'bg-[#C17767]/20 border-[#C17767]/50 text-[#C17767]';
      case 'packed': return 'bg-[#8B6F47]/20 border-[#8B6F47]/50 text-[#8B6F47]';
      case 'accepted': return 'bg-[#9FC131]/20 border-[#9FC131]/50 text-[#9FC131]';
      case 'new': return 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]';
      default: return 'bg-[#8B6F47]/20 border-[#8B6F47]/50 text-[#D4AF37]';
    }
  };

  // Generate tracking timeline based on order status
  const getTrackingTimeline = (order: Order): TrackingUpdate[] => {
    const baseTimeline: TrackingUpdate[] = [
      {
        status: 'Order Placed',
        timestamp: order.date,
        location: 'BOI PARA Platform',
        description: 'Your order has been confirmed and is being processed.',
        completed: true
      },
      {
        status: 'Processing',
        timestamp: order.date,
        location: 'Seller Warehouse',
        description: 'Your order is being prepared for shipment.',
        completed: order.status !== 'pending' && order.status !== 'new'
      },
      {
        status: 'Packed',
        timestamp: order.status === 'packed' || order.status === 'shipped' || order.status === 'delivered' ? 'Today, 2:30 PM' : 'Pending',
        location: 'College Street, Kolkata',
        description: 'Your books have been carefully packed and ready for pickup.',
        completed: order.status === 'packed' || order.status === 'shipped' || order.status === 'delivered'
      },
      {
        status: 'Shipped',
        timestamp: order.status === 'shipped' || order.status === 'delivered' ? 'Today, 4:45 PM' : 'Pending',
        location: 'In Transit',
        description: 'Your package is on the way to your delivery address.',
        completed: order.status === 'shipped' || order.status === 'delivered'
      },
      {
        status: 'Out for Delivery',
        timestamp: order.status === 'delivered' ? 'Today, 9:00 AM' : 'Pending',
        location: user?.location || 'Your Location',
        description: 'Your package will be delivered today.',
        completed: order.status === 'delivered'
      },
      {
        status: 'Delivered',
        timestamp: order.status === 'delivered' ? 'Today, 11:30 AM' : 'Pending',
        location: order.shippingAddress,
        description: 'Package has been successfully delivered. Thank you for shopping with BOI PARA!',
        completed: order.status === 'delivered'
      }
    ];

    if (order.status === 'cancelled') {
      return [
        baseTimeline[0],
        {
          status: 'Cancelled',
          timestamp: 'Today',
          location: 'BOI PARA Platform',
          description: 'Your order has been cancelled. Refund will be processed within 5-7 business days.',
          completed: true
        }
      ];
    }

    return baseTimeline;
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <Navbar user={user} onLogout={logout} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold text-[#2C1810] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
          My Orders
        </h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#8B6F47] w-12 h-12 rounded-lg"></div>
                    <div>
                      <div className="bg-[#8B6F47] h-4 w-24 rounded mb-2"></div>
                      <div className="bg-[#8B6F47] h-3 w-16 rounded"></div>
                    </div>
                  </div>
                  <div className="bg-[#8B6F47] h-8 w-20 rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="bg-[#8B6F47] h-3 w-12 rounded mb-1"></div>
                    <div className="bg-[#8B6F47] h-4 w-16 rounded"></div>
                  </div>
                  <div className="bg-[#8B6F47] h-8 w-24 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-[#3D2817] rounded-lg p-12 sm:p-16 text-center border-2 border-[#8B6F47] shadow-xl">
            <Package className="size-16 sm:size-20 text-[#8B6F47] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F5E6D3] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              No Orders Yet
            </h2>
            <p className="text-[#D4C5AA] mb-6">Start exploring our collection of books from College Street</p>
            <a
              href="/browse"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold px-6 sm:px-8 py-3 rounded-md transition-all shadow-lg"
            >
              Browse Books
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#8B6F47] p-3 rounded-lg shadow-md">
                      <Package className="size-6 text-[#F5E6D3]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#F5E6D3]">Order {order.id}</p>
                      <p className="text-sm text-[#D4C5AA]">{order.date}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 font-bold text-sm ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status === 'new' ? 'Order Placed' : order.status === 'placed' ? 'Order Placed' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#D4C5AA] mb-1">{order.items.length} items</p>
                    <div className="text-xs text-[#A08968] mb-2 max-w-xs">
                      {order.items.slice(0, 2).map((item: any, idx: number) => (
                        <span key={idx}>
                          {item.book?.title || 'Unknown Book'}
                          {idx < Math.min(order.items.length, 2) - 1 && ', '}
                        </span>
                      ))}
                      {order.items.length > 2 && ` +${order.items.length - 2} more`}
                    </div>
                    <p className="font-bold text-[#D4AF37] text-lg">₹{order.total}</p>
                  </div>
                  <button className="bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold px-6 py-2 rounded-md transition-all shadow-md" onClick={() => handleViewOrder(order)}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {viewingOrder && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setViewingOrder(null)}>
            <div className="bg-[#3D2817] rounded-lg border-2 border-[#8B6F47] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Order Details
                  </h2>
                  <button 
                    onClick={() => setViewingOrder(null)}
                    className="text-[#D4C5AA] hover:text-[#D4AF37] transition-colors"
                  >
                    <X className="size-6" />
                  </button>
                </div>

                {/* Order Header */}
                <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47] mb-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-[#D4C5AA] mb-1">Order ID</p>
                      <p className="font-bold text-[#F5E6D3]">{viewingOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#D4C5AA] mb-1">Order Date</p>
                      <p className="font-bold text-[#F5E6D3]">{viewingOrder.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#D4C5AA] mb-1">Status</p>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 font-bold text-sm w-fit ${getStatusColor(viewingOrder.status)}`}>
                        {getStatusIcon(viewingOrder.status)}
                        {viewingOrder.status.charAt(0).toUpperCase() + viewingOrder.status.slice(1)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ordered Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
                    <Package className="size-5" />
                    Ordered Items
                  </h3>
                  <div className="space-y-3">
                    {viewingOrder.items && viewingOrder.items.length > 0 ? (
                      viewingOrder.items.map((item: any, idx: number) => {
                        // Handle both nested (item.book) and flat data structures
                        const book = item.book || item;
                        const quantity = item.quantity || 1;
                        
                        return (
                          <div key={item.bookId || book.id || idx} className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47] flex gap-4">
                            <img 
                              src={book.image || '/placeholder-book.jpg'} 
                              alt={book.title || 'Book'} 
                              className="w-16 h-20 object-cover rounded border border-[#8B6F47]" 
                            />
                            <div className="flex-1">
                              <h4 className="font-bold text-[#F5E6D3] mb-1">{book.title || 'Unknown Title'}</h4>
                              <p className="text-sm text-[#D4C5AA] mb-2">by {book.author || 'Unknown Author'}</p>
                              
                              {/* Seller Information */}
                              {book.sellerName && (
                                <div className="mb-2 pb-2 border-b border-[#8B6F47]/30">
                                  <p className="text-xs text-[#A08968] mb-0.5">Sold by:</p>
                                  <p className="text-sm font-semibold text-[#D4AF37]">{book.sellerName}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-[#D4C5AA]">Quantity: {quantity}</p>
                                <p className="font-bold text-[#D4AF37]">₹{(book.price || 0) * quantity}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-[#2C1810] rounded-lg p-6 border border-[#8B6F47] text-center">
                        <p className="text-[#D4C5AA]">No items found in this order</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer & Shipping Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
                    <MapPin className="size-5" />
                    Shipping Address
                  </h3>
                  <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                    <p className="text-[#F5E6D3]">{viewingOrder.shippingAddress}</p>
                    {user && (
                      <div className="mt-3 pt-3 border-t border-[#8B6F47] space-y-1">
                        <p className="text-sm text-[#D4C5AA]">
                          <span className="font-semibold text-[#F5E6D3]">{user.name}</span>
                        </p>
                        {user.email && (
                          <p className="text-sm text-[#D4C5AA]">{user.email}</p>
                        )}
                        {user.phone && (
                          <p className="text-sm text-[#D4C5AA]">{user.phone}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47] mb-6">
                  <h3 className="text-lg font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
                    <CreditCard className="size-5" />
                    Payment Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#D4C5AA]">Subtotal</span>
                      <span className="text-[#F5E6D3] font-semibold">₹{viewingOrder.subtotal || viewingOrder.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#D4C5AA]">Shipping</span>
                      <span className="text-[#F5E6D3] font-semibold text-emerald-400">FREE</span>
                    </div>
                    <div className="pt-2 border-t border-[#8B6F47] flex justify-between">
                      <span className="font-bold text-[#D4AF37]">Total</span>
                      <span className="font-bold text-[#D4AF37] text-lg">₹{viewingOrder.total}</span>
                    </div>
                    <div className="pt-2 border-t border-[#8B6F47]">
                      <p className="text-xs text-[#D4C5AA]">Payment Method</p>
                      <p className="font-semibold text-[#F5E6D3]">{viewingOrder.paymentMethod || 'Cash on Delivery'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  {viewingOrder.status === 'delivered' && (
                    <>
                      <button
                        onClick={() => {
                          setShowInvoice(viewingOrder);
                          setViewingOrder(null);
                        }}
                        className="flex-1 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold py-3 rounded-md transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <FileText className="size-5" />
                        View Invoice
                      </button>
                      {!hasReturnRequest(viewingOrder.id) && (
                        <button
                          onClick={() => {
                            setReturningOrder(viewingOrder);
                            setViewingOrder(null);
                          }}
                          className="flex-1 bg-gradient-to-r from-orange-700 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-bold py-3 rounded-md transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <RotateCcw className="size-5" />
                          Request Return
                        </button>
                      )}
                      {hasReturnRequest(viewingOrder.id) && (
                        <button
                          onClick={() => {
                            const returnReq = getReturnRequest(viewingOrder.id);
                            setViewingReturnStatus(returnReq);
                            setViewingOrder(null);
                          }}
                          className="flex-1 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold py-3 rounded-md transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <ClipboardList className="size-5" />
                          View Return Status
                        </button>
                      )}
                    </>
                  )}
                  {(['new', 'placed', 'pending', 'processing', 'accepted', 'packed'].includes(viewingOrder.status)) && viewingOrder.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelOrder(viewingOrder.id)}
                      className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-md transition-all flex items-center justify-center gap-2"
                    >
                      <X className="size-5" />
                      Cancel Order
                    </button>
                  )}
                  {(['accepted', 'packed', 'shipped', 'delivered'].includes(viewingOrder.status)) && (
                    <button
                      onClick={() => {
                        setTrackingOrder(viewingOrder);
                        setViewingOrder(null);
                      }}
                      className="flex-1 bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 rounded-md transition-all flex items-center justify-center gap-2"
                    >
                      <Truck className="size-5" />
                      Track Order
                    </button>
                  )}
                  <button
                    onClick={() => setViewingOrder(null)}
                    className="flex-1 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-bold py-3 rounded-md transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoice && (
          <Invoice order={showInvoice} user={user} adminUser={adminUser} onClose={() => setShowInvoice(null)} />
        )}

        {/* Tracking Modal */}
        {trackingOrder && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setTrackingOrder(null)}>
            <div className="bg-[#3D2817] rounded-lg border-2 border-[#8B6F47] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Track Order
                    </h2>
                    <p className="text-sm text-[#D4C5AA] mt-1">Order {trackingOrder.id}</p>
                  </div>
                  <button 
                    onClick={() => setTrackingOrder(null)}
                    className="text-[#D4C5AA] hover:text-[#D4AF37] transition-colors"
                  >
                    <X className="size-6" />
                  </button>
                </div>

                {/* Tracking Number */}
                {trackingOrder.trackingNumber && (
                  <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47] mb-6">
                    <p className="text-xs text-[#D4C5AA] mb-1">Tracking Number</p>
                    <p className="font-bold text-[#F5E6D3] text-lg font-mono">{trackingOrder.trackingNumber}</p>
                  </div>
                )}

                {/* Tracking Timeline */}
                <div className="space-y-4">
                  {getTrackingTimeline(trackingOrder).map((update, index) => {
                    const isLast = index === getTrackingTimeline(trackingOrder).length - 1;
                    const iconMap: { [key: string]: any } = {
                      'Order Placed': ClipboardList,
                      'Processing': Clock,
                      'Packed': PackageCheck,
                      'Shipped': Truck,
                      'Out for Delivery': Truck,
                      'Delivered': CheckCircle,
                      'Cancelled': X
                    };
                    const Icon = iconMap[update.status] || Package;

                    return (
                      <div key={index} className="flex gap-4">
                        {/* Timeline line and icon */}
                        <div className="flex flex-col items-center">
                          <div className={`p-3 rounded-full ${
                            update.completed 
                              ? update.status === 'Cancelled' 
                                ? 'bg-red-900/30 border-2 border-red-700' 
                                : 'bg-emerald-900/30 border-2 border-emerald-700'
                              : 'bg-[#8B6F47]/20 border-2 border-[#8B6F47]/40'
                          }`}>
                            <Icon className={`size-5 ${
                              update.completed 
                                ? update.status === 'Cancelled' 
                                  ? 'text-red-400' 
                                  : 'text-emerald-400'
                                : 'text-[#8B6F47]'
                            }`} />
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 h-full min-h-[60px] ${
                              update.completed ? 'bg-emerald-700' : 'bg-[#8B6F47]/40'
                            }`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-6">
                          <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className={`font-bold ${
                                update.completed ? 'text-[#F5E6D3]' : 'text-[#A08968]'
                              }`}>
                                {update.status}
                              </h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                update.completed 
                                  ? 'bg-emerald-900/30 text-emerald-400'
                                  : 'bg-[#8B6F47]/20 text-[#A08968]'
                              }`}>
                                {update.timestamp}
                              </span>
                            </div>
                            <p className="text-sm text-[#D4C5AA] mb-1">{update.description}</p>
                            <div className="flex items-center gap-1.5 text-xs text-[#A08968]">
                              <MapPin className="size-3" />
                              <span>{update.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Close Button */}
                <div className="mt-6 pt-6 border-t border-[#8B6F47]">
                  <button
                    onClick={() => setTrackingOrder(null)}
                    className="w-full bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-bold py-3 rounded-md transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Return Request Modal */}
        {returningOrder && (
          <ReturnRequestModal
            order={returningOrder}
            user={user}
            onClose={() => setReturningOrder(null)}
            onSubmit={async () => {
              setReturningOrder(null);
              // Refresh return requests to update UI
              try {
                const returnsData = await apiService.getMyReturnRequests();
                setReturnRequests(returnsData || []);
              } catch (error) {
                console.error('Error refreshing return requests:', error);
              }
            }}
          />
        )}

        {/* Return Status Modal */}
        {viewingReturnStatus && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setViewingReturnStatus(null)}>
            <div className="bg-[#3D2817] rounded-lg border-2 border-[#8B6F47] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Return Request Status
                  </h2>
                  <button 
                    onClick={() => setViewingReturnStatus(null)}
                    className="text-[#D4C5AA] hover:text-[#D4AF37] transition-colors"
                  >
                    <X className="size-6" />
                  </button>
                </div>

                {/* Return Request Details */}
                <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47] mb-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#D4C5AA] mb-1">Request ID</p>
                      <p className="font-bold text-[#F5E6D3]">{viewingReturnStatus.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#D4C5AA] mb-1">Request Date</p>
                      <p className="font-bold text-[#F5E6D3]">{viewingReturnStatus.requestDate}</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[#D4AF37] mb-3">Current Status</h3>
                  <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                    viewingReturnStatus.status === 'pending-admin' ? 'bg-yellow-900/20 border-yellow-700 text-yellow-400' :
                    viewingReturnStatus.status === 'approved-by-admin' ? 'bg-blue-900/20 border-blue-700 text-blue-400' :
                    viewingReturnStatus.status === 'rejected-by-admin' ? 'bg-red-900/20 border-red-700 text-red-400' :
                    viewingReturnStatus.status === 'refund-issued' ? 'bg-purple-900/20 border-purple-700 text-purple-400' :
                    'bg-emerald-900/20 border-emerald-700 text-emerald-400'
                  }`}>
                    <div className="p-2 rounded-full bg-current/20">
                      {viewingReturnStatus.status === 'pending-admin' && <Clock className="size-5" />}
                      {viewingReturnStatus.status === 'approved-by-admin' && <CheckCircle className="size-5" />}
                      {viewingReturnStatus.status === 'rejected-by-admin' && <X className="size-5" />}
                      {viewingReturnStatus.status === 'refund-issued' && <CheckCircle className="size-5" />}
                      {viewingReturnStatus.status === 'completed' && <CheckCircle className="size-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-lg">
                        {viewingReturnStatus.status === 'pending-admin' && 'Pending Admin Review'}
                        {viewingReturnStatus.status === 'approved-by-admin' && 'Approved - Awaiting Seller Processing'}
                        {viewingReturnStatus.status === 'rejected-by-admin' && 'Request Rejected'}
                        {viewingReturnStatus.status === 'refund-issued' && 'Refund Issued'}
                        {viewingReturnStatus.status === 'completed' && 'Return Completed'}
                      </p>
                      <p className="text-sm opacity-80">
                        {viewingReturnStatus.status === 'pending-admin' && 'Your return request is being reviewed by our admin team.'}
                        {viewingReturnStatus.status === 'approved-by-admin' && 'Your return has been approved. The seller will process your refund soon.'}
                        {viewingReturnStatus.status === 'rejected-by-admin' && 'Your return request has been rejected by admin.'}
                        {viewingReturnStatus.status === 'refund-issued' && 'Your refund has been processed by the seller.'}
                        {viewingReturnStatus.status === 'completed' && 'Your return has been completed successfully.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Return Reason */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[#D4AF37] mb-3">Return Details</h3>
                  <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                    <div className="mb-3">
                      <p className="text-sm text-[#D4C5AA] mb-1">Reason</p>
                      <p className="text-[#F5E6D3] font-semibold">{viewingReturnStatus.reason}</p>
                    </div>
                    {viewingReturnStatus.description && (
                      <div>
                        <p className="text-sm text-[#D4C5AA] mb-1">Description</p>
                        <p className="text-[#F5E6D3]">{viewingReturnStatus.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Returned Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[#D4AF37] mb-3">Returned Items</h3>
                  <div className="space-y-3">
                    {viewingReturnStatus.items?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47] flex gap-4">
                        <img 
                          src={item.book?.image || '/placeholder-book.jpg'} 
                          alt={item.book?.title || 'Book'} 
                          className="w-16 h-20 object-cover rounded border border-[#8B6F47]" 
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-[#F5E6D3] mb-1">{item.book?.title || 'Unknown Title'}</h4>
                          <p className="text-sm text-[#D4C5AA] mb-2">by {item.book?.author || 'Unknown Author'}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-[#D4C5AA]">Quantity: {item.quantity}</p>
                            <p className="font-bold text-[#D4AF37]">₹{(item.book?.price || 0) * item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setViewingReturnStatus(null)}
                  className="w-full bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-bold py-3 rounded-md transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}