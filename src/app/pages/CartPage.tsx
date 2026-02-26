import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import type { CartItem } from '../types';
import { useState } from 'react';

export function CartPage() {
  const { user, logout, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useAuth();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});

  const onUpdateQuantity = (bookId: string, quantity: number) => {
    updateQuantity(bookId, quantity);
  };

  const onRemoveItem = (bookId: string) => {
    removeFromCart(bookId);
  };
  
  // Filter out items with invalid book data
  const validCart = (cart || []).filter(item => {
    const isValid = item.book && item.book.price !== undefined && item.book.title;
    if (!isValid) {
      console.warn('Invalid cart item found:', item);
    }
    return isValid;
  });
  
  const subtotal = validCart.reduce((sum, item) => sum + (item.book?.price || 0) * item.quantity, 0);
  const shipping = validCart.length > 0 ? 0 : 0; // Free shipping
  const total = subtotal + shipping;

  // Group cart items by seller
  const groupedCart = validCart.reduce((groups, item) => {
    const sellerId = item.book?.sellerId || 'unknown';
    if (!groups[sellerId]) {
      groups[sellerId] = {
        sellerName: item.book?.sellerName || 'Unknown Seller',
        items: []
      };
    }
    groups[sellerId].items.push(item);
    return groups;
  }, {} as Record<string, { sellerName: string; items: CartItem[] }>);

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <Navbar user={user} cart={cart} onLogout={logout} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#2C1810] mb-6 sm:mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
          Shopping Cart
        </h1>

        {!cart || cart.length === 0 ? (
          <div className="bg-[#3D2817] rounded-lg p-12 sm:p-16 text-center border-2 border-[#8B6F47] shadow-xl">
            <ShoppingBag className="size-16 sm:size-20 text-[#8B6F47] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F5E6D3] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Cart is Empty
            </h2>
            <p className="text-[#D4C5AA] mb-6">Discover amazing books from College Street sellers</p>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold px-6 sm:px-8 py-3 rounded-md transition-all shadow-lg"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items - Grouped by Seller */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(groupedCart).map(([sellerId, group]) => (
                <div key={sellerId} className="bg-[#3D2817] rounded-lg border-2 border-[#8B6F47] shadow-lg overflow-hidden">
                  {/* Seller Header */}
                  <div className="bg-[#2C1810] border-b-2 border-[#8B6F47] p-4 flex items-center gap-3">
                    <div className="bg-[#8B6F47] p-2 rounded-lg">
                      <Store className="size-5 text-[#F5E6D3]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#F5E6D3]">{group.sellerName}</p>
                      <p className="text-xs text-[#D4C5AA]">College Street, Kolkata</p>
                    </div>
                  </div>

                  {/* Items from this seller */}
                  <div className="divide-y-2 divide-[#8B6F47]">
                    {group.items.map((item) => {
                      const bookImages = item.book?.images && item.book.images.length > 0 
                        ? item.book.images 
                        : item.book?.image 
                        ? [item.book.image] 
                        : ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=500&fit=crop'];
                      const currentIndex = imageIndexes[item.bookId] || 0;
                      const hasMultipleImages = bookImages.length > 1;

                      const handlePrevImage = (e: React.MouseEvent) => {
                        e.preventDefault();
                        setImageIndexes(prev => ({
                          ...prev,
                          [item.bookId]: currentIndex > 0 ? currentIndex - 1 : bookImages.length - 1
                        }));
                      };

                      const handleNextImage = (e: React.MouseEvent) => {
                        e.preventDefault();
                        setImageIndexes(prev => ({
                          ...prev,
                          [item.bookId]: currentIndex < bookImages.length - 1 ? currentIndex + 1 : 0
                        }));
                      };

                      return (
                      <div key={item.bookId} className="p-4">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 relative" style={{ width: '96px' }}>
                            <div className="relative bg-[#2C1810] p-2 rounded-lg border border-[#8B6F47]">
                              <Link to={`/product/${item.bookId}`}>
                                <img
                                  src={bookImages[currentIndex]}
                                  alt={item.book?.title || 'Book'}
                                  className="w-20 h-28 object-cover rounded"
                                />
                              </Link>
                            </div>
                            {hasMultipleImages && (
                              <>
                                <button
                                  onClick={handlePrevImage}
                                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white hover:bg-[#D4AF37] text-[#8B6F47] hover:text-white p-2 rounded-full transition-all shadow-xl border-2 border-[#8B6F47] z-30"
                                >
                                  <ChevronLeft className="size-4" />
                                </button>
                                <button
                                  onClick={handleNextImage}
                                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white hover:bg-[#D4AF37] text-[#8B6F47] hover:text-white p-2 rounded-full transition-all shadow-xl border-2 border-[#8B6F47] z-30"
                                >
                                  <ChevronRight className="size-4" />
                                </button>
                              </>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link to={`/product/${item.bookId}`}>
                              <h3 className="font-bold text-[#F5E6D3] mb-1 hover:text-[#D4AF37] transition-colors line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                                {item.book?.title || 'Unknown Title'}
                              </h3>
                            </Link>
                            <p className="text-sm text-[#D4C5AA] mb-2 italic">{item.book?.author || 'Unknown Author'}</p>
                            
                            {/* Condition Badge */}
                            <div className="mb-3">
                              {item.book?.condition === 'new' && (
                                <span className="bg-emerald-700 text-white text-xs px-2 py-1 rounded font-bold">NEW</span>
                              )}
                              {item.book?.condition === 'like-new' && (
                                <span className="bg-blue-700 text-white text-xs px-2 py-1 rounded font-bold">LIKE NEW</span>
                              )}
                              {item.book?.condition === 'used' && (
                                <span className="bg-orange-700 text-white text-xs px-2 py-1 rounded font-bold">USED</span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-xl sm:text-2xl font-bold text-[#D4AF37]">₹{item.book?.price || 0}</span>
                              {(item.book?.mrp || 0) > (item.book?.price || 0) && (
                                <span className="text-sm text-[#A08968] line-through">₹{item.book?.mrp || 0}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-2 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                                <button
                                  onClick={() => onUpdateQuantity(item.bookId, Math.max(1, item.quantity - 1))}
                                  className="p-2 hover:bg-[#3D2817] rounded-l-lg transition-colors"
                                >
                                  <Minus className="size-4 text-[#D4AF37]" />
                                </button>
                                <span className="font-bold text-[#F5E6D3] min-w-[2rem] text-center">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(item.bookId, Math.min(item.book?.stock || 99, item.quantity + 1))}
                                  className="p-2 hover:bg-[#3D2817] rounded-r-lg transition-colors"
                                  disabled={item.quantity >= (item.book?.stock || 99)}
                                >
                                  <Plus className={`size-4 ${item.quantity >= (item.book?.stock || 99) ? 'text-[#6B5537]' : 'text-[#D4AF37]'}`} />
                                </button>
                              </div>
                              <button
                                onClick={() => onRemoveItem(item.bookId)}
                                className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold text-sm transition-colors"
                              >
                                <Trash2 className="size-4" />
                                Remove
                              </button>
                            </div>

                            {item.quantity >= (item.book?.stock || 0) && (
                              <p className="text-xs text-orange-400 mt-2">Maximum available quantity</p>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-[#3D2817] rounded-lg p-6 border-2 border-[#8B6F47] shadow-xl sticky top-24">
                <h2 className="text-2xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Order Summary
                </h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[#D4C5AA]">
                    <span>Subtotal ({validCart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span className="font-semibold text-[#F5E6D3]">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-[#D4C5AA]">
                    <span>Shipping</span>
                    <span className="font-semibold text-emerald-400">FREE</span>
                  </div>
                  <div className="border-t-2 border-[#8B6F47] pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-[#F5E6D3]">Total</span>
                      <span className="text-[#D4AF37] text-2xl">₹{total}</span>
                    </div>
                  </div>
                </div>

                {/* Savings */}
                {validCart.some(item => item.book?.mrp > item.book?.price) && (
                  <div className="bg-emerald-900/30 border-2 border-emerald-700/50 rounded-lg p-3 mb-6">
                    <p className="text-emerald-400 font-semibold text-sm">
                      🎉 You save ₹{validCart.reduce((sum, item) => sum + ((item.book?.mrp || 0) - (item.book?.price || 0)) * item.quantity, 0)}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-3 sm:py-4 rounded-md transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mb-3 border border-[#D4AF37]/30"
                >
                  {user ? 'Proceed to Checkout' : 'Sign In to Checkout'}
                  <ArrowRight className="size-5" />
                </button>

                {!user && (
                  <p className="text-xs text-[#D4C5AA] text-center mb-3">
                    Sign in to complete your purchase
                  </p>
                )}

                <Link
                  to="/browse"
                  className="block text-center text-[#D4AF37] hover:text-[#FFD700] font-semibold text-sm transition-colors"
                >
                  Continue Shopping
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t-2 border-[#8B6F47] space-y-2">
                  <div key="badge-authentic" className="flex items-center gap-2 text-sm text-[#D4C5AA]">
                    <div className="w-5 h-5 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>100% Authentic Books</span>
                  </div>
                  <div key="badge-delivery" className="flex items-center gap-2 text-sm text-[#D4C5AA]">
                    <div className="w-5 h-5 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Free Delivery</span>
                  </div>
                  <div key="badge-returns" className="flex items-center gap-2 text-sm text-[#D4C5AA]">
                    <div className="w-5 h-5 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}