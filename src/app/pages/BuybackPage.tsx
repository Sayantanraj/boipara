import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { RefreshCw, IndianRupee, Upload, X, Clock, CheckCircle, AlertCircle, Package, Truck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function BuybackPage() {
  const { user, logout, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previousRequests, setPreviousRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'previous'>('new');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isbn, setIsbn] = useState('');
  const [condition, setCondition] = useState<'like-new' | 'good' | 'fair'>('like-new');
  const [offeredPrice, setOfferedPrice] = useState<number | null>(null);
  const [bookImage, setBookImage] = useState<string | null>(null);
  
  // Book information fields
  const [bookName, setBookName] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [edition, setEdition] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [mrp, setMrp] = useState('');
  
  // Detailed condition questions
  const [pageCondition, setPageCondition] = useState('pristine');
  const [bindingCondition, setBindingCondition] = useState('perfect');
  const [coverCondition, setCoverCondition] = useState('like-new');
  const [writingMarks, setWritingMarks] = useState('none');
  const [damageCondition, setDamageCondition] = useState('no-damage');

  // Load previous buyback requests
  useEffect(() => {
    const loadPreviousRequests = async () => {
      if (!user) return;
      
      try {
        // Fetch buyback requests
        const requests = await apiService.getMyBuybackRequests();
        console.log('📚 Loaded buyback requests:', requests);
        
        // Fetch ALL buyback orders
        const allOrders = await apiService.getAllBuybackOrdersForCustomer();
        console.log('📦 Loaded all buyback orders:', allOrders);
        
        // Match orders to requests
        const requestsWithOrders = requests.map((request: any) => {
          console.log(`\n🔍 Matching request ${request._id}...`);
          
          // Find order where items contain this request's ID
          const matchingOrder = allOrders.find((order: any) => {
            console.log(`  Checking order ${order._id || order.trackingId}`);
            console.log(`  Order items:`, order.items);
            
            const hasMatch = order.items?.some((item: any) => {
              const bookId = item.bookId?._id || item.bookId;
              const requestId = request._id;
              
              console.log(`    Comparing: ${bookId} === ${requestId}`);
              
              return bookId === requestId || 
                     String(bookId) === String(requestId);
            });
            
            console.log(`  Match found: ${hasMatch}`);
            return hasMatch;
          });
          
          if (matchingOrder) {
            console.log(`✅ MATCHED! Request ${request._id} → Order ${matchingOrder._id || matchingOrder.trackingId}`);
          } else {
            console.log(`❌ No match for request ${request._id}`);
          }
          
          return { ...request, purchaseOrder: matchingOrder || null };
        });
        
        console.log('📋 Final requests with orders:', requestsWithOrders);
        setPreviousRequests(requestsWithOrders);
      } catch (error) {
        console.error('Error loading buyback requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    };

    loadPreviousRequests();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBookImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setBookImage(null);
  };

  const handleCheckPrice = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use entered MRP or default to 250 if not provided
    const basePrice = mrp ? parseFloat(mrp.replace(/[^0-9.]/g, '')) : 250;
    
    // Calculate price based on all conditions
    let priceMultiplier = 0.4; // Start with 40% for perfect condition
    
    // Check each condition and reduce multiplier
    if (pageCondition === 'minor-yellowing') priceMultiplier -= 0.05;
    if (pageCondition === 'yellowed') priceMultiplier -= 0.10;
    if (pageCondition === 'damaged') priceMultiplier -= 0.15;
    
    if (bindingCondition === 'tight') priceMultiplier -= 0.02;
    if (bindingCondition === 'loose') priceMultiplier -= 0.08;
    if (bindingCondition === 'broken') priceMultiplier -= 0.15;
    
    if (coverCondition === 'minor-wear') priceMultiplier -= 0.05;
    if (coverCondition === 'worn') priceMultiplier -= 0.10;
    if (coverCondition === 'damaged') priceMultiplier -= 0.15;
    
    if (writingMarks === 'minimal') priceMultiplier -= 0.05;
    if (writingMarks === 'moderate') priceMultiplier -= 0.10;
    if (writingMarks === 'heavy') priceMultiplier -= 0.20;
    
    if (damageCondition === 'minor-damage') priceMultiplier -= 0.08;
    if (damageCondition === 'moderate-damage') priceMultiplier -= 0.15;
    if (damageCondition === 'severe-damage') priceMultiplier -= 0.25;
    
    // Ensure minimum 5% price
    priceMultiplier = Math.max(0.05, priceMultiplier);
    
    setOfferedPrice(Math.round(basePrice * priceMultiplier));
  };

  const handleAcceptOffer = async () => {
    if (!offeredPrice || !user) {
      console.error('❌ Cannot submit:', { offeredPrice, user: !!user });
      toast.error('Please login to submit buyback request');
      return;
    }
    
    setLoading(true);
    
    try {
      const requestData = {
        isbn: isbn || 'N/A',
        bookTitle: bookName,
        author: authorName || 'Unknown',
        condition,
        offeredPrice,
        image: bookImage || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=500&fit=crop',
        publisher: publisherName,
        category: 'General',
        language: 'English',
        edition,
        publicationYear,
        mrp: mrp ? parseFloat(mrp.replace(/[^0-9.]/g, '')) : null,
        pageCondition,
        bindingCondition,
        coverCondition,
        writingMarks,
        damageCondition
      };
      
      console.log('📤 Submitting buyback request:', requestData);
      const result = await apiService.createBuybackRequest(requestData);
      console.log('✅ Buyback submitted successfully:', result);
      
      toast.success('Buyback request submitted successfully!');
      
      // Reload previous requests
      const requests = await apiService.getMyBuybackRequests();
      setPreviousRequests(requests);
      
      // Reset form
      setBookName('');
      setPublisherName('');
      setAuthorName('');
      setEdition('');
      setPublicationYear('');
      setMrp('');
      setIsbn('');
      setOfferedPrice(null);
      setBookImage(null);
      setPageCondition('pristine');
      setBindingCondition('perfect');
      setCoverCondition('like-new');
      setWritingMarks('none');
      setDamageCondition('no-damage');
    } catch (error: any) {
      console.error('❌ Error submitting buyback request:', error);
      toast.error(error.message || 'Failed to submit buyback request');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await apiService.updateBuybackOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      
      // Reload requests to get updated status
      const requests = await apiService.getMyBuybackRequests();
      const allOrders = await apiService.getAllBuybackOrdersForCustomer();
      
      const requestsWithOrders = requests.map((request: any) => {
        const matchingOrder = allOrders.find((order: any) => {
          return order.items?.some((item: any) => {
            const bookId = item.bookId?._id || item.bookId;
            const requestId = request._id;
            return bookId === requestId || String(bookId) === String(requestId);
          });
        });
        return { ...request, purchaseOrder: matchingOrder || null };
      });
      
      setPreviousRequests(requestsWithOrders);
      
      // Update the selected request if it's currently being viewed
      if (selectedRequest && selectedRequest.purchaseOrder?._id === orderId) {
        const updatedRequest = requestsWithOrders.find((r: any) => r._id === selectedRequest._id);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
        }
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="size-4 text-yellow-400" />;
      case 'approved': return <CheckCircle className="size-4 text-[#9FC131]" />;
      case 'rejected': return <X className="size-4 text-red-400" />;
      case 'completed': return <CheckCircle className="size-4 text-[#9FC131]" />;
      default: return <AlertCircle className="size-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/20 border-yellow-700/50 text-yellow-400';
      case 'approved': return 'bg-[#9FC131]/20 border-[#9FC131]/50 text-[#9FC131]';
      case 'rejected': return 'bg-red-900/20 border-red-700/50 text-red-400';
      case 'completed': return 'bg-[#9FC131]/20 border-[#9FC131]/50 text-[#9FC131]';
      default: return 'bg-gray-900/20 border-gray-700/50 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <Navbar user={user} onLogout={logout} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#2C1810] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Sell Your Books
          </h1>
          <p className="text-[#6B5537]">Get instant cash for your used books</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row bg-[#3D2817] rounded-lg p-1 border-2 border-[#8B6F47] w-full sm:w-fit">
            <button
              onClick={() => setActiveTab('new')}
              className={`w-full sm:w-auto px-6 py-2 rounded-md font-semibold transition-all ${
                activeTab === 'new'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:text-[#F5E6D3]'
              }`}
            >
              New Request
            </button>
            <button
              onClick={() => setActiveTab('previous')}
              className={`w-full sm:w-auto px-6 py-2 rounded-md font-semibold transition-all ${
                activeTab === 'previous'
                  ? 'bg-[#D4AF37] text-[#2C1810]'
                  : 'text-[#D4C5AA] hover:text-[#F5E6D3]'
              }`}
            >
              Previous Requests
            </button>
          </div>
        </div>

        {/* Previous Requests Section */}
        {activeTab === 'previous' && (
          <div className="bg-[#3D2817] rounded-lg p-8 border-2 border-[#8B6F47] shadow-xl">
            <h2 className="font-bold text-[#D4AF37] mb-6 text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Buyback Requests
            </h2>
            
            {loadingRequests ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47] animate-pulse">
                    <div className="flex gap-4">
                      <div className="bg-[#8B6F47] w-16 h-20 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-[#8B6F47] h-4 w-3/4 rounded"></div>
                        <div className="bg-[#8B6F47] h-3 w-1/2 rounded"></div>
                        <div className="bg-[#8B6F47] h-3 w-1/4 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : previousRequests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="size-16 text-[#8B6F47] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#F5E6D3] mb-2">No Previous Requests</h3>
                <p className="text-[#D4C5AA] mb-4">You haven't submitted any buyback requests yet.</p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold px-6 py-3 rounded-md transition-all shadow-lg"
                >
                  Submit Your First Request
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {previousRequests.map((request: any) => (
                  <div key={request._id} className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img
                        src={request.image || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=500&fit=crop'}
                        alt={request.bookTitle}
                        className="w-full sm:w-16 h-40 sm:h-20 object-cover rounded border border-[#8B6F47]"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-[#F5E6D3] mb-1">{request.bookTitle}</h3>
                            <p className="text-sm text-[#D4C5AA]">by {request.author}</p>
                            {request.publisher && (
                              <p className="text-xs sm:text-sm text-[#A08968]">Publisher: {request.publisher}</p>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="text-sm font-semibold capitalize">{request.status}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-[#A08968]">Condition</p>
                            <p className="text-[#F5E6D3] font-semibold capitalize">{request.condition}</p>
                          </div>
                          <div>
                            <p className="text-[#A08968]">Offered Price</p>
                            <p className="text-[#D4AF37] font-bold">₹{request.offeredPrice}</p>
                          </div>
                          <div>
                            <p className="text-[#A08968]">Submitted</p>
                            <p className="text-[#F5E6D3]">{new Date(request.createdAt).toLocaleDateString()}</p>
                          </div>
                          {request.sellingPrice && (
                            <div>
                              <p className="text-[#A08968]">Final Price</p>
                              <p className="text-[#9FC131] font-bold">₹{request.sellingPrice}</p>
                            </div>
                          )}
                        </div>
                        
                        {request.adminNotes && (
                          <div className="mt-3 p-3 bg-[#3D2817] rounded border border-[#8B6F47]">
                            <p className="text-xs text-[#A08968] mb-1">Admin Notes:</p>
                            <p className="text-sm text-[#D4C5AA]">{request.adminNotes}</p>
                          </div>
                        )}
                        
                        {(request.status === 'approved' || request.status === 'sold') && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailsModal(true);
                            }}
                            className="mt-3 w-full sm:w-auto px-4 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold rounded transition-all text-sm"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Request Form */}
        {activeTab === 'new' && (
          <>
            {/* How it Works */}
            <div className="bg-[#3D2817] rounded-lg p-4 sm:p-8 border-2 border-[#8B6F47] shadow-xl mb-8">
              <h2 className="font-bold text-[#D4AF37] mb-4 sm:mb-6 text-lg sm:text-xl text-center sm:text-left" style={{ fontFamily: "'Playfair Display', serif" }}>
                How It Works
              </h2>
              <div className="flex justify-between gap-2 sm:gap-6">
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-lg">
                    <span className="font-bold text-base sm:text-2xl text-[#2C1810]">1</span>
                  </div>
                  <h3 className="font-semibold text-[#F5E6D3] mb-1 sm:mb-2 text-xs sm:text-base">Enter ISBN</h3>
                  <p className="text-[10px] sm:text-sm text-[#D4C5AA] leading-tight">Enter your book's ISBN number</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-[#9FC131] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-lg">
                    <span className="font-bold text-base sm:text-2xl text-white">2</span>
                  </div>
                  <h3 className="font-semibold text-[#F5E6D3] mb-1 sm:mb-2 text-xs sm:text-base">Get Quote</h3>
                  <p className="text-[10px] sm:text-sm text-[#D4C5AA] leading-tight">Receive instant price quote</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-[#8B6F47] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-lg">
                    <span className="font-bold text-base sm:text-2xl text-[#F5E6D3]">3</span>
                  </div>
                  <h3 className="font-semibold text-[#F5E6D3] mb-1 sm:mb-2 text-xs sm:text-base">Get Paid</h3>
                  <p className="text-[10px] sm:text-sm text-[#D4C5AA] leading-tight">We pick up and pay instantly</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-[#3D2817] rounded-lg p-8 border-2 border-[#8B6F47] shadow-xl">
              <h2 className="font-bold text-[#D4AF37] mb-6 text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Get Your Quote
              </h2>
              
              <form onSubmit={handleCheckPrice} className="space-y-6">
                {/* Book Information Section */}
                <div className="space-y-4 bg-[#2C1810] p-5 rounded-lg border border-[#8B6F47]">
                  <h3 className="font-semibold text-[#D4AF37] mb-3">Book Information</h3>
                  
                  {/* Book Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">Book Name *</label>
                    <input
                      type="text"
                      required
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                      placeholder="Enter the book title"
                    />
                  </div>

                  {/* Publisher Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">Publisher Name *</label>
                    <input
                      type="text"
                      required
                      value={publisherName}
                      onChange={(e) => setPublisherName(e.target.value)}
                      className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                      placeholder="Enter the publisher name"
                    />
                  </div>

                  {/* Author Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">Author Name</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                      placeholder="Enter the author name (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Edition */}
                    <div>
                      <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">Edition</label>
                      <input
                        type="text"
                        value={edition}
                        onChange={(e) => setEdition(e.target.value)}
                        className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                        placeholder="e.g., 5th"
                      />
                    </div>

                    {/* Publication Year */}
                    <div>
                      <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">Publication Year</label>
                      <input
                        type="text"
                        value={publicationYear}
                        onChange={(e) => setPublicationYear(e.target.value)}
                        className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                        placeholder="e.g., 2020"
                      />
                    </div>
                  </div>

                  {/* MRP */}
                  <div>
                    <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">MRP</label>
                    <input
                      type="text"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                      placeholder="e.g., ₹500"
                    />
                  </div>

                  {/* ISBN Number - Now Optional */}
                  <div>
                    <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">ISBN Number</label>
                    <input
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                      placeholder="978-0-123456-78-9 (optional)"
                    />
                    <p className="text-xs sm:text-sm text-[#A08968] mt-2">Find ISBN on the back cover or inside the book</p>
                    
                    {/* Helper Image */}
                    <div className="mt-4 bg-[#3D2817] rounded-lg p-2 border border-[#8B6F47]">
                      <p className="text-xs font-semibold text-[#D4C5AA] mb-1">Where to find ISBN:</p>
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1620429928219-88ba915dd0f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwYmFyY29kZSUyMElTQk58ZW58MXx8fHwxNzY3NTk4ODk1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                        alt="Book ISBN barcode location"
                        className="w-full h-16 object-cover rounded-lg"
                      />
                      <p className="text-xs text-[#A08968] mt-1 text-center">
                        Look for the barcode on the back cover or inside the book
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#D4AF37] mb-2 sm:mb-3">Book Condition *</label>
                  <div className="flex gap-2 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setCondition('like-new')}
                      className={`flex-1 p-2 sm:p-4 rounded-lg border-2 transition-all ${
                        condition === 'like-new'
                          ? 'border-[#9FC131] bg-[#9FC131]/30'
                          : 'border-[#8B6F47] hover:border-[#D4AF37]'
                      }`}
                    >
                      <p className={`font-semibold text-xs sm:text-base ${condition === 'like-new' ? 'text-[#9FC131]' : 'text-[#D4C5AA]'}`}>
                        Like New
                      </p>
                      <p className="text-[10px] sm:text-xs text-[#A08968]">No marks</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondition('good')}
                      className={`flex-1 p-2 sm:p-4 rounded-lg border-2 transition-all ${
                        condition === 'good'
                          ? 'border-[#D4AF37] bg-[#D4AF37]/20'
                          : 'border-[#8B6F47] hover:border-[#D4AF37]'
                      }`}
                    >
                      <p className={`font-semibold text-xs sm:text-base ${condition === 'good' ? 'text-[#D4AF37]' : 'text-[#D4C5AA]'}`}>
                        Good
                      </p>
                      <p className="text-[10px] sm:text-xs text-[#A08968]">Minor wear</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondition('fair')}
                      className={`flex-1 p-2 sm:p-4 rounded-lg border-2 transition-all ${
                        condition === 'fair'
                          ? 'border-orange-600 bg-orange-900/30'
                          : 'border-[#8B6F47] hover:border-[#D4AF37]'
                      }`}
                    >
                      <p className={`font-semibold text-xs sm:text-base ${condition === 'fair' ? 'text-orange-400' : 'text-[#D4C5AA]'}`}>
                        Fair
                      </p>
                      <p className="text-[10px] sm:text-xs text-[#A08968]">Visible wear</p>
                    </button>
                  </div>
                </div>

                {/* Detailed Condition Questions */}
                <div className="space-y-4 bg-[#2C1810] p-5 rounded-lg border border-[#8B6F47]">
                  <h3 className="font-semibold text-[#D4AF37] mb-3">Detailed Condition Assessment</h3>
                  
                  {/* Page Condition */}
                  <div>
                    <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">Page Condition *</label>
                    <select
                      required
                      value={pageCondition}
                      onChange={(e) => setPageCondition(e.target.value)}
                      className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3]"
                    >
                      <option value="pristine">Pristine - Like new, crisp pages</option>
                      <option value="minor-yellowing">Minor Yellowing - Slight age-related yellowing</option>
                      <option value="yellowed">Yellowed - Noticeable yellowing throughout</option>
                      <option value="damaged">Damaged - Torn, stained, or heavily yellowed pages</option>
                    </select>
                  </div>

                  {/* Binding Condition */}
                  <div>
                    <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">Binding Condition *</label>
                    <select
                      required
                      value={bindingCondition}
                      onChange={(e) => setBindingCondition(e.target.value)}
                      className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3]"
                    >
                      <option value="perfect">Perfect - Firm and intact</option>
                      <option value="tight">Tight - Very good, no issues</option>
                      <option value="loose">Loose - Some pages coming loose</option>
                      <option value="broken">Broken - Spine damaged or pages falling out</option>
                    </select>
                  </div>

                  {/* Cover Condition */}
                  <div>
                    <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">Cover Condition *</label>
                    <select
                      required
                      value={coverCondition}
                      onChange={(e) => setCoverCondition(e.target.value)}
                      className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3]"
                    >
                      <option value="like-new">Like New - No visible wear</option>
                      <option value="minor-wear">Minor Wear - Light scuffing or creases</option>
                      <option value="worn">Worn - Visible wear, scratches, or fading</option>
                      <option value="damaged">Damaged - Torn, heavily worn, or stained</option>
                    </select>
                  </div>

                  {/* Writing/Markings */}
                  <div>
                    <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">Writing or Markings *</label>
                    <select
                      required
                      value={writingMarks}
                      onChange={(e) => setWritingMarks(e.target.value)}
                      className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3]"
                    >
                      <option value="none">None - No writing or markings</option>
                      <option value="minimal">Minimal - Light highlighting or notes</option>
                      <option value="moderate">Moderate - Multiple highlighted sections or notes</option>
                      <option value="heavy">Heavy - Extensive writing, highlighting, or markings</option>
                    </select>
                  </div>

                  {/* Damage Assessment */}
                  <div>
                    <label className="block text-sm font-semibold text-[#D4C5AA] mb-2">Overall Damage Assessment *</label>
                    <select
                      required
                      value={damageCondition}
                      onChange={(e) => setDamageCondition(e.target.value)}
                      className="w-full px-4 py-3 sm:py-2.5 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3]"
                    >
                      <option value="no-damage">No Damage - Excellent condition</option>
                      <option value="minor-damage">Minor Damage - Small issues (bent corners, light wear)</option>
                      <option value="moderate-damage">Moderate Damage - Noticeable issues (water spots, tears)</option>
                      <option value="severe-damage">Severe Damage - Major structural or cosmetic issues</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Upload Book Image</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="bookImageUpload"
                    />
                    <label
                      htmlFor="bookImageUpload"
                      className="bg-[#8B6F47] hover:bg-[#6B5537] text-[#F5E6D3] font-bold py-3 sm:py-2 px-4 rounded-md transition-all shadow-lg flex items-center justify-center gap-2 border border-[#D4AF37]/30 cursor-pointer"
                    >
                      <Upload className="size-5" />
                      Upload
                    </label>
                    {bookImage && (
                      <button
                        onClick={handleRemoveImage}
                        className="bg-[#8B6F47] hover:bg-[#6B5537] text-[#F5E6D3] font-bold py-3 sm:py-2 px-4 rounded-md transition-all shadow-lg flex items-center justify-center gap-2 border border-[#D4AF37]/30 cursor-pointer"
                      >
                        <X className="size-5" />
                        Remove
                      </button>
                    )}
                  </div>
                  {bookImage && (
                    <div className="mt-4">
                      <img
                        src={bookImage}
                        alt="Book"
                        className="w-full h-40 sm:h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {!offeredPrice && (
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-3 rounded-md transition-all shadow-lg flex items-center justify-center gap-2 border border-[#D4AF37]/30"
                  >
                    <IndianRupee className="size-5" />
                    Get Instant Quote
                  </button>
                )}
              </form>

              {offeredPrice && (
                <div className="mt-8 p-6 bg-[#9FC131]/30 rounded-lg border-2 border-[#9FC131]/50">
                  <div className="text-center mb-6">
                    <p className="text-[#D4C5AA] mb-2">We'll pay you</p>
                    <p className="text-6xl font-bold text-[#9FC131]">₹{offeredPrice}</p>
                    <p className="text-sm text-[#D4C5AA] mt-2">for this book in {condition} condition</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleAcceptOffer}
                      disabled={loading}
                      className="flex-1 bg-[#9FC131] hover:bg-[#8AB028] text-white font-bold py-3 rounded-md transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Submitting...' : 'Accept Offer'}
                    </button>
                    <button
                      onClick={() => setOfferedPrice(null)}
                      className="flex-1 bg-[#8B6F47] hover:bg-[#6B5537] text-[#F5E6D3] font-bold py-3 rounded-md transition-all shadow-lg"
                    >
                      Try Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Buyback Request Details
              </h2>
              <button
                onClick={() => {
                  console.log('=== DEBUG INFO ===');
                  console.log('Selected request:', selectedRequest);
                  console.log('Request ID:', selectedRequest._id);
                  console.log('Purchase order:', selectedRequest.purchaseOrder);
                  console.log('Has purchase order?', !!selectedRequest.purchaseOrder);
                  setShowDetailsModal(false);
                }}
                className="p-2 bg-red-700 hover:bg-red-600 text-white rounded transition-all"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Debug Info - Remove after testing */}
            <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded">
              <p className="text-xs text-yellow-300 font-mono">
                Debug: Request ID = {selectedRequest._id}<br/>
                Has Purchase Order = {selectedRequest.purchaseOrder ? 'YES' : 'NO'}<br/>
                {selectedRequest.purchaseOrder && `Order ID = ${selectedRequest.purchaseOrder._id}`}
              </p>
            </div>

            {/* Book Info */}
            <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47] mb-4">
              <div className="flex gap-4">
                <img
                  src={selectedRequest.image || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=500&fit=crop'}
                  alt={selectedRequest.bookTitle}
                  className="w-24 h-32 object-cover rounded border border-[#8B6F47]"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-[#F5E6D3] mb-1">{selectedRequest.bookTitle}</h3>
                  <p className="text-sm text-[#D4C5AA] mb-1">by {selectedRequest.author}</p>
                  {selectedRequest.publisher && (
                    <p className="text-sm text-[#A08968]">Publisher: {selectedRequest.publisher}</p>
                  )}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mt-2 ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="text-sm font-semibold capitalize">{selectedRequest.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Details */}
            <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47] mb-4">
              <h3 className="font-semibold text-[#D4AF37] mb-3">Price Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#A08968] mb-1">Your Offered Price</p>
                  <p className="text-lg font-bold text-[#D4AF37]">₹{selectedRequest.offeredPrice}</p>
                </div>
                {selectedRequest.sellingPrice && (
                  <div>
                    <p className="text-xs text-[#A08968] mb-1">Final Approved Price</p>
                    <p className="text-lg font-bold text-[#9FC131]">₹{selectedRequest.sellingPrice}</p>
                  </div>
                )}
              </div>
              {selectedRequest.priceChangeReason && (
                <div className="mt-3 p-2 bg-[#3D2817] rounded border border-yellow-700/50">
                  <p className="text-xs text-yellow-400 font-semibold mb-1">Price Adjustment Reason:</p>
                  <p className="text-sm text-[#D4C5AA]">{selectedRequest.priceChangeReason}</p>
                </div>
              )}
            </div>

            {/* Delivery Tracking */}
            {selectedRequest.purchaseOrder && (
              <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47] mb-4">
                <h3 className="font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
                  <Package className="size-5" />
                  Order Tracking
                </h3>
                
                {/* Tracking ID */}
                <div className="mb-4 p-3 bg-[#3D2817] rounded border border-[#D4AF37]/50">
                  <p className="text-xs text-[#A08968] mb-1">Tracking ID</p>
                  <p className="text-lg font-bold text-[#D4AF37]">{selectedRequest.purchaseOrder.trackingId}</p>
                </div>

                {/* Buyer Info */}
                <div className="mb-4 p-3 bg-[#3D2817] rounded border border-[#8B6F47]">
                  <p className="text-xs text-[#A08968] mb-1">Purchased By</p>
                  <p className="text-sm font-semibold text-[#F5E6D3]">{selectedRequest.purchaseOrder.customerName}</p>
                  <p className="text-xs text-[#D4C5AA]">Seller from College Street</p>
                </div>

                {/* Tracking Timeline */}
                <div className="relative">
                  {/* Vertical connecting line */}
                  <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#9FC131] via-[#D4AF37] to-[#8B6F47]"></div>
                  
                  <div className="space-y-6">
                    {/* Order Placed */}
                    <div className="flex items-start gap-3 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10 ${
                        selectedRequest.purchaseOrder.status ? 'bg-[#9FC131]' : 'bg-[#8B6F47]'
                      }`}>
                        <CheckCircle className="size-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#F5E6D3]">Order Placed</p>
                        <p className="text-xs text-[#A08968]">
                          {new Date(selectedRequest.purchaseOrder.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Pickup Scheduled */}
                    <div className="flex items-start gap-3 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10 ${
                        ['packed', 'shipped', 'out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status) 
                          ? 'bg-[#9FC131]' 
                          : selectedRequest.purchaseOrder.status === 'pending' || selectedRequest.purchaseOrder.status === 'processing'
                          ? 'bg-blue-600 animate-pulse'
                          : 'bg-[#8B6F47]'
                      }`}>
                        <Package className="size-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-semibold ${
                            ['packed', 'shipped', 'out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status)
                              ? 'text-[#F5E6D3]'
                              : selectedRequest.purchaseOrder.status === 'pending' || selectedRequest.purchaseOrder.status === 'processing'
                              ? 'text-blue-300'
                              : 'text-[#D4C5AA]'
                          }`}>
                            Pickup Scheduled
                          </p>
                          {selectedRequest.purchaseOrder.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(selectedRequest.purchaseOrder._id, 'processing')}
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors"
                            >
                              Mark as Processing
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-[#A08968]">
                          {['packed', 'shipped', 'out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status)
                            ? 'Pickup completed'
                            : 'Delivery partner will contact you soon'}
                        </p>
                      </div>
                    </div>

                    {/* Picked Up from Customer */}
                    <div className="flex items-start gap-3 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10 ${
                        ['packed', 'shipped', 'out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status)
                          ? 'bg-[#9FC131]'
                          : 'bg-[#8B6F47]'
                      }`}>
                        <Package className="size-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-semibold ${
                            ['packed', 'shipped', 'out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status)
                              ? 'text-[#F5E6D3]'
                              : 'text-[#D4C5AA]'
                          }`}>
                            Picked Up from Customer
                          </p>
                          {selectedRequest.purchaseOrder.status === 'processing' && (
                            <button
                              onClick={() => handleStatusUpdate(selectedRequest.purchaseOrder._id, 'packed')}
                              className="text-xs bg-[#9FC131] hover:bg-[#8AB028] text-white px-2 py-1 rounded transition-colors"
                            >
                              Mark as Packed
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-[#A08968]">
                          {['packed', 'shipped', 'out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status)
                            ? 'Book collected and in transit'
                            : 'Awaiting pickup'}
                        </p>
                      </div>
                    </div>

                    {/* In Transit to You */}
                    <div className="flex items-start gap-3 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10 ${
                        ['shipped', 'out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status)
                          ? 'bg-[#9FC131]'
                          : 'bg-[#8B6F47]'
                      }`}>
                        <Truck className="size-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-semibold ${
                            ['shipped', 'out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status)
                              ? 'text-[#F5E6D3]'
                              : 'text-[#D4C5AA]'
                          }`}>
                            In Transit to You
                          </p>
                          {selectedRequest.purchaseOrder.status === 'packed' && (
                            <button
                              onClick={() => handleStatusUpdate(selectedRequest.purchaseOrder._id, 'shipped')}
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors"
                            >
                              Mark as Shipped
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-[#A08968]">
                          {['shipped', 'out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status)
                            ? 'Book is on the way to buyer'
                            : 'Awaiting shipment'}
                        </p>
                      </div>
                    </div>

                    {/* Out for Delivery */}
                    <div className="flex items-start gap-3 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10 ${
                        ['out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status)
                          ? 'bg-[#9FC131]'
                          : 'bg-[#8B6F47]'
                      }`}>
                        <Truck className="size-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-semibold ${
                            ['out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status)
                              ? 'text-[#F5E6D3]'
                              : 'text-[#D4C5AA]'
                          }`}>
                            Out for Delivery
                          </p>
                          {selectedRequest.purchaseOrder.status === 'shipped' && (
                            <button
                              onClick={() => handleStatusUpdate(selectedRequest.purchaseOrder._id, 'out-for-delivery')}
                              className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-2 py-1 rounded transition-colors"
                            >
                              Out for Delivery
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-[#A08968]">
                          {['out-for-delivery', 'delivered'].includes(selectedRequest.purchaseOrder.status)
                            ? 'Final delivery in progress'
                            : 'Pending final delivery'}
                        </p>
                      </div>
                    </div>

                    {/* Delivered */}
                    <div className="flex items-start gap-3 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10 ${
                        selectedRequest.purchaseOrder.status === 'delivered'
                          ? 'bg-[#9FC131]'
                          : 'bg-[#8B6F47]'
                      }`}>
                        <CheckCircle className="size-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-semibold ${
                            selectedRequest.purchaseOrder.status === 'delivered'
                              ? 'text-[#9FC131]'
                              : 'text-[#D4C5AA]'
                          }`}>
                            Delivered
                          </p>
                          {selectedRequest.purchaseOrder.status === 'out-for-delivery' && (
                            <button
                              onClick={() => handleStatusUpdate(selectedRequest.purchaseOrder._id, 'delivered')}
                              className="text-xs bg-[#9FC131] hover:bg-[#8AB028] text-white px-2 py-1 rounded transition-colors"
                            >
                              Mark as Delivered
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-[#A08968]">
                          {selectedRequest.purchaseOrder.status === 'delivered'
                            ? 'Successfully delivered to buyer'
                            : 'Pending delivery'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Status Alert */}
                <div className={`mt-4 p-3 rounded border ${
                  selectedRequest.purchaseOrder.status === 'delivered'
                    ? 'bg-[#9FC131]/20 border-[#9FC131]/50'
                    : selectedRequest.purchaseOrder.status === 'out-for-delivery'
                    ? 'bg-blue-900/20 border-blue-700/50'
                    : 'bg-yellow-900/20 border-yellow-700/50'
                }`}>
                  <p className={`text-sm ${
                    selectedRequest.purchaseOrder.status === 'delivered'
                      ? 'text-[#9FC131]'
                      : selectedRequest.purchaseOrder.status === 'out-for-delivery'
                      ? 'text-blue-300'
                      : 'text-yellow-300'
                  }`}>
                    {selectedRequest.purchaseOrder.status === 'delivered'
                      ? '✅ Your book has been successfully delivered to the buyer. Payment will be processed within 24 hours.'
                      : selectedRequest.purchaseOrder.status === 'out-for-delivery'
                      ? '🚚 Your book is out for delivery. The buyer will receive it soon.'
                      : selectedRequest.purchaseOrder.status === 'shipped'
                      ? '📦 Your book is in transit to the buyer.'
                      : selectedRequest.purchaseOrder.status === 'packed'
                      ? '📦 Your book has been packed and will be shipped soon.'
                      : '📞 Our delivery partner will contact you within 24-48 hours to schedule the pickup. Please keep your book ready and packed.'}
                  </p>
                </div>

                {/* Shipping Address */}
                <div className="mt-4 p-3 bg-[#3D2817] rounded border border-[#8B6F47]">
                  <p className="text-xs text-[#A08968] mb-1">Shipping To</p>
                  <p className="text-sm text-[#D4C5AA]">{selectedRequest.purchaseOrder.shippingAddress}</p>
                </div>
              </div>
            )}

            {selectedRequest.status === 'approved' && !selectedRequest.purchaseOrder && (
              <div className="bg-[#9FC131]/20 rounded-lg p-4 border border-[#9FC131]/50">
                <p className="text-sm text-[#9FC131]">
                  ✅ Your book has been approved! It's now available for sellers to purchase. Once a seller buys your book, you'll be able to track the delivery here.
                </p>
              </div>
            )}

            {/* Condition Details */}
            <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
              <h3 className="font-semibold text-[#D4AF37] mb-3">Condition Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[#A08968]">Overall Condition</p>
                  <p className="text-[#F5E6D3] font-semibold capitalize">{selectedRequest.condition}</p>
                </div>
                <div>
                  <p className="text-[#A08968]">Submitted On</p>
                  <p className="text-[#F5E6D3]">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}