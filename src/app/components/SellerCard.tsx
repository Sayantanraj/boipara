import { Link } from 'react-router-dom';
import { Store, Star, BookOpen, MapPin, Award } from 'lucide-react';
import type { Seller } from '../types';

interface SellerCardProps {
  seller: Seller;
}

export function SellerCard({ seller }: SellerCardProps) {
  return (
    <Link
      to={`/browse?seller=${seller.id}`}
      className="block bg-[#3D2817] rounded-lg p-4 border-2 border-[#8B6F47] hover:border-[#D4AF37] hover:shadow-xl transition-all duration-300"
    >
      <div className="flex flex-col gap-3">
        {/* Header with Icon and Store Name */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#8B6F47] to-[#6B5537] p-2.5 rounded-lg shadow-lg flex-shrink-0">
            <Store className="size-6 text-[#F5E6D3]" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#F5E6D3] mb-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {seller.storeName}
            </h3>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 bg-[#2C1810] text-[#D4AF37] text-xs px-2 py-0.5 rounded">
                <Star className="size-3 fill-[#D4AF37]" />
                <span className="font-bold">{seller.rating}</span>
              </div>
              {seller.yearsInBusiness >= 30 && (
                <div className="bg-[#D4AF37] text-[#2C1810] text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                  <Award className="size-3" />
                  Legacy
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-[#D4C5AA]">
            <MapPin className="size-3.5 text-[#D4AF37] flex-shrink-0" />
            <span>{seller.location}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#D4C5AA]">
            <BookOpen className="size-3.5 text-[#D4AF37] flex-shrink-0" />
            <span>{seller.totalBooks.toLocaleString()} books available</span>
          </div>

          <div className="pt-1.5 border-t border-[#8B6F47]">
            <div className="inline-flex items-center gap-1.5 bg-emerald-900/40 text-emerald-300 px-2.5 py-1 rounded font-semibold border border-emerald-700/50 text-xs">
              <Award className="size-3.5" />
              {seller.yearsInBusiness}+ Years in College Street
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}