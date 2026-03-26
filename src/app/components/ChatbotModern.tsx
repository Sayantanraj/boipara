import { useState, useRef, useEffect } from 'react';
import { X, Send, Paperclip, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
// Updated to use chatbot_logo1.png
import chatbotLogo from '../../assets/chatbot_logo1.png';

// Add Google Font import for Bitcount Grid Double Ink, Lexend, and Momo Signature
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Bitcount+Grid+Double+Ink:wght@100..900&family=Lexend:wght@100..900&family=Momo+Signature&family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@300;400;500&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector(`link[href="${fontLink.href}"]`)) {
  document.head.appendChild(fontLink);
}

// Add marked.js and highlight.js libraries
const markedScript = document.createElement('script');
markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
markedScript.async = true;
if (!document.head.querySelector('script[src*="marked"]')) {
  document.head.appendChild(markedScript);
}

const highlightCSS = document.createElement('link');
highlightCSS.rel = 'stylesheet';
highlightCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
if (!document.head.querySelector('link[href*="highlight.js"]')) {
  document.head.appendChild(highlightCSS);
}

const highlightScript = document.createElement('script');
highlightScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
highlightScript.async = true;
if (!document.head.querySelector('script[src*="highlight.min.js"]')) {
  document.head.appendChild(highlightScript);
}

