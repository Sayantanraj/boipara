const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
    // Ensure token is refreshed when localStorage changes
    window.addEventListener('storage', () => {
      this.token = localStorage.getItem('token');
    });
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    // Always get the latest token from localStorage
    this.token = localStorage.getItem('token');
    
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      ...options,
    };

    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    console.log('Has token:', !!this.token);

    try {
      const response = await fetch(url, config);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        const text = await response.text();
        console.error('Response text:', text.substring(0, 200));
        throw new Error(`Server returned non-JSON response. Is the backend running on ${API_BASE}?`);
      }
      
      const data = await response.json();

      if (!response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`);
        console.error('Error data:', data);
        const error = new Error(data.error || 'API request failed') as any;
        error.requiresVerification = data.requiresVerification;
        error.userId = data.userId;
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (error: any) {
      if (error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_BASE}. Make sure the backend is running.`);
      }
      throw error;
    }
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = data.token;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async register(userData: any) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data;
  }

  async verifyOTP(userId: string, otp: string) {
    const data = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ userId, otp }),
    });
    this.token = data.token;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async resendOTP(userId: string) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async sendVerificationOTP(email: string) {
    return this.request('/auth/send-verification-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async sendEmailOTP(email: string, name: string) {
    return this.request('/auth/send-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  }

  async verifyEmailOTP(email: string, otp: string) {
    return this.request('/auth/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  // Forgot Password
  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetOTP(email: string, otp: string) {
    return this.request('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async resetPassword(email: string, otp: string, newPassword: string, confirmPassword: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
    });
  }

  async googleAuth(googleData: any) {
    const data = await this.request('/auth/google-auth', {
      method: 'POST',
      body: JSON.stringify(googleData),
    });
    this.token = data.token;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async getUserProfile() {
    return this.request('/auth/profile');
  }

  async updateUserProfile(profileData: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Books
  async getBooks(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/books?${query}`);
  }

  async getBook(id: string) {
    return this.request(`/books/${id}`);
  }

  async getFeaturedBooks() {
    return this.request('/books/featured/list');
  }

  async getBestsellers() {
    return this.request('/books/bestsellers/list');
  }

  async createBook(bookData: any) {
    return this.request('/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  }

  async updateBook(id: string, bookData: any) {
    return this.request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  }

  async deleteBook(id: string) {
    return this.request(`/books/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyBooks() {
    return this.request('/books/seller/my-books');
  }

  async getSellerDashboardStats() {
    return this.request('/books/seller/stats/dashboard');
  }

  async bulkCreateBooks(books: any[]) {
    console.log('📤 Bulk upload - Sending request...');
    console.log('📤 Number of books:', books.length);
    console.log('📤 Has auth token:', !!this.token);
    console.log('📤 Sample book:', books[0]);
    
    try {
      const result = await this.request('/books/bulk', {
        method: 'POST',
        body: JSON.stringify({ books }),
      });
      console.log('✅ Bulk upload - Success:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Bulk upload - Error:', error);
      throw error;
    }
  }

  // Orders
  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getMyOrders() {
    try {
      const data = await this.request('/orders/my-orders');
      console.log('API: Received orders data:', data);
      // Backend now returns array directly, wrap it for consistency
      return { orders: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { orders: [] };
    }
  }

  async cancelOrder(orderId: string) {
    return this.request(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
    });
  }

  async getSellerOrders() {
    return this.request('/orders/seller/orders');
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Buyback
  async createBuybackRequest(data: any) {
    return this.request('/buyback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyBuybackRequests() {
    return this.request('/buyback/my-requests');
  }

  async getApprovedBuybackBooks() {
    return this.request('/buyback/approved-books');
  }

  // Admin - Users
  async getAllUsers() {
    return this.request('/users');
  }

  async getAllSellers() {
    return this.request('/users/sellers');
  }

  // Admin - Orders
  async getAllOrders() {
    return this.request('/orders/admin/all-orders');
  }

  async getAllSellerOrders() {
    return this.request('/orders/admin/seller-orders');
  }

  // Admin - Returns
  async getAllReturns() {
    try {
      console.log('API: Fetching all return requests...');
      console.log('API: Token exists:', !!this.token);
      console.log('API: Making request to /returns/admin/all-returns');
      
      const result = await this.request('/returns/admin/all-returns');
      console.log('API: Successfully fetched return requests:', result.length);
      return result;
    } catch (error) {
      console.error('API Error - getAllReturns:', error);
      console.error('API Error details:', {
        message: error.message,
        hasToken: !!this.token,
        endpoint: '/returns/admin/all-returns'
      });
      throw error;
    }
  }

  async updateReturnStatus(returnId: string, status: string, adminNotes?: string) {
    return this.request(`/returns/${returnId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    });
  }

  // Customer - Returns
  async createReturnRequest(returnData: any) {
    return this.request('/returns', {
      method: 'POST',
      body: JSON.stringify(returnData),
    });
  }

  async getMyReturnRequests() {
    return this.request('/returns/my-returns');
  }

  // Seller - Returns
  async getSellerReturns() {
    return this.request('/returns/seller/my-returns');
  }

  async processReturn(returnId: string, refundAmount: number, sellerNotes?: string) {
    return this.request(`/returns/${returnId}/process`, {
      method: 'PATCH',
      body: JSON.stringify({ refundAmount, sellerNotes }),
    });
  }

  // Get books by seller ID (admin)
  async getSellerBooks(sellerId: string) {
    return this.request(`/books/seller/${sellerId}/books`);
  }

  // Get seller statistics (admin)
  async getSellerStats(sellerId: string) {
    return this.request(`/users/sellers/${sellerId}/stats`);
  }

  // Admin - Buyback
  async getAllBuybackRequests() {
    try {
      console.log('API: Fetching all buyback requests...');
      console.log('API: Token exists:', !!this.token);
      console.log('API: Making request to /buyback/admin/all-requests');
      
      const result = await this.request('/buyback/admin/all-requests');
      console.log('API: Successfully fetched buyback requests:', result.length);
      return result;
    } catch (error) {
      console.error('API Error - getAllBuybackRequests:', error);
      console.error('API Error details:', {
        message: error.message,
        hasToken: !!this.token,
        endpoint: '/buyback/admin/all-requests'
      });
      throw error;
    }
  }

  async approveBuybackRequest(requestId: string, sellingPrice: number, priceChangeReason?: string) {
    return this.request(`/buyback/${requestId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ sellingPrice, priceChangeReason }),
    });
  }

  async rejectBuybackRequest(requestId: string, rejectionReason?: string) {
    return this.request(`/buyback/${requestId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason }),
    });
  }

  async createBuybackListing(requestId: string) {
    return this.request(`/buyback/${requestId}/create-listing`, {
      method: 'POST',
    });
  }

  // Seller - Purchase buyback books
  async purchaseBuybackBooks(orderData: any) {
    return this.request('/buyback/purchase', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getMyBuybackOrders() {
    return this.request('/buyback/my-orders');
  }

  // Customer - Get buyback purchase orders for a specific buyback request
  async getMyBuybackPurchaseOrders(buybackRequestId: string) {
    try {
      console.log('API: Fetching purchase orders for buyback request:', buybackRequestId);
      const result = await this.request(`/buyback/customer/purchase-orders/${buybackRequestId}`);
      console.log('API: Purchase orders result:', result);
      return result;
    } catch (error) {
      console.error('API Error - getMyBuybackPurchaseOrders:', error);
      return [];
    }
  }

  // Customer - Get all buyback orders (to match with requests)
  async getAllBuybackOrdersForCustomer() {
    try {
      console.log('API: Fetching all buyback orders for customer');
      const result = await this.request('/buyback/customer/all-orders');
      console.log('API: All buyback orders result:', result);
      return result;
    } catch (error) {
      console.error('API Error - getAllBuybackOrdersForCustomer:', error);
      return [];
    }
  }

  // Customer - Update buyback order status
  async updateBuybackOrderStatus(orderId: string, status: string) {
    return this.request(`/buyback/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Admin - Get all buyback orders (seller purchases)
  async getAllBuybackOrders() {
    try {
      console.log('API: Fetching all buyback orders...');
      console.log('API: Token exists:', !!this.token);
      console.log('API: Making request to /buyback/admin/all-orders');
      
      const result = await this.request('/buyback/admin/all-orders');
      console.log('API: Successfully fetched buyback orders:', result.length);
      return result;
    } catch (error) {
      console.error('API Error - getAllBuybackOrders:', error);
      console.error('API Error details:', {
        message: error.message,
        hasToken: !!this.token,
        endpoint: '/buyback/admin/all-orders'
      });
      throw error;
    }
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Search
  async getSearchSuggestions(query: string) {
    return this.request(`/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  async saveSearchHistory(userId: string, query: string) {
    return this.request('/search/history', {
      method: 'POST',
      body: JSON.stringify({ userId, query }),
    });
  }

  async getSearchHistory(userId: string) {
    return this.request(`/search/history/${userId}`);
  }

  async getPopularSearches() {
    return this.request('/search/popular');
  }

  // Reviews
  async createReview(reviewData: any) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async getReviewByOrder(orderId: string) {
    return this.request(`/reviews/order/${orderId}`);
  }

  async updateReview(reviewId: string, reviewData: any) {
    return this.request(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  }

  async getBookReviews(bookId: string, sort?: string) {
    const query = sort ? `?sort=${sort}` : '';
    return this.request(`/reviews/book/${bookId}${query}`);
  }

  async markReviewHelpful(reviewId: string) {
    return this.request(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
    });
  }

  async removeReviewHelpful(reviewId: string) {
    return this.request(`/reviews/${reviewId}/helpful`, {
      method: 'DELETE',
    });
  }

  // Support Tickets
  async getAllSupportTickets() {
    return this.request('/support/admin/all');
  }

  async updateSupportTicketStatus(ticketId: string, status: string, priority?: string, adminNotes?: string) {
    return this.request(`/support/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, priority, adminNotes }),
    });
  }
}

export const apiService = new ApiService();
export const getSearchSuggestions = (query: string) => apiService.getSearchSuggestions(query);