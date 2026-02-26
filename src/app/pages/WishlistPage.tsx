import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { apiService } from '../../services/api';
import type { Book } from '../types';
import { toast } from 'sonner';

export function WishlistPage() {
  const { user, logout, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.error('Error parsing wishlist:', error);
        setWishlist([]);
      }
    } else {
      setWishlist([]);
    }
  }, [user?.id]);

  // Load books from API
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
    loadBooks();
  }, []);

  // Save wishlist to localStorage
  useEffect(() => {
    if (user && wishlist.length >= 0) {
      const wishlistKey = `wishlist_${user.id}`;
      localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    }
  }, [wishlist, user?.id]);

  const wishlistBooks = books.filter(book => 
    wishlist.includes((book as any)._id || book.id)
  );

  const handleAddToCart = (book: Book, quantity: number) => {
    addToCart(book, quantity);
  };

  const handleToggleWishlist = (bookId: string) => {
    setWishlist(prev => {
      if (prev.includes(bookId)) {
        toast.success('Removed from wishlist');
        return prev.filter(id => id !== bookId);
      } else {
        toast.success('Added to wishlist!');
        return [...prev, bookId];
      }
    });
  };

  const handleMoveAllToCart = () => {
    const availableBooks = wishlistBooks.filter(book => book.stock > 0);
    availableBooks.forEach(book => {
      addToCart(book, 1);
    });
    toast.success(`Added ${availableBooks.length} books to cart!`);
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <Navbar user={user} onLogout={logout} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 border-b-2 border-[#8B6F47]">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2C1810] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              My Wishlist
            </h1>
            <p className="text-[#6B5537]">{wishlistBooks.length} {wishlistBooks.length === 1 ? 'book' : 'books'} saved</p>
          </div>
          {wishlistBooks.length > 0 && (
            <button
              onClick={handleMoveAllToCart}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold px-6 py-3 rounded-md transition-all shadow-lg"
            >
              <ShoppingBag className="size-5" />
              Add All to Cart
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#3D2817] rounded-lg p-4 animate-pulse">
                <div className="bg-[#8B6F47] h-48 rounded mb-4"></div>
                <div className="bg-[#8B6F47] h-4 rounded mb-2"></div>
                <div className="bg-[#8B6F47] h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : wishlistBooks.length === 0 ? (
          <div className="bg-[#3D2817] rounded-lg p-12 sm:p-16 text-center border-2 border-[#8B6F47] shadow-xl">
            <Heart className="size-16 sm:size-20 text-[#8B6F47] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F5E6D3] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Wishlist is Empty
            </h2>
            <p className="text-[#D4C5AA] mb-6">Save books you love for later</p>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold px-6 sm:px-8 py-3 rounded-md transition-all shadow-lg"
            >
              Discover Books
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile: Add All to Cart */}
            <div className="sm:hidden mb-6">
              <button
                onClick={handleMoveAllToCart}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold px-6 py-3 rounded-md transition-all shadow-lg"
              >
                <ShoppingBag className="size-5" />
                Add All to Cart
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {wishlistBooks.map(book => (
                <ProductCard
                  key={(book as any)._id || book.id}
                  book={book}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlisted={true}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}