import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: {
    title: string;
    author: string;
    price: number;
    image: string;
    description: string;
    id?: string;
    _id?: string;
  };
}

export function ShareModal({ isOpen, onClose, book }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const bookId = book._id || book.id;
  const productUrl = `${window.location.origin}/product/${bookId}`;
  const shareText = `Check out "${book.title}" by ${book.author} - ₹${book.price}`;
  const shortDesc = book.description.length > 100 ? book.description.substring(0, 100) + '...' : book.description;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + productUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`,
    email: `mailto:?subject=${encodeURIComponent(book.title)}&body=${encodeURIComponent(shareText + '\n\n' + productUrl)}`
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gradient-to-br from-[#3D2817] to-[#2C1810] rounded-2xl max-w-md w-full border-2 border-[#8B6F47] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-[#8B6F47]">
          <h2 className="text-xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Share this Book
          </h2>
          <button
            onClick={onClose}
            className="text-[#D4AF37] hover:text-[#FFD700] transition-colors p-1 hover:bg-[#2C1810] rounded-lg"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Product Preview */}
          <div className="flex gap-4 bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
            <img
              src={book.image}
              alt={book.title}
              className="w-20 h-28 object-cover rounded-lg shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#F5E6D3] text-sm mb-1 line-clamp-2">{book.title}</h3>
              <p className="text-[#D4C5AA] text-xs mb-2">by {book.author}</p>
              <p className="text-[#D4AF37] font-bold text-lg">₹{book.price}</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#2C1810] rounded-lg p-3 border border-[#8B6F47]">
            <p className="text-[#D4C5AA] text-xs leading-relaxed">{shortDesc}</p>
          </div>

          {/* Copy Link */}
          <div className="bg-[#2C1810] rounded-lg p-3 border border-[#8B6F47]">
            <label className="text-[#D4AF37] text-xs font-semibold mb-2 block">Product Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={productUrl}
                readOnly
                className="flex-1 bg-[#3D2817] text-[#F5E6D3] text-xs px-3 py-2 rounded border border-[#8B6F47] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
              <button
                onClick={handleCopyLink}
                className="bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] px-4 py-2 rounded font-semibold transition-all flex items-center gap-2 text-sm"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <label className="text-[#D4AF37] text-xs font-semibold mb-3 block">Share via</label>
            <div className="grid grid-cols-5 gap-3">
              {/* WhatsApp */}
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-3 bg-[#2C1810] hover:bg-[#25D366] border border-[#8B6F47] hover:border-[#25D366] rounded-lg transition-all group"
              >
                <svg className="size-7 fill-[#25D366] group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="text-[10px] text-[#D4C5AA] group-hover:text-white font-medium">WhatsApp</span>
              </a>

              {/* Facebook */}
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-3 bg-[#2C1810] hover:bg-[#1877F2] border border-[#8B6F47] hover:border-[#1877F2] rounded-lg transition-all group"
              >
                <svg className="size-7 fill-[#1877F2] group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-[10px] text-[#D4C5AA] group-hover:text-white font-medium">Facebook</span>
              </a>

              {/* Twitter/X */}
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-3 bg-[#2C1810] hover:bg-black border border-[#8B6F47] hover:border-black rounded-lg transition-all group"
              >
                <svg className="size-7 fill-[#D4C5AA] group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-[10px] text-[#D4C5AA] group-hover:text-white font-medium">X</span>
              </a>

              {/* Telegram */}
              <a
                href={shareLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-3 bg-[#2C1810] hover:bg-[#0088cc] border border-[#8B6F47] hover:border-[#0088cc] rounded-lg transition-all group"
              >
                <svg className="size-7 fill-[#0088cc] group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-[10px] text-[#D4C5AA] group-hover:text-white font-medium">Telegram</span>
              </a>

              {/* Email */}
              <a
                href={shareLinks.email}
                className="flex flex-col items-center gap-2 p-3 bg-[#2C1810] hover:bg-[#D4AF37] border border-[#8B6F47] hover:border-[#D4AF37] rounded-lg transition-all group"
              >
                <svg className="size-7 fill-[#D4AF37] group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="text-[10px] text-[#D4C5AA] group-hover:text-white font-medium">Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
