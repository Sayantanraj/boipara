import React from 'react';
import { X, MessageCircle, Users, Shield, Mail } from 'lucide-react';
import { toast } from 'sonner';

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
  if (!showTicketMessaging || !selectedTicketForMessaging) return null;

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
          
          <div className="flex-1 overflow-y-auto">
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
            <button
              onClick={() => {
                setShowTicketMessaging(false);
                setSelectedTicketForMessaging(null);
              }}
              className="p-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-all"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

            {/* Additional messages from database */}
            {selectedTicketForMessaging.messages && selectedTicketForMessaging.messages.length > 1 && (
              selectedTicketForMessaging.messages.slice(1).map((msg: any, idx: number) => (
                <div key={idx} className={`rounded-lg p-4 border ${
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
                      </div>
                      <p className="text-[#D4C5AA] text-sm leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Local messages from localStorage */}
            {(ticketMessages[selectedTicketForMessaging._id] || []).map((msg: any, idx: number) => (
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
            {(!selectedTicketForMessaging.messages || selectedTicketForMessaging.messages.length <= 1) && 
             (!ticketMessages[selectedTicketForMessaging._id] || ticketMessages[selectedTicketForMessaging._id].length === 0) && (
              <div className="text-center py-8">
                <MessageCircle className="size-12 text-[#8B6F47] mx-auto mb-3" />
                <p className="text-[#D4C5AA]">No additional messages yet</p>
                <p className="text-xs text-[#8B6F47] mt-1">Send a message below to start the conversation</p>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-[#8B6F47]">
            <div className="flex gap-3">
              <textarea
                placeholder="Type your message to the customer..."
                className="flex-1 px-4 py-3 bg-[#2C1810] border border-[#8B6F47] rounded-lg text-[#F5E6D3] text-sm focus:outline-none focus:border-[#D4AF37] resize-none"
                rows={3}
                id={`modal-message-${selectedTicketForMessaging._id}`}
              />
              <button
                type="button"
                onClick={() => {
                  const messageInput = document.getElementById(`modal-message-${selectedTicketForMessaging._id}`) as HTMLTextAreaElement;
                  const message = messageInput?.value.trim();
                  
                  if (!message) {
                    toast.error('Please enter a message');
                    return;
                  }
                  
                  sendMessageToTicket(selectedTicketForMessaging._id, message, selectedTicketForMessaging);
                  messageInput.value = '';
                }}
                disabled={sendingMessage}
                className="px-6 py-3 bg-[#D4AF37] hover:bg-[#C5A028] text-[#2C1810] font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="size-4" />
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-[#8B6F47] mt-2">
              💡 Messages are saved to the database and will be visible to the customer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}