# Buyback Requests - Admin Dashboard Setup

## Overview
The Buyback Requests section in the Admin Dashboard is now fully functional and connected to the database. This allows administrators to:

- View all buyback requests from customers
- Approve or reject buyback requests
- Set selling prices for approved books
- Add price change reasons when adjusting prices
- Track request status and history

## Database Setup

### 1. Start the Backend Server
```bash
cd backend
npm install
npm start
```

### 2. Seed Sample Buyback Requests (Optional)
To test the functionality with sample data:
```bash
cd backend
node seedBuyback.js
```

This will create 3 sample buyback requests:
- Introduction to Algorithms (Pending)
- The Art of Computer Programming (Pending) 
- Clean Code (Already Approved)

## Testing the Functionality

### 1. Access Admin Dashboard
- Login as an admin user
- Navigate to the "Buyback" tab in the admin dashboard

### 2. View Buyback Requests
- All buyback requests are loaded from the database
- Pending requests show approval/rejection controls
- Approved/rejected requests show their status

### 3. Approve a Buyback Request
- Enter a selling price (defaults to offered price)
- If changing the price, provide a reason
- Click "Approve" to approve the request
- The request status updates in real-time

### 4. Reject a Buyback Request
- Click "Reject" to reject the request
- The request status updates immediately

### 5. Refresh Data
- Use the "Refresh" button to reload data from the database
- Data automatically refreshes when switching to the buyback tab

## API Endpoints Used

- `GET /api/buyback/admin/all-requests` - Fetch all buyback requests
- `PATCH /api/buyback/:id/approve` - Approve a buyback request
- `PATCH /api/buyback/:id/reject` - Reject a buyback request

## Features

✅ **Database Integration**: Fully connected to MongoDB
✅ **Real-time Updates**: Automatic refresh and status updates
✅ **Price Management**: Set custom selling prices with reasons
✅ **Status Tracking**: Track pending, approved, and rejected requests
✅ **Activity Logging**: Admin actions are logged in the activity feed
✅ **Error Handling**: Proper error handling and user feedback
✅ **Responsive Design**: Works on all screen sizes

## Troubleshooting

### No Buyback Requests Showing
1. Check if the backend server is running on port 3001
2. Verify MongoDB connection in the backend
3. Run the seed script to add sample data
4. Check browser console for any API errors

### API Errors
1. Ensure you're logged in as an admin user
2. Check the backend logs for detailed error messages
3. Verify the MongoDB connection string in `.env`

### Database Connection Issues
1. Make sure MongoDB is running locally or update the connection string
2. Check the `.env` file in the backend directory
3. Verify the database name matches your setup

The buyback functionality is now fully operational and ready for production use!