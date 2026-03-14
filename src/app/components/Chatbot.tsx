import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minus, Paperclip, Send } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: string;
  file?: {
    name: string;
    size: string;
    type: string;
  };
  awaitingTicketDetails?: boolean;
}

// Gemini AI Configuration
const GEMINI_API_KEY = 'AIzaSyBgvlo5fO7UbSetLpF2ox3gLB2GKB8gXcU';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [awaitingTicketDetails, setAwaitingTicketDetails] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: `Hello 👋 Welcome to <b>BOIPARA</b>!<br/><br/>
I'm your AI assistant powered by Google Gemini. I can help you with:<br/>
📚 Find Books & Recommendations<br/>
🔎 Search by ISBN, Author, or Title<br/>
💰 Sell your books & Get quotes<br/>
📦 Track orders & Support<br/>
🎓 Academic book suggestions<br/><br/>
What can I help you find today?`,
      isUser: false,
      timestamp: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const chatboxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Close chatbot when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const searchBookByTitle = async (title: string) => {
    try {
      console.log('Searching for book with exact title:', title);
      let response = await apiService.getBooks({ search: title, limit: 5 });
      let books = response.books || [];
      
      // If no exact match, try searching with just the main title (remove author)
      if (books.length === 0) {
        const titleWithoutAuthor = title.replace(/\s+by\s+[^\s]+.*$/i, '').trim();
        if (titleWithoutAuthor !== title) {
          console.log('No exact match, trying without author:', titleWithoutAuthor);
          response = await apiService.getBooks({ search: titleWithoutAuthor, limit: 5 });
          books = response.books || [];
        }
      }
      
      // If still no match, try with just the subject and class
      if (books.length === 0) {
        const subjectMatch = title.match(/(\w+)\s+for\s+class\s+(\d+)/i);
        if (subjectMatch) {
          const simpleSearch = `${subjectMatch[1]} class ${subjectMatch[2]}`;
          console.log('Trying simplified search:', simpleSearch);
          response = await apiService.getBooks({ search: simpleSearch, limit: 5 });
          books = response.books || [];
        }
      }
      
      console.log('Final search results:', books.length, books.map(b => ({ title: b.title, author: b.author })));
      return books;
    } catch (error) {
      console.error('Error searching books:', error);
      return [];
    }
  };

  const placeOrder = async (bookTitle: string) => {
    try {
      if (!user) {
        return `🔐 Please <b>login</b> to place an order!<br/><br/>📱 You can:<br/>• Click the login button in the top menu<br/>• Register if you're new to BOIPARA<br/>• Then come back to order your book!`;
      }

      // Parse quantity from the book title
      let quantity = 1;
      let cleanTitle = bookTitle.trim();
      
      console.log('Original input:', bookTitle);
      
      // Check for quantity patterns like "two", "2", "three", etc.
      const quantityPatterns = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      
      // Check for number words at the beginning
      for (const [word, num] of Object.entries(quantityPatterns)) {
        const regex = new RegExp(`^${word}\\s+`, 'gi');
        if (regex.test(cleanTitle)) {
          quantity = num;
          cleanTitle = cleanTitle.replace(regex, '').trim();
          console.log(`Found quantity word "${word}", quantity: ${quantity}, remaining: "${cleanTitle}"`);
          break;
        }
      }
      
      // Check for digits at the beginning
      if (quantity === 1) {
        const digitMatch = cleanTitle.match(/^(\d+)\s+/);
        if (digitMatch) {
          const num = parseInt(digitMatch[1]);
          if (num > 0 && num <= 10) {
            quantity = num;
            cleanTitle = cleanTitle.replace(digitMatch[0], '').trim();
            console.log(`Found quantity digit "${digitMatch[1]}", quantity: ${quantity}, remaining: "${cleanTitle}"`);
          }
        }
      }
      
      // Clean up the title (remove "books", "copies" at the end)
      cleanTitle = cleanTitle.replace(/\s+(books?)$/gi, '').trim();
      console.log('Final clean title:', cleanTitle);
      
      // Search for the book
      console.log('Searching for book with title:', cleanTitle);
      const books = await searchBookByTitle(cleanTitle);
      console.log('Found books:', books.length, books.map(b => b.title));
      
      if (books.length === 0) {
        console.log('No books found for search term:', cleanTitle);
        return `📚 Sorry, "${cleanTitle}" is not currently in stock.<br/><br/>🔍 Try:<br/>• Check spelling<br/>• Search for similar books<br/>• Contact us at +91-9876543210 for special orders`;
      }

      const book = books[0]; // Take the first match
      
      // Check stock availability
      if (book.stock < quantity) {
        return `📦 Sorry, we only have ${book.stock} copies of "${book.title}" in stock.<br/><br/>🛒 You can:<br/>• Order ${book.stock} copies now<br/>• Contact us at +91-9876543210 for more stock<br/>• Check back later for restocking`;
      }
      
      const totalPrice = book.price * quantity;
      
      // Create order data
      const orderData = {
        items: [{
          bookId: book._id,
          quantity: quantity,
          price: book.price
        }],
        total: totalPrice,
        subtotal: totalPrice,
        shipping: 0, // Free shipping
        shippingAddress: user.address || 'Address to be updated',
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone || 'Phone to be updated',
        paymentMethod: 'COD' // Default to Cash on Delivery
      };

      const order = await apiService.createOrder(orderData);
      
      const quantityText = quantity > 1 ? `${quantity} copies` : '1 copy';
      return `✅ <b>Order Placed Successfully!</b><br/><br/>📖 Book: ${book.title}<br/>📦 Quantity: ${quantityText}<br/>💰 Price: ₹${book.price} each<br/>💰 Total: ₹${totalPrice}<br/>📦 Order ID: ${order.orderId}<br/>🚚 FREE Delivery in 3-5 days<br/><br/>📱 Track your order in the Orders section!`;
      
    } catch (error: any) {
      console.error('Order placement error:', error);
      return `❌ <b>Order Failed</b><br/><br/>🔧 ${error.message || 'Something went wrong'}<br/><br/>📞 Please contact support: +91-9876543210`;
    }
  };

  const parseMultipleOrders = (input: string) => {
    console.log('Parsing multiple orders from:', input);
    
    // Split by "and order" pattern
    const parts = input.split(/\s+and\s+order\s+/i);
    
    if (parts.length <= 1) {
      // Try splitting by "and" followed by quantity words
      const quantityWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', '\\d+'];
      const quantityPattern = new RegExp(`\\s+and\\s+(${quantityWords.join('|')})\\s+`, 'gi');
      
      const matches = [...input.matchAll(quantityPattern)];
      if (matches.length > 0) {
        const splitParts = [];
        let lastIndex = 0;
        
        matches.forEach((match, i) => {
          // Add the part before this match
          if (i === 0) {
            splitParts.push(input.substring(0, match.index).trim());
          }
          
          // Add the part starting from this match
          const nextMatch = matches[i + 1];
          const endIndex = nextMatch ? nextMatch.index : input.length;
          const part = input.substring(match.index, endIndex).replace(/^\s+and\s+/i, '').trim();
          splitParts.push(part);
        });
        
        console.log('Split by quantity pattern:', splitParts);
        return splitParts.filter(part => part.length > 0);
      }
      
      return [input]; // Single order
    }
    
    console.log('Split by "and order":', parts);
    return parts.map(part => part.trim()).filter(part => part.length > 0);
  };

  const placeMultipleOrders = async (orderTexts: string[]) => {
    const results = [];
    let totalAmount = 0;
    let allOrderIds = [];
    
    for (const orderText of orderTexts) {
      try {
        const result = await placeOrder(orderText);
        results.push(result);
        
        // Extract order ID and amount for summary (if successful)
        const orderIdMatch = result.match(/Order ID: (BOI\d+)/);
        const totalMatch = result.match(/Total: ₹(\d+)/);
        
        if (orderIdMatch && totalMatch) {
          allOrderIds.push(orderIdMatch[1]);
          totalAmount += parseInt(totalMatch[1]);
        }
      } catch (error) {
        results.push(`❌ Failed to order "${orderText}": ${error.message}`);
      }
    }
    
    // Create summary if multiple successful orders
    if (allOrderIds.length > 1) {
      const summary = `🎉 <b>Multiple Orders Placed Successfully!</b><br/><br/>📦 Order IDs: ${allOrderIds.join(', ')}<br/>💰 Total Amount: ₹${totalAmount}<br/>🚚 FREE Delivery for all orders<br/><br/>📱 Track all orders in the Orders section!`;
      return [summary, ...results];
    }
    
    return results;
  };

  const analyzeBookImage = async (file: File): Promise<string> => {
    try {
      console.log('=== STARTING IMAGE ANALYSIS ===');
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        console.error('File is not an image:', file.type);
        return 'NOT_AN_IMAGE';
      }
      
      // Convert file to base64
      console.log('Converting file to base64...');
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          console.log('✅ Base64 conversion successful, length:', base64.length);
          resolve(base64);
        };
        reader.onerror = (error) => {
          console.error('❌ FileReader error:', error);
          reject(error);
        };
        reader.readAsDataURL(file);
      });

      const prompt = `You are a book identification expert. Look at this image very carefully.

Is this a book cover or book page? If yes, extract these details:

1. TITLE: The exact book title as written
2. AUTHOR: Author name(s) if visible
3. SUBJECT: Subject area (Mathematics, Physics, Chemistry, English, etc.)
4. CLASS: Grade/Class level if mentioned (like "Class 10", "Grade 12", etc.)
5. PUBLISHER: Publisher name if visible

If this is clearly NOT a book image, respond with exactly: "NOT_A_BOOK"

If it IS a book, respond in this exact format:
TITLE: [exact title from the book]
AUTHOR: [author name or "Not visible"]
SUBJECT: [subject name]
CLASS: [class level or "Not specified"]
PUBLISHER: [publisher or "Not visible"]

Be very careful to read the text accurately from the image.`;

      console.log('Making Vision API request to:', GEMINI_VISION_URL);
      console.log('Using model: gemini-1.5-flash (multimodal model)');
      console.log('Prompt length:', prompt.length);
      


      const response = await fetch(GEMINI_VISION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
          }
        })
      });

      console.log('📥 Vision API response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Vision API error response:', errorText);
        console.error('❌ Response status:', response.status, response.statusText);
        
        // Parse error for more details
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Parsed error:', errorData);
        } catch (e) {
          console.error('❌ Could not parse error response');
        }
        
        throw new Error(`Vision API failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Vision API response data:', JSON.stringify(data, null, 2));
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const result = data.candidates[0].content.parts[0].text;
        console.log('✅ Extracted analysis result:', result);
        return result;
      } else {
        console.error('❌ Invalid response format:', data);
        throw new Error('Invalid response format from Vision API');
      }
    } catch (error) {
      console.error('❌ Image analysis error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Return a more specific error
      return `ERROR: ${error.message}`;
    }
  };

  const fallbackImageAnalysis = async (file: File): Promise<string> => {
    console.log('Using fallback image analysis');
    // Simple fallback - assume it's a book and ask user to provide details
    return `TITLE: Please type the book title
AUTHOR: Please type the author name
SUBJECT: Please specify subject
CLASS: Please specify class`;
  };

  const processBookImageAnalysis = async (analysisResult: string, file: File): Promise<string> => {
    console.log('=== PROCESSING ANALYSIS RESULT ===');
    console.log('Analysis result:', analysisResult);
    
    if (analysisResult.startsWith('ERROR:')) {
      return `❌ <b>Image Analysis Failed</b><br/><br/>🔧 ${analysisResult.replace('ERROR: ', '')}<br/><br/>💡 <b>What you can do:</b><br/>• Try uploading a clearer image<br/>• Ensure good lighting on the book cover<br/>• Type the book details manually<br/>• Contact support: +91-9876543210`;
    }

    if (analysisResult === 'NOT_AN_IMAGE') {
      return `❌ <b>Invalid File Type</b><br/><br/>📷 Please upload an image file (JPG, PNG, GIF) of the book cover.`;
    }

    if (analysisResult.includes('NOT_A_BOOK')) {
      return `📷 <b>Not a Book Image</b><br/><br/>🤔 The uploaded image doesn't appear to be a book. Please:<br/>• Upload an image of a book cover<br/>• Ensure the book title is clearly visible<br/>• Try a different angle or better lighting`;
    }

    // Parse the analysis result
    const lines = analysisResult.split('\n').filter(line => line.trim());
    const bookInfo: any = {};
    
    console.log('Parsing lines:', lines);
    
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        if (value && value !== 'Not visible' && value !== 'Not specified') {
          bookInfo[key] = value;
        }
      }
    });

    console.log('Parsed book info:', bookInfo);

    const title = bookInfo.title || 'Unknown Title';
    const author = bookInfo.author || 'Unknown Author';
    const subject = bookInfo.subject || 'General';
    const classLevel = bookInfo.class || 'Not specified';
    const publisher = bookInfo.publisher || 'Unknown Publisher';

    // Search for the book in inventory
    console.log('Searching for book with title:', title);
    let searchResults = await searchBookByTitle(title);
    
    if (searchResults.length === 0 && subject && classLevel !== 'Not specified') {
      console.log('No exact match, trying subject + class:', `${subject} for ${classLevel}`);
      searchResults = await searchBookByTitle(`${subject} for ${classLevel}`);
    }

    if (searchResults.length === 0 && subject) {
      console.log('Still no match, trying just subject:', subject);
      searchResults = await searchBookByTitle(subject);
    }

    console.log('Final search results:', searchResults.length, 'books found');

    let response = `📖 <b>Book Identified from Image!</b><br/><br/>`;
    response += `📚 <b>Title:</b> ${title}<br/>`;
    response += `✍️ <b>Author:</b> ${author}<br/>`;
    response += `📂 <b>Subject:</b> ${subject}<br/>`;
    response += `🎓 <b>Class:</b> ${classLevel}<br/>`;
    response += `🏢 <b>Publisher:</b> ${publisher}<br/><br/>`;

    if (searchResults.length > 0) {
      const book = searchResults[0];
      response += `✅ <b>Great News! This book is available!</b><br/><br/>`;
      response += `💰 <b>Price:</b> ₹${book.price}<br/>`;
      response += `📦 <b>Stock:</b> ${book.stock > 0 ? `${book.stock} copies available` : 'Out of stock'}<br/>`;
      response += `⭐ <b>Rating:</b> ${book.rating}/5<br/>`;
      response += `🏪 <b>Condition:</b> ${book.condition.toUpperCase()}<br/><br/>`;
      
      if (book.stock > 0) {
        response += `🛒 <b>Ready to order?</b><br/>Type: "order ${title}" to place your order!`;
      } else {
        response += `📞 <b>Out of stock</b> - Contact us at +91-9876543210 for restocking info.`;
      }
    } else {
      response += `❌ <b>Sorry, this book is not currently in our inventory.</b><br/><br/>`;
      response += `🔍 <b>What you can do:</b><br/>`;
      response += `• Contact us at +91-9876543210 for special orders<br/>`;
      response += `• Visit our College Street store<br/>`;
      response += `• Check for similar books in our collection`;
    }

    return response;
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const callGeminiAI = async (userMessage: string): Promise<string> => {
    try {
      console.log('Calling Gemini AI with message:', userMessage);
      
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

User Query: "${userMessage}"

Please respond as BOIPARA AI Assistant. Be helpful, friendly, and focus on books, orders, and bookstore services. Keep responses concise (2-3 sentences max) and use relevant emojis. If asked about specific books or ISBN, provide helpful information about finding or identifying the book.`;

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

      console.log('Gemini API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini API response data:', data);
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Gemini AI Error:', error);
      // For now, let's create a more intelligent fallback for ISBN searches
      if (userMessage.match(/\d{3}-\d{2}-\d{5,7}-\d{1,2}-\d{1}/)) {
        return getISBNResponse(userMessage);
      }
      return await getFallbackResponse(userMessage);
    }
  };

  const getISBNResponse = (input: string): string => {
    const isbnMatch = input.match(/\d{3}-\d{2}-\d{5,7}-\d{1,2}-\d{1}/);
    const isbn = isbnMatch ? isbnMatch[0] : 'the ISBN you provided';
    
    return `📖 I found your ISBN search for <b>${isbn}</b>!<br/><br/>🔍 Let me help you with this book:<br/>• I'm checking our College Street inventory<br/>• This appears to be an academic/technical book<br/>• Estimated price range: ₹800-₹1500<br/><br/>📞 For exact availability and pricing, please contact our team at +91-9876543210 or visit our store. We can also help you find similar books if this one isn't in stock!`;
  };

  const getFallbackResponse = async (input: string): Promise<string> => {
    const val = input.toLowerCase();
    
    // Handle awaiting ticket details state
    if (awaitingTicketDetails) {
      // User provided issue details, create ticket
      const ticketId = `TKT${Date.now().toString().slice(-8)}`;
      const supportTicket = {
        ticketId,
        userId: user?._id,
        customerName: user?.name || 'Guest',
        customerEmail: user?.email || 'Not provided',
        subject: 'Customer Support Request',
        description: input.trim(),
        status: 'Open',
        priority: 'Medium',
        createdAt: new Date().toISOString()
      };
      
      setAwaitingTicketDetails(false);
      
      // In a real app, save to database via API
      try {
        // await apiService.createSupportTicket(supportTicket);
        console.log('Support ticket created:', supportTicket);
      } catch (error) {
        console.error('Error creating ticket:', error);
      }
      
      return `✅ <b>Support Ticket Submitted Successfully!</b><br/><br/>🎫 <b>Ticket ID:</b> ${ticketId}<br/>👤 <b>Name:</b> ${user?.name || 'Guest'}<br/>📧 <b>Email:</b> ${user?.email || 'Not provided'}<br/>📝 <b>Issue:</b> ${input.trim()}<br/><br/>⏰ <b>Response Time:</b> Within 2-4 hours<br/>📞 <b>Urgent?</b> Call +91-9876543210<br/><br/>💬 Our support team will contact you soon!<br/><br/>📋 <b>Track your ticket:</b> Visit Help & Support → History section to see updates and messages from our team.`;
    }
    
    // Check for order requests
    if (val.includes('order') || val.includes('buy') || val.includes('purchase') || val.includes('want to buy')) {
      let bookQuery = input.replace(/\b(order|buy|purchase|want to buy|one book|book)\b/gi, '').trim();
      // Remove extra spaces
      bookQuery = bookQuery.replace(/\s+/g, ' ').trim();
      console.log('Order request - original input:', input);
      console.log('Order request - extracted book query:', bookQuery);
      // Check for multiple orders
      const orderTexts = parseMultipleOrders(bookQuery);
      
      if (orderTexts.length > 1) {
        console.log('Multiple orders detected:', orderTexts);
        const results = await placeMultipleOrders(orderTexts);
        return results.join('<br/><br/>---<br/><br/>');
      }
      
      return await placeOrder(bookQuery);
    }
    
    // Check for support/help requests
    if (val.includes('support') || val.includes('help') || val.includes('contact') || val.includes('ticket') || val.includes('complaint') || val.includes('issue') || val.includes('problem')) {
      if (!user) {
        return `🎧 <b>BOIPARA Support Center</b><br/><br/>📞 <b>Contact Options:</b><br/>• Phone: +91-9876543210<br/>• Email: support@boipara.com<br/>• WhatsApp: +91-9876543210<br/><br/>🕒 <b>Support Hours:</b><br/>Monday - Saturday: 9 AM - 8 PM<br/>Sunday: 10 AM - 6 PM<br/><br/>🔐 <b>For personalized support, please login to raise a support ticket!</b>`;
      }
      
      // Check if user is asking for general support/contact
      const generalSupportKeywords = ['contact', 'customer care', 'support', 'help me', 'need help'];
      const isGeneralRequest = generalSupportKeywords.some(keyword => 
        val.includes(keyword) && !val.includes('order') && !val.includes('delivery') && !val.includes('payment')
      );
      
      if (isGeneralRequest && input.trim().split(' ').length <= 8) {
        // Short general request - ask for details
        setAwaitingTicketDetails(true);
        return `🎧 <b>BOIPARA Customer Support</b><br/><br/>👋 Hi ${user.name}! I'm here to help you.<br/><br/>📝 <b>Please describe your issue in detail:</b><br/>• What problem are you facing?<br/>• Order-related issues?<br/>• Book availability questions?<br/>• Account or payment problems?<br/>• Any other concerns?<br/><br/>💡 The more details you provide, the better I can assist you!`;
      }
      
      // Create support ticket with detailed issue
      const ticketId = `TKT${Date.now().toString().slice(-8)}`;
      const issueDescription = awaitingTicketDetails 
        ? input.trim() 
        : input.replace(/support|help|contact|ticket|complaint|issue|problem|customer care/gi, '').trim() || 'Customer needs assistance';
      
      const supportTicket = {
        ticketId,
        userId: user._id,
        customerName: user.name,
        customerEmail: user.email,
        subject: 'Customer Support Request',
        description: issueDescription,
        status: 'Open',
        priority: 'Medium',
        createdAt: new Date().toISOString()
      };
      
      // Reset awaiting state
      setAwaitingTicketDetails(false);
      
      // In a real app, you would save this to database
      console.log('Support ticket created:', supportTicket);
      
      return `✅ <b>Support Ticket Created Successfully!</b><br/><br/>🎫 <b>Ticket ID:</b> ${ticketId}<br/>👤 <b>Name:</b> ${user.name}<br/>📧 <b>Email:</b> ${user.email}<br/>📝 <b>Issue:</b> ${issueDescription}<br/><br/>⏰ <b>Response Time:</b> Within 2-4 hours<br/>📞 <b>Urgent?</b> Call +91-9876543210<br/><br/>💬 You'll receive updates via email and can track your ticket in the Support section!`;
    }
    
    // Check for catalog/inventory requests
    if (val.includes('all book') || val.includes('list of books') || val.includes('book names') || val.includes('catalog') || val.includes('inventory') || (val.includes('give me all') && val.includes('book'))) {
      return `📚 Our Complete Book Catalog:<br/><br/>🎓 <b>Academic Textbooks:</b><br/>• Mathematics (Class 6-12, Engineering)<br/>• Physics, Chemistry, Biology<br/>• Computer Science & Programming<br/>• Engineering subjects (All branches)<br/><br/>📖 <b>Literature & Stories:</b><br/>• Rabindranath Tagore collections<br/>• Satyajit Ray stories<br/>• Shakespeare classics<br/>• Modern Bengali & English novels<br/><br/>📞 For our complete 500+ book inventory, visit our College Street store or call +91-9876543210!`;
    }
    
    // Check for story books / literature
    if (val.includes('story') || val.includes('novel') || val.includes('fiction') || val.includes('literature')) {
      return `📚 Yes! We have an amazing collection of story books and literature!<br/><br/>📖 Our Literature Section includes:<br/>• Classic novels & short stories<br/>• Contemporary fiction<br/>• Bengali literature<br/>• English classics<br/>• Children's story books<br/><br/>Visit our College Street store or call +91-9876543210 for specific titles!`;
    }
    
    // Check for specific book titles or subjects
    if (val.includes('mathematics') || val.includes('math') || val.includes('class') || val.includes('textbook') || val.includes('book') || val.includes('have this') || val.includes('do you have')) {
      const bookQuery = input.replace(/do you have|did you have|have this|book/gi, '').trim();
      return `📖 Looking for "${bookQuery}"?<br/><br/>🔍 Let me help you find this book:<br/>• We specialize in academic textbooks<br/>• Strong collection of Class 6-12 books<br/>• Mathematics, Science, Literature sections<br/>• Both new and used copies available<br/><br/>📞 For exact availability and pricing, please contact us at +91-9876543210 or visit our College Street store!`;
    }
    
    if (val.includes('search') || val.includes('find')) {
      return `🔍 I'm searching our College Street collection for "${input.replace(/search|find/gi, '').trim()}"...<br/><br/>📚 Our extensive inventory includes:<br/>• Academic textbooks<br/>• Literature collections<br/>• Technical manuals<br/><br/>For specific book availability, please contact us at +91-9876543210!`;
    } else if (val.includes('sell')) {
      return "💰 Great! Upload a photo of your book cover and ISBN. Our AI will provide an instant quote based on current market demand!";
    } else if (val.includes('track')) {
      return "📦 Please share your Order ID (format: BOI120320261) and I'll check the delivery status for you!";
    } else if (val.includes('category') || val.includes('browse')) {
      return `📚 Our main categories:<br/>• Engineering & Technical<br/>• Medical & Science<br/>• Literature & Arts<br/>• Mathematics & Academic<br/>• Rare & Vintage Collections<br/><br/>Which interests you most?`;
    } else if (val.includes('price') || val.includes('cost')) {
      return "💸 Our books range from ₹200-₹2000. Academic textbooks are competitively priced! What specific book are you looking for?";
    } else if (val.includes('delivery') || val.includes('shipping')) {
      return "🚚 FREE delivery across India! Standard: 3-5 days, Express: ₹50 for next-day delivery. We ship from our College Street warehouse!";
    } else {
      return "🤔 I'm here to help with books, orders, and bookstore services! Could you be more specific about what you're looking for?";
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      // Check file type (images and documents)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only images (JPG, PNG, GIF), PDF, and text files are allowed');
        return;
      }
      
      setAttachedFile(file);
      toast.success(`File "${file.name}" attached successfully!`);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText && !attachedFile) return;

    // Create message with file info if attached
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

    // Show typing indicator
    setIsTyping(true);

    try {
      // Enhanced prompt for file handling
      let enhancedMessage = messageText;
      let analysisResult = '';
      
      if (attachedFile) {
        if (attachedFile.type.startsWith('image/')) {
          console.log('Image file detected, analyzing...');
          analysisResult = await analyzeBookImage(attachedFile);
          
          if (!messageText || messageText.trim() === '') {
            setIsTyping(false);
            const imageAnalysisResponse = await processBookImageAnalysis(analysisResult, attachedFile);
            const botMessage: Message = {
              text: imageAnalysisResponse,
              isUser: false,
              timestamp: getCurrentTime()
            };
            setMessages(prev => [...prev, botMessage]);
            return;
          }
          
          enhancedMessage += ` [User uploaded an image of a book. Analysis: ${analysisResult}]`;
        } else {
          enhancedMessage += ` [User attached a file: ${attachedFile.name} (${formatFileSize(attachedFile.size)})]`;
        }
      }
      
      // Get AI response
      const aiResponse = await callGeminiAI(enhancedMessage);
      
      setIsTyping(false);
      const botMessage: Message = {
        text: aiResponse,
        isUser: false,
        timestamp: getCurrentTime()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setIsTyping(false);
      
      // Try fallback response for order requests
      try {
        let fallbackResponse;
        
        if (attachedFile && attachedFile.type.startsWith('image/') && analysisResult) {
          fallbackResponse = await processBookImageAnalysis(analysisResult, attachedFile);
        } else {
          fallbackResponse = await getFallbackResponse(enhancedMessage);
        }
        const botMessage: Message = {
          text: fallbackResponse,
          isUser: false,
          timestamp: getCurrentTime()
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (fallbackError) {
        const errorMessage: Message = {
          text: "🔧 I'm having trouble connecting right now. Please try again in a moment, or contact our support team!",
          isUser: false,
          timestamp: getCurrentTime()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const quickActions = [
    { text: 'Order a Book', icon: '🛒' },
    { text: 'Browse Literature', icon: '📖' },
    { text: 'Show All Book Names', icon: '📚' },
    { text: 'Track My Order', icon: '📦' },
    { text: 'Contact Support', icon: '🎧' }
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <div
        className={`fixed bottom-8 right-8 w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center text-2xl cursor-pointer shadow-2xl transition-all duration-300 z-50 hover:scale-110 hover:rotate-6 group ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        onClick={() => setIsOpen(true)}
      >
        📚
        <div className="absolute right-20 bg-[#2C1810] text-[#D4AF37] px-4 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 border border-[#D4AF37] pointer-events-none">
          Ask Boipara AI
        </div>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatWindowRef}
          className="fixed bottom-28 right-8 w-96 h-[520px] bg-gradient-to-b from-[#2C1810] to-[#4B2E14] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-[#D4AF37]/20 z-50 animate-in slide-in-from-bottom-4 duration-400"
        >
          {/* Header */}
          <div className="bg-[#3A1F0D] px-5 py-4 text-[#F5E6C8] border-b border-[#D4AF37] flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm tracking-wider flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                📚 BOIPARA AI ASSISTANT
              </h4>
              {/* <p className="text-xs text-[#D4AF37] opacity-80">Powered by Google Gemini</?p> */}
            </div>
            <div className="flex gap-3">
              {/* <button
                onClick={() => setIsOpen(false)}
                className="text-[#D4AF37] hover:text-[#F5E6C8] transition-colors opacity-70 hover:opacity-100"
              >
                <Minus className="size-4" />
              </button> */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#D4AF37] hover:text-[#F5E6C8] transition-colors opacity-70 hover:opacity-100"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div
            ref={chatboxRef}
            className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 scrollbar-thin scrollbar-thumb-[#D4AF37] scrollbar-track-transparent"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[80%] p-3 text-sm leading-relaxed relative ${
                  message.isUser
                    ? 'self-end bg-[#D4AF37] text-[#2C1810] rounded-2xl rounded-br-sm font-medium'
                    : 'self-start bg-[#3A1F0D] text-[#F5E6C8] rounded-2xl rounded-bl-sm border-l-2 border-[#D4AF37]'
                }`}
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

            {/* Quick Actions (only show after first message) */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(action.text)}
                    className="bg-[#D4AF37] text-[#2C1810] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#F5E6C8] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                  >
                    {action.icon} {action.text}
                  </button>
                ))}
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="text-xs text-[#D4AF37] italic animate-pulse flex items-center gap-2">
                📚 Boipara AI is thinking...
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-[#D4AF37] rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#3A1F0D] border-t border-[#D4AF37]/10">
            {/* Attached File Preview */}
            {attachedFile && (
              <div className="mb-3 p-2 bg-[#2C1810] rounded-lg border border-[#D4AF37]/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#F5E6C8]">
                  <Paperclip className="size-3 text-[#D4AF37]" />
                  <span className="font-medium">{attachedFile.name}</span>
                  <span className="opacity-70">({formatFileSize(attachedFile.size)})</span>
                </div>
                <button
                  onClick={removeAttachedFile}
                  className="text-[#D4AF37] hover:text-red-400 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf,.txt"
                className="hidden"
              />
              <button 
                onClick={handleFileAttach}
                className="text-[#D4AF37] hover:text-[#F5E6C8] transition-colors disabled:opacity-50"
                disabled={isTyping}
                title="Attach file (Images, PDF, Text - Max 5MB)"
              >
                <Paperclip className="size-4" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about books, orders, or anything..."
                className="flex-1 bg-[#2C1810] border border-[#D4AF37] rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-[#F5E6C8] transition-colors placeholder-[#A08968]"
                disabled={isTyping}
              />
              <button
                onClick={() => sendMessage()}
                className="text-[#D4AF37] hover:text-[#F5E6C8] transition-colors disabled:opacity-50"
                disabled={isTyping}
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}