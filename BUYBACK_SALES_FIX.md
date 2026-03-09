# Buyback Sales Fix - Data Not Showing

## Problem
Admin panel "Buyback Sales" section is not displaying seller purchases from the database even though data exists in MongoDB Atlas.

## Root Cause
The backend endpoint `/buyback/admin/all-orders` was missing from the routes file.

## Solution Applied

### Backend Fix (backend/routes/buyback.js)
Added the missing admin endpoint to fetch all buyback orders:

```javascript
// Admin - Get all buyback orders (seller purchases)
router.get('/admin/all-orders', auth, async (req, res) => {
  try {
    console.log('🔍 Admin fetching all buyback orders...');
    console.log('User role:', req.user.role);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const mongoose = require('mongoose');
    const BuybackOrder = mongoose.models.BuybackOrder;
    
    if (!BuybackOrder) {
      console.log('⚠️ BuybackOrder model not found');
      return res.json([]);
    }

    console.log('📦 Fetching orders from database...');
    const orders = await BuybackOrder.find({})
      .populate('userId', 'name email storeName')
      .populate('items.bookId')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${orders.length} buyback orders`);
    if (orders.length > 0) {
      console.log('Sample order:', JSON.stringify(orders[0], null, 2));
    }

    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching all buyback orders:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend Fix Needed (src/app/pages/AdminDashboard.tsx)
The frontend needs to handle cases where populated fields might be null or undefined. Update the buyback sales loading logic around line 450-480 to add null checks:

```typescript
const sales: BuybackSale[] = orders.map((order: any) => {
  // Handle populated userId safely
  const sellerName = order.userId?.storeName || order.userId?.name || order.customerName || 'Unknown Seller';
  const sellerId = order.userId?._id || order.userId || 'unknown';
  
  // Handle items array safely
  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
  const bookTitle = firstItem?.bookId?.bookTitle || 'Unknown Book';
  const author = firstItem?.bookId?.author || 'Unknown Author';
  const isbn = firstItem?.bookId?.isbn || 'N/A';
  const price = firstItem?.price || 0;
  
  // Calculate total quantity safely
  const quantity = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
  
  return {
    id: order._id,
    sellerId,
    sellerName,
    buybackBookId: firstItem?.bookId?._id || '',
    bookTitle,
    author,
    isbn,
    price,
    quantity,
    total: order.total || 0,
    date: new Date(order.createdAt).toLocaleDateString('en-IN'),
    status: order.status === 'pending' ? 'pending' : 'completed'
  };
});
```

## Testing Steps
1. Restart backend server: `cd backend && npm run dev`
2. Login as admin
3. Navigate to "Buyback Sales" tab
4. Check browser console for logs showing data fetch
5. Verify sales are displayed with seller name, book details, and totals

## Expected Result
Admin should see all buyback orders where sellers have purchased books from the platform, with proper seller names and book details populated from the database.
