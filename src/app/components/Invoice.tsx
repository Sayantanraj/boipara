import { X, Download, BookOpen, MapPin, Phone, Mail } from 'lucide-react';
import type { Order, User } from '../types';
import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceProps {
  order: Order;
  user: User | null;
  onClose: () => void;
  adminUser?: User | null;
}

export function Invoice({ order, user, onClose, adminUser }: InvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const generateInvoiceNumber = (orderId: string) => {
    return `INV-${orderId.toUpperCase()}`;
  };

  const subtotal = order.items.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
  const gstRate = 0.12; // 12% GST on books
  const gstAmount = subtotal * gstRate;
  const total = subtotal + gstAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    // Make element visible for rendering
    printContent.style.display = 'block';
    printContent.style.position = 'fixed';
    printContent.style.top = '-9999px';
    printContent.style.left = '0';
    printContent.style.zIndex = '-9999';

    // Wait for render then generate PDF
    setTimeout(() => {
      html2canvas(printContent, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        removeContainer: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Find the cloned invoice element
          const clonedElement = clonedDoc.querySelector('[data-invoice-pdf]') as HTMLElement;
          if (!clonedElement) return;
          
          // Ensure all elements are visible
          clonedElement.style.display = 'block';
          clonedElement.style.visibility = 'visible';
          
          // Override all OKLCH colors in the cloned document
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach((el: Element) => {
            if (el instanceof HTMLElement) {
              // Ensure visibility
              el.style.visibility = 'visible';
              el.style.opacity = '1';
              
              // Special handling for white text elements (like TAX INVOICE badge)
              if (el.hasAttribute('data-white-text')) {
                el.style.color = '#FFFFFF';
                el.style.setProperty('color', '#FFFFFF', 'important');
                return; // Skip other color processing for this element
              }
              
              // Force standard colors on all elements
              const computedStyle = window.getComputedStyle(el);
              
              // Check and override if color contains oklch
              if (computedStyle.color && computedStyle.color.includes('oklch')) {
                el.style.color = '#000000';
              }
              if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
                el.style.backgroundColor = '#ffffff';
              }
              if (computedStyle.borderColor && computedStyle.borderColor.includes('oklch')) {
                el.style.borderColor = '#000000';
              }
            }
          });
        }
      }).then(canvas => {
        // Hide element immediately after capture
        printContent.style.display = 'none';
        printContent.style.position = '';
        printContent.style.top = '';
        printContent.style.left = '';
        printContent.style.zIndex = '';

        // Convert to JPEG with compression for smaller file size
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
        
        // Calculate dimensions with margins (12mm on all sides)
        const marginX = 12;
        const marginY = 12;
        const contentWidth = pdfWidth - (marginX * 2); // 186mm
        const contentHeight = pdfHeight - (marginY * 2); // 273mm
        
        // Calculate aspect ratio to prevent stretching
        const canvasAspectRatio = canvas.width / canvas.height;
        const contentAspectRatio = contentWidth / contentHeight;
        
        let finalWidth = contentWidth;
        let finalHeight = contentHeight;
        let offsetX = marginX;
        let offsetY = marginY;
        
        // Adjust dimensions to maintain aspect ratio
        if (canvasAspectRatio > contentAspectRatio) {
          // Canvas is wider - fit to width
          finalHeight = contentWidth / canvasAspectRatio;
          offsetY = marginY + (contentHeight - finalHeight) / 2;
        } else {
          // Canvas is taller - fit to height
          finalWidth = contentHeight * canvasAspectRatio;
          offsetX = marginX + (contentWidth - finalWidth) / 2;
        }

        // Add image with proper scaling and centering (using JPEG format)
        pdf.addImage(imgData, 'JPEG', offsetX, offsetY, finalWidth, finalHeight, undefined, 'FAST');

        pdf.save(`Invoice_${generateInvoiceNumber(order.id)}.pdf`);
      }).catch((error) => {
        console.error('PDF generation error:', error);
        // Hide element on error
        printContent.style.display = 'none';
        printContent.style.position = '';
        printContent.style.top = '';
        printContent.style.left = '';
        printContent.style.zIndex = '';
      });
    }, 300);
  };

  return (
    <>
      {/* Modal Overlay - Hidden in print */}
      <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto print:hidden">
        <div className="min-h-screen flex items-center justify-center p-4 py-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
            {/* Header Actions */}
            <div className="flex items-center justify-between p-4 border-b-2 border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Tax Invoice</h2>
                <p className="text-xs text-gray-500 mt-1">Click download to generate and save the invoice as a PDF file</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md font-semibold"
                >
                  <Download className="size-5" />
                  Download PDF
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="size-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Invoice Content - Preview */}
            <div className="p-8">
              {/* Company Header with Logo */}
              <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-[#8B6F47]">
                <div>
                  {/* BOI PARA Logo */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-gradient-to-br from-[#8B6F47] to-[#6B5537] p-2.5 rounded-lg shadow-lg">
                        <BookOpen className="size-6 text-[#F5E6D3]" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold text-[#2C1810] leading-none" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '0.02em' }}>
                          BOI PARA
                        </h1>
                        <p className="text-xs text-[#8B6F47] font-semibold tracking-wide mt-0.5">FROM COLLEGE STREET TO YOUR DOORSTEP</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      {adminUser?.storeAddress || adminUser?.location || 'College Street, Kolkata - 700073, West Bengal'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="size-4" />
                      {adminUser?.phone || '+91 8101637164'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="size-4" />
                      {adminUser?.supportEmail || 'reachsupport@boipara.com'}
                    </p>
                    <p className="font-semibold mt-2">GSTIN: {adminUser?.gst || '19XXXXX1234X1ZX'}</p>
                    {adminUser?.gtin && (
                      <p className="text-xs mt-1">GTIN: {adminUser.gtin}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-[#8B6F47] text-white px-4 py-2 rounded-md mb-3">
                    <p className="text-sm font-bold tracking-wide m-0">TAX INVOICE</p>
                  </div>
                  <p className="text-sm text-gray-600">Invoice No:</p>
                  <p className="text-lg font-bold text-[#2C1810] mb-2">{generateInvoiceNumber(order.id)}</p>
                  <p className="text-sm text-gray-600">Order ID:</p>
                  <p className="font-semibold text-gray-800 mb-2">{order.id}</p>
                  <p className="text-sm text-gray-600">Date:</p>
                  <p className="font-semibold text-gray-800">{order.date}</p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-8 relative">
                <div className="flex items-center justify-between mb-3 border-b border-gray-300 pb-2">
                  <h3 className="text-lg font-bold text-[#2C1810]">
                    Bill To:
                  </h3>
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-bold text-gray-800">{user?.name || order.customerName || 'Customer'}</p>
                  <p className="text-gray-700">{order.shippingAddress}</p>
                  {user?.email && <p className="text-gray-600">Email: {user.email}</p>}
                  {user?.phone && <p className="text-gray-600">Phone: {user.phone}</p>}
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#8B6F47] text-white">
                      <th className="text-left py-3 px-4 font-semibold">S.No</th>
                      <th className="text-left py-3 px-4 font-semibold">Book Details</th>
                      <th className="text-center py-3 px-4 font-semibold">Qty</th>
                      <th className="text-right py-3 px-4 font-semibold">Unit Price</th>
                      <th className="text-right py-3 px-4 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={item.bookId} className="border-b border-gray-200">
                        <td className="py-4 px-4 text-gray-700">{index + 1}</td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-gray-800">{item.book.title}</p>
                          <p className="text-sm text-gray-600">by {item.book.author}</p>
                          <p className="text-xs text-gray-500">ISBN: {item.book.isbn}</p>
                          <p className="text-xs text-[#8B6F47]">Condition: {item.book.condition.charAt(0).toUpperCase() + item.book.condition.slice(1)}</p>
                          {item.book.sellerName && (
                            <p className="text-xs text-gray-500">Seller: {item.book.sellerName}</p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700">{item.quantity}</td>
                        <td className="py-4 px-4 text-right text-gray-700">₹{item.book.price.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right font-semibold text-gray-800">
                          ₹{(item.book.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-80">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Shipping Charges:</span>
                      <span className="font-semibold text-emerald-600">FREE</span>
                    </div>
                    <div className="flex justify-between py-2 border-t border-gray-300">
                      <span className="text-gray-600">GST (12%):</span>
                      <span className="font-semibold text-gray-800">₹{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-[#8B6F47] bg-[#F5E6D3] px-4 -mx-4 rounded">
                      <span className="font-bold text-[#2C1810] text-lg">Grand Total:</span>
                      <span className="font-bold text-[#8B6F47] text-xl">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-2">Payment Information:</h3>
                <div className="text-sm space-y-1">
                  <p className="text-gray-700">Payment Method: <span className="font-semibold">Cash on Delivery</span></p>
                  <p className="text-gray-700">Payment Status: <span className="font-semibold text-green-600">Paid</span></p>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="border-t-2 border-gray-300 pt-6">
                <h3 className="font-bold text-gray-800 mb-3">Terms & Conditions:</h3>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>This is a computer-generated invoice and does not require a signature.</li>
                  <li>All sales are subject to BOI PARA's standard terms and conditions.</li>
                  <li>Books sold cannot be returned unless defective or damaged upon delivery.</li>
                  <li>For buyback requests, please visit our Sell Books section within 30 days of delivery.</li>
                  <li>For any queries, please contact our customer support at {adminUser?.supportEmail || 'reachsupport@boipara.com'}</li>
                </ul>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center border-t-2 border-gray-300 pt-4">
                <p className="text-sm font-semibold text-[#8B6F47]">
                  Thank you for shopping with BOI PARA!
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Bringing the heritage of College Street book culture to your doorstep
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all shadow-md font-semibold"
                >
                  <X className="size-5" />
                  Close Invoice
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md font-semibold"
                >
                  <Download className="size-5" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Generation Invoice - Hidden, uses standard colors */}
      <div ref={invoiceRef} data-invoice-pdf style={{ 
        display: 'none', 
        all: 'initial',
        backgroundColor: '#ffffff', 
        fontFamily: 'Arial, sans-serif', 
        width: '794px',
        height: '1123px',
        padding: '30px 40px',
        color: '#000000',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        {/* Company Header with Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '14px', borderBottom: '2.5px solid #8B6F47' }}>
          <div style={{ flex: 1 }}>
            {/* BOI PARA Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#8B6F47', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {/* BookOpen icon from lucide */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="#F5E6D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="#F5E6D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#2C1810', margin: 0, padding: 0, lineHeight: '1.1', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  BOI PARA
                </h1>
                <p style={{ fontSize: '9px', color: '#8B6F47', fontWeight: '700', margin: '5px 0 0 0', padding: 0, letterSpacing: '1.2px', lineHeight: 1 }}>FROM COLLEGE STREET TO YOUR DOORSTEP</p>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                {/* MapPin icon from lucide */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <circle cx="12" cy="10" r="3" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                <span>{adminUser?.storeAddress || adminUser?.location || 'College Street, Kolkata - 700073, West Bengal'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                {/* Phone icon from lucide */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                <span>{adminUser?.phone || '+91 8101637164'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                {/* Mail icon from lucide */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="20" height="16" x="2" y="4" rx="2" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                <span>{adminUser?.supportEmail || 'reachsupport@boipara.com'}</span>
              </div>
              <p style={{ fontWeight: '700', margin: '8px 0 0 0', color: '#1F2937', fontSize: '11px' }}>GSTIN: {adminUser?.gst || '19XXXXX1234X1ZX'}</p>
              {adminUser?.gtin && (
                <p style={{ fontSize: '10px', color: '#4B5563', margin: '2px 0 0 0' }}>GTIN: {adminUser.gtin}</p>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', minWidth: '220px' }}>
            <div style={{ display: 'inline-block', backgroundColor: '#8B6F47', padding: '12px 20px', borderRadius: '6px', marginBottom: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <p data-white-text style={{ fontSize: '14px', fontWeight: '700', margin: 0, padding: 0, letterSpacing: '1.5px', color: '#FFFFFF', lineHeight: '1.3', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>TAX INVOICE</p>
            </div>
            <div style={{ fontSize: '12px' }}>
              <p style={{ color: '#6B7280', margin: '0 0 3px 0', fontWeight: '500' }}>Invoice No:</p>
              <p style={{ fontWeight: 'bold', color: '#2C1810', margin: '0 0 10px 0', fontSize: '16px' }}>{generateInvoiceNumber(order.id)}</p>
              <p style={{ color: '#6B7280', margin: '0 0 3px 0', fontWeight: '500' }}>Order ID:</p>
              <p style={{ fontWeight: '700', color: '#1F2937', margin: '0 0 10px 0', fontSize: '13px' }}>{order.id}</p>
              <p style={{ color: '#6B7280', margin: '0 0 3px 0', fontWeight: '500' }}>Date:</p>
              <p style={{ fontWeight: '700', color: '#1F2937', margin: 0, fontSize: '13px' }}>{order.date}</p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2C1810', marginBottom: '8px', paddingBottom: '4px', borderBottom: '2px solid #D1D5DB' }}>
            Bill To:
          </h3>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <p style={{ fontWeight: 'bold', color: '#1F2937', margin: '3px 0' }}>{user?.name || order.customerName || 'Customer'}</p>
            <p style={{ color: '#374151', margin: '3px 0' }}>{order.shippingAddress}</p>
            {user?.email && <p style={{ color: '#4B5563', margin: '3px 0' }}>Email: {user.email}</p>}
            {user?.phone && <p style={{ color: '#4B5563', margin: '3px 0' }}>Phone: {user.phone}</p>}
          </div>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: '#8B6F47', color: '#ffffff' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: '700', fontSize: '11px', borderRight: '1px solid #6B5537' }}>No</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: '700', fontSize: '11px', borderRight: '1px solid #6B5537' }}>Book Details</th>
                <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: '700', fontSize: '11px', borderRight: '1px solid #6B5537' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: '700', fontSize: '11px', borderRight: '1px solid #6B5537' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: '700', fontSize: '11px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.bookId} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: index % 2 === 0 ? '#ffffff' : '#F9FAFB' }}>
                  <td style={{ padding: '10px 8px', color: '#374151', fontWeight: '600' }}>{index + 1}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <p style={{ fontWeight: '700', color: '#1F2937', margin: '0 0 2px 0', fontSize: '12px' }}>{item.book.title}</p>
                    <p style={{ fontSize: '10px', color: '#4B5563', margin: '0 0 1px 0' }}>by {item.book.author}</p>
                    <p style={{ fontSize: '9px', color: '#6B7280', margin: '0' }}>ISBN: {item.book.isbn} | Condition: {item.book.condition.charAt(0).toUpperCase() + item.book.condition.slice(1)}</p>
                    {item.book.sellerName && (
                      <p style={{ fontSize: '9px', color: '#6B7280', margin: '0' }}>Seller: {item.book.sellerName}</p>
                    )}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: '#374151', fontWeight: '600', fontSize: '11px' }}>{item.quantity}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', color: '#374151', fontWeight: '600', fontSize: '11px' }}>₹{item.book.price.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '700', color: '#1F2937', fontSize: '12px' }}>
                    ₹{(item.book.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <div style={{ width: '340px' }}>
            <div style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#4B5563', fontWeight: '500' }}>Subtotal:</span>
                <span style={{ fontWeight: '700', color: '#1F2937' }}>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#4B5563', fontWeight: '500' }}>Shipping Charges:</span>
                <span style={{ fontWeight: '700', color: '#059669' }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #D1D5DB' }}>
                <span style={{ color: '#4B5563', fontWeight: '500' }}>GST (12%):</span>
                <span style={{ fontWeight: '700', color: '#1F2937' }}>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: '2.5px solid #8B6F47', backgroundColor: '#F5E6D3', borderRadius: '8px', marginTop: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#2C1810', fontSize: '15px' }}>Grand Total:</span>
                <span style={{ fontWeight: 'bold', color: '#8B6F47', fontSize: '18px' }}>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div style={{ marginBottom: '16px', backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontWeight: 'bold', color: '#1F2937', marginBottom: '6px', fontSize: '12px' }}>Payment Information:</h3>
          <div style={{ fontSize: '11px' }}>
            <p style={{ color: '#374151', margin: '3px 0' }}>Payment Method: <span style={{ fontWeight: '700' }}>Cash on Delivery</span></p>
            <p style={{ color: '#374151', margin: '3px 0' }}>Payment Status: <span style={{ fontWeight: '700', color: '#059669' }}>Paid</span></p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div style={{ borderTop: '2px solid #D1D5DB', paddingTop: '12px', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 'bold', color: '#1F2937', marginBottom: '6px', fontSize: '12px' }}>Terms & Conditions:</h3>
          <ul style={{ fontSize: '10px', color: '#4B5563', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
            <li style={{ marginBottom: '2px' }}>This is a computer-generated invoice and does not require a signature.</li>
            <li style={{ marginBottom: '2px' }}>All sales are subject to BOI PARA's standard terms and conditions.</li>
            <li style={{ marginBottom: '2px' }}>Books sold cannot be returned unless defective or damaged upon delivery.</li>
            <li style={{ marginBottom: '2px' }}>For buyback requests, please visit our Sell Books section within 30 days of delivery.</li>
            <li style={{ marginBottom: '2px' }}>For any queries, please contact our customer support at {adminUser?.supportEmail || 'reachsupport@boipara.com'}</li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', borderTop: '2px solid #D1D5DB', paddingTop: '12px', marginTop: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#8B6F47', margin: '0 0 4px 0' }}>
            Thank you for shopping with BOI PARA!
          </p>
          <p style={{ fontSize: '10px', color: '#6B7280', margin: 0, fontWeight: '500' }}>
            Bringing the heritage of College Street book culture to your doorstep
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden;
          }
          
          /* Hide everything except print content */
          body * {
            visibility: hidden;
          }
          
          /* Reset body for print */
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Show only the print-specific content */
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          
          /* Ensure print content is positioned at top */
          .print\\:absolute {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
          
          /* Prevent page breaks inside important sections */
          .print\\:block > div {
            page-break-inside: avoid;
            page-break-after: avoid;
            page-break-before: avoid;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          thead {
            display: table-header-group;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          /* Force single page */
          * {
            max-height: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>
    </>
  );
}