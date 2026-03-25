import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { apiService } from '../../services/api';
import { ArrowRight, Shield, RefreshCw, Truck, Award, BookOpen, Sparkles } from 'lucide-react';
import type { Book } from '../types';
import { quickCategories } from '../data/mockData';

// Ultra-lightweight image component
const FastImage = memo(({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
      onLoad={() => setLoaded(true)}
      loading="lazy"
      decoding="async"
    />
  );
});

// Minimal navbar for speed
const FastNavbar = memo(() => (
  <nav className="bg-[#2C1810] border-b-2 border-[#8B6F47] sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="text-2xl font-bold text-[#D4AF37]">BOI PARA</Link>
      <div className="flex items-center gap-4">
        <Link to="/browse" className="text-[#F5E6D3] hover:text-[#D4AF37] transition-colors">Browse</Link>
        <Link to="/login" className="bg-[#D4AF37] text-[#2C1810] px-4 py-2 rounded font-bold">Login</Link>
      </div>
    </div>
  </nav>
));

// Minimal product card
const FastProductCard = memo(({ book }: { book: Book }) => (
  <Link to={`/product/${(book as any)._id || book.id}`} className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div className="aspect-[3/4] bg-gray-200 rounded-t-lg overflow-hidden">
      <FastImage
        src={book.image || '/placeholder-book.jpg'}
        alt={book.title}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="p-3">
      <h3 className="font-bold text-sm text-[#2C1810] line-clamp-2 mb-1">{book.title}</h3>
      <p className="text-xs text-[#6B5537] mb-2">{book.author}</p>
      <p className="text-lg font-bold text-[#8B6F47]">₹{book.price}</p>
    </div>
  </Link>
));

export function HomePage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Ultra-fast data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        const [booksData] = await Promise.all([
          apiService.getBooks().catch(() => ({ books: [] }))
        ]);
        setBooks(booksData.books?.slice(0, 12) || []); // Only load first 12 books
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Memoized sections
  const bookSections = useMemo(() => {
    const featured = books.filter(b => b.featured).slice(0, 6);
    const academic = books.filter(b => b.category === 'Academic').slice(0, 6);
    return { featured, academic };
  }, [books]);

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <FastNavbar />

      {/* Ultra-fast hero section */}
      <div className="bg-[#2C1810] py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="mb-4">
            <span className="bg-[#D4AF37] text-[#2C1810] px-4 py-2 rounded font-bold text-sm">
              Welcome to BOI PARA
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-[#F5E6D3]">
            From College Street
            <br />
            <span className="text-[#D4AF37]">to Your Doorstep</span>
          </h1>
          <p className="text-xl mb-8 text-[#D4C5AA]">
            Authentic books from trusted Kolkata sellers
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8941F] text-[#2C1810] font-bold px-8 py-4 rounded-md transition-colors"
          >
            Explore Books
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>

      {/* Quick categories - minimal */}
      <div className="bg-white py-6 border-b-2 border-[#8B6F47]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {quickCategories.slice(0, 6).map(cat => {
              const IconComponent = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/browse?category=${cat.name}`}
                  className="bg-[#2C1810] hover:bg-[#8B6F47] border border-[#8B6F47] rounded-lg p-4 text-center transition-colors"
                >
                  <IconComponent className="size-6 text-[#D4AF37] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#F5E6D3]">{cat.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Books */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#2C1810]">Featured Books</h2>
            <Link to="/browse" className="text-[#8B6F47] hover:text-[#D4AF37] font-semibold">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {bookSections.featured.map(book => (
                <FastProductCard key={(book as any)._id || book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        {/* Academic Books */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#2C1810]">Academic Books</h2>
            <Link to="/browse?category=Academic" className="text-[#8B6F47] hover:text-[#D4AF37] font-semibold">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {bookSections.academic.map(book => (
              <FastProductCard key={(book as any)._id || book.id} book={book} />
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <Link to="/buyback" className="bg-emerald-900 hover:bg-emerald-800 rounded-lg p-6 text-white transition-colors">
            <div className="flex items-center gap-4">
              <RefreshCw className="size-8" />
              <div>
                <h3 className="text-xl font-bold">Sell Your Books</h3>
                <p className="text-emerald-200">Get instant cash</p>
              </div>
            </div>
          </Link>
          <div className="bg-[#2C1810] rounded-lg p-6 text-[#F5E6D3]">
            <div className="flex items-center gap-4">
              <Award className="size-8 text-[#D4AF37]" />
              <div>
                <h3 className="text-xl font-bold">Premium Collection</h3>
                <p className="text-[#D4C5AA]">Rare & vintage books</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Minimal footer */}
      <footer className="bg-[#2C1810] text-[#F5E6D3] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 BOI PARA. All rights reserved.</p>
          <p className="mt-2 text-[#D4AF37] italic">"From College Street to Your Doorstep"</p>
        </div>
      </footer>
    </div>
  );
}