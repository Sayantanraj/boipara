import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Heart, MapPin, Clock, Plus, Minus } from 'lucide-react';
import type { Book } from '../types';
import { useState } from 'react';

interface ProductCardProps {
  book: Book;
  onAddToCart?: (book: Book, quantity: number) => void;
  onToggleWishlist?: (bookId: string) => void;
  isWishlisted?: boolean;
}

export function ProductCard({ book, onAddToCart, onToggleWishlist, isWishlisted = false }: ProductCardProps) {
  const discountPercent = Math.round(((book.mrp - book.price) / book.mrp) * 100);
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const getConditionBadge = () => {
    const badges = {
      'new': { text: 'NEW', color: 'bg-emerald-700 text-white' },
      'like-new': { text: 'LIKE NEW', color: 'bg-blue-700 text-white' },
      'used': { text: 'USED', color: 'bg-orange-700 text-white' },
    };
    return badges[book.condition];
  };

  const conditionBadge = getConditionBadge();

  return (
    <div className="group bg-[#F5E6D3] rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <Link to={`/product/${(book as any)._id || book.id}`} className="flex flex-col flex-1">
        {/* Image - Full book visible */}
        <div className="relative bg-[#F5E6D3] aspect-[3/4] overflow-hidden">
          <div className="relative w-full h-full">
            <img
              src={book.image}
              alt={book.title}
              className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Condition Badge - On image */}
            <div className={`absolute top-1 left-1 ${conditionBadge.color} text-[9px] px-1.5 py-0.5 rounded font-bold shadow-lg z-10`}>
              {conditionBadge.text}
            </div>
            
            {/* Discount Badge - On image */}
            {discountPercent > 0 && (
              <div className="absolute top-1 right-1 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-lg z-10">
                {discountPercent}% OFF
              </div>
            )}
          </div>
          
          {/* Bestseller Badge */}
          {book.bestseller && (
            <div className="absolute bottom-1 left-1 bg-[#D4AF37] text-[#2C1810] text-[9px] px-1.5 py-0.5 rounded font-bold shadow-lg flex items-center gap-0.5 z-10">
              <Star className="size-2.5 fill-[#2C1810]" />
              Bestseller
            </div>
          )}

          {/* Wishlist Button */}
          {onToggleWishlist && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleWishlist((book as any)._id || book.id);
              }}
              className="absolute top-1 right-1 p-1 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <Heart className={`size-3 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
            </button>
          )}
        </div>

        {/* Details - Compact but readable */}
        <div className="p-2 bg-gradient-to-b from-[#F5E6D3] to-[#EDD9C0] flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-bold text-[#2C1810] line-clamp-2 mb-1 text-xs leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {book.title}
          </h3>

          {/* Author */}
          <p className="text-[10px] text-[#6B5537] mb-1 italic line-clamp-1">
            by {book.author}
          </p>

          {/* Seller Info */}
          <div className="flex items-center gap-1 mb-1 text-[9px] text-[#6B5537]">
            <MapPin className="size-2.5" />
            <span className="line-clamp-1">{book.sellerName}</span>
          </div>

          {/* Rating & Delivery */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-0.5 bg-[#2C1810] text-[#D4AF37] text-[9px] px-1.5 py-0.5 rounded shadow">
              <Star className="size-2.5 fill-[#D4AF37]" />
              <span className="font-bold">{book.rating > 0 ? book.rating.toFixed(1) : '4.5'}</span>
              <span className="text-[#A08968]">({book.reviewCount > 0 ? book.reviewCount : 'New'})</span>
            </div>
            <div className="flex items-center gap-0.5 text-[9px] text-emerald-700 font-semibold">
              <Clock className="size-2.5" />
              <span>{book.deliveryDays}d</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-1 mt-auto">
            <div className="flex flex-col">
              <span className="text-base font-bold text-[#2C1810]">
                ₹{book.price * quantity}
              </span>
              {quantity > 1 && (
                <span className="text-[8px] text-[#6B5537]">
                  ₹{book.price} × {quantity}
                </span>
              )}
            </div>
            {book.mrp > book.price && (
              <span className="text-[10px] text-gray-500 line-through">₹{book.mrp * quantity}</span>
            )}
          </div>

          {/* Stock Info & Quantity - Same Line */}
          {book.stock > 0 ? (
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-emerald-700 font-semibold">
                ✓ {book.stock < 10 ? `Only ${book.stock} left` : 'In Stock'}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-[#6B5537] font-semibold">Qty:</span>
                <div className="flex items-center gap-0.5 bg-[#3D2817] rounded border border-[#8B6F47]">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (quantity > 1) setQuantity(quantity - 1);
                    }}
                    className="p-0.5 hover:bg-[#8B6F47] transition-colors rounded-l disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1}
                  >
                    <Minus className="size-2.5 text-[#D4AF37]" />
                  </button>
                  <span className="text-[10px] font-bold text-[#F5E6D3] min-w-[14px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (quantity < book.stock) setQuantity(quantity + 1);
                    }}
                    className="p-0.5 hover:bg-[#8B6F47] transition-colors rounded-r disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity >= book.stock}
                  >
                    <Plus className="size-2.5 text-[#D4AF37]" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[9px] text-red-700 font-semibold mb-1">✗ Out of Stock</p>
          )}
        </div>
      </Link>

      {/* Add to Cart Button - Compact */}
      {onAddToCart && book.stock > 0 && (
        <div className="px-2 pb-2 bg-gradient-to-b from-[#EDD9C0] to-[#F5E6D3]">
          <div className="flex gap-1.5">
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(book, quantity);
              }}
              className="flex-1 bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#6B5537] hover:to-[#8B6F47] text-[#F5E6D3] font-bold py-1.5 rounded-md transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-1 border border-[#2C1810]/20 text-[10px]"
            >
              <ShoppingBag className="size-3" />
              Add to Cart
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Store book with quantity for direct checkout without adding to cart
                const buyNowItem = { ...book, quantity };
                localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
                navigate('/checkout');
              }}
              className="flex-1 bg-[#F4C430] hover:bg-[#FFD700] text-[#2C1810] font-bold py-1.5 rounded-md transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-1 border border-[#2C1810]/20 text-[10px]"
            >
              <ShoppingBag className="size-3" />
              Buy Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}