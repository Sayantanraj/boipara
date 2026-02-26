import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { SellerCard } from '../components/SellerCard';
import type { Book } from '../types';
import { mockSellers, quickCategories } from '../data/mockData';
import { ArrowRight, Shield, RefreshCw, Truck, Award, MapPin, BookOpen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { apiService } from '../../services/api';
import { useRealTime } from '../../hooks/useRealTime';

export function HomePage() {
  const { user, logout, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useAuth();
  const { cart, addToCart } = useCart();
  const { notifications: realtimeNotifications } = useRealTime(user?.id || '');
  
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [bestsellers, setBestsellers] = useState<Book[]>([]);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const data = await apiService.getBooks();
        setBooks(data.books || []);
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadBestsellers = async () => {
      try {
        const data = await apiService.getBestsellers();
        setBestsellers(data || []);
      } catch (error) {
        console.error('Error loading bestsellers:', error);
      }
    };

    loadBooks();
    loadBestsellers();
  }, []);

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
  };

  // Filter books for different sections
  const availableBooks = books;
  const featured = availableBooks.filter(b => b.featured).slice(0, 6);
  const academicBooks = availableBooks.filter(b => b.category === 'Academic' || b.category === 'Competitive Exams').slice(0, 6);
  const rareBooks = availableBooks.filter(b => b.category === 'Rare & Vintage');
  const newArrivals = availableBooks.slice(0, 6);

  const handleAddToCart = (book: Book, quantity: number) => {
    addToCart(book, quantity);
  };

  const handleToggleWishlist = (bookId: string) => {
    if (wishlist.includes(bookId)) {
      setWishlist(wishlist.filter(id => id !== bookId));
    } else {
      setWishlist([...wishlist, bookId]);
    }
  };

  const location = user?.location || 'Newtown, Kolkata';

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <Navbar 
        user={user} 
        wishlist={wishlist} 
        notifications={notifications}
        onLogout={logout}
        onMarkNotificationRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
        onDeleteNotification={deleteNotification}
      />

      {/* Hero Carousel */}
      <div className="bg-[#2C1810]">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <Slider {...carouselSettings}>
            {/* Slide 1 - Welcome */}
            <div>
              <div className="relative h-[400px] sm:h-[500px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1689710214746-c0094c4bac56?w=1920"
                  alt="College Street Bookstores"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#2C1810]/95 via-[#2C1810]/70 to-transparent"></div>
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
                    <div className="max-w-2xl">
                      <div className="mb-4 inline-block">
                        <span className="bg-[#D4AF37] text-[#2C1810] px-4 py-2 rounded font-bold text-sm shadow-lg flex items-center gap-2">
                          <Sparkles className="size-4" />
                          Welcome to BOI PARA
                        </span>
                      </div>
                      <h2 className="text-4xl sm:text-6xl font-bold mb-4 text-[#F5E6D3] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                        From College Street
                        <br />
                        <span className="text-[#D4AF37]">to Your Doorstep</span>
                      </h2>
                      <p className="text-lg sm:text-xl mb-8 text-[#D4C5AA] leading-relaxed">
                        Authentic books from trusted Kolkata sellers
                      </p>
                      <Link
                        to="/browse"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-md shadow-xl transition-all duration-300 border-2 border-[#D4AF37]/30"
                      >
                        Explore Books
                        <ArrowRight className="size-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2 - Exam Season */}
            <div>
              <div className="relative h-[400px] sm:h-[500px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1671570142427-be04d1ee9d1e?w=1920"
                  alt="Academic Books"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#2C1810]/95 via-[#2C1810]/70 to-transparent"></div>
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
                    <div className="max-w-2xl">
                      <div className="mb-4 inline-block">
                        <span className="bg-emerald-700 text-white px-4 py-2 rounded font-bold text-sm shadow-lg flex items-center gap-2">
                          <BookOpen className="size-4" />
                          Exam Season Essentials
                        </span>
                      </div>
                      <h2 className="text-4xl sm:text-6xl font-bold mb-4 text-[#F5E6D3] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Academic Books
                        <br />
                        <span className="text-[#D4AF37]">Up to 40% Off</span>
                      </h2>
                      <p className="text-lg sm:text-xl mb-8 text-[#D4C5AA] leading-relaxed">
                        NEET, JEE, WBBSE, and competitive exam guides
                      </p>
                      <Link
                        to="/browse?category=Academic"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-md shadow-xl transition-all duration-300 border-2 border-[#D4AF37]/30"
                      >
                        Shop Academic
                        <ArrowRight className="size-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 3 - Rare Books */}
            <div>
              <div className="relative h-[400px] sm:h-[500px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1722182877533-7378b60bf1e8?w=1920"
                  alt="Rare & Vintage Books"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#2C1810]/95 via-[#2C1810]/70 to-transparent"></div>
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
                    <div className="max-w-2xl">
                      <div className="mb-4 inline-block">
                        <span className="bg-[#D4AF37] text-[#2C1810] px-4 py-2 rounded font-bold text-sm shadow-lg flex items-center gap-2">
                          <Award className="size-4" />
                          Rare Collection
                        </span>
                      </div>
                      <h2 className="text-4xl sm:text-6xl font-bold mb-4 text-[#F5E6D3] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Discover Rare
                        <br />
                        <span className="text-[#D4AF37]">Literary Treasures</span>
                      </h2>
                      <p className="text-lg sm:text-xl mb-8 text-[#D4C5AA] leading-relaxed">
                        First editions, vintage classics, and collector's items
                      </p>
                      <Link
                        to="/browse?category=Rare & Vintage"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-md shadow-xl transition-all duration-300 border-2 border-[#D4AF37]/30"
                      >
                        View Collection
                        <ArrowRight className="size-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Slider>
        </div>
      </div>

      {/* Location Bar - Mobile */}
      <div className="lg:hidden bg-[#3D2817] border-y border-[#8B6F47] px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-[#D4AF37]" />
          <div>
            <p className="text-xs text-[#A08968]">Delivering to</p>
            <p className="text-sm font-semibold text-[#F5E6D3]">{location}</p>
          </div>
        </div>
      </div>

      {/* Quick Categories */}
      <div className="bg-white py-3 border-b-2 border-[#8B6F47]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#2C1810] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Quick Categories
          </h2>
          {/* Mobile: Grid Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:hidden">
            {quickCategories.map(cat => {
              const IconComponent = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/browse?category=${cat.name}`}
                  className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] hover:from-[#8B6F47] hover:to-[#6B5537] border-2 border-[#8B6F47] hover:border-[#D4AF37] rounded-xl p-4 transition-all shadow-md hover:shadow-xl text-center transform hover:scale-105"
                >
                  <div className="flex justify-center mb-2">
                    <IconComponent className="size-8 text-[#D4AF37]" />
                  </div>
                  <p className="text-xs font-bold text-[#F5E6D3] leading-tight">{cat.name}</p>
                </Link>
              );
            })}
          </div>
          {/* Desktop: Horizontal Scroll */}
          <div className="hidden md:flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
            {quickCategories.map(cat => {
              const IconComponent = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/browse?category=${cat.name}`}
                  className="flex-shrink-0 bg-gradient-to-br from-[#3D2817] to-[#2C1810] hover:from-[#8B6F47] hover:to-[#6B5537] border-2 border-[#8B6F47] hover:border-[#D4AF37] rounded-xl p-4 transition-all shadow-md hover:shadow-xl min-w-[140px] text-center transform hover:scale-105"
                >
                  <div className="flex justify-center mb-2">
                    <IconComponent className="size-8 text-[#D4AF37]" />
                  </div>
                  <p className="text-sm font-bold text-[#F5E6D3]">{cat.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Bestsellers */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#8B6F47]">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2C1810]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Best Sellers Books
              </h2>
              <p className="text-[10px] sm:text-xs text-[#6B5537]">Most purchased by our readers</p>
            </div>
            <Link 
              to="/browse?bestsellers=true" 
              className="hidden sm:flex text-[#8B6F47] hover:text-[#D4AF37] font-semibold items-center gap-1 transition-colors text-xs"
            >
              View All
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#3D2817] rounded-lg p-4 animate-pulse">
                  <div className="bg-[#8B6F47] h-32 rounded mb-2"></div>
                  <div className="bg-[#8B6F47] h-4 rounded mb-1"></div>
                  <div className="bg-[#8B6F47] h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 auto-rows-fr">
              {bestsellers.map(book => (
                <ProductCard 
                  key={(book as any)._id || book.id} 
                  book={book} 
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlisted={wishlist?.includes((book as any)._id || book.id) || false}
                />
              ))}
            </div>
          )}
        </section>

        {/* Exam Season Essentials */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#8B6F47]">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2C1810]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Exam Season Essentials
              </h2>
              <p className="text-[10px] sm:text-xs text-[#6B5537]">Academic & competitive exam books</p>
            </div>
            <Link 
              to="/browse?category=Academic" 
              className="hidden sm:flex text-[#8B6F47] hover:text-[#D4AF37] font-semibold items-center gap-1 transition-colors text-xs"
            >
              View All
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {academicBooks.map(book => (
              <ProductCard 
                key={(book as any)._id || book.id} 
                book={book} 
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                isWishlisted={wishlist?.includes((book as any)._id || book.id) || false}
              />
            ))}
          </div>
        </section>

        {/* Rare & Out of Print */}
        {rareBooks.length > 0 && (
          <section className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#8B6F47]">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#2C1810]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Rare & Out of Print
                </h2>
                <p className="text-[10px] sm:text-xs text-[#6B5537]">Collector's editions and vintage finds</p>
              </div>
              <Link 
                to="/browse?category=Rare & Vintage" 
                className="hidden sm:flex text-[#8B6F47] hover:text-[#D4AF37] font-semibold items-center gap-1 transition-colors text-xs"
              >
                Explore
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {rareBooks.map(book => (
                <ProductCard 
                  key={(book as any)._id || book.id} 
                  book={book} 
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlisted={wishlist?.includes((book as any)._id || book.id) || false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Buy-Back & Auction Banner */}
        <section className="grid md:grid-cols-2 gap-4 mb-6">
          <Link to="/buyback" className="bg-emerald-900 hover:bg-emerald-800 rounded-lg p-4 border-2 border-emerald-700 transition-all shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-600 p-2 rounded-lg shadow-md">
                <RefreshCw className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Sell Your Old Books
                </h3>
                <p className="text-emerald-200 text-xs">Get instant cash for used books</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 text-emerald-300 font-bold text-sm">
              Start Selling <ArrowRight className="size-4" />
            </div>
          </Link>

          <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-lg p-4 border-2 border-[#D4AF37] shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#D4AF37] p-2 rounded-lg shadow-md">
                <Award className="size-6 text-[#2C1810]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F5E6D3]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  e-Auction Coming Soon
                </h3>
                <p className="text-[#D4C5AA] text-xs">Bid on rare & collectible books</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 text-[#D4AF37] font-bold text-sm">
              Notify Me <ArrowRight className="size-4" />
            </div>
          </div>
        </section>
      </div>

      {/* Trust Features */}
      <div className="bg-[#3D2817] py-4 sm:py-6 border-y-4 border-[#8B6F47]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-[#D4AF37] rounded-full mb-3 sm:mb-4 shadow-lg">
                <Shield className="size-6 sm:size-8 text-[#2C1810]" />
              </div>
              <h3 className="font-bold text-[#F5E6D3] mb-1 sm:mb-2 text-sm sm:text-base" style={{ fontFamily: "'Playfair Display', serif" }}>100% Authentic</h3>
              <p className="text-xs sm:text-sm text-[#D4C5AA]">Verified sellers only</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-[#D4AF37] rounded-full mb-3 sm:mb-4 shadow-lg">
                <Award className="size-6 sm:size-8 text-[#2C1810]" />
              </div>
              <h3 className="font-bold text-[#F5E6D3] mb-1 sm:mb-2 text-sm sm:text-base" style={{ fontFamily: "'Playfair Display', serif" }}>Best Prices</h3>
              <p className="text-xs sm:text-sm text-[#D4C5AA]">Direct from sellers</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-[#D4AF37] rounded-full mb-3 sm:mb-4 shadow-lg">
                <RefreshCw className="size-6 sm:size-8 text-[#2C1810]" />
              </div>
              <h3 className="font-bold text-[#F5E6D3] mb-1 sm:mb-2 text-sm sm:text-base" style={{ fontFamily: "'Playfair Display', serif" }}>Easy Buyback</h3>
              <p className="text-xs sm:text-sm text-[#D4C5AA]">Sell used books</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-[#D4AF37] rounded-full mb-3 sm:mb-4 shadow-lg">
                <Truck className="size-6 sm:size-8 text-[#2C1810]" />
              </div>
              <h3 className="font-bold text-[#F5E6D3] mb-1 sm:mb-2 text-sm sm:text-base" style={{ fontFamily: "'Playfair Display', serif" }}>Fast Delivery</h3>
              <p className="text-xs sm:text-sm text-[#D4C5AA]">3-5 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#2C1810] text-[#F5E6D3] py-4 sm:py-6 border-t-4 border-[#8B6F47]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-4">
            <div>
              <h3 className="font-bold mb-2 text-[#D4AF37] text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>About</h3>
              <ul className="space-y-1 text-xs text-[#D4C5AA]">
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-[#D4AF37] text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>Help</h3>
              <ul className="space-y-1 text-xs text-[#D4C5AA]">
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Customer Support</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Track Order</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Returns</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-[#D4AF37] text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>Policies</h3>
              <ul className="space-y-1 text-xs text-[#D4C5AA]">
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Terms of Use</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-[#D4AF37] text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>Sell</h3>
              <ul className="space-y-1 text-xs text-[#D4C5AA]">
                <li><Link to="/login" className="hover:text-[#D4AF37] transition-colors">Seller Login</Link></li>
                <li><Link to="/buyback" className="hover:text-[#D4AF37] transition-colors">Sell Books</Link></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Guidelines</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t-2 border-[#8B6F47] pt-4 text-center text-xs text-[#D4C5AA]">
            <p>&copy; 2024 BOI PARA. All rights reserved.</p>
            <p className="mt-1 italic">"From College Street to Your Doorstep"</p>
          </div>
        </div>
      </footer>
    </div>
  );
}