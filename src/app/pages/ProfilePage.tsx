import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { User as UserIcon, Mail, Phone, MapPin, Save, Edit2, Shield, FileText, CreditCard, Building2, Home, Calendar, Award, X, AlertCircle, Store, Package } from 'lucide-react';
import type { User, CartItem } from '../types';
import { toast } from 'sonner';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ProfilePageProps {
  user: User | null;
  cart: CartItem[];
  onLogout: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onLocationChange?: (location: string) => void;
}

export function ProfilePage({ onLocationChange }: { onLocationChange?: (location: string) => void; }) {
  const { user, logout, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    storeName: '',
    gtin: '',
    businessRegistration: '',
    gst: '',
    storeAddress: '',
    yearsInBusiness: 0,
    specialties: '',
    supportEmail: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await apiService.getUserProfile();
        setProfileData(response.user);
        setFormData({
          name: response.user.name || '',
          email: response.user.email || '',
          phone: response.user.phone || '',
          location: response.user.location || '',
          storeName: response.user.storeName || '',
          gtin: response.user.gtin || '',
          businessRegistration: response.user.businessRegistration || '',
          gst: response.user.gst || '',
          storeAddress: response.user.storeAddress || '',
          yearsInBusiness: response.user.yearsInBusiness || 0,
          specialties: response.user.specialties || '',
          supportEmail: response.user.supportEmail || '',
        });
      } catch (error) {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!profileData) return;
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Phone validation (if provided)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        toast.error('Please enter a valid phone number');
        return;
      }
    }
    
    // Seller-specific validation
    if (profileData.role === 'seller') {
      if (!formData.storeName.trim()) {
        toast.error('Store name is required for sellers');
        return;
      }
      
      if (!formData.storeAddress.trim()) {
        toast.error('Store address is required for sellers');
        return;
      }
    }
    
    try {
      const response = await apiService.updateUserProfile(formData);
      setProfileData(response.user);
      setIsEditing(false);
      toast.success('✅ Profile updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profileData?.name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      location: profileData?.location || '',
      storeName: profileData?.storeName || '',
      gtin: profileData?.gtin || '',
      businessRegistration: profileData?.businessRegistration || '',
      gst: profileData?.gst || '',
      storeAddress: profileData?.storeAddress || '',
      yearsInBusiness: profileData?.yearsInBusiness || 0,
      specialties: profileData?.specialties || '',
      supportEmail: profileData?.supportEmail || '',
    });
    setIsEditing(false);
    toast.info('Changes discarded');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5E6D3]">
        <Navbar user={user} onLogout={logout} onLocationChange={onLocationChange} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-[#2C1810] mb-4">Loading Profile...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profileData) {
    return (
      <div className="min-h-screen bg-[#F5E6D3]">
        <Navbar user={user} onLogout={logout} onLocationChange={onLocationChange} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-[#2C1810] mb-4">Please Login</h2>
            <p className="text-[#6B5537] mb-6">You need to be logged in to view your profile.</p>
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-[#8B6F47] text-white rounded-lg hover:bg-[#6B5537] transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <Navbar user={user} onLogout={logout} onLocationChange={onLocationChange} notifications={notifications} onMarkNotificationRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onDeleteNotification={deleteNotification} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2C1810]" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Profile
          </h1>
          <p className="text-[#6B5537] mt-2">View and manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#8B6F47] to-[#6B5537] px-6 py-8 sm:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                  <UserIcon className="size-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{profileData.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="size-4 text-[#D4AF37]" />
                    <span className="text-sm font-medium text-[#D4AF37] capitalize">
                      {profileData.role === 'customer' ? 'Customer Account' : profileData.role === 'seller' ? 'Seller Account' : 'Admin Account'}
                    </span>
                  </div>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  <Edit2 className="size-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="p-6 sm:p-8">
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                  <UserIcon className="size-4" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                  />
                ) : (
                  <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">{profileData.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                  <Mail className="size-4" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                  />
                ) : (
                  <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">{profileData.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                  <Phone className="size-4" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                  />
                ) : (
                  <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                    {profileData.phone || 'Not provided'}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                  <MapPin className="size-4" />
                  Location / Address
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter your address"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810] resize-none"
                  />
                ) : (
                  <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                    {profileData.location || 'Not provided'}
                  </p>
                )}
              </div>

              {/* Seller-specific fields */}
              {profileData.role === 'seller' && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <Building2 className="size-4" />
                      Store Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.storeName}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        placeholder="Your store name"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {profileData.storeName || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Store Address */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <Home className="size-4" />
                      Store Address
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.storeAddress}
                        onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                        placeholder="Enter your store's full address"
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810] resize-none"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.storeAddress || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* GTIN */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <FileText className="size-4" />
                      GTIN (Global Trade Item Number)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.gtin}
                        onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                        placeholder="Enter your GTIN"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.gtin || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* GST Number */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <CreditCard className="size-4" />
                      GST Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.gst}
                        onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                        placeholder="Enter your GST number"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.gst || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Business Registration */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <FileText className="size-4" />
                      Business Registration Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.businessRegistration}
                        onChange={(e) => setFormData({ ...formData, businessRegistration: e.target.value })}
                        placeholder="Enter your business registration number"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.businessRegistration || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Years in Business */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <Calendar className="size-4" />
                      Years in Business
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.yearsInBusiness}
                        onChange={(e) => setFormData({ ...formData, yearsInBusiness: parseInt(e.target.value) })}
                        placeholder="Enter years in business"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.yearsInBusiness || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Specialties */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <Award className="size-4" />
                      Specialties
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.specialties}
                        onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                        placeholder="Enter your specialties"
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810] resize-none"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.specialties || 'Not provided'}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Admin-specific fields */}
              {profileData.role === 'admin' && (
                <>
                  {/* Section Header */}
                  <div className="pt-6 border-t-2 border-[#D4AF37]">
                    <h3 className="text-lg font-bold text-[#2C1810] mb-4 flex items-center gap-2">
                      <Building2 className="size-5 text-[#8B6F47]" />
                      BOI PARA Platform Information
                    </h3>
                  </div>

                  {/* Platform Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <Building2 className="size-4" />
                      Platform Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.storeName}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        placeholder="BOI PARA"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.storeName || 'BOI PARA'}
                      </p>
                    )}
                  </div>

                  {/* Admin Login Email */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <Mail className="size-4" />
                      Admin Login Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="admin@test.com"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.email || 'admin@test.com'}
                      </p>
                    )}
                  </div>

                  {/* Customer Support Email */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <Mail className="size-4" />
                      Customer Support Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.supportEmail}
                        onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                        placeholder="reachsupport@boipara.com"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.supportEmail || 'reachsupport@boipara.com'}
                      </p>
                    )}
                  </div>

                  {/* Customer Support Phone */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <Phone className="size-4" />
                      Customer Support Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 8101637164"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.phone || '+91 8101637164'}
                      </p>
                    )}
                  </div>

                  {/* Business Address */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <Home className="size-4" />
                      Business Address
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.storeAddress}
                        onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                        placeholder="Enter BOI PARA's registered business address"
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810] resize-none"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.storeAddress || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* GTIN */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <FileText className="size-4" />
                      GTIN (Global Trade Item Number)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.gtin}
                        onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                        placeholder="Enter platform GTIN"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.gtin || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* GSTIN/GST Number */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <CreditCard className="size-4" />
                      GSTIN / GST Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.gst}
                        onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                        placeholder="Enter platform GSTIN"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.gst || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Business Registration */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                      <FileText className="size-4" />
                      Business Registration Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.businessRegistration}
                        onChange={(e) => setFormData({ ...formData, businessRegistration: e.target.value })}
                        placeholder="Enter business registration number"
                        className="w-full px-4 py-3 border-2 border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-[#2C1810]"
                      />
                    ) : (
                      <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg">
                        {user.businessRegistration || 'Not provided'}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Account Type (Read-only) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#6B5537] mb-2">
                  <Shield className="size-4" />
                  Account Type
                </label>
                <p className="text-lg text-[#2C1810] font-medium px-4 py-3 bg-[#F5E6D3] rounded-lg capitalize">
                  {profileData.role === 'customer' ? 'Customer' : profileData.role === 'seller' ? 'Seller' : 'Administrator'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-4 mt-8 pt-6 border-t-2 border-[#D4AF37]">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#8B6F47] text-white rounded-lg hover:bg-[#6B5537] transition-colors font-semibold"
                >
                  <Save className="size-5" />
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> For security reasons, password changes and account deletion require contacting support.
          </p>
        </div>
      </div>
    </div>
  );
}