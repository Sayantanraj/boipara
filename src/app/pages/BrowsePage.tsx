import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { SlidersHorizontal, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import type { Book } from '../types';
import { apiService } from '../../services/api';
import { toast } from 'sonner';

export function BrowsePage() {
  const { user, logout, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useAuth();
  const { cart, addToCart } = useCart();
  const [wishlist, setWishlist] = useState<string[]>([]);
  // Load wishlist from localStorage
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
        console.error('Error parsing wishlist from localStorage:', error);
        setWishlist([]);
      }
    } else {
      setWishlist([]);
    }
  }, [user?.id]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (user && wishlist.length >= 0) {
      const wishlistKey = `wishlist_${user.id}`;
      localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    }
  }, [wishlist, user?.id]);

  const onAddToCart = (book: Book, quantity: number) => {
    addToCart(book, quantity);
  };

  const onToggleWishlist = (bookId: string) => {
    setWishlist(prevWishlist => {
      if (prevWishlist.includes(bookId)) {
        toast.success('Removed from wishlist');
        return prevWishlist.filter(id => id !== bookId);
      } else {
        toast.success('Added to wishlist!');
        return [...prevWishlist, bookId];
      }
    });
  };

  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [sortBy, setSortBy] = useState('popularity');
  const [showFilters, setShowFilters] = useState(false);
  
  // Load books from API
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Get URL parameters
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category');
  const bestsellersParam = searchParams.get('bestsellers');
  const sellerParam = searchParams.get('seller');

  const loadBooks = async () => {
    try {
      setLoading(true);
      
      // If bestsellers parameter is present, fetch from bestsellers endpoint
      if (bestsellersParam) {
        const data = await apiService.getBestsellers();
        setAllBooks(data || []);
      } else {
        const params: any = {};
        // Use categoryParam from URL if present, otherwise use selectedCategory
        const activeCategory = categoryParam || selectedCategory;
        if (activeCategory && activeCategory !== 'all') params.category = activeCategory;
        if (selectedCondition !== 'all') params.condition = selectedCondition;
        if (priceRange[0] > 0) params.minPrice = priceRange[0];
        if (priceRange[1] < 2000) params.maxPrice = priceRange[1];
        if (searchQuery) params.search = searchQuery;
        
        const data = await apiService.getBooks(params);
        setAllBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error loading books:', error);
      setAllBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [selectedCategory, selectedCondition, priceRange, searchQuery, bestsellersParam, categoryParam]);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      // Reset to 'all' when no category parameter in URL
      setSelectedCategory('all');
    }
  }, [categoryParam]);

  const categories = [...new Set(allBooks.map(b => b.category))];

  let filteredBooks = allBooks.filter(book => {
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    const matchesCondition = selectedCondition === 'all' || book.condition === selectedCondition;
    const matchesPrice = book.price >= priceRange[0] && book.price <= priceRange[1];
    const matchesSearch = !searchQuery || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery);
    const matchesSeller = !sellerParam || book.sellerId === sellerParam;

    return matchesCategory && matchesCondition && matchesPrice && matchesSearch && matchesSeller;
  });

  filteredBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'discount': return ((b.mrp - b.price) / b.mrp) - ((a.mrp - a.price) / a.mrp);
      case 'delivery': return a.deliveryDays - b.deliveryDays;
      default: return b.reviewCount - a.reviewCount;
    }
  });

  const handleAddToCart = (book: Book, quantity: number) => {
    onAddToCart(book, quantity);
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <Navbar user={user} wishlist={wishlist} notifications={notifications} onLogout={logout} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link 
          to="/"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#3D2817] border border-[#8B6F47] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-white transition-all shadow-sm hover:shadow-md mb-6"
        >
          <ArrowLeft className="size-5" />
        </Link>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-[#3D2817] rounded-lg p-5 shadow-xl border-2 border-[#8B6F47] lg:sticky lg:top-24">
                <div className="flex items-center justify-between mb-5 pb-5 border-b-2 border-[#8B6F47]">
                  <h3 className="font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>Filters</h3>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden p-1 hover:bg-[#4D3827] rounded transition-colors"
                  >
                    <X className="size-4 text-[#F5E6D3]" />
                  </button>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-[#F5E6D3] text-sm">Category</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === 'all'}
                        onChange={() => setSelectedCategory('all')}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-sm text-[#D4C5AA] group-hover:text-[#D4AF37] transition-colors">All Categories</span>
                    </label>
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === cat}
                          onChange={() => setSelectedCategory(cat)}
                          className="w-4 h-4 accent-[#D4AF37]"
                        />
                        <span className="text-sm text-[#D4C5AA] group-hover:text-[#D4AF37] transition-colors">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Condition Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-[#F5E6D3] text-sm">Condition</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        checked={selectedCondition === 'all'}
                        onChange={() => setSelectedCondition('all')}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-sm text-[#D4C5AA] group-hover:text-[#D4AF37] transition-colors">All Conditions</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        checked={selectedCondition === 'new'}
                        onChange={() => setSelectedCondition('new')}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-sm text-[#D4C5AA] group-hover:text-[#D4AF37] transition-colors">New</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        checked={selectedCondition === 'like-new'}
                        onChange={() => setSelectedCondition('like-new')}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-sm text-[#D4C5AA] group-hover:text-[#D4AF37] transition-colors">Like New</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        checked={selectedCondition === 'used'}
                        onChange={() => setSelectedCondition('used')}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-sm text-[#D4C5AA] group-hover:text-[#D4AF37] transition-colors">Used</span>
                    </label>
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-[#F5E6D3] text-sm">Price Range</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        checked={priceRange[0] === 0 && priceRange[1] === 2000}
                        onChange={() => setPriceRange([0, 2000])}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-sm text-[#D4C5AA] group-hover:text-[#D4AF37] transition-colors">All Prices</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        checked={priceRange[0] === 0 && priceRange[1] === 300}
                        onChange={() => setPriceRange([0, 300])}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-sm text-[#D4C5AA] group-hover:text-[#D4AF37] transition-colors">Under ₹300</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        checked={priceRange[0] === 300 && priceRange[1] === 500}
                        onChange={() => setPriceRange([300, 500])}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-sm text-[#D4C5AA] group-hover:text-[#D4AF37] transition-colors">₹300 - ₹500</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        checked={priceRange[0] === 500 && priceRange[1] === 2000}
                        onChange={() => setPriceRange([500, 2000])}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-sm text-[#D4C5AA] group-hover:text-[#D4AF37] transition-colors">Above ₹500</span>
                    </label>
                  </div>
                </div>

                {/* Clear Filters */}
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedCondition('all');
                    setPriceRange([0, 2000]);
                  }}
                  className="w-full bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-2 rounded-md transition-all shadow-md text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="bg-[#3D2817] rounded-lg p-4 mb-6 shadow-lg border-2 border-[#8B6F47]">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-bold text-[#F5E6D3]">
                    {filteredBooks.length} {filteredBooks.length === 1 ? 'Book' : 'Books'}
                  </p>
                  {searchQuery && (
                    <p className="text-sm text-[#D4C5AA] mt-0.5">
                      for "{searchQuery}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {!showFilters && (
                    <button
                      onClick={() => setShowFilters(true)}
                      className="bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all"
                    >
                      <SlidersHorizontal className="size-4" />
                      Filters
                    </button>
                  )}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm text-[#F5E6D3]"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Rating</option>
                    <option value="discount">Discount</option>
                    <option value="delivery">Fastest Delivery</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-[#3D2817] rounded-lg p-4 animate-pulse">
                    <div className="bg-[#8B6F47] h-48 rounded mb-4"></div>
                    <div className="bg-[#8B6F47] h-4 rounded mb-2"></div>
                    <div className="bg-[#8B6F47] h-4 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredBooks.map(book => (
                  <ProductCard 
                    key={(book as any)._id || book.id} 
                    book={book} 
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={wishlist.includes((book as any)._id || book.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[#3D2817] rounded-lg p-12 text-center shadow-xl border-2 border-[#8B6F47]">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-[#F5E6D3] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>No Books Found</h3>
                <p className="text-[#D4C5AA] mb-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedCondition('all');
                    setPriceRange([0, 2000]);
                  }}
                  className="bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold px-6 py-2 rounded-md transition-all shadow-md"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}