// Add custom styles for markdown formatting
const customStyles = document.createElement('style');
customStyles.textContent = `
  .bot-message {
    font-family: 'Inter', sans-serif;
    line-height: 1.6;
  }
  
  .bot-message pre {
    background: #1e1e1e !important;
    color: #d4d4d4 !important;
    padding: 12px !important;
    border-radius: 8px !important;
    overflow-x: auto !important;
    margin: 10px 0 !important;
    position: relative;
  }
  
  .bot-message code {
    font-family: 'Fira Code', monospace !important;
    font-size: 0.9em !important;
  }
  
  .bot-message p {
    margin-bottom: 1rem;
  }
  
  .bot-message h1, .bot-message h2, .bot-message h3 {
    margin: 1.5rem 0 1rem 0;
    font-weight: 600;
  }
  
  .bot-message ul, .bot-message ol {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }
  
  .bot-message li {
    margin-bottom: 0.5rem;
  }
  
  .bot-message blockquote {
    border-left: 4px solid #d4a017;
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    opacity: 0.9;
  }
  
  .copy-button {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(212, 160, 23, 0.8);
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    color: white;
    font-size: 12px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .bot-message pre:hover .copy-button {
    opacity: 1;
  }
  
  .copy-button:hover {
    background: rgba(212, 160, 23, 1);
  }
`;
if (!document.head.querySelector('style[data-chatbot-styles]')) {
  customStyles.setAttribute('data-chatbot-styles', 'true');
  document.head.appendChild(customStyles);
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
      text: `Hi! I'm your BOIPARA AI Assistant, trained specifically on our bookstore data.<br/>I can help you with books, orders, and everything about BOIPARA!<br/><br/>🔒 <strong>Privacy Protected:</strong> I only access your order history and book preferences - never passwords or sensitive data.`,
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

  // Format bot response with markdown
  const formatBotResponse = (rawText: string): string => {
    try {
      // Check if marked is available
      if (typeof window !== 'undefined' && (window as any).marked) {
        const htmlOutput = (window as any).marked.parse(rawText);
        return htmlOutput;
      }
      // Fallback: basic formatting
      return rawText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: rgba(212, 160, 23, 0.1); padding: 2px 4px; border-radius: 3px; font-family: \'Fira Code\', monospace;">$1</code>')
        .replace(/\n/g, '<br/>');
    } catch (error) {
      console.error('Error formatting markdown:', error);
      return rawText.replace(/\n/g, '<br/>');
    }
  };

  // Add copy functionality for code blocks
  const addCopyButtons = (element: HTMLElement) => {
    const codeBlocks = element.querySelectorAll('pre');
    codeBlocks.forEach((block) => {
      if (!block.querySelector('.copy-button')) {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = 'Copy';
        copyButton.onclick = () => {
          const code = block.querySelector('code')?.textContent || block.textContent || '';
          navigator.clipboard.writeText(code).then(() => {
            copyButton.innerHTML = 'Copied!';
            setTimeout(() => {
              copyButton.innerHTML = 'Copy';
            }, 2000);
          });
        };
        block.style.position = 'relative';
        block.appendChild(copyButton);
      }
    });
  };

  // Trigger syntax highlighting
  const highlightCode = () => {
    if (typeof window !== 'undefined' && (window as any).hljs) {
      (window as any).hljs.highlightAll();
    }
  };

  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Enhanced useEffect for markdown processing
  useEffect(() => {
    scrollToBottom();
    
    // Add copy buttons and highlight code after messages update
    setTimeout(() => {
      if (chatContentRef.current) {
        const botMessages = chatContentRef.current.querySelectorAll('.bot-message');
        botMessages.forEach((message) => {
          addCopyButtons(message as HTMLElement);
        });
        highlightCode();
      }
    }, 100);
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
      
      // Get comprehensive BOIPARA database context with role-based filtering
      let boiparaContext = await getBoiparaProjectContext(userMessage);
      
      // Check for specific book searches
      const bookSearchResult = await searchSpecificBooks(userMessage);
      if (bookSearchResult) {
        boiparaContext += ` ${bookSearchResult}`;
      }
      
      // Role-based system prompt
      const isCustomer = !user || user.role === 'customer';
      const isAdmin = user && user.role === 'admin';
      const isSeller = user && user.role === 'seller';
      
      let roleContext = '';
      if (isAdmin) {
        roleContext = 'You are responding to an ADMIN user. Provide comprehensive system information including user management, seller details, order analytics, returns, buyback data, and full database statistics.';
      } else if (isSeller) {
        roleContext = 'You are responding to a SELLER user. Provide seller-relevant information including inventory management, order processing, and sales analytics.';
      } else {
        roleContext = 'You are responding to a CUSTOMER. Only provide customer-relevant information.';
      }
      
      const prompt = `You are BOIPARA AI Assistant (Genio AI), an intelligent chatbot trained specifically on the BOIPARA online bookstore project.

${roleContext}

IMPORTANT TRAINING GUIDELINES:
- You ONLY provide information about BOIPARA project and its features
- You fetch ALL information from the BOIPARA database (books, orders, categories, etc.)
- You DO NOT provide any private/sensitive information (user passwords, API keys, etc.)
- You DO NOT discuss other companies, competitors, or unrelated topics
- You focus ONLY on helping with BOIPARA services
- **ALWAYS respond using Markdown formatting**
- **For code snippets, always use triple backticks with the language name (e.g., \`\`\`python)**
- Use **bold** for emphasis, *italics* for subtle emphasis
- Use bullet points and numbered lists for better readability
- Use headers (##) for section organization when appropriate

${isCustomer ? `
CUSTOMER-ONLY RESTRICTIONS:
- DO NOT mention admin panel, admin dashboard, or admin features
- DO NOT discuss seller management, seller onboarding, or seller tools
- DO NOT provide backend technical details, database schemas, or API information
- DO NOT mention user roles, permissions, or access levels
- DO NOT discuss system administration, server management, or technical infrastructure
- FOCUS ONLY on customer services: browsing books, ordering, tracking, support, returns
- If asked about admin/seller features, redirect to customer services
` : ''}

${isAdmin ? `
ADMIN FULL ACCESS:
- Provide complete system statistics and analytics
- Share user management data (total users, customers, sellers)
- Provide order analytics (total orders, revenue, status breakdown)
- Share return management data
- Provide buyback request and order statistics
- Share seller performance data
- Provide database insights and system health information
- Answer questions about admin dashboard features
- Provide detailed breakdowns when requested
` : ''}

${isSeller ? `
SELLER ACCESS:
- Provide seller inventory management information
- Share seller order processing data
- Provide sales analytics and performance metrics
- Share buyback purchasing information
` : ''}

BOIPARA PROJECT INFORMATION:
- Name: BOIPARA ("From College Street to Your Doorstep")
- Specialty: Online bookstore featuring books from College Street, Kolkata
- Categories: Engineering, Medical, Literature, Mathematics, Competitive Exams, Rare & Vintage
- Services: Book ${isCustomer ? 'browsing, purchasing' : 'selling'}, Order tracking, Customer support${isAdmin ? ', User management, System administration' : ''}
- ${isCustomer ? 'Customer' : isAdmin ? 'Admin' : 'Seller'} Features: ${isCustomer ? 'Book search, Shopping cart, Wishlist, Order history, Account management' : isAdmin ? 'User management, Seller management, Order management, Return management, Buyback management, System analytics, Dashboard access' : 'Book listing, Inventory management, Order processing, Sales analytics'}
- Delivery: Free delivery across India (3-5 business days)
- Payment: UPI, Cards, Net Banking, Cash on Delivery (COD)
- Return Policy: 7-day return policy
- Price Range: ₹200-₹2000 for most textbooks
- ${isCustomer ? 'Customer Support' : 'Contact'}: support@boipara.com, +91-9876543210
- Hours: Mon-Sat 9 AM - 8 PM
- Order ID Format: BOI + date + number (e.g., BOI120320261)

REAL-TIME BOIPARA DATABASE DATA:
${boiparaContext}

USER QUERY: "${userMessage}"

${isCustomer ? 'CUSTOMER-FOCUSED' : isAdmin ? 'ADMIN-FOCUSED' : 'SELLER-FOCUSED'} RESPONSE RULES:
1. If user asks about BOIPARA features, focus on ${isCustomer ? 'customer-facing' : isAdmin ? 'admin dashboard and system' : 'seller'} features
2. If user asks about books, provide book ${isCustomer ? 'browsing and purchasing' : isAdmin ? 'inventory and management' : 'listing and sales'} information
3. If user asks about orders, help with order ${isCustomer ? 'tracking and management' : isAdmin ? 'analytics and system-wide data' : 'processing'}
4. If user asks about categories, list available book categories
5. If user asks about pricing, provide book prices and payment options
6. If user asks about delivery, provide delivery information
7. If user asks about returns/refunds, explain return policy${isAdmin ? ' and provide return management data' : ''}
8. If user asks about contact, provide ${isCustomer ? 'customer support' : 'contact'} information
${isCustomer ? '9. If user asks about admin/seller features, politely redirect to customer services' : ''}
${isAdmin ? '9. If user asks about users, provide total user counts, customer/seller breakdown' : ''}
${isAdmin ? '10. If user asks about dashboard, provide comprehensive admin dashboard statistics' : ''}
${isAdmin ? '11. If user asks about revenue, orders, returns, buybacks - provide detailed analytics' : ''}
12. If user asks about something NOT related to BOIPARA, politely redirect to BOIPARA services
13. NEVER provide private information like passwords, API keys, technical credentials
14. NEVER discuss competitors or other bookstore platforms
15. **Format all responses using proper Markdown syntax**
16. Always maintain a ${isCustomer ? 'customer service' : isAdmin ? 'professional administrative' : 'business'} tone

Respond as BOIPARA AI Assistant (Genio AI) using ${isCustomer ? 'customer-relevant' : isAdmin ? 'comprehensive admin' : 'seller-relevant'} BOIPARA information with proper Markdown formatting.`;

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
      return await getBoiparaFallbackResponse(userMessage);
    }
  };

  // Handle complete order flow
  const handleOrderFlow = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for cancellation keywords - enhanced detection
    const cancellationKeywords = [
      'cancel', 'stop', 'quit', 'exit', 'no thanks', 'not interested',
      'don\'t want', 'not purchase', 'not buy', 'changed my mind',
      'thinking not', 'don\'t need', 'not ordering', 'abort'
    ];
    if (cancellationKeywords.some(keyword => lowerMessage.includes(keyword))) {
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
      return "❌ Order cancelled. No worries! Is there anything else I can help you with? You can always browse our books or ask me any questions about BOIPARA.";
    }
    
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
          // Enhanced validation for address vs cancellation
          const addressCancellationCheck = [
            'not purchase', 'don\'t want', 'changed mind', 'thinking not',
            'not buy', 'cancel', 'abort', 'stop'
          ];
          
          if (addressCancellationCheck.some(phrase => lowerMessage.includes(phrase))) {
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
            return "❌ I understand you've changed your mind about purchasing. No problem at all! Is there anything else I can help you with? You can browse other books or ask me questions about BOIPARA.";
          }
          
          // Validate if it's actually an address (should contain some address elements)
          const addressElements = ['house', 'flat', 'street', 'road', 'city', 'pin', 'phone', 'area', 'block', 'sector'];
          const hasAddressElements = addressElements.some(element => lowerMessage.includes(element)) || 
                                   userMessage.length > 20 || // Reasonable address length
                                   /\d/.test(userMessage); // Contains numbers (likely address)
          
          if (!hasAddressElements && userMessage.length < 15) {
            return "📍 Please provide a complete delivery address including:\n- Name\n- House/Flat number\n- Street/Area\n- City, State\n- PIN code\n- Phone number\n\nOr type 'cancel' if you don't want to proceed with the order.";
          }
          
          setOrderFlow({
            ...orderFlow,
            step: 'payment',
            address: userMessage.trim()
          });
          return `📍 Address saved successfully!\n\nNow, please choose your payment method:\n\n1️⃣ **COD (Cash on Delivery)** - Pay when you receive\n2️⃣ **UPI** - Pay online via UPI\n3️⃣ **Card** - Credit/Debit card payment\n4️⃣ **Net Banking** - Online banking\n\nJust type the number (1, 2, 3, or 4) or the payment method name.`;
          
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
  
  // Enhanced BOIPARA project context fetching with role-based filtering and admin access
  const getBoiparaProjectContext = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    let boiparaContext = '';
    
    // Check if user is customer (default), admin, or seller
    const isCustomer = !user || user.role === 'customer';
    const isAdmin = user && user.role === 'admin';
    const isSeller = user && user.role === 'seller';
    
    try {
      // Always fetch some basic BOIPARA inventory data
      const booksResponse = await apiService.getBooksInitial(100);
      const books = booksResponse.books || [];
      const totalBooks = books.length;
      const categories = [...new Set(books.map(book => book.category))].filter(Boolean);
      const priceRange = books.length > 0 ? {
        min: Math.min(...books.map(b => b.price)),
        max: Math.max(...books.map(b => b.price))
      } : { min: 200, max: 2000 };
      
      // ADMIN: Fetch comprehensive system data
      if (isAdmin) {
        try {
          // Fetch all admin dashboard data
          const [usersData, sellersData, ordersData, returnsData, buybackRequestsData, buybackOrdersData] = await Promise.all([
            apiService.getAllUsers().catch(() => []),
            apiService.getAllSellers().catch(() => []),
            apiService.getAllOrders().catch(() => []),
            apiService.getAllReturns().catch(() => []),
            apiService.getAllBuybackRequests().catch(() => []),
            apiService.getAllBuybackOrders().catch(() => [])
          ]);
          
          const totalUsers = usersData.length || 0;
          const totalSellers = sellersData.length || 0;
          const totalCustomers = usersData.filter(u => u.role === 'customer').length || 0;
          const totalOrders = ordersData.length || 0;
          const totalReturns = returnsData.length || 0;
          const totalBuybackRequests = buybackRequestsData.length || 0;
          const totalBuybackOrders = buybackOrdersData.length || 0;
          
          // Calculate revenue
          const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          
          // Order status breakdown
          const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
          const confirmedOrders = ordersData.filter(o => o.status === 'confirmed').length;
          const shippedOrders = ordersData.filter(o => o.status === 'shipped').length;
          const deliveredOrders = ordersData.filter(o => o.status === 'delivered').length;
          const cancelledOrders = ordersData.filter(o => o.status === 'cancelled').length;
          
          // Buyback status breakdown
          const pendingBuybacks = buybackRequestsData.filter(b => b.status === 'pending').length;
          const approvedBuybacks = buybackRequestsData.filter(b => b.status === 'approved').length;
          const rejectedBuybacks = buybackRequestsData.filter(b => b.status === 'rejected').length;
          
          boiparaContext = `ADMIN DASHBOARD DATA:
- Total Books: ${totalBooks} (Categories: ${categories.join(', ')})
- Total Users: ${totalUsers} (Customers: ${totalCustomers}, Sellers: ${totalSellers}, Admins: ${totalUsers - totalCustomers - totalSellers})
- Total Orders: ${totalOrders} (Pending: ${pendingOrders}, Confirmed: ${confirmedOrders}, Shipped: ${shippedOrders}, Delivered: ${deliveredOrders}, Cancelled: ${cancelledOrders})
- Total Revenue: ₹${totalRevenue}
- Total Returns: ${totalReturns}
- Buyback Requests: ${totalBuybackRequests} (Pending: ${pendingBuybacks}, Approved: ${approvedBuybacks}, Rejected: ${rejectedBuybacks})
- Buyback Orders: ${totalBuybackOrders}
- Price Range: ₹${priceRange.min}-₹${priceRange.max}
- System Status: Operational`;
          
        } catch (error) {
          console.error('Error fetching admin dashboard data:', error);
          boiparaContext = `ADMIN INVENTORY: ${totalBooks} books available. Categories: ${categories.join(', ')}. Price range: ₹${priceRange.min}-₹${priceRange.max}.`;
        }
      } else {
        // Customer/Seller view
        boiparaContext = `BOIPARA CUSTOMER INVENTORY: ${totalBooks} books available for purchase. Categories: ${categories.join(', ')}. Price range: ₹${priceRange.min}-₹${priceRange.max}.`;
      }
      
      // Add category-specific information if mentioned
      if (lowerMessage.includes('engineering') || lowerMessage.includes('medical') || 
          lowerMessage.includes('literature') || lowerMessage.includes('mathematics') || 
          lowerMessage.includes('competitive') || lowerMessage.includes('exam')) {
        
        const categoryBooks = books.filter(book => {
          const bookTitle = book.title?.toLowerCase() || '';
          const bookCategory = book.category?.toLowerCase() || '';
          
          return bookTitle.includes('engineering') || bookCategory.includes('engineering') ||
                 bookTitle.includes('medical') || bookCategory.includes('medical') ||
                 bookTitle.includes('literature') || bookCategory.includes('literature') ||
                 bookTitle.includes('mathematics') || bookTitle.includes('math') ||
                 bookTitle.includes('competitive') || bookTitle.includes('exam');
        });
        
        if (categoryBooks.length > 0) {
          const sampleBooks = categoryBooks.slice(0, 5).map(book => 
            `"${book.title}" by ${book.author} (₹${book.price})`
          ).join(', ');
          boiparaContext += ` CATEGORY BOOKS: Found ${categoryBooks.length} books. Examples: ${sampleBooks}.`;
        }
      }
      
      // Add user-specific data if available and relevant
      if (user && (lowerMessage.includes('my') || lowerMessage.includes('order') || lowerMessage.includes('account'))) {
        try {
          const ordersResponse = await apiService.getMyOrders();
          const orders = ordersResponse.orders || [];
          boiparaContext += ` USER ACCOUNT: You have ${orders.length} orders in your BOIPARA account.`;
          
          if (orders.length > 0) {
            const recentOrder = orders[0];
            const orderStatus = recentOrder.status || 'pending';
            boiparaContext += ` Most recent order status: ${orderStatus}.`;
          }
        } catch (error) {
          console.error('Error fetching user orders for context:', error);
        }
      }
      
      // Add BOIPARA features context based on role
      if (lowerMessage.includes('feature') || lowerMessage.includes('service') || 
          lowerMessage.includes('what') || lowerMessage.includes('about')) {
        if (isCustomer) {
          boiparaContext += ` CUSTOMER FEATURES: Book browsing and search, Shopping cart, Wishlist, Order tracking, Account management, Customer support, Mobile responsive design.`;
        } else if (isAdmin) {
          boiparaContext += ` ADMIN FEATURES: User management, Seller management, Order management, Return management, Buyback management, System analytics, Dashboard access, Full database control.`;
        } else if (isSeller) {
          boiparaContext += ` SELLER FEATURES: Book listing, Inventory management, Order processing, Sales analytics, Buyback purchasing.`;
        }
      }
      
      // Add delivery and payment information
      if (lowerMessage.includes('delivery') || lowerMessage.includes('shipping') || 
          lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
        boiparaContext += ` CUSTOMER SERVICES: Free delivery across India (3-5 days), Payment methods: UPI, Cards, Net Banking, COD. 7-day return policy for customers.`;
      }
      
      // Filter out admin/seller information for customers
      if (isCustomer && (lowerMessage.includes('admin') || lowerMessage.includes('seller') || lowerMessage.includes('dashboard'))) {
        boiparaContext += ` CUSTOMER FOCUS: BOIPARA chatbot provides customer support only. For business inquiries, contact support@boipara.com.`;
      }
      
    } catch (error) {
      console.error('Error fetching BOIPARA project context:', error);
      boiparaContext = 'BOIPARA is an online bookstore specializing in books from College Street, Kolkata with Engineering, Medical, Literature, and Rare & Vintage collections available for customers.';
    }
    
    return boiparaContext;
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
  
  const getBoiparaFallbackResponse = async (input: string): Promise<string> => {
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
    
    // Admin dashboard queries - comprehensive system information
    const isAdmin = user && user.role === 'admin';
    
    if (isAdmin && (val.includes('how many users') || val.includes('total users') || val.includes('user count'))) {
      try {
        const usersData = await apiService.getAllUsers();
        const totalUsers = usersData.length;
        const customers = usersData.filter(u => u.role === 'customer').length;
        const sellers = usersData.filter(u => u.role === 'seller').length;
        const admins = usersData.filter(u => u.role === 'admin').length;
        
        return `## 👥 BOIPARA User Statistics\n\n### Total Users: **${totalUsers}**\n\n#### User Breakdown:\n- 🛍️ **Customers:** ${customers} users\n- 🏪 **Sellers:** ${sellers} users\n- 🔑 **Admins:** ${admins} users\n\n#### User Distribution:\n\`\`\`\nCustomers: ${((customers/totalUsers)*100).toFixed(1)}%\nSellers:   ${((sellers/totalUsers)*100).toFixed(1)}%\nAdmins:    ${((admins/totalUsers)*100).toFixed(1)}%\n\`\`\`\n\n**System Status:** Active and operational`;
      } catch (error) {
        return '❌ Unable to fetch user data. Please check database connection.';
      }
    }
    
    if (isAdmin && (val.includes('dashboard') || val.includes('admin panel') || val.includes('system stats') || val.includes('overview'))) {
      try {
        const [usersData, ordersData, returnsData, buybackRequestsData, buybackOrdersData, booksData] = await Promise.all([
          apiService.getAllUsers().catch(() => []),
          apiService.getAllOrders().catch(() => []),
          apiService.getAllReturns().catch(() => []),
          apiService.getAllBuybackRequests().catch(() => []),
          apiService.getAllBuybackOrders().catch(() => []),
          apiService.getBooks({ limit: 1000 }).catch(() => ({ books: [] }))
        ]);
        
        const totalUsers = usersData.length;
        const totalCustomers = usersData.filter(u => u.role === 'customer').length;
        const totalSellers = usersData.filter(u => u.role === 'seller').length;
        const totalOrders = ordersData.length;
        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const totalBooks = booksData.books?.length || 0;
        const totalReturns = returnsData.length;
        const totalBuybackRequests = buybackRequestsData.length;
        const totalBuybackOrders = buybackOrdersData.length;
        
        const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
        const confirmedOrders = ordersData.filter(o => o.status === 'confirmed').length;
        const shippedOrders = ordersData.filter(o => o.status === 'shipped').length;
        const deliveredOrders = ordersData.filter(o => o.status === 'delivered').length;
        const cancelledOrders = ordersData.filter(o => o.status === 'cancelled').length;
        
        const pendingBuybacks = buybackRequestsData.filter(b => b.status === 'pending').length;
        const approvedBuybacks = buybackRequestsData.filter(b => b.status === 'approved').length;
        const rejectedBuybacks = buybackRequestsData.filter(b => b.status === 'rejected').length;
        
        return `## 📊 BOIPARA Admin Dashboard\n\n### 👥 User Management\n- **Total Users:** ${totalUsers}\n  - Customers: ${totalCustomers}\n  - Sellers: ${totalSellers}\n  - Admins: ${totalUsers - totalCustomers - totalSellers}\n\n### 📚 Book Inventory\n- **Total Books:** ${totalBooks}\n\n### 📦 Order Management\n- **Total Orders:** ${totalOrders}\n- **Total Revenue:** ₹${totalRevenue.toLocaleString()}\n\n#### Order Status:\n- Pending: ${pendingOrders}\n- Confirmed: ${confirmedOrders}\n- Shipped: ${shippedOrders}\n- Delivered: ${deliveredOrders}\n- Cancelled: ${cancelledOrders}\n\n### 🔄 Return Management\n- **Total Returns:** ${totalReturns}\n\n### 💰 Buyback System\n- **Buyback Requests:** ${totalBuybackRequests} (Pending: ${pendingBuybacks}, Approved: ${approvedBuybacks}, Rejected: ${rejectedBuybacks})\n- **Buyback Orders:** ${totalBuybackOrders}\n\n### 🟢 System Status\n**All systems operational**\n\n*Last updated: ${new Date().toLocaleString()}*`;
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return '❌ Unable to fetch complete dashboard data. Some services may be unavailable.';
      }
    }
    
    if (isAdmin && (val.includes('orders') || val.includes('customer orders') || val.includes('order details'))) {
      try {
        const ordersData = await apiService.getAllOrders();
        const totalOrders = ordersData.length;
        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
        const confirmedOrders = ordersData.filter(o => o.status === 'confirmed').length;
        const shippedOrders = ordersData.filter(o => o.status === 'shipped').length;
        const deliveredOrders = ordersData.filter(o => o.status === 'delivered').length;
        const cancelledOrders = ordersData.filter(o => o.status === 'cancelled').length;
        
        return `## 📦 Customer Orders Overview\n\n### Order Statistics:\n- **Total Orders:** ${totalOrders}\n- **Total Revenue:** ₹${totalRevenue.toLocaleString()}\n- **Average Order Value:** ₹${avgOrderValue.toFixed(2)}\n\n### Order Status Distribution:\n- Pending: ${pendingOrders} (${((pendingOrders/totalOrders)*100).toFixed(1)}%)\n- Confirmed: ${confirmedOrders} (${((confirmedOrders/totalOrders)*100).toFixed(1)}%)\n- Shipped: ${shippedOrders} (${((shippedOrders/totalOrders)*100).toFixed(1)}%)\n- Delivered: ${deliveredOrders} (${((deliveredOrders/totalOrders)*100).toFixed(1)}%)\n- Cancelled: ${cancelledOrders} (${((cancelledOrders/totalOrders)*100).toFixed(1)}%)\n\n### Recent Orders:\n${ordersData.slice(0, 5).map((order, i) => `${i+1}. Order ${order.orderId} - ₹${order.totalAmount} - ${order.status}`).join('\n')}\n\n**Need more details?** Ask about specific order statuses or revenue analytics.`;
      } catch (error) {
        return '❌ Unable to fetch order data. Please check database connection.';
      }
    }
    
    if (isAdmin && (val.includes('returns') || val.includes('return requests'))) {
      try {
        const returnsData = await apiService.getAllReturns();
        const totalReturns = returnsData.length;
        const pendingReturns = returnsData.filter(r => r.status === 'pending').length;
        const approvedReturns = returnsData.filter(r => r.status === 'approved').length;
        const rejectedReturns = returnsData.filter(r => r.status === 'rejected').length;
        const completedReturns = returnsData.filter(r => r.status === 'completed').length;
        
        return `## 🔄 Return Management\n\n### Return Statistics:\n- **Total Returns:** ${totalReturns}\n\n### Status Breakdown:\n- Pending: ${pendingReturns}\n- Approved: ${approvedReturns}\n- Rejected: ${rejectedReturns}\n- Completed: ${completedReturns}\n\n### Recent Returns:\n${returnsData.slice(0, 5).map((ret, i) => `${i+1}. Return #${ret._id?.substring(0, 8)} - Status: ${ret.status}`).join('\n')}\n\n**Action Required:** ${pendingReturns} pending returns need review.`;
      } catch (error) {
        return '❌ Unable to fetch return data. Please check database connection.';
      }
    }
    
    if (isAdmin && (val.includes('buyback') || val.includes('buyback requests') || val.includes('buyback orders'))) {
      try {
        const [buybackRequestsData, buybackOrdersData] = await Promise.all([
          apiService.getAllBuybackRequests(),
          apiService.getAllBuybackOrders()
        ]);
        
        const totalRequests = buybackRequestsData.length;
        const pendingRequests = buybackRequestsData.filter(b => b.status === 'pending').length;
        const approvedRequests = buybackRequestsData.filter(b => b.status === 'approved').length;
        const rejectedRequests = buybackRequestsData.filter(b => b.status === 'rejected').length;
        const totalOrders = buybackOrdersData.length;
        
        return `## 💰 Buyback System Overview\n\n### Buyback Requests:\n- **Total Requests:** ${totalRequests}\n  - Pending: ${pendingRequests}\n  - Approved: ${approvedRequests}\n  - Rejected: ${rejectedRequests}\n\n### Buyback Orders:\n- **Total Orders:** ${totalOrders}\n\n### Approval Rate:\n**${totalRequests > 0 ? ((approvedRequests / totalRequests) * 100).toFixed(1) : 0}%** of requests approved\n\n### Recent Requests:\n${buybackRequestsData.slice(0, 5).map((req, i) => `${i+1}. ${req.bookTitle} - ₹${req.expectedPrice} - ${req.status}`).join('\n')}\n\n**Action Required:** ${pendingRequests} pending requests need review.`;
      } catch (error) {
        return '❌ Unable to fetch buyback data. Please check database connection.';
      }
    }
    
    if (isAdmin && (val.includes('sellers') || val.includes('seller details'))) {
      try {
        const sellersData = await apiService.getAllSellers();
        const totalSellers = sellersData.length;
        
        return `## 🏪 Seller Management\n\n### Seller Statistics:\n- **Total Sellers:** ${totalSellers}\n\n### Registered Sellers:\n${sellersData.slice(0, 10).map((seller, i) => `${i+1}. ${seller.name} - Store: ${seller.storeName || 'N/A'} - ${seller.email}`).join('\n')}\n\n${totalSellers > 10 ? `*Showing 10 of ${totalSellers} sellers*` : ''}\n\n**Need more details?** Ask about specific seller performance.`;
      } catch (error) {
        return '❌ Unable to fetch seller data. Please check database connection.';
      }
    }
    
    if (isAdmin && (val.includes('revenue') || val.includes('sales') || val.includes('earnings'))) {
      try {
        const ordersData = await apiService.getAllOrders();
        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const deliveredOrders = ordersData.filter(o => o.status === 'delivered');
        const confirmedRevenue = deliveredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const pendingRevenue = totalRevenue - confirmedRevenue;
        
        return `## 💰 Revenue Analytics\n\n### Total Revenue:\n**₹${totalRevenue.toLocaleString()}**\n\n### Revenue Breakdown:\n- Confirmed Revenue (Delivered): ₹${confirmedRevenue.toLocaleString()}\n- Pending Revenue (In Process): ₹${pendingRevenue.toLocaleString()}\n\n### Order Statistics:\n- Total Orders: ${ordersData.length}\n- Delivered Orders: ${deliveredOrders.length}\n- Average Order Value: ₹${(totalRevenue / ordersData.length).toFixed(2)}\n\n**System Performance:** Strong revenue generation with ${deliveredOrders.length} successful deliveries.`;
      } catch (error) {
        return '❌ Unable to fetch revenue data. Please check database connection.';
      }
    }
    
    // BOIPARA-specific responses with database integration and admin access
    if (val.includes('what is boipara') || val.includes('about boipara') || val.includes('tell me about')) {
      const contextData = await getBoiparaProjectContext(input);
      const isAdmin = user && user.role === 'admin';
      
      if (isAdmin) {
        return `## About BOIPARA - Admin Overview

🏢 **BOIPARA** is your comprehensive online bookstore management system bringing College Street books to customers nationwide.

### System Overview:
${contextData}

### Admin Capabilities:
- 👥 **User Management** - Manage all customers, sellers, and admins
- 📚 **Book Management** - Full inventory control
- 📦 **Order Management** - Track and manage all orders
- 🔄 **Return Management** - Handle return requests
- 💰 **Buyback System** - Manage buyback requests and orders
- 📊 **Analytics Dashboard** - Comprehensive system analytics

### Contact Information:
- 📞 **Phone:** +91-9876543210
- 📧 **Email:** support@boipara.com`;
      }
      
      return `## About BOIPARA

🏢 **BOIPARA** is your trusted online bookstore bringing the authentic College Street book experience to your doorstep!

### What We Offer:
- 📚 Books from College Street, Kolkata
- 🎯 Engineering, Medical, Literature & Rare collections
- 🔄 Book buyback services
- 🚚 Free delivery across India (3-5 days)
- 💳 Multiple payment options (UPI, Cards, COD)

### Current Status:
${contextData}

### Contact Information:
- 📞 **Phone:** +91-9876543210
- 📧 **Email:** support@boipara.com`;
    }
    
    if (val.includes('wings of fire')) {
      const searchResult = await searchSpecificBooks(input);
      if (searchResult) {
        return `📚 ${searchResult} This is Dr. A.P.J. Abdul Kalam's inspiring autobiography! Would you like to place an order?`;
      }
      return `📚 "Wings of Fire" by Dr. A.P.J. Abdul Kalam is a popular autobiography! Let me check our BOIPARA inventory for you. We specialize in books from College Street, Kolkata. Would you like me to help you order it?`;
    }
    
    if (val.includes('mathematics') && val.includes('class 10')) {
      const searchResult = await searchSpecificBooks(input);
      if (searchResult) {
        return `📚 ${searchResult} These are from our academic collection at BOIPARA! Would you like me to help you place an order?`;
      }
      return `📚 Let me check our BOIPARA Mathematics Class 10 collection! We have various NCERT, CBSE, and reference books from College Street sellers. Could you specify the board or author you prefer?`;
    }
    
    if (val.includes('how many books') || val.includes('book count') || val.includes('inventory')) {
      const contextData = await getBoiparaProjectContext(input);
      return `📚 **BOIPARA Inventory Status:**\n\n${contextData}\n\n🎯 Browse through our College Street collections or ask about specific subjects! We're constantly adding new books from trusted Kolkata sellers.`;
    }
    
    if (val.includes('categories') || val.includes('subjects') || val.includes('types of books')) {
      const contextData = await getBoiparaProjectContext(input);
      return `## BOIPARA Book Categories

### Available Categories:
- 🔧 **Engineering** - All branches & semesters
- 🎨 **Medical** - MBBS, NEET, medical reference
- 📜 **Literature** - Bengali, English, classics
- 🔢 **Mathematics** - All classes & competitive exams
- 🏆 **Competitive Exams** - JEE, NEET, WBBSE
- 📜 **Rare & Vintage** - Collector's editions

### Current Status:
${contextData}`;
    }
    
    if (val.includes('order') || val.includes('buy') || val.includes('want') || val.includes('purchase')) {
      const searchResult = await searchSpecificBooks(input);
      if (searchResult) {
        return `📚 ${searchResult} These are available in our BOIPARA inventory! Would you like to place an order for any of these books?`;
      }
      return `📚 I'd love to help you order a book from BOIPARA! Please tell me the title, subject, or author you're looking for, and I'll check our College Street inventory for you.`;
    }
    
    if (val.includes('track')) {
      return `📦 **BOIPARA Order Tracking**\n\nI can help you track your BOIPARA orders! You can:\n\n1️⃣ Provide Order ID (e.g., BOI120320261)\n2️⃣ Say 'show my orders' to see all orders\n3️⃣ Say 'track [book name]' to find orders by book\n\nWhat would you like to do?`;
    }
    
    if (val.includes('cancel')) {
      return `🚫 **BOIPARA Order Cancellation**\n\nTo cancel your BOIPARA order, please provide your Order ID (format: BOI120320261) and I'll help you cancel it.\n\n📞 You can also contact our support team at +91-9876543210 for immediate assistance.`;
    }
    
    if (val.includes('support') || val.includes('help') || val.includes('contact')) {
      return `🎬 **BOIPARA Customer Support**\n\n📞 **Phone:** +91-9876543210\n📧 **Email:** support@boipara.com\n🕰️ **Hours:** Mon-Sat 9 AM - 8 PM\n\n💬 I'm here 24/7 to help with:\n• Book searches & recommendations\n• Order tracking & management\n• Account assistance\n• General BOIPARA information`;
    }
    
    if (val.includes('delivery') || val.includes('shipping')) {
      return `🚚 **BOIPARA Delivery Information**\n\n✨ **Free Delivery** across India\n🕰️ **Timeline:** 3-5 business days\n📦 **Packaging:** Secure book packaging\n📍 **Coverage:** All major cities & towns\n\n💳 **Payment Options:**\n• UPI (Google Pay, PhonePe, Paytm)\n• Credit/Debit Cards\n• Net Banking\n• Cash on Delivery (COD)`;
    }
    
    if (val.includes('return') || val.includes('refund')) {
      return `🔄 **BOIPARA Return Policy**\n\n✅ **7-day return policy**\n💰 **Full refund** for eligible returns\n📦 **Condition:** Books should be in original condition\n📞 **Process:** Contact support at +91-9876543210\n\n📄 **Return Reasons:**\n• Damaged/defective books\n• Wrong book delivered\n• Quality issues\n\n🕰️ **Refund Timeline:** 3-5 business days after return approval`;
    }
    
    // Handle non-BOIPARA queries and admin/seller redirects
    if (val.includes('weather') || val.includes('news') || val.includes('politics') || 
        val.includes('other website') || val.includes('amazon') || val.includes('flipkart')) {
      return `## BOIPARA Customer Support

📚 I'm **Genio AI**, your BOIPARA customer assistant!

### I can help you with:
- 🔍 Finding books in our College Street collection
- 🛒 Placing orders & tracking deliveries
- 📖 Book recommendations & pricing
- 🎧 Customer support & account assistance

### What would you like to know about BOIPARA books or services?`;
    }
    
    // Handle admin/seller queries for customers
    const isCustomer = !user || user.role === 'customer';
    if (isCustomer && (val.includes('admin') || val.includes('seller') || val.includes('dashboard') || 
        val.includes('manage') || val.includes('backend') || val.includes('database'))) {
      return `## Customer Support Only

👋 I'm here to help **customers** with BOIPARA services!

### As a customer, I can assist you with:
- 📚 **Book Browsing** - Find your perfect book
- 🛒 **Order Management** - Place and track orders
- 💰 **Pricing & Payment** - Get quotes and payment help
- 📞 **Customer Support** - Account and service help

### For business inquiries:
📧 Contact our team at **support@boipara.com**

### What book can I help you find today?`;
    }
    
    // For any book-related query, try to search BOIPARA inventory
    const searchResult = await searchSpecificBooks(input);
    if (searchResult) {
      return `📚 **BOIPARA Search Results:**\n\n${searchResult}\n\nWould you like more information about any of these books from our College Street collection?`;
    }
    
    return `## Welcome to BOIPARA Customer Support!

👋 I'm **Genio AI**, your personal BOIPARA shopping assistant.

### I can help you with:

🔍 **Book Search** - Find books by title, author, or subject
📦 **Order Management** - Track orders, place new orders
📚 **Recommendations** - Get book suggestions
🎯 **BOIPARA Info** - Learn about our services

### Popular Categories:
- 🔧 Engineering Books
- 🏥 Medical Books  
- 📖 Literature
- 🔢 Mathematics
- 🏆 Competitive Exams

### Try asking:
- "Show me engineering books"
- "Track my order"
- "What is BOIPARA?"
- "Order a book"

**Ready to find your next book?** 📚✨`;
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
    { text: '📚 Browse BOIPARA Books', action: 'Show me books available in BOIPARA' },
    { text: '📦 Track My Order', action: 'Track My Order' },
    { text: '🎯 About BOIPARA', action: 'What is BOIPARA and what services do you offer?' },
    { text: '🎧 BOIPARA Support', action: 'Contact BOIPARA Support' }
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
                Hi! I'm your BOIPARA AI Assistant, trained specifically on our bookstore data.
              </div>
              I can help you with books, orders, and everything about BOIPARA!
              <div style={{ fontSize: '12px', color: '#d4a017', marginTop: '8px', padding: '6px', background: 'rgba(212, 160, 23, 0.1)', borderRadius: '8px' }}>
                🔒 <strong>Privacy Protected:</strong> I only access your order history and book preferences - never passwords or sensitive data.
              </div>
              <ul style={{ marginTop: '10px', paddingLeft: 0, listStyle: 'none' }}>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', opacity: 0.9 }}>
                  📚 Find BOIPARA books & recommendations
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', opacity: 0.9 }}>
                  📦 Track your BOIPARA orders
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', opacity: 0.9 }}>
                  💰 Get quotes for book buyback
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', opacity: 0.9 }}>
                  🎯 Learn about BOIPARA services
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
                    : 'self-start rounded-2xl rounded-bl-sm border-l-2 border-[#d4a017] bot-message'
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
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: message.isUser ? message.text : formatBotResponse(message.text)
                  }} 
                />
                <span className="text-xs opacity-50 mt-1 block">
                  {message.timestamp}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="text-xs text-[#d4a017] italic animate-pulse flex items-center gap-2">
                📚 Genio AI is thinking...
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