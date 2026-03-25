const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Ultra-fast cache implementation
class FastCache {
  private cache = new Map();
  private ttl = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

class FastApiService {
  private token: string | null = null;
  private cache = new FastCache();

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async fastRequest(endpoint: string, options: RequestInit = {}) {
    this.token = localStorage.getItem('token');
    
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const error = new Error(data.error || 'Request failed') as any;
        error.status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      if (error.message.includes('fetch')) {
        throw new Error(`Backend unavailable at ${API_BASE}`);
      }
      throw error;
    }
  }

  // Ultra-fast cached book fetching
  async getBooks(params: any = {}) {
    const cacheKey = `books_${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const query = new URLSearchParams(params).toString();
    const data = await this.fastRequest(`/books?${query}`);
    this.cache.set(cacheKey, data);
    return data;
  }

  async getBestsellers() {
    const cached = this.cache.get('bestsellers');
    if (cached) return cached;

    const data = await this.fastRequest('/books/bestsellers/list');
    this.cache.set('bestsellers', data);
    return data;
  }

  async getFeaturedBooks() {
    const cached = this.cache.get('featured');
    if (cached) return cached;

    const data = await this.fastRequest('/books/featured/list');
    this.cache.set('featured', data);
    return data;
  }

  async getBook(id: string) {
    const cached = this.cache.get(`book_${id}`);
    if (cached) return cached;

    const data = await this.fastRequest(`/books/${id}`);
    this.cache.set(`book_${id}`, data);
    return data;
  }

  // Auth methods (no caching for security)
  async login(email: string, password: string) {
    const data = await this.fastRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = data.token;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.cache.clear(); // Clear cache on login
    return data;
  }

  async register(userData: any) {
    return this.fastRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.cache.clear();
  }

  // Orders
  async createOrder(orderData: any) {
    const data = await this.fastRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    this.cache.clear(); // Clear cache after order creation
    return data;
  }

  async getMyOrders() {
    try {
      const data = await this.fastRequest('/orders/my-orders');
      return { orders: Array.isArray(data) ? data : data.orders || [] };
    } catch (error) {
      return { orders: [] };
    }
  }

  // Buyback
  async createBuybackRequest(data: any) {
    return this.fastRequest('/buyback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyBuybackRequests() {
    return this.fastRequest('/buyback/my-requests');
  }

  // Search with caching
  async getSearchSuggestions(query: string) {
    if (query.length < 2) return [];
    
    const cached = this.cache.get(`search_${query}`);
    if (cached) return cached;

    try {
      const data = await this.fastRequest(`/search/suggestions?q=${encodeURIComponent(query)}`);
      this.cache.set(`search_${query}`, data);
      return data;
    } catch (error) {
      return [];
    }
  }

  // Admin methods (minimal implementation)
  async getAllUsers() {
    return this.fastRequest('/users');
  }

  async getAllSellers() {
    return this.fastRequest('/users/sellers');
  }

  async getAllOrders() {
    return this.fastRequest('/orders/admin/all-orders');
  }
}

export const apiService = new FastApiService();
export const getSearchSuggestions = (query: string) => apiService.getSearchSuggestions(query);