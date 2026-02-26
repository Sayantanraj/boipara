import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { MapPin, User as UserIcon, Phone, Mail, CreditCard, ArrowLeft, ShoppingBag, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { apiService } from '../../services/api';
import type { Book } from '../types';

export function CheckoutPage() {
  const { user, logout } = useAuth();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  
  // Check for "Buy Now" item from localStorage
  const [buyNowItem, setBuyNowItem] = useState<Book | null>(null);
  
  useEffect(() => {
    const storedItem = localStorage.getItem('buyNowItem');
    if (storedItem) {
      try {
        setBuyNowItem(JSON.parse(storedItem));
      } catch (e) {
        console.error('Error parsing buyNowItem:', e);
      }
    }
  }, []);
  
  // Determine which items to show - either buyNowItem or cart
  const checkoutItems = buyNowItem 
    ? [{ bookId: (buyNowItem as any)._id || buyNowItem.id, book: buyNowItem, quantity: (buyNowItem as any).quantity || 1 }] 
    : cart;
  
  // Deduplicate checkout items to prevent React key warnings
  const deduplicatedItems = checkoutItems.reduce((acc: CartItem[], item: CartItem) => {
    const existingIndex = acc.findIndex(i => i.bookId === item.bookId);
    if (existingIndex >= 0) {
      acc[existingIndex] = {
        ...acc[existingIndex],
        quantity: acc[existingIndex].quantity + item.quantity
      };
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
  
  // Pre-fill form with user data
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    countryCode: '+91',
    address: user?.location || '',
    landmark: '',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '',
    paymentMethod: 'cod' as 'cod' | 'upi' | 'card'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = deduplicatedItems.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.phone.trim() && !/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    if (deduplicatedItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    setLoading(true);
    
    try {
      // Create order data
      const orderData = {
        items: deduplicatedItems.map(item => ({
          bookId: item.bookId,
          quantity: item.quantity,
          price: item.book.price,
          book: item.book
        })),
        total,
        subtotal,
        shipping,
        shippingAddress: `${formData.address}, ${formData.landmark ? formData.landmark + ', ' : ''}${formData.city}, ${formData.state} - ${formData.pincode}`,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: `${formData.countryCode} ${formData.phone}`,
        paymentMethod: formData.paymentMethod
      };

      // Save order to database
      const response = await apiService.createOrder(orderData);
      
      // Clear cart if not buy now
      if (!buyNowItem) {
        clearCart();
      } else {
        localStorage.removeItem('buyNowItem');
      }
      
      toast.success('Order placed successfully! 🎉');
      navigate('/orders');
    } catch (error: any) {
      console.error('Order creation failed:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Redirect if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Show message if cart becomes empty after loading
  if (!user) {
    return null;
  }

  if (deduplicatedItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5E6D3]">
        <Navbar user={user} onLogout={logout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <ShoppingBag className="size-16 mx-auto text-[#8B6F47] mb-4" />
          <h2 className="text-2xl font-bold text-[#2C1810] mb-2">Your cart is empty</h2>
          <p className="text-[#6B5537] mb-6">Add some books to proceed with checkout</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#B8941F] hover:to-[#D4AF37] text-[#2C1810] font-bold py-3 px-6 rounded-md transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <Navbar user={user} onLogout={logout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/cart')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-[#D4AF37] text-[#8B6F47] hover:text-white transition-all shadow-sm hover:shadow-md mb-4"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2C1810]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Checkout
          </h1>
          <p className="text-[#6B5537] mt-2">Complete your order details</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Personal Information */}
              <div className="bg-[#3D2817] rounded-lg p-4 sm:p-6 border-2 border-[#8B6F47] shadow-lg">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-[#D4AF37] flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    <UserIcon className="size-6" />
                    Personal Information
                  </h2>
                  <Edit2 className="size-5 text-[#D4C5AA]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#F5E6D3] mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-4 py-2 bg-[#2C1810] border-2 ${errors.name ? 'border-red-500' : 'border-[#8B6F47]'} rounded-lg text-[#F5E6D3] placeholder-[#8B6F47] focus:border-[#D4AF37] focus:outline-none transition-colors`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#F5E6D3] mb-2">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-2 bg-[#2C1810] border-2 ${errors.email ? 'border-red-500' : 'border-[#8B6F47]'} rounded-lg text-[#F5E6D3] placeholder-[#8B6F47] focus:border-[#D4AF37] focus:outline-none transition-colors`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-[#F5E6D3] mb-2">
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => handleInputChange('countryCode', e.target.value)}
                        className="w-[70px] sm:w-[110px] px-1.5 sm:px-3 py-2.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg text-[#F5E6D3] focus:border-[#D4AF37] focus:outline-none transition-all text-[10px] sm:text-base"
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+61">+61</option>
                        <option value="+86">+86</option>
                        <option value="+81">+81</option>
                        <option value="+82">+82</option>
                        <option value="+65">+65</option>
                        <option value="+971">+971</option>
                        <option value="+966">+966</option>
                      </select>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`flex-1 min-w-0 px-3 py-2 bg-[#2C1810] border-2 ${errors.phone ? 'border-red-500' : 'border-[#8B6F47]'} rounded-lg text-[#F5E6D3] placeholder-[#8B6F47] focus:border-[#D4AF37] focus:outline-none transition-colors text-sm`}
                        placeholder="10-digit number"
                      />
                    </div>
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-[#3D2817] rounded-lg p-4 sm:p-6 border-2 border-[#8B6F47] shadow-lg">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-[#D4AF37] flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    <MapPin className="size-6" />
                    Delivery Address
                  </h2>
                  <Edit2 className="size-5 text-[#D4C5AA]" />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#F5E6D3] mb-2">
                      Street Address <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-2 bg-[#2C1810] border-2 ${errors.address ? 'border-red-500' : 'border-[#8B6F47]'} rounded-lg text-[#F5E6D3] placeholder-[#8B6F47] focus:border-[#D4AF37] focus:outline-none transition-colors resize-none`}
                      placeholder="House/Flat No., Building Name, Street Name"
                    />
                    {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#F5E6D3] mb-2">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => handleInputChange('landmark', e.target.value)}
                      className="w-full px-4 py-2 bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg text-[#F5E6D3] placeholder-[#8B6F47] focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="Nearby landmark"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#F5E6D3] mb-2">
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={`w-full px-4 py-2 bg-[#2C1810] border-2 ${errors.city ? 'border-red-500' : 'border-[#8B6F47]'} rounded-lg text-[#F5E6D3] placeholder-[#8B6F47] focus:border-[#D4AF37] focus:outline-none transition-colors`}
                        placeholder="City"
                      />
                      {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#F5E6D3] mb-2">
                        State <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className={`w-full px-4 py-2 bg-[#2C1810] border-2 ${errors.state ? 'border-red-500' : 'border-[#8B6F47]'} rounded-lg text-[#F5E6D3] placeholder-[#8B6F47] focus:border-[#D4AF37] focus:outline-none transition-colors`}
                        placeholder="State"
                      />
                      {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#F5E6D3] mb-2">
                        Pincode <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                        className={`w-full px-4 py-2 bg-[#2C1810] border-2 ${errors.pincode ? 'border-red-500' : 'border-[#8B6F47]'} rounded-lg text-[#F5E6D3] placeholder-[#8B6F47] focus:border-[#D4AF37] focus:outline-none transition-colors`}
                        placeholder="6-digit PIN"
                      />
                      {errors.pincode && <p className="text-red-400 text-xs mt-1">{errors.pincode}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-[#3D2817] rounded-lg p-4 sm:p-6 border-2 border-[#8B6F47] shadow-lg">
                <h2 className="text-lg sm:text-xl font-bold text-[#D4AF37] mb-4 sm:mb-6 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  <CreditCard className="size-6" />
                  Payment Method
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg cursor-pointer hover:border-[#D4AF37] transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: 'cod' }))}
                      className="w-4 h-4 text-[#D4AF37]"
                    />
                    <div>
                      <p className="font-semibold text-[#F5E6D3]">Cash on Delivery</p>
                      <p className="text-xs text-[#D4C5AA]">Pay when you receive your books</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg cursor-pointer hover:border-[#D4AF37] transition-colors opacity-50">
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      disabled
                      className="w-4 h-4 text-[#D4AF37]"
                    />
                    <div>
                      <p className="font-semibold text-[#F5E6D3]">UPI Payment</p>
                      <p className="text-xs text-[#D4C5AA]">Coming Soon</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg cursor-pointer hover:border-[#D4AF37] transition-colors opacity-50">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      disabled
                      className="w-4 h-4 text-[#D4AF37]"
                    />
                    <div>
                      <p className="font-semibold text-[#F5E6D3]">Credit/Debit Card</p>
                      <p className="text-xs text-[#D4C5AA]">Coming Soon</p>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#3D2817] rounded-lg p-4 sm:p-6 border-2 border-[#8B6F47] shadow-xl lg:sticky lg:top-24">
              <h2 className="text-xl sm:text-2xl font-bold text-[#D4AF37] mb-4 sm:mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 max-h-60 overflow-y-auto">
                {deduplicatedItems.map((item) => (
                  <div key={item.bookId} className="flex gap-3 p-3 bg-[#2C1810] rounded-lg border border-[#8B6F47]">
                    <img
                      src={item.book.image}
                      alt={item.book.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#F5E6D3] line-clamp-2">{item.book.title}</p>
                      <p className="text-xs text-[#D4C5AA] mt-1">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-[#D4AF37] mt-1">₹{item.book.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 border-t-2 border-[#8B6F47] pt-3 sm:pt-4">
                <div className="flex justify-between text-[#D4C5AA]">
                  <span>Subtotal ({deduplicatedItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
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
              {deduplicatedItems.some(item => item.book.mrp > item.book.price) && (
                <div className="bg-emerald-900/30 border-2 border-emerald-700/50 rounded-lg p-3 mb-4 sm:mb-6">
                  <p className="text-emerald-400 font-semibold text-sm">
                    🎉 You save ₹{deduplicatedItems.reduce((sum, item) => sum + (item.book.mrp - item.book.price) * item.quantity, 0)}
                  </p>
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-4 rounded-md transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#D4AF37]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="size-5" />
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>

              {/* Trust Badges */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-[#8B6F47] space-y-2">
                <div key="checkout-badge-secure" className="flex items-center gap-2 text-sm text-[#D4C5AA]">
                  <div className="w-5 h-5 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Secure Checkout</span>
                </div>
                <div key="checkout-badge-delivery" className="flex items-center gap-2 text-sm text-[#D4C5AA]">
                  <div className="w-5 h-5 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Free Delivery</span>
                </div>
                <div key="checkout-badge-returns" className="flex items-center gap-2 text-sm text-[#D4C5AA]">
                  <div className="w-5 h-5 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}