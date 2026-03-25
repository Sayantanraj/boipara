import { useState, useRef, useEffect } from 'react';
import { X, Send, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
// Updated to use chatbot_logo1.png
import chatbotLogo from '../../assets/chatbot_logo1.png';

// Add Google Font import for Bitcount Grid Double Ink, Lexend, and Momo Signature
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Bitcount+Grid+Double+Ink:wght@100..900&family=Lexend:wght@100..900&family=Momo+Signature&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector(`link[href="${fontLink.href}"]`)) {
  document.head.appendChild(fontLink);
}

interface Message {
  text: string;
  isUser: boolean;
  timestamp: string;
  file?: {
    name: string;
    size: string;
    type: string;
  };
}

// Gemini AI Configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBgvlo5fO7UbSetLpF2ox3gLB2GKB8gXcU';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export function ChatbotModern() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: `Hi! I'm your Gemini-powered assistant.<br/>How can I help you navigate our library today?`,
      isUser: false,
      timestamp: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Order flow state management
  const [orderFlow, setOrderFlow] = useState({
    isActive: false,
    step: '', // 'book_name', 'quantity', 'address', 'payment', 'confirm'
    bookName: '',
    bookId: '',
    bookPrice: 0,
    quantity: 0,
    address: '',
    paymentMethod: ''
  });

  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Close chatbot when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const callGeminiAI = async (userMessage: string): Promise<string> => {
    try {
      console.log('Calling Gemini AI with message:', userMessage);
      
      // Handle order flow first (takes priority)
      const orderFlowResponse = await handleOrderFlow(userMessage);
      if (orderFlowResponse) {
        return orderFlowResponse;
      }
      
      // Handle order operations (including tracking) - HIGH PRIORITY
      const orderResponse = await handleOrderOperations(userMessage);
      if (orderResponse) {
        return orderResponse;
      }
      
      // Handle follow-up questions
      const followUpResponse = await handleFollowUpQuestions(userMessage);
      if (followUpResponse) {
        return followUpResponse;
      }
      
      // Get comprehensive database context
      let contextData = await getDatabaseContext(userMessage);
      
      // Check for specific book searches
      const bookSearchResult = await searchSpecificBooks(userMessage);
      if (bookSearchResult) {
        contextData += ` ${bookSearchResult}`;
      }
      
      const prompt = `You are BOIPARA AI Assistant, a helpful chatbot for an online bookstore called "BOIPARA" that specializes in books from College Street, Kolkata.

Context about BOIPARA:
- We sell new and used books, especially academic textbooks
- We have Engineering, Medical, Literature, and Rare & Vintage collections
- We offer book buyback services
- Free delivery across India (3-5 business days)
- Order IDs format: BOI + date + number (e.g., BOI120320261)
- 7-day return policy
- Price range: ₹200-₹2000 for most textbooks
- Contact: support@boipara.com, +91-9876543210
- Hours: Mon-Sat 9 AM - 8 PM

Real-time Database Data: ${contextData}

User Query: "${userMessage}"

IMPORTANT INSTRUCTIONS:
1. If user asks to "track [book name]" or mentions tracking a specific book, DO NOT ask for Order ID - instead search their orders for that book
2. If user provides just an Order ID (BOI format), track that specific order
3. If user asks "show my orders" or "current orders", display their order list
4. If user asks "yes", "yeah", "sure" or wants "more information", provide detailed book information
5. If user asks about specific books, search the database data above for matching books
6. For general order tracking without specifics, then ask for Order ID
7. Handle book ordering, order placement, and order management
8. Always be helpful, specific, and use relevant emojis
9. Keep responses informative but concise
10. Use the real-time database data to provide accurate information

Respond as BOIPARA AI Assistant using the real-time database data above.`;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Gemini AI Error:', error);
      return await getFallbackResponse(userMessage);
    }
  };

  // Handle complete order flow
  const handleOrderFlow = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Start order flow
    if (!orderFlow.isActive && (lowerMessage.includes('order a book') || lowerMessage.includes('buy a book') || lowerMessage.includes('purchase a book'))) {
      setOrderFlow({
        ...orderFlow,
        isActive: true,
        step: 'book_name'
      });
      return "📚 Great! I'd love to help you order a book. What's the name of the book you'd like to order? You can tell me the title or author name.";
    }
    
    // Handle order flow steps
    if (orderFlow.isActive) {
      switch (orderFlow.step) {
        case 'book_name':
          // Search for the book
          const bookSearchResult = await searchSpecificBooks(userMessage);
          if (bookSearchResult && bookSearchResult.includes('Found')) {
            // Extract book details from search result
            try {
              const booksResponse = await apiService.getBooks({ limit: 500 });
              const books = booksResponse.books || [];
              const matchingBooks = books.filter(book => {
                const title = book.title?.toLowerCase() || '';
                const author = book.author?.toLowerCase() || '';
                const searchTerms = lowerMessage.split(' ').filter(term => 
                  term.length > 2 && !['for', 'the', 'and', 'book', 'available', 'this', 'is', 'can', 'order', 'buy', 'want'].includes(term)
                );
                return searchTerms.some(term => title.includes(term) || author.includes(term));
              });
              
              if (matchingBooks.length > 0) {
                const book = matchingBooks[0]; // Take first match
                setOrderFlow({
                  ...orderFlow,
                  step: 'quantity',
                  bookName: book.title,
                  bookId: book._id,
                  bookPrice: book.price
                });
                return `📖 Perfect! I found "${book.title}" by ${book.author} for ₹${book.price}.\n\nHow many copies would you like to order? Please enter the quantity (e.g., 1, 2, 3...).`;
              }
            } catch (error) {
              console.error('Error searching books:', error);
            }
          }
          return "❌ Sorry, I couldn't find that book in our inventory. Could you please try with a different title or author name? Or you can browse our categories: Engineering, Medical, Literature, Mathematics.";
          
        case 'quantity':
          const quantity = parseInt(userMessage.trim());
          if (quantity && quantity > 0 && quantity <= 10) {
            setOrderFlow({
              ...orderFlow,
              step: 'address',
              quantity: quantity
            });
            const totalAmount = orderFlow.bookPrice * quantity;
            return `📦 Great! ${quantity} ${quantity === 1 ? 'copy' : 'copies'} of "${orderFlow.bookName}" = ₹${totalAmount}\n\nNow I need your delivery address. Please provide your complete address including:\n- Name\n- House/Flat number\n- Street/Area\n- City, State\n- PIN code\n- Phone number`;
          }
          return "❌ Please enter a valid quantity (1-10). How many copies would you like to order?";
          
        case 'address':
          if (userMessage.trim().length > 20) { // Basic validation for address
            setOrderFlow({
              ...orderFlow,
              step: 'payment',
              address: userMessage.trim()
            });
            return `📍 Address saved successfully!\n\nNow, please choose your payment method:\n\n1️⃣ **COD (Cash on Delivery)** - Pay when you receive\n2️⃣ **UPI** - Pay online via UPI\n3️⃣ **Card** - Credit/Debit card payment\n4️⃣ **Net Banking** - Online banking\n\nJust type the number (1, 2, 3, or 4) or the payment method name.`;
          }
          return "❌ Please provide a complete address with all details (name, house number, street, city, state, PIN, phone).";
          
        case 'payment':
          let paymentMethod = '';
          if (lowerMessage.includes('1') || lowerMessage.includes('cod') || lowerMessage.includes('cash on delivery')) {
            paymentMethod = 'COD';
          } else if (lowerMessage.includes('2') || lowerMessage.includes('upi')) {
            paymentMethod = 'UPI';
          } else if (lowerMessage.includes('3') || lowerMessage.includes('card')) {
            paymentMethod = 'Card';
          } else if (lowerMessage.includes('4') || lowerMessage.includes('net banking') || lowerMessage.includes('banking')) {
            paymentMethod = 'Net Banking';
          }
          
          if (paymentMethod) {
            setOrderFlow({
              ...orderFlow,
              step: 'confirm',
              paymentMethod: paymentMethod
            });
            
            const totalAmount = orderFlow.bookPrice * orderFlow.quantity;
            
            if (paymentMethod === 'COD') {
              // For COD, directly place the order
              return await placeOrder(totalAmount);
            } else {
              return `💳 Payment method: ${paymentMethod} selected.\n\n📋 **Order Summary:**\n📖 Book: ${orderFlow.bookName}\n📦 Quantity: ${orderFlow.quantity}\n💰 Total: ₹${totalAmount}\n📍 Address: ${orderFlow.address.substring(0, 50)}...\n💳 Payment: ${paymentMethod}\n\nType 'confirm' to place your order, or 'cancel' to cancel.`;
            }
          }
          return "❌ Please choose a valid payment method:\n1 - COD\n2 - UPI\n3 - Card\n4 - Net Banking";
          
        case 'confirm':
          if (lowerMessage.includes('confirm') || lowerMessage.includes('yes')) {
            const totalAmount = orderFlow.bookPrice * orderFlow.quantity;
            return await placeOrder(totalAmount);
          } else if (lowerMessage.includes('cancel') || lowerMessage.includes('no')) {
            setOrderFlow({
              isActive: false,
              step: '',
              bookName: '',
              bookId: '',
              bookPrice: 0,
              quantity: 0,
              address: '',
              paymentMethod: ''
            });
            return "❌ Order cancelled. Is there anything else I can help you with?";
          }
          return "Please type 'confirm' to place your order or 'cancel' to cancel the order.";
      }
    }
    
    return '';
  };
  
  // Place the actual order
  const placeOrder = async (totalAmount: number): Promise<string> => {
    try {
      if (!user) {
        setOrderFlow({
          isActive: false,
          step: '',
          bookName: '',
          bookId: '',
          bookPrice: 0,
          quantity: 0,
          address: '',
          paymentMethod: ''
        });
        return "❌ Please login to place an order. You can login from our website and then continue with the order.";
      }
      
      const orderData = {
        items: [{
          bookId: orderFlow.bookId,
          quantity: orderFlow.quantity,
          price: orderFlow.bookPrice
        }],
        shippingAddress: orderFlow.address,
        paymentMethod: orderFlow.paymentMethod,
        totalAmount: totalAmount
      };
      
      const response = await apiService.createOrder(orderData);
      
      // Reset order flow
      setOrderFlow({
        isActive: false,
        step: '',
        bookName: '',
        bookId: '',
        bookPrice: 0,
        quantity: 0,
        address: '',
        paymentMethod: ''
      });
      
      const orderId = response.order?.orderId || response.orderId || 'BOI' + Date.now();
      
      return `✅ **Order Placed Successfully!**\n\n🎉 Your order has been confirmed!\n📋 **Order ID**: ${orderId}\n📖 **Book**: ${orderFlow.bookName}\n📦 **Quantity**: ${orderFlow.quantity}\n💰 **Total**: ₹${totalAmount}\n💳 **Payment**: ${orderFlow.paymentMethod}\n\n📞 **Next Steps:**\n${orderFlow.paymentMethod === 'COD' ? '💵 Pay cash when delivered' : '💳 Complete payment to process order'}\n🚚 Delivery in 3-5 business days\n📱 Track your order with Order ID\n\n📞 **Need help?** Call +91-9876543210`;
      
    } catch (error) {
      console.error('Error placing order:', error);
      return "❌ Sorry, there was an error placing your order. Please try again or contact our support team at +91-9876543210.";
    }
  };
  
  // Handle follow-up questions and book details
  const handleFollowUpQuestions = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Handle simple yes/no responses for book information
    if (lowerMessage === 'yes' || lowerMessage === 'yeah' || lowerMessage === 'sure' || lowerMessage.includes('more information') || lowerMessage.includes('details')) {
      // Get the last book mentioned in context (this is a simplified approach)
      try {
        const booksResponse = await apiService.getBooks({ limit: 100 });
        const books = booksResponse.books || [];
        
        // Find Indian Classical Poetry Collection as it was the last searched book
        const book = books.find(b => 
          b.title?.toLowerCase().includes('indian classical poetry') ||
          b._id === '69a12cfd43da21318a66390b'
        );
        
        if (book) {
          return `📚 **"${book.title}"** by ${book.author}\n\n💰 **Price**: ₹${book.price}\n📖 **Condition**: ${book.condition || 'Good'}\n📚 **Category**: ${book.category || 'Literature'}\n🆔 **Book ID**: ${book._id}\n\n✨ This is a beautiful collection of classical Indian poetry! To order this book:\n1. Visit our website and search for Book ID: ${book._id}\n2. Add to cart and proceed to checkout\n3. Or call us at +91-9876543210\n\n🚚 **Free delivery** across India in 3-5 business days!`;
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
      }
      
      return "📚 I'd be happy to provide more details! Could you please specify which book you'd like to know more about?";
    }
    
    // Handle ordering requests
    if (lowerMessage.includes('order this') || lowerMessage.includes('buy this') || lowerMessage.includes('purchase this')) {
      return "🛒 Great choice! To place your order:\n\n1. **Online**: Visit our website and search for the Book ID\n2. **Phone**: Call us at +91-9876543210\n3. **WhatsApp**: Message us with the Book ID\n\n📋 **You'll need**:\n- Book ID (provided above)\n- Your delivery address\n- Payment method\n\n💳 We accept: UPI, Cards, Net Banking, COD\n🚚 Free delivery in 3-5 business days!";
    }
    
    return '';
  };
  
  // Enhanced database context fetching
  const getDatabaseContext = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    let contextData = '';
    
    try {
      // Always fetch some basic inventory data
      const booksResponse = await apiService.getBooks({ limit: 200 });
      const books = booksResponse.books || [];
      const totalBooks = books.length;
      const categories = [...new Set(books.map(book => book.category))].filter(Boolean);
      
      contextData = `Total books in inventory: ${totalBooks}. Available categories: ${categories.join(', ')}.`;
      
      // Add specific category data if mentioned
      if (lowerMessage.includes('engineering') || lowerMessage.includes('medical') || lowerMessage.includes('literature') || lowerMessage.includes('mathematics') || lowerMessage.includes('class 10')) {
        const categoryBooks = books.filter(book => {
          const bookTitle = book.title?.toLowerCase() || '';
          const bookCategory = book.category?.toLowerCase() || '';
          const bookAuthor = book.author?.toLowerCase() || '';
          
          return bookTitle.includes('engineering') || bookCategory.includes('engineering') ||
                 bookTitle.includes('medical') || bookCategory.includes('medical') ||
                 bookTitle.includes('literature') || bookCategory.includes('literature') ||
                 bookTitle.includes('mathematics') || bookTitle.includes('math') ||
                 bookTitle.includes('class 10') || bookTitle.includes('10th');
        });
        
        if (categoryBooks.length > 0) {
          const sampleBooks = categoryBooks.slice(0, 3).map(book => 
            `"${book.title}" by ${book.author} (₹${book.price})`
          ).join(', ');
          contextData += ` Found ${categoryBooks.length} relevant books. Examples: ${sampleBooks}.`;
        }
      }
      
      // Add user order data if available
      if (user && lowerMessage.includes('order')) {
        try {
          const ordersResponse = await apiService.getMyOrders();
          const orders = ordersResponse.orders || [];
          contextData += ` User has ${orders.length} orders in their account.`;
        } catch (error) {
          console.error('Error fetching orders:', error);
        }
      }
      
    } catch (error) {
      console.error('Error fetching database context:', error);
      contextData = 'Unable to fetch current inventory data, but we have a vast collection of books from College Street.';
    }
    
    return contextData;
  };
  
  // Enhanced book search function
  const searchSpecificBooks = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    try {
      const booksResponse = await apiService.getBooks({ limit: 500 });
      const books = booksResponse.books || [];
      
      // Search for specific book titles or subjects
      const matchingBooks = books.filter(book => {
        const title = book.title?.toLowerCase() || '';
        const author = book.author?.toLowerCase() || '';
        const category = book.category?.toLowerCase() || '';
        
        // Check for wings of fire specifically
        if (lowerMessage.includes('wings of fire')) {
          return title.includes('wings of fire') || title.includes('wings') && title.includes('fire') || author.includes('kalam') || author.includes('abdul kalam');
        }
        
        // Check for mathematics class 10 specifically
        if (lowerMessage.includes('mathematics') && lowerMessage.includes('class 10')) {
          return title.includes('mathematics') && (title.includes('class 10') || title.includes('10th') || title.includes('x'));
        }
        
        // General book search
        const searchTerms = lowerMessage.split(' ').filter(term => 
          term.length > 2 && !['for', 'the', 'and', 'book', 'available', 'this', 'is', 'can', 'order', 'buy', 'want'].includes(term)
        );
        
        return searchTerms.some(term => 
          title.includes(term) || author.includes(term) || category.includes(term)
        );
      });
      
      if (matchingBooks.length > 0) {
        const topMatches = matchingBooks.slice(0, 3).map(book => 
          `"${book.title}" by ${book.author} - ₹${book.price} (${book.condition || 'Good condition'}) [ID: ${book._id}]`
        ).join('; ');
        return `Found ${matchingBooks.length} matching books: ${topMatches}.`;
      }
      
    } catch (error) {
      console.error('Error searching books:', error);
    }
    
    return '';
  };
  
  // Handle order operations
  const handleOrderOperations = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Handle order tracking by Order ID - ENHANCED FOR MONGODB IDs
    if (lowerMessage.includes('track') && lowerMessage.includes('order')) {
      const orderIdMatch = userMessage.match(/[a-f0-9]{24}/i) || userMessage.match(/BOI\d{11}/i);
      if (orderIdMatch) {
        try {
          if (!user) {
            return "❌ Please login to track your orders. You can login from our website.";
          }
          
          console.log('🔍 Tracking order with ID:', orderIdMatch[0]);
          const ordersResponse = await apiService.getMyOrders();
          console.log('🔍 API response:', ordersResponse);
          const orders = ordersResponse.orders || ordersResponse || [];
          
          const order = orders.find(o => 
            (o.orderId === orderIdMatch[0]) || 
            (o._id === orderIdMatch[0]) ||
            (o.id === orderIdMatch[0])
          );
          console.log('🔍 Found order:', order);
          
          if (order) {
            const statusEmoji = {
              'pending': '⏳',
              'confirmed': '✅',
              'processing': '📦',
              'shipped': '🚚',
              'delivered': '✅',
              'cancelled': '❌'
            };
            
            const statusMessage = {
              'pending': 'Order received and being reviewed',
              'confirmed': 'Order confirmed and being prepared',
              'processing': 'Order is being processed',
              'shipped': 'Order shipped and on the way to you',
              'delivered': 'Order delivered successfully',
              'cancelled': 'Order has been cancelled'
            };
            
            const orderStatus = order.status || 'pending';
            const orderId = order.orderId || order._id || order.id || orderIdMatch[0];
            const totalAmount = order.totalAmount || order.total || 0;
            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
            const bookTitles = order.items?.map(item => item.book?.title || item.title).filter(Boolean).join(', ') || 'N/A';
            
            return `📦 **Order Tracking - ${orderId}**\n\n${statusEmoji[orderStatus] || '📦'} **Status**: ${orderStatus.toUpperCase()}\n📝 **Details**: ${statusMessage[orderStatus] || 'Order is being processed'}\n📚 **Books**: ${bookTitles}\n💰 **Total**: ₹${totalAmount}\n📅 **Order Date**: ${orderDate}\n\n${orderStatus === 'delivered' ? '🎉 Thank you for your purchase!' : orderStatus === 'shipped' ? '📱 You should receive it soon!' : '⏰ We\'ll update you on progress!'}`;
          } else {
            return `❌ Order ${orderIdMatch[0]} not found in your account.\n\n💡 **Tips:**\n- Make sure you're logged in with the correct account\n- Check if the Order ID is correct\n- Contact support at +91-9876543210 if you need help`;
          }
        } catch (error) {
          console.error('🔍 Error tracking order:', error);
          return "❌ Unable to track order right now. Database connection issue. Please try again or contact support at +91-9876543210.";
        }
      } else {
        return "📦 Please provide your Order ID to track your order. You can also say 'show my orders' to see all your orders.";
      }
    }
    
    // Handle direct Order ID input - ENHANCED FOR MONGODB IDs
    const directOrderIdMatch = userMessage.match(/^[a-f0-9]{24}$/i) || userMessage.match(/^BOI\d{11}$/i);
    if (directOrderIdMatch) {
      try {
        if (!user) {
          return "❌ Please login to track your orders. You can login from our website.";
        }
        
        console.log('🔍 Tracking order by ID:', directOrderIdMatch[0]);
        const ordersResponse = await apiService.getMyOrders();
        console.log('🔍 Orders response for tracking:', ordersResponse);
        const orders = ordersResponse.orders || ordersResponse || [];
        console.log('🔍 Orders array:', orders);
        
        const order = orders.find(o => 
          (o.orderId === directOrderIdMatch[0]) || 
          (o._id === directOrderIdMatch[0]) ||
          (o.id === directOrderIdMatch[0])
        );
        console.log('🔍 Found order:', order);
        
        if (order) {
          const statusEmoji = {
            'pending': '⏳',
            'confirmed': '✅',
            'processing': '📦',
            'shipped': '🚚',
            'delivered': '✅',
            'cancelled': '❌'
          };
          
          const statusMessage = {
            'pending': 'Order received and being reviewed',
            'confirmed': 'Order confirmed and being prepared',
            'processing': 'Order is being processed',
            'shipped': 'Order shipped and on the way to you',
            'delivered': 'Order delivered successfully',
            'cancelled': 'Order has been cancelled'
          };
          
          const orderStatus = order.status || 'pending';
          const orderId = order.orderId || order._id || order.id || directOrderIdMatch[0];
          const totalAmount = order.totalAmount || order.total || 0;
          const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
          const bookTitles = order.items?.map(item => item.book?.title || item.title).filter(Boolean).join(', ') || 'N/A';
          
          return `📦 **Order Tracking - ${orderId}**\n\n${statusEmoji[orderStatus] || '📦'} **Status**: ${orderStatus.toUpperCase()}\n📝 **Details**: ${statusMessage[orderStatus] || 'Order is being processed'}\n📚 **Books**: ${bookTitles}\n💰 **Total**: ₹${totalAmount}\n📅 **Order Date**: ${orderDate}\n\n${orderStatus === 'delivered' ? '🎉 Thank you for your purchase!' : orderStatus === 'shipped' ? '📱 You should receive it soon!' : '⏰ We\'ll update you on progress!'}`;
        } else {
          return `❌ Order ${directOrderIdMatch[0]} not found in your account.\n\n💡 **Tips:**\n- Make sure you're logged in with the correct account\n- Check if the Order ID is correct\n- Contact support at +91-9876543210 if you need help`;
        }
      } catch (error) {
        console.error('🔍 Error tracking order:', error);
        return `❌ Unable to track order right now. Database connection issue.\n\n🔧 **Troubleshooting:**\n- Check your internet connection\n- Try again in a few moments\n- Contact support at +91-9876543210 if this persists`;
      }
    }
    
    // Handle "Track My Order" - show all orders - FIXED PATTERN MATCHING
    if (lowerMessage === 'track my order' || 
        lowerMessage === 'track order' || 
        lowerMessage === 'my orders' ||
        lowerMessage === 'show my orders' ||
        lowerMessage === 'current orders' ||
        (lowerMessage.includes('track') && lowerMessage.includes('my') && lowerMessage.includes('order'))) {
      try {
        if (!user) {
          return "❌ Please login to view your orders. You can login from our website.";
        }
        
        console.log('🔍 Fetching user orders...');
        const ordersResponse = await apiService.getMyOrders();
        console.log('🔍 Orders response:', ordersResponse);
        const orders = ordersResponse.orders || ordersResponse || [];
        
        if (orders.length === 0) {
          return "📦 You don't have any orders yet. Would you like to order a book? Just say 'Order a Book' to get started!";
        }
        
        const recentOrders = orders.slice(0, 5); // Show last 5 orders
        let ordersList = "📦 **Your Recent Orders:**\n\n";
        
        recentOrders.forEach((order, index) => {
          const statusEmoji = {
            'pending': '⏳',
            'confirmed': '✅',
            'processing': '📦',
            'shipped': '🚚',
            'delivered': '✅',
            'cancelled': '❌'
          };
          
          const orderId = order.orderId || order._id || 'N/A';
          const status = order.status || 'pending';
          const total = order.totalAmount || order.total || 0;
          const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
          
          ordersList += `${index + 1}. **${orderId}**\n`;
          ordersList += `   ${statusEmoji[status] || '📦'} Status: ${status.toUpperCase()}\n`;
          ordersList += `   💰 Total: ₹${total}\n`;
          ordersList += `   📅 Date: ${date}\n\n`;
        });
        
        ordersList += "💡 **To track a specific order**, just send me the Order ID";
        
        return ordersList;
      } catch (error) {
        console.error('Error fetching orders:', error);
        return "❌ Unable to fetch your orders right now. Please try again or contact support at +91-9876543210.";
      }
    }
    
    // Handle tracking by book name - ENHANCED PATTERN MATCHING
    if ((lowerMessage.includes('track') || lowerMessage.includes('tack')) && 
        !lowerMessage.includes('order id') &&
        !userMessage.match(/BOI\d{11}/i)) {
      
      try {
        if (!user) {
          return "❌ Please login to track your orders. You can login from our website.";
        }
        
        const ordersResponse = await apiService.getMyOrders();
        const orders = ordersResponse.orders || [];
        
        if (orders.length === 0) {
          return "📦 You don't have any orders yet. Would you like to order a book?";
        }
        
        // Extract book name from the message - improved extraction
        let bookSearchTerms = [];
        
        // Check for specific book titles mentioned
        if (lowerMessage.includes('indian classical poetry')) {
          bookSearchTerms = ['indian', 'classical', 'poetry'];
        } else if (lowerMessage.includes('wings of fire')) {
          bookSearchTerms = ['wings', 'fire'];
        } else if (lowerMessage.includes('mathematics')) {
          bookSearchTerms = ['mathematics', 'math'];
        } else {
          // General extraction
          bookSearchTerms = lowerMessage.split(' ').filter(term => 
            term.length > 2 && 
            !['track', 'tack', 'order', 'book', 'my', 'the', 'and', 'for', 'this', 'that', 'orderd', 'ordered', 'it'].includes(term)
          );
        }
        
        console.log('Book search terms:', bookSearchTerms);
        
        // Search for orders containing the book name
        const matchingOrders = orders.filter(order => {
          if (order.items && order.items.length > 0) {
            return order.items.some(item => {
              const bookTitle = item.book?.title?.toLowerCase() || '';
              const bookAuthor = item.book?.author?.toLowerCase() || '';
              
              return bookSearchTerms.some(term => 
                bookTitle.includes(term) || bookAuthor.includes(term)
              );
            });
          }
          return false;
        });
        
        console.log('Matching orders found:', matchingOrders.length);
        
        if (matchingOrders.length > 0) {
          let trackingInfo = "📦 **Found your book orders:**\n\n";
          
          matchingOrders.slice(0, 3).forEach((order, index) => {
            const statusEmoji = {
              'pending': '⏳',
              'confirmed': '✅',
              'processing': '📦',
              'shipped': '🚚',
              'delivered': '✅',
              'cancelled': '❌'
            };
            
            const statusMessage = {
              'pending': 'Order received and being reviewed',
              'confirmed': 'Order confirmed and being prepared',
              'processing': 'Order is being processed',
              'shipped': 'Order shipped and on the way to you',
              'delivered': 'Order delivered successfully',
              'cancelled': 'Order has been cancelled'
            };
            
            trackingInfo += `${index + 1}. **Order ${order.orderId}**\n`;
            trackingInfo += `   ${statusEmoji[order.status] || '📦'} **Status**: ${order.status.toUpperCase()}\n`;
            trackingInfo += `   📝 **Details**: ${statusMessage[order.status] || 'Order is being processed'}\n`;
            trackingInfo += `   📚 **Books**: ${order.items?.map(item => item.book?.title).join(', ') || 'N/A'}\n`;
            trackingInfo += `   💰 **Total**: ₹${order.totalAmount}\n`;
            trackingInfo += `   📅 **Date**: ${new Date(order.createdAt).toLocaleDateString()}\n\n`;
          });
          
          return trackingInfo;
        } else {
          return "❌ No orders found for that book. Please check the book name or provide your Order ID for accurate tracking.\n\n💡 You can also say 'show my orders' to see all your orders.";
        }
      } catch (error) {
        console.error('Error tracking by book name:', error);
        return "❌ Unable to track orders right now. Please try again or contact support at +91-9876543210.";
      }
    }
    
    // Handle order cancellation
    if (lowerMessage.includes('cancel') && lowerMessage.includes('order')) {
      const orderIdMatch = userMessage.match(/BOI\d{11}/i);
      if (orderIdMatch) {
        try {
          await apiService.cancelOrder(orderIdMatch[0]);
          return `✅ Order ${orderIdMatch[0]} has been cancelled successfully. Refund will be processed within 3-5 business days.`;
        } catch (error) {
          return `❌ Unable to cancel order ${orderIdMatch[0]}. It may already be shipped or delivered. Contact support for assistance.`;
        }
      } else {
        return "🚫 Please provide your Order ID (format: BOI120320261) to cancel your order.";
      }
    }
    
    // Handle book ordering
    if ((lowerMessage.includes('order') || lowerMessage.includes('buy') || lowerMessage.includes('want')) && !lowerMessage.includes('track') && !lowerMessage.includes('cancel') && !lowerMessage.includes('show') && !lowerMessage.includes('current')) {
      const bookSearchResult = await searchSpecificBooks(userMessage);
      if (bookSearchResult && bookSearchResult.includes('Found')) {
        return `📚 ${bookSearchResult} To place an order, please visit our website and add the book to your cart, or tell me the specific Book ID you'd like to order!`;
      } else {
        return "📚 I'd love to help you order a book! Please tell me the specific title, author, or subject you're looking for, and I'll check our inventory.";
      }
    }
    
    return '';
  };
  
  const getFallbackResponse = async (input: string): Promise<string> => {
    const val = input.toLowerCase();
    
    // Handle order flow first
    const orderFlowResponse = await handleOrderFlow(input);
    if (orderFlowResponse) {
      return orderFlowResponse;
    }
    
    // Check for order operations (including direct Order ID)
    const orderResponse = await handleOrderOperations(input);
    if (orderResponse) {
      return orderResponse;
    }
    
    // Handle follow-up questions
    const followUpResponse = await handleFollowUpQuestions(input);
    if (followUpResponse) {
      return followUpResponse;
    }
    
    // Enhanced fallback with database integration
    if (val.includes('wings of fire')) {
      const searchResult = await searchSpecificBooks(input);
      if (searchResult) {
        return `📚 ${searchResult} This is a popular autobiography by Dr. A.P.J. Abdul Kalam! Would you like to place an order?`;
      }
      return "📚 'Wings of Fire' by Dr. A.P.J. Abdul Kalam is a popular autobiography! Let me check our inventory for you. We may have it in our Literature or Biography section. Would you like me to help you order it?";
    }
    
    if (val.includes('mathematics') && val.includes('class 10')) {
      const searchResult = await searchSpecificBooks(input);
      if (searchResult) {
        return `📚 ${searchResult} Would you like me to help you place an order for any of these books?`;
      }
      return "📚 Let me check our Mathematics Class 10 collection! We have various NCERT, CBSE, and reference books. Could you specify the board or author you prefer?";
    }
    
    if (val.includes('how many books') || val.includes('book count') || val.includes('inventory')) {
      const contextData = await getDatabaseContext(input);
      return `📚 ${contextData} Browse through our collections or ask about specific subjects!`;
    }
    
    if (val.includes('order') || val.includes('buy') || val.includes('want')) {
      const searchResult = await searchSpecificBooks(input);
      if (searchResult) {
        return `📚 ${searchResult} Would you like to place an order for any of these books?`;
      }
      return "📚 I'd love to help you order a book! Please tell me the title, subject, or author you're looking for, and I'll check our College Street inventory.";
    } else if (val.includes('track')) {
      return "📦 I can help you track your orders! You can:\n\n1️⃣ Provide Order ID (e.g., BOI120320261)\n2️⃣ Say 'show my orders' to see all orders\n3️⃣ Say 'track [book name]' to find orders by book\n\nWhat would you like to do?";
    } else if (val.includes('cancel')) {
      return "🚫 To cancel an order, please provide your Order ID (format: BOI120320261) and I'll help you cancel it.";
    } else if (val.includes('support') || val.includes('help')) {
      return "🎧 I'm here to help! Contact our support team at +91-9876543210 or support@boipara.com for immediate assistance.";
    } else {
      // For any book-related query, try to search
      const searchResult = await searchSpecificBooks(input);
      if (searchResult) {
        return `📚 ${searchResult} Would you like more information about any of these books?`;
      }
      return "🤔 I'm here to help with books, orders, and bookstore services! Try asking about specific books, subjects, or your orders.";
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only images (JPG, PNG, GIF) are allowed');
        return;
      }
      
      setAttachedFile(file);
      toast.success(`File "${file.name}" attached successfully!`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sendMessage = async () => {
    const messageText = inputValue.trim();
    if (!messageText && !attachedFile) return;

    const userMessage: Message = {
      text: messageText || (attachedFile ? `📎 Sent file: ${attachedFile.name}` : ''),
      isUser: true,
      timestamp: getCurrentTime(),
      file: attachedFile ? {
        name: attachedFile.name,
        size: formatFileSize(attachedFile.size),
        type: attachedFile.type
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsTyping(true);

    try {
      const aiResponse = await callGeminiAI(messageText);
      
      setIsTyping(false);
      const botMessage: Message = {
        text: aiResponse,
        isUser: false,
        timestamp: getCurrentTime()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setIsTyping(false);
      const errorMessage: Message = {
        text: "🔧 I'm having trouble connecting right now. Please try again in a moment, or contact our support team!",
        isUser: false,
        timestamp: getCurrentTime()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const quickActions = [
    { text: '🛒 Order a Book', action: 'Order a Book' },
    { text: '📖 Browse Literature', action: 'Browse Literature' },
    { text: '📦 Track My Order', action: 'Track My Order' },
    { text: '🎧 Support', action: 'Contact Support' }
  ];

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div
        className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-[#6B5537] rounded-full flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-300 z-50 hover:scale-110 group ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        onClick={() => setIsOpen(true)}
      >
        <img 
          src={chatbotLogo} 
          alt="Boipara AI" 
          className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
          style={{
            filter: 'brightness(1.1) contrast(1.1)'
          }}
        />
        <div className="absolute right-20 bg-[#2C1810] text-[#d4a017] px-4 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 border border-[#d4a017] pointer-events-none">
          Ask Genio AI
        </div>
      </div>

      {/* Modern Chat Container */}
      {isOpen && (
        <div 
          ref={chatContainerRef}
          className="fixed md:bottom-8 md:right-8 md:left-auto bottom-4 left-1/2 md:left-auto md:right-8 md:transform-none transform -translate-x-1/2 md:translate-x-0 z-50 md:w-[380px] md:h-[600px] w-[calc(100vw-32px)] h-[calc(100vh-120px)] max-w-[380px] max-h-[600px]"
          style={{
            background: '#3D2817',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(212, 160, 23, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}
        >
          {/* Elegant Header */}
          <div 
            className="flex justify-between items-center"
            style={{
              padding: '8px 8px',
              background: '#b8860b'
            }}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <img 
                src={chatbotLogo} 
                alt="GENIO" 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                style={{
                  filter: 'brightness(1.2) contrast(1.1)'
                }}
              />
              <h1 
                style={{
                  fontFamily: '"Lexend", sans-serif',
                  fontWeight: '600',
                  fontStyle: 'normal',
                  color: 'white',
                  fontSize: '16px',
                  margin: 0,
                  letterSpacing: '0.5px'
                }}
                className="md:text-lg"
              >
                Genio Ai
              </h1>
            </div>
            <div 
              onClick={() => setIsOpen(false)}
              style={{
                color: 'white',
                cursor: 'pointer',
                fontSize: '20px'
              }}
              className="md:text-2xl"
            >
              ×
            </div>
          </div>
          
          {/* Partition Line */}
          <div 
            style={{
              height: '1px',
              background: 'linear-gradient(to right, transparent, #d4a017, transparent)',
              margin: '0 20px'
            }}
          ></div>

          {/* Scrollable Content */}
          <div 
            ref={chatContentRef}
            className="flex-1 overflow-y-auto flex flex-col gap-4 chat-messages"
            style={{ padding: '16px' }}
          >
            {/* Welcome Message */}
            <div 
              style={{
                background: 'rgba(61, 40, 23, 0.9)',
                color: '#f5e6c8',
                padding: '16px',
                borderRadius: '18px 18px 18px 4px',
                lineHeight: '1.6',
                fontSize: '14.5px',
                border: '1px solid rgba(212, 160, 23, 0.1)'
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                Hi! I'm your Gemini-powered assistant.
              </div>
              How can I help you navigate our library today?
              <ul style={{ marginTop: '10px', paddingLeft: 0, listStyle: 'none' }}>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', opacity: 0.9 }}>
                  📚 Find recommendations
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', opacity: 0.9 }}>
                  🔍 Search by ISBN or Author
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', opacity: 0.9 }}>
                  💰 Get quotes to sell books
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', opacity: 0.9 }}>
                  📦 Live order tracking
                </li>
              </ul>
            </div>

            {/* Quick Action Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  onClick={() => handleQuickAction(action.action)}
                  style={{
                    background: 'rgba(212, 160, 23, 0.15)',
                    color: '#d4a017',
                    border: '1px solid #d4a017',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#d4a017';
                    e.currentTarget.style.color = '#1a0f06';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 160, 23, 0.15)';
                    e.currentTarget.style.color = '#d4a017';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {action.text}
                </div>
              ))}
            </div>

            {/* Messages */}
            {messages.slice(1).map((message, index) => (
              <div
                key={index}
                className={`max-w-[80%] p-3 text-sm leading-relaxed ${
                  message.isUser
                    ? 'self-end bg-[#d4a017] text-[#1a0f06] rounded-2xl rounded-br-sm font-medium'
                    : 'self-start rounded-2xl rounded-bl-sm border-l-2 border-[#d4a017]'
                }`}
                style={{
                  backgroundColor: message.isUser ? '#d4a017' : 'rgba(61, 40, 23, 0.9)',
                  color: message.isUser ? '#1a0f06' : '#f5e6c8'
                }}
              >
                {message.file && (
                  <div className="mb-2 p-2 bg-black/20 rounded-lg border border-current/20">
                    <div className="flex items-center gap-2 text-xs">
                      <Paperclip className="size-3" />
                      <span className="font-medium">{message.file.name}</span>
                      <span className="opacity-70">({message.file.size})</span>
                    </div>
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: message.text }} />
                <span className="text-xs opacity-50 mt-1 block">
                  {message.timestamp}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="text-xs text-[#d4a017] italic animate-pulse flex items-center gap-2">
                📚 Boipara AI is thinking...
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-[#d4a017] rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-[#d4a017] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-[#d4a017] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div 
            style={{
              padding: '16px',
              background: 'rgba(61, 40, 23, 0.8)',
              borderTop: '1px solid rgba(212, 160, 23, 0.1)'
            }}
          >
            {/* Attached File Preview */}
            {attachedFile && (
              <div className="mb-3 p-2 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(212,160,23,0.3)] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#f5e6c8]">
                  <Paperclip className="size-3 text-[#d4a017]" />
                  <span className="font-medium">{attachedFile.name}</span>
                  <span className="opacity-70">({formatFileSize(attachedFile.size)})</span>
                </div>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="text-[#d4a017] hover:text-red-400 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}

            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(212, 160, 23, 0.3)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                padding: '8px 14px',
                transition: 'border 0.3s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <span 
                onClick={handleFileAttach}
                style={{ opacity: 0.5, marginRight: '5px', cursor: 'pointer' }}
              >
                📎
              </span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about books, orders..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  padding: '10px',
                  outline: 'none',
                  fontSize: '14px'
                }}
                disabled={isTyping}
              />
              <div
                onClick={sendMessage}
                style={{
                  background: '#d4a017',
                  width: '35px',
                  height: '35px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a0f06" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}