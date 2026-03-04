import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ShareModal } from '../components/ShareModal';
import { Star, ShoppingBag, Heart, Share2, Truck, ArrowLeft, MapPin, Award, Clock, CheckCircle, ChevronLeft, ChevronRight, X, ThumbsUp, MoreVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { apiService } from '../../services/api';
import { toast } from 'sonner';
import type { Book } from '../types';

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useAuth();
  const { addToCart } = useCart();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  
  // Load book from API
  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;
      
      try {
        const bookData = await apiService.getBook(id);
        // Add fallback values for required properties
        const processedBook = {
          ...bookData,
          id: bookData._id || bookData.id,
          rating: bookData.rating || 4.5,
          reviewCount: bookData.reviewCount || 0,
          deliveryDays: bookData.deliveryDays || 5,
          discount: bookData.discount || Math.round(((bookData.mrp - bookData.price) / bookData.mrp) * 100),
          seller: bookData.sellerId || null,
          sellerName: bookData.sellerName || (bookData.sellerId?.storeName || bookData.sellerId?.name) || 'Unknown Seller'
        };
        setBook(processedBook);
        
        // Load reviews (don't fail if this errors)
        try {
          const reviewsData = await apiService.getBookReviews(bookData._id || id);
          setReviews(reviewsData || []);
        } catch (error) {
          console.error('Error loading reviews:', error);
          setReviews([]);
        }
      } catch (error) {
        console.error('Error loading book:', error);
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id]);

  // Load wishlist
  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }
    
    const wishlistKey = `wishlist_${user.id}`;
    const savedWishlist = localStorage.getItem(wishlistKey);
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (error) {
        console.error('Error parsing wishlist:', error);
        setWishlist([]);
      }
    }
  }, [user?.id]);

  const handleToggleWishlist = (bookId: string) => {
    if (!user) return;
    
    setWishlist(prev => {
      const newWishlist = prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId];
      
      const wishlistKey = `wishlist_${user.id}`;
      localStorage.setItem(wishlistKey, JSON.stringify(newWishlist));
      
      toast.success(prev.includes(bookId) ? 'Removed from wishlist' : 'Added to wishlist!');
      return newWishlist;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5E6D3]">
        <Navbar user={user} onLogout={logout} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#3D2817] h-64 sm:h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="bg-[#3D2817] h-8 rounded"></div>
                <div className="bg-[#3D2817] h-6 rounded w-3/4"></div>
                <div className="bg-[#3D2817] h-12 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="min-h-screen bg-[#F5E6D3]">
        <Navbar user={user} onLogout={logout} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#2C1810] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Book Not Found</h1>
          <p className="text-[#8B6F47] mb-4">Could not find book with ID: {id}</p>
          <Link to="/browse" className="text-[#8B6F47] hover:text-[#D4AF37] font-semibold transition-colors">
            ← Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return <CustomerView book={book} user={user} wishlist={wishlist} onLogout={logout} addToCart={addToCart} onToggleWishlist={handleToggleWishlist} navigate={navigate} notifications={notifications} markNotificationRead={markNotificationRead} markAllNotificationsRead={markAllNotificationsRead} deleteNotification={deleteNotification} reviews={reviews} />;
}

// Customer Shopping View
function CustomerView({ book, user, wishlist, onLogout, addToCart, onToggleWishlist, navigate, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, reviews }: any) {
  const [pincode, setPincode] = useState('');
  const [deliveryChecked, setDeliveryChecked] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);
  const [allReviewImages, setAllReviewImages] = useState<string[]>([]);
  const [showAllImagesPage, setShowAllImagesPage] = useState(false);
  const [showAllReviewsPage, setShowAllReviewsPage] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [sortBy, setSortBy] = useState('helpful');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [filteredReviews, setFilteredReviews] = useState<any[]>([]);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && filteredReviews.length > 0) {
      const liked = new Set<string>();
      filteredReviews.forEach((r: any) => {
        if (r.helpfulVotes?.includes(user.id)) {
          liked.add(r._id);
        }
      });
      setLikedReviews(liked);
    }
  }, [filteredReviews, user]);

  const defaultImage = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400';
  const bookImages = book.image
    ? [book.image, ...(book.images || []).filter((img: string) => img !== book.image)]
    : book.images && book.images.length > 0
    ? book.images
    : [defaultImage];
  const bookId = (book as any)._id || book.id;
  const isWishlisted = wishlist.includes(bookId);
  const hasMultipleImages = bookImages.length > 1;

  const handlePrevImage = () => {
    setSelectedImageIndex(prev => prev > 0 ? prev - 1 : bookImages.length - 1);
  };

  const handleNextImage = () => {
    setSelectedImageIndex(prev => prev < bookImages.length - 1 ? prev + 1 : 0);
  };

  const handleAddToCart = () => {
    addToCart(book, 1);
  };

  const handleBuyNow = () => {
    // Store book with quantity for direct checkout
    const buyNowItem = { ...book, quantity: 1 };
    localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
    navigate('/checkout');
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setDeliveryChecked(true);
    }
  };

  useEffect(() => {
    const calc = () => {
      if (!galleryRef.current) return;
      const w = galleryRef.current.offsetWidth;
      setVisibleCount(Math.floor(w / 104));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [reviews]);

  const getConditionBadge = () => {
    const badges = {
      'new': { text: 'NEW', color: 'bg-emerald-700 text-white', desc: 'Brand new, sealed' },
      'like-new': { text: 'LIKE NEW', color: 'bg-blue-700 text-white', desc: 'Excellent condition, minimal wear' },
      'used': { text: 'USED', color: 'bg-orange-700 text-white', desc: 'Good condition, may have marks' },
    };
    return badges[book.condition];
  };

  const conditionBadge = getConditionBadge();

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <Navbar user={user} onLogout={onLogout} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <Link to="/browse" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#3D2817] border border-[#8B6F47] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-white transition-all shadow-sm hover:shadow-md mb-4 sm:mb-6">
          <ArrowLeft className="size-5" />
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Image Section */}
          <div className="relative w-full lg:sticky lg:top-24">
            <div className="rounded-xl p-4 lg:p-6 border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
              {/* Main Image Container */}
              <div className="relative mb-4 group">
                <img
                  src={bookImages[selectedImageIndex]}
                  alt={book.title}
                  className="w-64 h-[370px] sm:w-72 sm:h-[416px] lg:w-80 lg:h-[462px] rounded-lg shadow-xl object-cover mx-auto bg-white"
                  style={{ aspectRatio: '9/13' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== defaultImage) {
                      target.src = defaultImage;
                    }
                  }}
                />
                
                {/* Navigation Arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white hover:bg-[#D4AF37] text-[#8B6F47] hover:text-white p-2 rounded-full transition-all shadow-xl border-2 border-[#8B6F47] z-10"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-[#D4AF37] text-[#8B6F47] hover:text-white p-2 rounded-full transition-all shadow-xl border-2 border-[#8B6F47] z-10"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}
                
                {/* Enhanced Badges */}
                <div className="absolute top-6 left-6 space-y-2">
                  <div className={`${conditionBadge.color} text-sm px-3 py-2 rounded-lg font-bold shadow-xl border-2 border-white/20 backdrop-blur-sm`}>
                    {conditionBadge.text}
                  </div>
                  {book.bestseller && (
                    <div className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#2C1810] text-sm px-3 py-2 rounded-lg font-bold shadow-xl flex items-center gap-2 border-2 border-white/20">
                      <Star className="size-4 fill-[#2C1810]" />
                      Bestseller
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex gap-3 justify-center pb-2 overflow-x-auto">
                {bookImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative rounded-lg border-2 transition-all hover:scale-105 flex-shrink-0 ${
                      selectedImageIndex === index 
                        ? 'border-[#D4AF37] shadow-lg ring-2 ring-[#D4AF37]/50' 
                        : 'border-[#8B6F47] opacity-70 hover:opacity-100 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${book.title} - View ${index + 1}`}
                      className="w-14 h-18 sm:w-16 sm:h-20 lg:w-20 lg:h-26 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== defaultImage) {
                          target.src = defaultImage;
                        }
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Condition Details Card */}
              <div className="mt-4 bg-gradient-to-r from-[#2C1810] to-[#1A0F08] rounded-lg p-4 border-2 border-[#8B6F47]/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`${conditionBadge.color} p-2 rounded-lg`}>
                    <Award className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#D4AF37] text-sm">Book Condition</h3>
                    <p className="text-[#F5E6D3] font-semibold">{conditionBadge.text}</p>
                  </div>
                </div>
                <p className="text-[#D4C5AA] text-sm leading-relaxed">
                  {conditionBadge.desc}
                </p>
              </div>

              {/* Short Description - Desktop only */}
              <div className="hidden lg:block mt-4 bg-gradient-to-r from-[#2C1810] to-[#1A0F08] rounded-lg p-4 border-2 border-[#8B6F47]/50">
                <h4 className="font-semibold text-[#D4AF37] mb-2 text-sm">About this Book</h4>
                <p className="text-[#D4C5AA] text-sm leading-relaxed line-clamp-4">
                  {book.description}
                </p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            {/* Main Details Card */}
            <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-xl p-5 lg:p-6 border-2 border-[#8B6F47] shadow-2xl">
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#F5E6D3] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {book.title}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-[#D4C5AA] mb-3 italic">by {book.author}</p>

                {/* Enhanced Rating, Condition & Stock Row */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#2C1810] to-[#1A0F08] text-[#D4AF37] px-3 py-2 rounded-lg shadow-md border border-[#8B6F47]/50">
                    <span className="font-bold text-sm sm:text-base">{book.rating > 0 ? book.rating.toFixed(1) : '4.5'}</span>
                    <Star className="size-4 fill-[#D4AF37]" />
                    {book.reviewCount > 0 && (
                      <span className="text-xs text-[#D4C5AA] ml-1">({book.reviewCount.toLocaleString()})</span>
                    )}
                  </div>
                  <div className="text-xs px-3 py-2 font-bold text-[#F5E6D3]">
                    {conditionBadge.text}
                  </div>
                  {book.stock > 0 ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <CheckCircle className="size-3.5" />
                      <span>{book.stock < 5 ? `Only ${book.stock} left!` : 'In Stock'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs">
                      <span>✗ Out of Stock</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Price Section */}
              <div className="mb-6 pb-4 border-b-2 border-[#8B6F47]/50">
                <div className="bg-gradient-to-r from-[#2C1810] to-[#1A0F08] rounded-lg p-4 border border-[#8B6F47]/50">
                  <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#D4AF37] drop-shadow-lg">₹{book.price}</span>
                    {book.mrp > book.price && (
                      <>
                        <span className="text-lg sm:text-xl lg:text-2xl text-[#A08968] line-through">₹{book.mrp}</span>
                        <span className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg border border-red-500/50">
                          {book.discount}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-[#D4C5AA] flex items-center gap-2">
                    <CheckCircle className="size-4 text-emerald-400" />
                    Inclusive of all taxes • Free delivery
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                {book.stock > 0 && (
                  <>
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-3 sm:py-2.5 lg:py-3 rounded-md transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#D4AF37]/30"
                    >
                      <ShoppingBag className="size-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-3 sm:py-2.5 lg:py-3 rounded-md transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#D4AF37]/30"
                    >
                      <ShoppingBag className="size-4" />
                      Buy Now
                    </button>
                  </>
                )}
                <div className="flex gap-2">
                  <button 
                    onClick={() => onToggleWishlist(bookId)}
                    className={`${isWishlisted ? 'bg-red-900/30 border-red-700' : 'bg-[#2C1810] border-[#8B6F47]'} hover:bg-[#3D2817] border-2 p-3 sm:p-2.5 lg:p-3 rounded-md transition-all flex-1 sm:flex-none`}
                  >
                    <Heart className={`size-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-[#D4AF37]'}`} />
                  </button>
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="bg-[#2C1810] hover:bg-[#3D2817] border-2 border-[#8B6F47] p-3 sm:p-2.5 lg:p-3 rounded-md transition-all flex-1 sm:flex-none"
                  >
                    <Share2 className="size-5 text-[#D4AF37]" />
                  </button>
                </div>
              </div>

              {/* Pincode Check */}
              <div className="bg-[#2C1810] rounded-lg p-3 border-2 border-[#8B6F47] mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="size-4 text-[#D4AF37]" />
                  <h3 className="font-semibold text-[#F5E6D3] text-sm">Delivery Information</h3>
                </div>
                <form onSubmit={handleCheckPincode} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter pincode"
                    className="flex-1 px-3 py-2 sm:py-1.5 text-sm bg-[#3D2817] border border-[#8B6F47] rounded focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                  />
                  <button 
                    type="submit"
                    className="bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] font-semibold px-4 py-2 sm:px-3 sm:py-1.5 text-sm rounded transition-colors"
                  >
                    Check
                  </button>
                </form>
                {deliveryChecked && (
                  <div className="mt-2 flex items-center gap-2 text-emerald-400 text-xs">
                    <CheckCircle className="size-3" />
                    <span>Delivery available in {book.deliveryDays} days to {pincode}</span>
                  </div>
                )}
              </div>

              {/* Quick Info */}
              <div className="flex items-center gap-3 text-xs text-[#D4C5AA] flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3 text-emerald-400" />
                  <span>{book.deliveryDays} days delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="size-3 text-emerald-400" />
                  <span>Free shipping</span>
                </div>
              </div>
            </div>

            {/* Seller Info Card */}
            <div className="bg-[#3D2817] rounded-lg p-4 border-2 border-[#8B6F47] shadow-xl">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-[#8B6F47] to-[#6B5537] p-2.5 rounded-lg shadow-md">
                  <MapPin className="size-5 text-[#F5E6D3]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#F5E6D3] mb-0.5 text-sm sm:text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {book.sellerName}
                  </h3>
                  <p className="text-xs text-[#D4C5AA] mb-2">College Street, Kolkata</p>
                  
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-[#2C1810] text-[#D4AF37] text-xs px-2 py-0.5 rounded">
                      <Star className="size-3 fill-[#D4AF37]" />
                      <span className="font-bold">{book.seller?.rating || 4.8}</span>
                    </div>
                    {book.seller && book.seller.yearsInBusiness >= 30 && (
                      <div className="bg-[#D4AF37] text-[#2C1810] text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <Award className="size-3" />
                        Legacy Seller
                      </div>
                    )}
                    <span className="text-xs text-emerald-400 font-semibold">
                      {book.seller?.yearsInBusiness || 35}+ years in business
                    </span>
                  </div>

                  <Link
                    to={`/browse?seller=${book.sellerId}`}
                    className="inline-flex items-center gap-1 text-[#D4AF37] hover:text-[#FFD700] font-semibold text-xs transition-colors"
                  >
                    View all books from this seller →
                  </Link>
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="bg-[#3D2817] rounded-lg p-4 border-2 border-[#8B6F47] shadow-xl">
              <h2 className="font-bold text-[#D4AF37] mb-3 text-base sm:text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                About this Book
              </h2>
              <p className="text-[#D4C5AA] text-sm leading-relaxed mb-4">{book.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#2C1810] rounded-md border border-[#8B6F47]">
                  <p className="text-xs text-[#A08968] mb-0.5">ISBN</p>
                  <p className="font-semibold text-[#F5E6D3] text-xs break-all">{book.isbn}</p>
                </div>
                <div className="p-2.5 bg-[#2C1810] rounded-md border border-[#8B6F47]">
                  <p className="text-xs text-[#A08968] mb-0.5">Category</p>
                  <p className="font-semibold text-[#F5E6D3] text-xs">{book.category}</p>
                </div>
                {book.language && (
                  <div className="p-2.5 bg-[#2C1810] rounded-md border border-[#8B6F47]">
                    <p className="text-xs text-[#A08968] mb-0.5">Language</p>
                    <p className="font-semibold text-[#F5E6D3] text-xs">{book.language}</p>
                  </div>
                )}
                {book.edition && (
                  <div className="p-2.5 bg-[#2C1810] rounded-md border border-[#8B6F47]">
                    <p className="text-xs text-[#A08968] mb-0.5">Edition</p>
                    <p className="font-semibold text-[#F5E6D3] text-xs">{book.edition}</p>
                  </div>
                )}
                {book.publisher && (
                  <div className="p-2.5 bg-[#2C1810] rounded-md border border-[#8B6F47]">
                    <p className="text-xs text-[#A08968] mb-0.5">Publisher</p>
                    <p className="font-semibold text-[#F5E6D3] text-xs">{book.publisher}</p>
                  </div>
                )}
                <div className="p-2.5 bg-[#2C1810] rounded-md border border-[#8B6F47]">
                  <p className="text-xs text-[#A08968] mb-0.5">Condition</p>
                  <p className="font-semibold text-[#F5E6D3] text-xs">{conditionBadge.desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ratings & Reviews Section */}
        {reviews && reviews.length > 0 && (
          <div className="mt-8 bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl">
            <h2 className="font-bold text-[#D4AF37] mb-4 text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ratings & Reviews ({reviews.length})
            </h2>
            
            {/* Review Images Gallery */}
            {(() => {
              const allImages = reviews.flatMap((r: any) => r.images || []);
              
              return allImages.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#F5E6D3] text-sm">Customer Images ({allImages.length})</h3>
                    <button
                      onClick={() => {
                        setAllReviewImages(allImages);
                        setShowAllImagesPage(true);
                      }}
                      className="text-[#D4AF37] hover:text-[#F5E6D3] font-semibold text-sm transition-colors"
                    >
                      View All {allImages.length} Images
                    </button>
                  </div>
                  <div ref={galleryRef} className="flex gap-2">
                    {allImages.slice(0, visibleCount).map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Customer"
                        onClick={() => {
                          setAllReviewImages(allImages);
                          setViewingImageIndex(idx);
                        }}
                        className="w-24 h-24 object-cover rounded border-2 border-[#8B6F47] cursor-pointer hover:border-[#D4AF37] transition-colors flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
            
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review: any) => (
                <div key={review._id} className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-[#F5E6D3]">{review.userName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`size-4 ${
                                star <= review.rating
                                  ? 'fill-[#D4AF37] text-[#D4AF37]'
                                  : 'text-[#8B6F47]'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-[#D4C5AA]">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[#D4C5AA] text-sm leading-relaxed">{review.feedback}</p>
                </div>
              ))}
            </div>
            
            {reviews.length > 3 && (
              <button
                onClick={() => {setShowAllReviewsPage(true);setFilteredReviews(reviews);}}
                className="mt-4 w-full bg-[#2C1810] hover:bg-[#8B6F47] border-2 border-[#8B6F47] text-[#D4AF37] hover:text-[#F5E6D3] font-semibold py-2 rounded-lg transition-colors"
              >
                View All {reviews.length} Reviews
              </button>
            )}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        book={book} 
      />

      {/* All Reviews Page */}
      {showAllReviewsPage && (
        <div className="fixed inset-0 bg-[#F5E6D3] z-50 overflow-y-auto">
          <Navbar user={user} onLogout={onLogout} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
            <button
              onClick={() => setShowAllReviewsPage(false)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#3D2817] border border-[#8B6F47] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-white transition-all shadow-sm hover:shadow-md mb-4 sm:mb-6"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-2xl font-bold text-[#2C1810] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              All Reviews ({filteredReviews.length})
            </h1>
            
            <div className="mb-6 bg-[#3D2817] rounded-lg p-4 border-2 border-[#8B6F47]">
              <p className="text-[#D4C5AA] text-sm mb-3">User reviews sorted by</p>
              <div className="grid grid-cols-4 gap-1">
                {[{id:'helpful',label:'Most Helpful'},{id:'latest',label:'Latest'},{id:'positive',label:'Positive'},{id:'negative',label:'Negative'}].map(s=>(
                  <button key={s.id} onClick={async()=>{console.log('Clicked:',s.id);setSortBy(s.id);const r=await apiService.getBookReviews(bookId,s.id);console.log('Fetched reviews:',r.length,'for sort:',s.id);setFilteredReviews(r||[]);}} className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${sortBy===s.id?'bg-[#D4AF37] text-[#2C1810]':'bg-[#2C1810] text-[#D4C5AA] hover:bg-[#8B6F47]'}`}>{s.label}</button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredReviews.map((review: any) => {
                const isExpanded = expandedReviews.has(review._id);
                const needsTruncate = review.feedback.length > 200;
                return (
                  <div key={review._id} className="bg-[#3D2817] rounded-lg p-5 border-2 border-[#8B6F47]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-[#F5E6D3]">{review.userName}</p>
                          {review.verifiedPurchase && <span className="bg-emerald-700 text-white text-xs px-2 py-0.5 rounded">Verified Purchase</span>}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(s=>(<Star key={s} className={`size-4 ${s<=review.rating?'fill-[#D4AF37] text-[#D4AF37]':'text-[#8B6F47]'}`}/>))}
                          </div>
                          <span className="text-[#D4AF37] font-bold text-sm">{review.rating}.0</span>
                          <span className="text-[#D4C5AA] text-xs">{new Date(review.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                        </div>
                        {review.title && <p className="font-semibold text-[#F5E6D3] mb-2">{review.title}</p>}
                      </div>
                    </div>
                    <p className="text-[#D4C5AA] text-sm leading-relaxed mb-3">
                      {isExpanded || !needsTruncate ? review.feedback : `${review.feedback.slice(0,200)}...`}
                      {needsTruncate && (
                        <button onClick={()=>setExpandedReviews(p=>{const n=new Set(p);isExpanded?n.delete(review._id):n.add(review._id);return n;})} className="text-[#D4AF37] ml-1 font-semibold">{isExpanded?'less':'more'}</button>
                      )}
                    </p>
                    <div className="flex items-center gap-4">
                      <button onClick={async()=>{const isLiked=likedReviews.has(review._id);try{if(isLiked){await apiService.removeReviewHelpful(review._id);setLikedReviews(p=>{const n=new Set(p);n.delete(review._id);return n;});toast.success('Removed helpful mark');}else{await apiService.markReviewHelpful(review._id);setLikedReviews(p=>new Set(p).add(review._id));toast.success('Marked as helpful');}const r=await apiService.getBookReviews(bookId,sortBy);setFilteredReviews(r||[]);}catch(e){console.error(e);}}} className="flex items-center gap-2 text-[#D4C5AA] hover:text-[#D4AF37] transition-colors">
                        <ThumbsUp className={`size-4 ${likedReviews.has(review._id)?'fill-white text-white':''}` }/>
                        <span className="text-sm">Helpful ({review.helpfulCount||0})</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* All Images Page */}
      {showAllImagesPage && (
        <div className="fixed inset-0 bg-[#F5E6D3] z-50 overflow-y-auto">
          <Navbar user={user} onLogout={onLogout} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
            <button
              onClick={() => setShowAllImagesPage(false)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#3D2817] border border-[#8B6F47] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-white transition-all shadow-sm hover:shadow-md mb-4 sm:mb-6"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-2xl font-bold text-[#2C1810] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Customer Images ({allReviewImages.length})
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allReviewImages.map((img: string, idx: number) => (
                <img
                  key={idx}
                  src={img}
                  alt="Customer"
                  onClick={() => setViewingImageIndex(idx)}
                  className="w-full aspect-square object-cover rounded-lg border-2 border-[#8B6F47] cursor-pointer hover:border-[#D4AF37] transition-colors shadow-md"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImageIndex !== null && allReviewImages.length > 0 && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50" onClick={() => setViewingImageIndex(null)}>
          <button
            onClick={() => setViewingImageIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-[#D4AF37] transition-colors z-10"
          >
            <X className="size-8" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewingImageIndex(viewingImageIndex > 0 ? viewingImageIndex - 1 : allReviewImages.length - 1);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all z-10"
          >
            <ChevronLeft className="size-8" />
          </button>
          
          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={allReviewImages[viewingImageIndex]}
              alt="Customer review"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <p className="text-white mt-4 text-sm">
              {viewingImageIndex + 1} / {allReviewImages.length}
            </p>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewingImageIndex(viewingImageIndex < allReviewImages.length - 1 ? viewingImageIndex + 1 : 0);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all z-10"
          >
            <ChevronRight className="size-8" />
          </button>
        </div>
      )}
    </div>
  );
}