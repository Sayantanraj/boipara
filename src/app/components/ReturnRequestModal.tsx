import { X, RotateCcw, AlertCircle, Package, ImageIcon } from 'lucide-react';
import type { Order, ReturnRequest, CartItem, User } from '../types';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiService } from '../../services/api';

interface ReturnRequestModalProps {
  order: Order;
  user: User | null;
  onClose: () => void;
  onSubmit: () => void;
}

export function ReturnRequestModal({ order, user, onClose, onSubmit }: ReturnRequestModalProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>(order.items.map(item => item.bookId));
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');

  const reasons = [
    'Product damaged or defective',
    'Wrong item received',
    'Item not as described',
    'Book condition not matching listing',
    'Missing pages or content',
    'Quality issues',
    'Other'
  ];

  const toggleItemSelection = (bookId: string) => {
    setSelectedItems(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    if (!returnReason) {
      toast.error('Please select a return reason');
      return;
    }

    if (!returnDescription.trim()) {
      toast.error('Please provide a detailed description');
      return;
    }

    try {
      // Get items to return
      const itemsToReturn = order.items.filter(item => selectedItems.includes(item.bookId));

      // Group items by seller
      const itemsBySeller = itemsToReturn.reduce((acc, item) => {
        const sellerId = item.book.sellerId;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      // Create return requests for each seller
      const sellers = [...new Set(itemsToReturn.map(item => item.book.sellerId))];
      
      for (const sellerId of sellers) {
        const sellerItems = itemsToReturn.filter(item => item.book.sellerId === sellerId);
        const sellerName = sellerItems[0].book.sellerName;

        const returnRequestData = {
          orderId: order.id,
          sellerId: sellerId,
          sellerName: sellerName,
          items: sellerItems,
          reason: returnReason,
          description: returnDescription,
        };

        await apiService.createReturnRequest(returnRequestData);
      }

      toast.success('Return request submitted successfully! Admin will review your request shortly.');
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting return request:', error);
      toast.error('Failed to submit return request. Please try again.');
    }
  };

  const selectedTotal = order.items
    .filter(item => selectedItems.includes(item.bookId))
    .reduce((sum, item) => sum + item.book.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#3D2817] rounded-lg border-2 border-[#8B6F47] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#D4AF37] flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                <RotateCcw className="size-6" />
                Request Return
              </h2>
              <p className="text-sm text-[#D4C5AA] mt-1">Order {order.id}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-[#D4C5AA] hover:text-[#D4AF37] transition-colors"
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="size-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-semibold mb-1">Return Policy</p>
                <p>Your return request will be reviewed by our admin team first. Once approved, it will be forwarded to the respective seller for processing. Returns are accepted within 7 days of delivery.</p>
              </div>
            </div>
          </div>

          {/* Select Items */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
              <Package className="size-5" />
              Select Items to Return
            </h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => {
                const book = item.book;
                const isSelected = selectedItems.includes(item.bookId);

                return (
                  <div 
                    key={item.bookId || idx}
                    onClick={() => toggleItemSelection(item.bookId)}
                    className={`bg-[#2C1810] rounded-lg p-4 border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-[#D4AF37] shadow-lg' 
                        : 'border-[#8B6F47] hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <div className="flex gap-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleItemSelection(item.bookId)}
                        className="mt-1 size-5 accent-[#D4AF37] cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <img 
                        src={book.image} 
                        alt={book.title} 
                        className="w-16 h-20 object-cover rounded border border-[#8B6F47]" 
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-[#F5E6D3] mb-1">{book.title}</h4>
                        <p className="text-sm text-[#D4C5AA] mb-2">by {book.author}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-[#D4C5AA]">Quantity: {item.quantity}</p>
                          <p className="font-bold text-[#D4AF37]">₹{book.price * item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-[#2C1810] rounded border border-[#8B6F47]">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#D4C5AA]">{selectedItems.length} item(s) selected</span>
                <span className="font-bold text-[#D4AF37]">Refund Amount: ₹{selectedTotal}</span>
              </div>
            </div>
          </div>

          {/* Return Reason */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
              Reason for Return *
            </label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full px-4 py-3 bg-[#2C1810] border border-[#8B6F47] rounded-md text-[#F5E6D3] focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="">Select a reason</option>
              {reasons.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
              Detailed Description *
            </label>
            <textarea
              value={returnDescription}
              onChange={(e) => setReturnDescription(e.target.value)}
              placeholder="Please provide detailed information about why you're returning this item..."
              rows={4}
              className="w-full px-4 py-3 bg-[#2C1810] border border-[#8B6F47] rounded-md text-[#F5E6D3] placeholder-[#8B6F47] focus:outline-none focus:border-[#D4AF37] resize-none"
            />
            <p className="text-xs text-[#A08968] mt-1">Provide specific details to help us process your return quickly</p>
          </div>

          {/* Image Upload Placeholder */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
              Photos (Optional)
            </label>
            <div className="border-2 border-dashed border-[#8B6F47] rounded-lg p-6 text-center bg-[#2C1810]/50">
              <ImageIcon className="size-10 text-[#8B6F47] mx-auto mb-2" />
              <p className="text-sm text-[#D4C5AA] mb-1">Upload photos of the product</p>
              <p className="text-xs text-[#A08968]">Helps us process your return faster</p>
              <button className="mt-3 px-4 py-2 bg-[#8B6F47] hover:bg-[#D4AF37] text-[#F5E6D3] rounded-md text-sm font-semibold transition-colors">
                Choose Files
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#8B6F47]">
            <button
              onClick={onClose}
              className="flex-1 bg-[#8B6F47] hover:bg-[#6B5537] text-[#F5E6D3] font-bold py-3 rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0 || !returnReason || !returnDescription.trim()}
              className="flex-1 bg-gradient-to-r from-orange-700 to-orange-600 hover:from-orange-600 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-md transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="size-5" />
              Submit Return Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
