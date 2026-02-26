import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

interface Suggestion {
  _id: string;
  title: string;
  author: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load search history and popular searches on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load from localStorage first for immediate display
        const localHistory = localStorage.getItem(`searchHistory_${userId}`);
        if (localHistory) {
          setSearchHistory(JSON.parse(localHistory));
        }

        // Then fetch from backend
        const [history, popular] = await Promise.all([
          userId ? apiService.getSearchHistory(userId).catch(() => []) : Promise.resolve([]),
          apiService.getPopularSearches().catch(() => ['Engineering', 'Medical', 'UPSC', 'JEE', 'NEET'])
        ]);
        
        // Use backend data if available, otherwise keep localStorage data
        if (history.length > 0) {
          setSearchHistory(history);
          localStorage.setItem(`searchHistory_${userId}`, JSON.stringify(history));
        }
        setPopularSearches(popular);
      } catch (error) {
        console.error('Error loading search data:', error);
        // Fallback to localStorage
        const localHistory = localStorage.getItem(`searchHistory_${userId}`);
        if (localHistory) {
          setSearchHistory(JSON.parse(localHistory));
        }
        setPopularSearches(['Engineering', 'Medical', 'UPSC', 'JEE', 'NEET']);
      }
    };
    loadData();
  }, [userId]);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(hasInteracted && query.length === 0 && (searchHistory.length > 0 || popularSearches.length > 0));
      return;
    }

    setLoading(true);
    clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await apiService.getSearchSuggestions(query);
        setSuggestions(results);
        setShowDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, searchHistory.length, popularSearches.length]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Update local state and localStorage immediately
    const newHistory = (() => {
      const filtered = searchHistory.filter(q => q.toLowerCase() !== searchQuery.toLowerCase());
      return [searchQuery, ...filtered].slice(0, 10);
    })();
    setSearchHistory(newHistory);
    
    // Save to localStorage
    if (userId) {
      localStorage.setItem(`searchHistory_${userId}`, JSON.stringify(newHistory));
      
      // Also save to backend (non-blocking)
      apiService.saveSearchHistory(userId, searchQuery).catch(err => 
        console.error('Error saving search history to backend:', err)
      );
    }
    
    navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
    setShowDropdown(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const totalItems = suggestions.length || searchHistory.length + popularSearches.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && selectedIndex >= 0) {
        const selectedBook = suggestions[selectedIndex];
        
        // Save book title to search history
        const newHistory = (() => {
          const filtered = searchHistory.filter(q => q.toLowerCase() !== selectedBook.title.toLowerCase());
          return [selectedBook.title, ...filtered].slice(0, 10);
        })();
        setSearchHistory(newHistory);
        
        if (userId) {
          localStorage.setItem(`searchHistory_${userId}`, JSON.stringify(newHistory));
          apiService.saveSearchHistory(userId, selectedBook.title).catch(err => 
            console.error('Error saving search history:', err)
          );
        }
        
        navigate(`/product/${selectedBook._id}`);
        setShowDropdown(false);
        setQuery('');
      } else if (selectedIndex >= 0) {
        const allQueries = [...searchHistory, ...popularSearches];
        handleSearch(allQueries[selectedIndex]);
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-2xl">
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { setHasInteracted(true); setShowDropdown(query.length === 0 && (searchHistory.length > 0 || popularSearches.length > 0)); }}
          placeholder="Search books, authors, ISBN..."
          className="w-full px-4 py-2 pl-10 pr-10 bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[#A08968]" />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A08968] hover:text-[#D4AF37]"
          >
            <X className="size-5" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute top-full mt-2 w-full bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-[#A08968]">Loading...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((item, idx) => (
              <button
                key={item._id}
                onClick={() => {
                  // Save book title to search history
                  const newHistory = (() => {
                    const filtered = searchHistory.filter(q => q.toLowerCase() !== item.title.toLowerCase());
                    return [item.title, ...filtered].slice(0, 10);
                  })();
                  setSearchHistory(newHistory);
                  
                  if (userId) {
                    localStorage.setItem(`searchHistory_${userId}`, JSON.stringify(newHistory));
                    apiService.saveSearchHistory(userId, item.title).catch(err => 
                      console.error('Error saving search history:', err)
                    );
                  }
                  
                  navigate(`/product/${item._id}`);
                  setShowDropdown(false);
                  setQuery('');
                }}
                className={`w-full p-2 flex items-center gap-2 hover:bg-[#3D2817] transition-colors border-b border-[#8B6F47] last:border-b-0 ${
                  idx === selectedIndex ? 'bg-[#3D2817]' : ''
                }`}
              >
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.title} className="w-8 h-10 object-cover rounded" />
                )}
                <div className="flex-1 text-left">
                  <p className="text-[#F5E6D3] font-semibold text-sm">{item.title}</p>
                  <p className="text-[#A08968] text-xs">{item.author} • ₹{item.price}</p>
                </div>
              </button>
            ))
          ) : (
            <>
              {searchHistory.length > 0 && (
                <div>
                  <div className="px-3 py-2 flex items-center gap-2 border-b border-[#8B6F47]">
                    <Clock className="size-4 text-[#D4AF37]" />
                    <span className="text-xs font-semibold text-[#D4AF37]">Recent Searches</span>
                  </div>
                  {searchHistory.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(item)}
                      className={`w-full px-4 py-2 text-left hover:bg-[#3D2817] transition-colors border-b border-[#8B6F47]/30 ${
                        idx === selectedIndex ? 'bg-[#3D2817]' : ''
                      }`}
                    >
                      <p className="text-[#F5E6D3] text-sm">{item}</p>
                    </button>
                  ))}
                </div>
              )}
              {popularSearches.length > 0 && (
                <div>
                  <div className="px-3 py-2 flex items-center gap-2 border-b border-[#8B6F47]">
                    <TrendingUp className="size-4 text-[#D4AF37]" />
                    <span className="text-xs font-semibold text-[#D4AF37]">Popular Searches</span>
                  </div>
                  {popularSearches.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(item)}
                      className={`w-full px-4 py-2 text-left hover:bg-[#3D2817] transition-colors border-b border-[#8B6F47]/30 last:border-b-0 ${
                        idx + searchHistory.length === selectedIndex ? 'bg-[#3D2817]' : ''
                      }`}
                    >
                      <p className="text-[#F5E6D3] text-sm capitalize">{item}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
