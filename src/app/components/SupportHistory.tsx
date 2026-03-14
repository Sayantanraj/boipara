import { useState, useEffect } from 'react';
import { Ticket, MessageCircle, Clock, CheckCircle, AlertCircle, Send, User, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface SupportTicket {
  _id: string;
  ticketId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

interface TicketMessage {
  _id: string;
  sender: 'customer' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
}

export default function SupportHistory() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // Load admin messages from localStorage
  const [adminMessages, setAdminMessages] = useState<{ [ticketId: string]: any[] }>(() => {
    const saved = localStorage.getItem('ticketMessages');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    // Listen for localStorage changes to update admin messages
    const handleStorageChange = () => {
      const saved = localStorage.getItem('ticketMessages');
      if (saved) {
        setAdminMessages(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for same-tab updates
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch tickets when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  // Mock data for demonstration
  const mockTickets: SupportTicket[] = [
    {
      _id: '1',
      ticketId: 'TKT12345678',
      userId: 'user1',
      customerName: 'Sayantan Dhara',
      customerEmail: 'sayantand652@gmail.com',
      subject: 'Order delivery issue',
      description: 'My order was delivered but the book is damaged',
      status: 'In Progress',
      priority: 'High',
      createdAt: '2024-03-12T08:15:00Z',
      updatedAt: '2024-03-12T10:30:00Z',
      messages: [
        {
          _id: 'm1',
          sender: 'customer',
          senderName: 'Sayantan Dhara',
          message: 'My order was delivered but the book is damaged. The cover is torn and some pages are missing.',
          timestamp: '2024-03-12T08:15:00Z'
        },
        {
          _id: 'm2',
          sender: 'admin',
          senderName: 'Support Team',
          message: 'Hi Sayantan, I apologize for the inconvenience. We will arrange a replacement for your damaged book. Please share your order ID so we can process this quickly.',
          timestamp: '2024-03-12T10:30:00Z'
        },
        {
          _id: 'm3',
          sender: 'customer',
          senderName: 'Sayantan Dhara',
          message: 'Thank you for the quick response! My order ID is BOI120320261.',
          timestamp: '2024-03-12T11:45:00Z'
        }
      ]
    },
    {
      _id: '2',
      ticketId: 'TKT87654321',
      userId: 'user1',
      customerName: 'Sayantan Dhara',
      customerEmail: 'sayantand652@gmail.com',
      subject: 'Account login problem',
      description: 'Unable to login to my account',
      status: 'Resolved',
      priority: 'Medium',
      createdAt: '2024-03-10T14:20:00Z',
      updatedAt: '2024-03-10T16:45:00Z',
      messages: [
        {
          _id: 'm4',
          sender: 'customer',
          senderName: 'Sayantan Dhara',
          message: 'I am unable to login to my account. It says invalid credentials but I am sure my password is correct.',
          timestamp: '2024-03-10T14:20:00Z'
        },
        {
          _id: 'm5',
          sender: 'admin',
          senderName: 'Support Team',
          message: 'Hi Sayantan, this might be due to a recent security update. Please try resetting your password using the "Forgot Password" link on the login page.',
          timestamp: '2024-03-10T15:30:00Z'
        },
        {
          _id: 'm6',
          sender: 'customer',
          senderName: 'Sayantan Dhara',
          message: 'That worked! I was able to reset my password and login successfully. Thank you!',
          timestamp: '2024-03-10T16:45:00Z'
        }
      ]
    }
  ];

  const fetchTickets = async () => {
    try {
      setLoading(true);
      console.log('🎫 Fetching support tickets...');
      console.log('🎫 User:', user);
      console.log('🎫 Token exists:', !!localStorage.getItem('token'));
      
      const response = await apiService.getSupportTickets();
      console.log('🎫 API Response:', response);
      
      if (response && response.tickets) {
        console.log('🎫 Found tickets:', response.tickets.length);
        setTickets(response.tickets);
      } else {
        console.log('🎫 No tickets in response, using empty array');
        setTickets([]);
      }
    } catch (error: any) {
      console.error('🎫 Error fetching tickets:', error);
      console.error('🎫 Error details:', {
        message: error.message,
        status: error.status,
        stack: error.stack
      });
      
      // Show specific error message
      if (error.message.includes('Cannot connect')) {
        toast.error('Cannot connect to server. Please check if backend is running.');
      } else if (error.status === 401) {
        toast.error('Please login to view your support tickets');
      } else {
        toast.error(`Failed to load support tickets: ${error.message}`);
      }
      
      // Fallback to mock data for demonstration
      console.log('🎫 Using mock data as fallback');
      setTickets(mockTickets);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (ticketId: string) => {
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        ticketId,
        message: newMessage.trim(),
        sender: 'customer',
        senderName: user?.name || 'Customer'
      };

      const response = await apiService.addTicketMessage(messageData);
      
      // Update selected ticket with response
      if (response.ticket) {
        setSelectedTicket(response.ticket);
        
        // Update tickets list
        setTickets(prev => prev.map(t => 
          t._id === ticketId ? response.ticket : t
        ));
      }
      
      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Fallback to mock implementation
      const newMsg: TicketMessage = {
        _id: `m${Date.now()}`,
        sender: 'customer',
        senderName: user?.name || 'Customer',
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      };

      if (selectedTicket) {
        const updatedTicket = {
          ...selectedTicket,
          messages: [...selectedTicket.messages, newMsg],
          updatedAt: new Date().toISOString()
        };
        setSelectedTicket(updatedTicket);
        
        setTickets(prev => prev.map(t => 
          t._id === ticketId ? updatedTicket : t
        ));
      }
      
      setNewMessage('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'text-blue-400 bg-blue-900/30';
      case 'In Progress': return 'text-yellow-400 bg-yellow-900/30';
      case 'Resolved': return 'text-green-400 bg-green-900/30';
      case 'Closed': return 'text-gray-400 bg-gray-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-400 bg-red-900/30';
      case 'High': return 'text-orange-400 bg-orange-900/30';
      case 'Medium': return 'text-yellow-400 bg-yellow-900/30';
      case 'Low': return 'text-green-400 bg-green-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open': return <Clock className="w-4 h-4" />;
      case 'In Progress': return <AlertCircle className="w-4 h-4" />;
      case 'Resolved': return <CheckCircle className="w-4 h-4" />;
      case 'Closed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Ticket className="w-16 h-16 text-[#8B6F47] mx-auto mb-4" />
        <p className="text-[#D4C5AA] text-lg mb-2">Please login to view your support history</p>
        <p className="text-[#A08968] text-sm">You need to be logged in to access your support tickets</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tickets List */}
      <div className="lg:col-span-1">
        <h3 className="text-lg font-semibold text-[#F5E6D3] mb-4 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-[#D4AF37]" />
          Your Support Tickets
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto"></div>
            <p className="text-[#D4C5AA] mt-2 text-sm">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="w-12 h-12 text-[#8B6F47] mx-auto mb-3" />
            <p className="text-[#D4C5AA] mb-2">No support tickets found</p>
            <p className="text-[#A08968] text-sm">Create your first ticket to get help</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedTicket?._id === ticket._id
                    ? 'border-[#D4AF37] bg-[#3D2817] shadow-lg'
                    : 'border-[#8B6F47] bg-[#2C1810] hover:border-[#D4AF37] hover:bg-[#3D2817]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-sm text-[#F5E6D3] font-mono">
                    {ticket.ticketId}
                  </span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status}
                  </div>
                </div>
                
                <p className="text-sm text-[#F5E6D3] mb-2 line-clamp-2 font-medium">
                  {ticket.subject}
                </p>
                
                <p className="text-xs text-[#D4C5AA] mb-3 line-clamp-2">
                  {ticket.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className="text-xs text-[#A08968]">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {(ticket.messages.length > 0 || (adminMessages[ticket.ticketId] && adminMessages[ticket.ticketId].length > 0)) && (
                  <div className="mt-2 pt-2 border-t border-[#8B6F47]/30">
                    <div className="flex items-center gap-1 text-xs text-[#D4AF37]">
                      <MessageCircle className="w-3 h-3" />
                      {(() => {
                        const originalCount = ticket.messages.length;
                        const adminCount = adminMessages[ticket.ticketId]?.length || 0;
                        const totalCount = originalCount + adminCount;
                        return `${totalCount} message${totalCount !== 1 ? 's' : ''}`;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Details */}
      <div className="lg:col-span-2">
        {selectedTicket ? (
          <div className="bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg p-6">
            {/* Ticket Header */}
            <div className="border-b border-[#8B6F47]/30 pb-4 mb-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-[#F5E6D3]">
                  {selectedTicket.subject}
                </h3>
                <div className="flex gap-2">
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusIcon(selectedTicket.status)}
                    {selectedTicket.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>
              
              <p className="text-[#D4C5AA] mb-3 leading-relaxed">{selectedTicket.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-[#A08968]">
                <div>
                  <span className="font-medium text-[#D4C5AA]">Ticket ID:</span>
                  <span className="ml-2 font-mono">{selectedTicket.ticketId}</span>
                </div>
                <div>
                  <span className="font-medium text-[#D4C5AA]">Created:</span>
                  <span className="ml-2">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {/* Combine original ticket messages with admin messages */}
              {(() => {
                const originalMessages = selectedTicket.messages || [];
                // Try both ticketId and _id as keys for admin messages
                const adminMsgs = adminMessages[selectedTicket.ticketId] || adminMessages[selectedTicket._id] || [];
                
                console.log('🔍 Debug admin messages:', {
                  ticketId: selectedTicket.ticketId,
                  _id: selectedTicket._id,
                  adminMessagesKeys: Object.keys(adminMessages),
                  adminMsgsFound: adminMsgs.length,
                  adminMsgs: adminMsgs
                });
                
                // Convert admin messages to the same format
                const convertedAdminMsgs = adminMsgs.map((msg, index) => ({
                  _id: msg.id || `admin-${index}-${Date.now()}`,
                  sender: 'admin' as const,
                  senderName: msg.senderName || 'Support Team',
                  message: msg.message,
                  timestamp: msg.timestamp
                }));
                
                // Combine and sort all messages by timestamp
                const allMessages = [...originalMessages, ...convertedAdminMsgs]
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                
                console.log('🔍 All messages combined:', allMessages.length, allMessages);
                
                return allMessages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.sender === 'customer'
                          ? 'bg-[#D4AF37] text-[#2C1810]'
                          : 'bg-[#3D2817] border border-[#8B6F47] text-[#F5E6D3]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.sender === 'customer' ? (
                          <User className="w-3 h-3" />
                        ) : (
                          <Headphones className="w-3 h-3" />
                        )}
                        <span className="text-xs font-semibold">
                          {message.sender === 'customer' ? 'You' : 'Support Team'}
                        </span>
                        <span className={`text-xs ${
                          message.sender === 'customer' ? 'opacity-70' : 'opacity-60'
                        }`}>
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{message.message}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Message Input */}
            {selectedTicket.status !== 'Closed' && (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-[#3D2817] border-2 border-[#8B6F47] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(selectedTicket._id)}
                />
                <button
                  onClick={() => sendMessage(selectedTicket._id)}
                  disabled={!newMessage.trim()}
                  className="bg-[#D4AF37] text-[#2C1810] px-4 py-2 rounded-lg hover:bg-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {selectedTicket.status === 'Closed' && (
              <div className="text-center py-4 bg-[#3D2817] border border-[#8B6F47] rounded-lg">
                <p className="text-[#D4C5AA] text-sm">
                  This ticket has been closed. If you need further assistance, please create a new ticket.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg">
            <MessageCircle className="w-16 h-16 text-[#8B6F47] mx-auto mb-4" />
            <p className="text-[#D4C5AA] text-lg mb-2">Select a ticket to view details</p>
            <p className="text-[#A08968] text-sm">Choose a ticket from the list to see messages and respond</p>
          </div>
        )}
      </div>
    </div>
  );
}