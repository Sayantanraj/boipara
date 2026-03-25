import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Users, Shield, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../services/api';

interface TicketMessagingModalProps {
  showTicketMessaging: boolean;
  setShowTicketMessaging: (show: boolean) => void;
  selectedTicketForMessaging: any;
  setSelectedTicketForMessaging: (ticket: any) => void;
  supportTickets: any[];
  ticketMessages: { [ticketId: string]: any[] };
  sendMessageToTicket: (ticketId: string, message: string, ticket: any) => void;
  sendingMessage: boolean;
  user: any;
}

export function TicketMessagingModal({
  showTicketMessaging,
  setShowTicketMessaging,
  selectedTicketForMessaging,
  setSelectedTicketForMessaging,
  supportTickets,
  ticketMessages,
  sendMessageToTicket,
  sendingMessage,
  user
}: TicketMessagingModalProps) {
  const [ticketWithMessages, setTicketWithMessages] = useState<any>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingModalMessage, setSendingModalMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Clear message text when modal closes or ticket changes
  useEffect(() => {
    if (!showTicketMessaging || !selectedTicketForMessaging) {
      setMessageText('');
      // Clear auto-refresh when modal closes
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
    }
  }, [showTicketMessaging, selectedTicketForMessaging?._id, autoRefreshInterval]);

  // Fetch ticket messages only when modal opens or ticket changes
  useEffect(() => {
    if (selectedTicketForMessaging && (selectedTicketForMessaging._id || selectedTicketForMessaging.ticketId) && showTicketMessaging) {
      const ticketId = selectedTicketForMessaging.ticketId || selectedTicketForMessaging._id;
      console.log('💬 Modal opened: Fetching messages for ticket:', ticketId);
      fetchTicketMessages(ticketId);
      
      // Start auto-refresh for messages
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
      
      const interval = setInterval(() => {
        console.log('💬 Auto-refreshing ticket messages...');
        fetchTicketMessages(ticketId, false); // Auto refresh, don't show loading or toast
      }, 15000); // Refresh every 15 seconds (less frequent to reduce flicker)
      
      setAutoRefreshInterval(interval);
      
      // Cleanup on unmount
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [selectedTicketForMessaging?._id, selectedTicketForMessaging?.ticketId, showTicketMessaging]);

  const fetchTicketMessages = async (ticketId: string, isManualRefresh = false) => {
    // Don't show loading state for auto-refresh to prevent flickering
    if (isManualRefresh && loadingMessages) return; // Prevent duplicate calls
    
    try {
      if (isManualRefresh) {
        setLoadingMessages(true);
      }
      console.log('💬 Fetching messages for ticket:', ticketId, isManualRefresh ? '(manual)' : '(auto)');
      
      const ticketData = await apiService.getSupportTicketWithMessages(ticketId);
      console.log('💬 Received ticket data:', ticketData);
      console.log('💬 Messages in response:', ticketData?.ticket?.messages?.length || 0);
      
      if (ticketData && ticketData.ticket) {
        // Only update if we have new data or this is the initial load
        const newMessagesCount = ticketData.ticket.messages?.length || 0;
        const currentMessagesCount = ticketWithMessages?.messages?.length || 0;
        
        if (!ticketWithMessages || newMessagesCount !== currentMessagesCount || isManualRefresh) {
          setTicketWithMessages(ticketData.ticket);
          console.log('💬 Updated ticket messages:', newMessagesCount);
        } else {
          console.log('💬 No new messages, skipping update to prevent flicker');
        }
        
        if (isManualRefresh) {
          toast.success('Messages refreshed successfully');
        }
      } else {
        console.log('❌ No ticket data in response');
        if (!ticketWithMessages) {
          setTicketWithMessages(selectedTicketForMessaging);
        }
        if (isManualRefresh) {
          toast.warning('No additional message data found');
        }
      }
    } catch (error: any) {
      console.error('💬 Error fetching ticket messages:', error);
      
      // Only show error toast for manual refresh attempts
      if (isManualRefresh) {
        if (error.message?.includes('Cannot connect')) {
          toast.error('Cannot connect to server. Please check your connection.');
        } else if (error.status === 404) {
          toast.error('Ticket not found or access denied');
        } else if (error.status === 403) {
          toast.error('Access denied. Admin privileges required.');
        } else {
          toast.error('Failed to load ticket messages. Please try again.');
        }
      } else {
        // For automatic fetches, just log the error
        console.log('💬 Auto-fetch error (suppressed):', {
          ticketId,
          errorMessage: error.message,
          errorStatus: error.status
        });
      }
      
      if (!ticketWithMessages) {
        setTicketWithMessages(selectedTicketForMessaging);
      }
    } finally {
      if (isManualRefresh) {
        setLoadingMessages(false);
      }
    }
  };

  const sendAdminMessage = async (ticketId: string, message: string) => {
    console.log('💬 sendAdminMessage called with:', { 
      ticketId, 
      message: message.substring(0, 50) + '...',
      messageLength: message.length
    });
    
    if (!message.trim()) {
      console.log('❌ Message is empty after trim');
      toast.error('Please enter a message');
      return;
    }

    setSendingModalMessage(true);
    
    try {
      console.log('💬 About to call apiService.addAdminMessage');
      console.log('💬 API Service exists:', !!apiService);
      console.log('💬 addAdminMessage method exists:', !!apiService.addAdminMessage);
      
      const result = await apiService.addAdminMessage(ticketId, message.trim());
      console.log('✅ Admin message sent successfully:', result);
      
      toast.success('Message sent successfully!');
      
      // Refresh messages after sending (immediate refresh)
      console.log('💬 Refreshing messages after successful send');
      fetchTicketMessages(ticketId);
      
    } catch (error: any) {
      console.error('❌ Error sending admin message:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        stack: error.stack?.substring(0, 200)
      });
      
      // Show specific error messages
      if (error.message?.includes('Cannot connect')) {
        toast.error('Cannot connect to server. Please check your connection.');
      } else if (error.status === 404) {
        toast.error('Ticket not found or access denied');
      } else if (error.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error(`Failed to send message: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSendingModalMessage(false);
    }
  };

  if (!showTicketMessaging || !selectedTicketForMessaging) return null;

  const currentTicket = ticketWithMessages || selectedTicketForMessaging;
  const allMessages = currentTicket.messages || [];
  const localMessages = ticketMessages[selectedTicketForMessaging._id] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#3D2817] rounded-lg border-2 border-[#8B6F47] shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
        {/* Left Panel - Ticket List */}
        <div className="w-1/3 bg-[#2C1810] border-r border-[#8B6F47] flex flex-col">
          <div className="p-4 border-b border-[#8B6F47]">
            <h3 className="text-lg font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Support Tickets
            </h3>
            <p className="text-xs text-[#D4C5AA] mt-1">Select a ticket to view messages</p>
          </div>
          
          <div className="flex-1 overflow-y-auto ticket-list">
            <div className="p-3">
              <div className="space-y-2">
                {supportTickets.map((ticket) => {
                  const messageCount = (ticket.messages || []).length + (ticketMessages[ticket._id] || []).length;
                  const isSelected = selectedTicketForMessaging?._id === ticket._id;
                  
                  return (
                    <div
                      key={ticket._id}
                      onClick={() => setSelectedTicketForMessaging(ticket)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5E6D3]' 
                          : 'bg-[#3D2817] border-[#8B6F47] hover:border-[#D4AF37]/50 text-[#D4C5AA]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono bg-[#8B6F47]/20 px-2 py-1 rounded">
                          TKT{ticket._id.slice(-8).toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          ticket.status === 'open' || ticket.status === 'Open' ? 'bg-orange-900/30 text-orange-400' :
                          ticket.status === 'in-progress' || ticket.status === 'In Progress' ? 'bg-blue-900/30 text-blue-400' :
                          ticket.status === 'resolved' || ticket.status === 'Resolved' ? 'bg-emerald-900/30 text-emerald-400' :
                          'bg-gray-900/30 text-gray-400'
                        }`}>
                          {(ticket.status || 'open').toUpperCase().replace('-', ' ')}
                        </span>
                      </div>
                      <h5 className="font-semibold text-sm mb-1 truncate">{ticket.subject}</h5>
                      <p className="text-xs opacity-75 mb-2 line-clamp-2">{ticket.description || ticket.message}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-1 rounded ${
                          ticket.priority === 'urgent' || ticket.priority === 'Critical' ? 'bg-red-900/30 text-red-400' :
                          ticket.priority === 'high' || ticket.priority === 'High' ? 'bg-orange-900/30 text-orange-400' :
                          ticket.priority === 'medium' || ticket.priority === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-blue-900/30 text-blue-400'
                        }`}>
                          {(ticket.priority || 'medium').toUpperCase()}
                        </span>
                        <span className="opacity-60">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-[#D4AF37]">
                        {messageCount} message{messageCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Messages */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#8B6F47] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#D4AF37]">
                TKT{selectedTicketForMessaging._id.slice(-8).toUpperCase()}
              </h3>
              <p className="text-sm text-[#D4C5AA]">{selectedTicketForMessaging.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowTicketMessaging(false);
                  setSelectedTicketForMessaging(null);
                  setTicketWithMessages(null); // Clear cached messages
                  // Clear auto-refresh interval
                  if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    setAutoRefreshInterval(null);
                  }
                }}
                className="p-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-all"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages">
            {/* Only show loading on initial load, not during auto-refresh */}
            {loadingMessages && !ticketWithMessages ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto mb-3"></div>
                <p className="text-[#D4C5AA] text-sm">Loading messages...</p>
              </div>
            ) : (
              <>
                {/* Original ticket message */}
                <div className="bg-[#2C1810] rounded-lg p-4 border border-[#8B6F47]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="size-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-[#F5E6D3]">
                          {selectedTicketForMessaging.customerName || selectedTicketForMessaging.name || 'Customer'}
                        </span>
                        <span className="text-xs text-[#8B6F47]">
                          {new Date(selectedTicketForMessaging.createdAt).toLocaleString()}
                        </span>
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded border border-blue-700/50">
                          ORIGINAL
                        </span>
                      </div>
                      <p className="text-[#D4C5AA] text-sm leading-relaxed">
                        {selectedTicketForMessaging.description || selectedTicketForMessaging.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* All messages from database */}
                {allMessages && allMessages.length > 0 && (
                  allMessages.map((msg: any, idx: number) => {
                    // Skip the original message if it's included in the messages array
                    if (msg.message === (selectedTicketForMessaging.description || selectedTicketForMessaging.message)) {
                      return null;
                    }
                    
                    return (
                      <div key={`db-${msg._id || idx}`} className={`rounded-lg p-4 border ${
                        msg.sender === 'admin' 
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 ml-4' 
                          : 'bg-[#2C1810] border-[#8B6F47] mr-4'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.sender === 'admin' ? 'bg-[#D4AF37]' : 'bg-blue-600'
                          }`}>
                            {msg.sender === 'admin' ? (
                              <Shield className="size-4 text-[#2C1810]" />
                            ) : (
                              <Users className="size-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-[#F5E6D3]">
                                {msg.senderName || (msg.sender === 'admin' ? 'Support Team' : 'Customer')}
                              </span>
                              <span className="text-xs text-[#8B6F47]">
                                {new Date(msg.timestamp || msg.createdAt).toLocaleString()}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded border ${
                                msg.sender === 'admin' 
                                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40' 
                                  : 'bg-blue-900/30 text-blue-400 border-blue-700/50'
                              }`}>
                                {msg.sender === 'admin' ? 'ADMIN' : 'CUSTOMER'}
                              </span>
                              <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded border border-green-700/50">
                                DATABASE
                              </span>
                            </div>
                            <p className="text-[#D4C5AA] text-sm leading-relaxed">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Local messages from localStorage (fallback) */}
                {localMessages.map((msg: any, idx: number) => (
                  <div key={`local-${idx}`} className={`rounded-lg p-4 border ${
                    msg.sender === 'admin' 
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 ml-4' 
                      : 'bg-[#2C1810] border-[#8B6F47] mr-4'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender === 'admin' ? 'bg-[#D4AF37]' : 'bg-blue-600'
                      }`}>
                        {msg.sender === 'admin' ? (
                          <Shield className="size-4 text-[#2C1810]" />
                        ) : (
                          <Users className="size-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-[#F5E6D3]">
                            {msg.senderName || (msg.sender === 'admin' ? 'Support Team' : 'Customer')}
                          </span>
                          <span className="text-xs text-[#8B6F47]">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded border ${
                            msg.sender === 'admin' 
                              ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40' 
                              : 'bg-blue-900/30 text-blue-400 border-blue-700/50'
                          }`}>
                            {msg.sender === 'admin' ? 'ADMIN' : 'CUSTOMER'}
                          </span>
                          <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded border border-yellow-700/50">
                            LOCAL
                          </span>
                        </div>
                        <p className="text-[#D4C5AA] text-sm leading-relaxed">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* No messages state */}
                {(!allMessages || allMessages.length === 0) && 
                 (!localMessages || localMessages.length === 0) && (
                  <div className="text-center py-8">
                    <MessageCircle className="size-12 text-[#8B6F47] mx-auto mb-3" />
                    <p className="text-[#D4C5AA]">No additional messages yet</p>
                    <p className="text-xs text-[#8B6F47] mt-1">Send a message below to start the conversation</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-[#8B6F47]">
            <div className="flex gap-3">
              <textarea
                placeholder="Type your admin response to the customer..."
                className="flex-1 px-4 py-3 bg-[#2C1810] border border-[#8B6F47] rounded-lg text-[#F5E6D3] text-sm focus:outline-none focus:border-[#D4AF37] resize-none"
                rows={3}
                value={messageText}
                onChange={(e) => {
                  console.log('💬 Textarea onChange:', e.target.value);
                  setMessageText(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('💬 Enter key pressed, message:', messageText);
                    
                    if (!messageText.trim()) {
                      console.log('❌ Message is empty on Enter key');
                      toast.error('Please enter a message');
                      return;
                    }
                    
                    const ticketId = selectedTicketForMessaging.ticketId || selectedTicketForMessaging._id;
                    console.log('💬 Ticket ID from Enter key:', ticketId);
                    console.log('💬 Selected ticket details:', {
                      _id: selectedTicketForMessaging._id,
                      ticketId: selectedTicketForMessaging.ticketId
                    });
                    sendAdminMessage(ticketId, messageText.trim());
                    setMessageText('');
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  console.log('💬 Send button clicked');
                  console.log('💬 Selected ticket:', {
                    _id: selectedTicketForMessaging._id,
                    ticketId: selectedTicketForMessaging.ticketId,
                    subject: selectedTicketForMessaging.subject
                  });
                  console.log('💬 Message text from state:', messageText);
                  console.log('💬 Message length:', messageText.length);
                  
                  if (!messageText.trim()) {
                    console.log('❌ Message is empty, showing error');
                    toast.error('Please enter a message');
                    return;
                  }
                  
                  // Use ticketId if available, otherwise use _id
                  const ticketId = selectedTicketForMessaging.ticketId || selectedTicketForMessaging._id;
                  console.log('💬 Using ticket ID for API call:', ticketId);
                  console.log('💬 Calling sendAdminMessage...');
                  sendAdminMessage(ticketId, messageText.trim());
                  setMessageText('');
                }}
                disabled={sendingModalMessage}
                className="px-6 py-3 bg-[#D4AF37] hover:bg-[#C5A028] text-[#2C1810] font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="size-4" />
                {sendingModalMessage ? 'Sending...' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-[#8B6F47] mt-2">
              💡 Admin messages are saved to the database and will be visible to the customer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}