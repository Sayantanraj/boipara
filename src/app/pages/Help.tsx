import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Mail, Phone, MessageCircle, Send, ChevronDown, ChevronUp, MapPin, ArrowLeft } from 'lucide-react';
import type { User } from '../types';
import { toast } from 'sonner';

interface HelpProps {
  user: User | null;
}

export function Help({ user }: HelpProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'support'>('faq');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', subject: '', message: '' });

  // Load platform settings from localStorage
  const savedSettings = localStorage.getItem('boiParaPlatformSettings');
  const platformSettings = savedSettings ? JSON.parse(savedSettings) : {
    businessName: 'BOI PARA',
    tagline: 'Connecting Kolkata\'s Book Lovers',
    address: 'College Street, Kolkata - 700073',
    email: 'contact@boipara.com',
    phone: '+91 8101637164',
    supportEmail: 'reachsupport@boipara.com'
  };

  return (
    <div className="min-h-screen bg-[#1A0F08]">
      {/* Header */}
      <div className="bg-[#2C1810] border-b-2 border-[#8B6F47]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#3D2817] border border-[#8B6F47] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-white transition-all shadow-sm hover:shadow-md mb-4"
        >
          <ArrowLeft className="size-5" />
        </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#3D2817] rounded-lg border border-[#8B6F47]">
              <HelpCircle className="size-8 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#F5E6D3]">Help & Support</h1>
              <p className="text-[#D4C5AA] mt-1">We're here to help you with any questions or concerns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#2C1810] border-b-2 border-[#8B6F47]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'faq'
                  ? 'text-[#D4AF37] border-[#D4AF37] bg-[#3D2817]'
                  : 'text-[#A08968] border-transparent hover:text-[#F5E6D3] hover:bg-[#3D2817]/50'
              }`}
            >
              FAQs
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'contact'
                  ? 'text-[#D4AF37] border-[#D4AF37] bg-[#3D2817]'
                  : 'text-[#A08968] border-transparent hover:text-[#F5E6D3] hover:bg-[#3D2817]/50'
              }`}
            >
              Contact
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'support'
                  ? 'text-[#D4AF37] border-[#D4AF37] bg-[#3D2817]'
                  : 'text-[#A08968] border-transparent hover:text-[#F5E6D3] hover:bg-[#3D2817]/50'
              }`}
            >
              Support Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#F5E6D3] mb-2">Frequently Asked Questions</h2>
              <p className="text-[#D4C5AA]">Find answers to common questions about BOI PARA</p>
            </div>

            {/* Role Badge */}
            {user && (
              <div className="mb-6 p-4 bg-[#3D2817] border border-[#8B6F47] rounded-lg">
                <p className="text-sm text-[#D4C5AA]">
                  Showing help for: <span className="font-semibold text-[#D4AF37]">
                    {user.role === 'seller' ? 'Seller' : user.role === 'admin' ? 'Admin' : 'Buyer'}
                  </span>
                </p>
              </div>
            )}

            {/* Buyer FAQs - Show for customers and guests */}
            {(!user || user.role === 'customer') && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[#D4AF37] mb-4">For Buyers</h3>
                <div className="space-y-3">
                  {[
                    {
                      id: 'faq1',
                      question: 'How does the shipping work?',
                      answer: 'We offer free shipping on orders above ₹500. For orders below ₹500, a flat shipping charge of ₹40 applies. Orders are typically delivered within 3-7 business days depending on your location.'
                    },
                    {
                      id: 'faq2',
                      question: 'What is the condition of used books?',
                      answer: 'All books are categorized as New, Like-New, or Used. Used books are carefully inspected and rated for condition. We only list books that are in readable condition with all pages intact.'
                    },
                    {
                      id: 'faq3',
                      question: 'Can I return a book?',
                      answer: 'Yes! You can request a return within 7 days of delivery if the book condition does not match the description. Contact the seller or our support team to initiate a return request.'
                    },
                    {
                      id: 'faq4',
                      question: 'How does the buyback program work?',
                      answer: 'If you purchased a book from BOI PARA and have the matching book number, you can sell it back to us. Visit the Buyback page, enter your book details, and we will provide an instant quote.'
                    },
                    {
                      id: 'faq5',
                      question: 'How do I track my order?',
                      answer: 'Once your order is shipped, you will receive a tracking number via email. You can also view order status in the "My Orders" section of your account.'
                    },
                    {
                      id: 'faq6',
                      question: 'What payment methods are accepted?',
                      answer: 'We accept all major credit/debit cards, UPI, net banking, and popular digital wallets. All transactions are secured with industry-standard encryption.'
                    }
                  ].map((faq) => (
                    <div key={faq.id} className="bg-[#2C1810] border border-[#8B6F47] rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-[#3D2817] transition-colors"
                      >
                        <span className="text-left font-medium text-[#F5E6D3]">{faq.question}</span>
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="size-5 text-[#D4AF37] flex-shrink-0 ml-4" />
                        ) : (
                          <ChevronDown className="size-5 text-[#D4AF37] flex-shrink-0 ml-4" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="pt-3 border-t border-[#8B6F47]/30">
                            <p className="text-[#D4C5AA]">{faq.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seller FAQs */}
            {user?.role === 'seller' && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[#D4AF37] mb-4">For Sellers</h3>
                <div className="space-y-3">
                  {[
                    {
                      id: 'seller1',
                      question: 'How do I list books on BOI PARA?',
                      answer: 'Log in to your seller dashboard, click "Add Book", and fill in the book details including ISBN, title, author, condition, and price. You can also use bulk upload via CSV/Excel files.'
                    },
                    {
                      id: 'seller2',
                      question: 'When do I receive payment?',
                      answer: 'Payments are processed within 2-3 business days after the order is marked as delivered. Funds are transferred directly to your registered bank account.'
                    },
                    {
                      id: 'seller3',
                      question: 'What are the seller fees?',
                      answer: 'BOI PARA charges a small commission on each sale to maintain the platform. The exact percentage depends on your seller tier and volume. Check your dashboard for detailed fee structure.'
                    },
                    {
                      id: 'seller4',
                      question: 'How do I handle returns?',
                      answer: 'If a buyer requests a return, you will receive a notification in your dashboard. Review the reason and either accept or reject the request. If accepted, arrange for pickup and the refund will be processed.'
                    },
                    {
                      id: 'seller5',
                      question: 'How do I manage inventory and stock?',
                      answer: 'Use the stock management section in your dashboard to update quantities. When a book sells out, it will automatically be hidden from buyers until you restock.'
                    },
                    {
                      id: 'seller6',
                      question: 'What happens if I reject an order?',
                      answer: 'If you reject an order within the first hour, the buyer will be notified immediately and can look for alternatives. Please only reject orders in exceptional circumstances.'
                    },
                    {
                      id: 'seller7',
                      question: 'How do I use the TEST MODE buttons?',
                      answer: 'TEST MODE buttons simulate delivery partner API updates (shipped → out for delivery → delivered). These are for testing the complete order workflow without actual delivery partners.'
                    }
                  ].map((faq) => (
                    <div key={faq.id} className="bg-[#2C1810] border border-[#8B6F47] rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-[#3D2817] transition-colors"
                      >
                        <span className="text-left font-medium text-[#F5E6D3]">{faq.question}</span>
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="size-5 text-[#D4AF37] flex-shrink-0 ml-4" />
                        ) : (
                          <ChevronDown className="size-5 text-[#D4AF37] flex-shrink-0 ml-4" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="pt-3 border-t border-[#8B6F47]/30">
                            <p className="text-[#D4C5AA]">{faq.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin FAQs */}
            {user?.role === 'admin' && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[#D4AF37] mb-4">For Admins</h3>
                <div className="space-y-3">
                  {[
                    {
                      id: 'admin1',
                      question: 'How do I manage platform settings?',
                      answer: 'Access the Platform Settings from your user menu. You can configure shipping fees, commission rates, featured categories, and other global platform parameters.'
                    },
                    {
                      id: 'admin2',
                      question: 'How do I review and approve sellers?',
                      answer: 'New seller registrations appear in your admin dashboard. Review their business details, documentation, and approve or reject their application. You can also suspend existing sellers if needed.'
                    },
                    {
                      id: 'admin3',
                      question: 'How do I handle disputes between buyers and sellers?',
                      answer: 'View all active disputes in the Disputes section. Review communication history, order details, and evidence from both parties. Make a decision to refund, replace, or close the dispute.'
                    },
                    {
                      id: 'admin4',
                      question: 'How do I manage buyback requests?',
                      answer: 'Review all buyback requests in the Buyback Management section. Verify book numbers, assess condition from photos, and approve/reject requests with offered prices.'
                    },
                    {
                      id: 'admin5',
                      question: 'Can I generate platform analytics reports?',
                      answer: 'Yes! Use the Analytics section to generate comprehensive reports on sales, revenue, seller performance, buyer trends, and platform growth metrics. Export to CSV for further analysis.'
                    },
                    {
                      id: 'admin6',
                      question: 'How do I manage featured books and promotions?',
                      answer: 'Access the Promotions section to create featured listings, banners, and promotional campaigns. You can schedule promotions and track their performance.'
                    }
                  ].map((faq) => (
                    <div key={faq.id} className="bg-[#2C1810] border border-[#8B6F47] rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-[#3D2817] transition-colors"
                      >
                        <span className="text-left font-medium text-[#F5E6D3]">{faq.question}</span>
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="size-5 text-[#D4AF37] flex-shrink-0 ml-4" />
                        ) : (
                          <ChevronDown className="size-5 text-[#D4AF37] flex-shrink-0 ml-4" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="pt-3 border-t border-[#8B6F47]/30">
                            <p className="text-[#D4C5AA]">{faq.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#F5E6D3] mb-2">Get in Touch</h2>
              <p className="text-[#D4C5AA]">Multiple ways to reach our support team</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Email Support */}
              <div className="bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg p-6 hover:border-[#D4AF37] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-blue-900/30 rounded-lg">
                    <Mail className="size-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#F5E6D3] mb-2">Email Support</h3>
                    <p className="text-sm text-[#D4C5AA] mb-3">We typically respond within 24 hours</p>
                    <a
                      href={`mailto:${platformSettings.supportEmail}`}
                      className="text-[#D4AF37] hover:text-[#FFD700] font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      {platformSettings.supportEmail}
                      <span className="text-sm">→</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone Support */}
              <div className="bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg p-6 hover:border-[#D4AF37] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-emerald-900/30 rounded-lg">
                    <Phone className="size-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#F5E6D3] mb-2">Phone Support</h3>
                    <p className="text-sm text-[#D4C5AA] mb-3">Mon-Sat: 10:00 AM - 6:00 PM IST</p>
                    <a
                      href={`tel:${platformSettings.phone}`}
                      className="text-[#D4AF37] hover:text-[#FFD700] font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      {platformSettings.phone}
                      <span className="text-sm">→</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Live Chat */}
              <div className="bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg p-6 hover:border-[#D4AF37] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-purple-900/30 rounded-lg">
                    <MessageCircle className="size-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#F5E6D3] mb-2">Live Chat</h3>
                    <p className="text-sm text-[#D4C5AA] mb-3">Chat with our support team in real-time</p>
                    <button
                      onClick={() => toast.success('Live chat feature coming soon!')}
                      className="text-[#D4AF37] hover:text-[#FFD700] font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      Start Chat
                      <span className="text-sm">→</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Office Location */}
              <div className="bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg p-6 hover:border-[#D4AF37] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-orange-900/30 rounded-lg">
                    <MapPin className="size-6 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#F5E6D3] mb-2">Our Office</h3>
                    <p className="text-sm text-[#D4C5AA]">
                      {platformSettings.address}<br />
                      India
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Ticket Tab */}
        {activeTab === 'support' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#F5E6D3] mb-2">Submit a Support Ticket</h2>
              <p className="text-[#D4C5AA]">Fill out the form below and we'll get back to you soon</p>
            </div>

            {/* Role Badge for logged in users */}
            {user && (
              <div className="mb-6 p-4 bg-[#3D2817] border border-[#8B6F47] rounded-lg">
                <p className="text-sm text-[#D4C5AA]">
                  Submitting as: <span className="font-semibold text-[#D4AF37]">
                    {user.role === 'seller' ? 'Seller' : user.role === 'admin' ? 'Admin' : 'Buyer'}
                  </span> • {user.name}
                </p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = user ? {
                  name: user.name,
                  email: user.email,
                  subject: supportForm.subject,
                  message: supportForm.message
                } : supportForm;

                if (formData.name && formData.email && formData.subject && formData.message) {
                  toast.success('Support ticket submitted successfully! We will get back to you soon.');
                  setSupportForm({ name: '', email: '', subject: '', message: '' });
                } else {
                  toast.error('Please fill in all fields');
                }
              }}
              className="bg-[#2C1810] border-2 border-[#8B6F47] rounded-lg p-6 space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-[#F5E6D3] mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={user ? user.name : supportForm.name}
                  onChange={(e) => !user && setSupportForm({ ...supportForm, name: e.target.value })}
                  disabled={!!user}
                  className={`w-full px-4 py-3 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] ${user ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F5E6D3] mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={user ? user.email : supportForm.email}
                  onChange={(e) => !user && setSupportForm({ ...supportForm, email: e.target.value })}
                  disabled={!!user}
                  className={`w-full px-4 py-3 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] ${user ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F5E6D3] mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3]"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F5E6D3] mb-2">
                  Message *
                </label>
                <textarea
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 bg-[#3D2817] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] resize-none"
                  placeholder="Please describe your issue in detail..."
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#D4AF37] hover:bg-[#FFD700] text-[#2C1810] font-semibold rounded-md transition-colors"
              >
                <Send className="size-5" />
                Submit Ticket
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <p className="text-sm text-[#D4C5AA]">
                <strong className="text-[#F5E6D3]">Note:</strong> For urgent issues, please call our support line.
                We typically respond to tickets within 24-48 hours.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}