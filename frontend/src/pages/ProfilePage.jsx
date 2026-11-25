import React, { useState } from 'react';
import {
  User,
  MapPin,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShieldCheck,
  Save,
  Home,
  Briefcase,
  Building,
  CheckCircle2,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';

const ProfilePage = () => {
  const { user, updateProfile, changePassword, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();
  const { checkServiceability, selectLocation } = useLocation();
  const toast = useToast();

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    houseNumber: '',
    buildingName: '',
    street: '',
    landmark: '',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226016',
    addressType: 'Home',
    isDefault: false,
  });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    await updateProfile({ name, phone });
    setSavingProfile(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    setChangingPass(true);
    const res = await changePassword(currentPassword, newPassword);
    setChangingPass(false);
    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleStartEdit = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      houseNumber: addr.houseNumber || '',
      buildingName: addr.buildingName || '',
      street: addr.street || '',
      landmark: addr.landmark || '',
      city: addr.city || 'Lucknow',
      state: addr.state || 'Uttar Pradesh',
      pincode: addr.pincode || '226016',
      addressType: addr.addressType || 'Home',
      isDefault: !!addr.isDefault,
    });
    setShowAddressForm(true);
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm({
      fullName: user?.name || '',
      phone: user?.phone || '',
      houseNumber: '',
      buildingName: '',
      street: '',
      landmark: '',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      pincode: '226016',
      addressType: 'Home',
      isDefault: false,
    });
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (editingAddressId) {
      const res = await updateAddress(editingAddressId, addressForm);
      if (res.success) {
        handleCancelAddressForm();
      }
    } else {
      const res = await addAddress(addressForm);
      if (res.success) {
        handleCancelAddressForm();
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          My Account &amp; Preferences
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage your personal profile, credentials, and saved delivery addresses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Personal Info & Password */}
        <div className="space-y-6">
          {/* User badge */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl mx-auto">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base">{user?.name || 'BasketBee Shopper'}</h3>
              <p className="text-xs text-gray-500">{user?.email || user?.phone || 'Mobile Customer'}</p>
              <div className="flex justify-center gap-1.5 mt-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  {user?.role || 'Customer'}
                </span>
                {user?.isPhoneVerified && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Phone Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Personal Details</span>
            </h3>

            <form onSubmit={handleProfileSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'Registered with Mobile OTP'}
                  className="w-full px-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingProfile ? 'Saving...' : 'Update Details'}</span>
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Security &amp; Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={changingPass}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
              >
                {changingPass ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Right 2 Columns: Saved Addresses Management */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-gray-900 font-black text-base">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Saved Delivery Addresses</span>
              </div>

              {!showAddressForm && (
                <button
                  onClick={() => {
                    setEditingAddressId(null);
                    setShowAddressForm(true);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {/* Add / Edit Address Form */}
            {showAddressForm && (
              <form onSubmit={handleAddressSubmit} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3.5">
                <div className="font-bold text-xs text-gray-900 uppercase tracking-wide">
                  {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rohan Sharma"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">House / Flat No.</label>
                    <input
                      type="text"
                      placeholder="Flat 402, Block A"
                      value={addressForm.houseNumber}
                      onChange={(e) => setAddressForm({ ...addressForm, houseNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Apartment / Society</label>
                    <input
                      type="text"
                      placeholder="Shalimar Gallant"
                      value={addressForm.buildingName}
                      onChange={(e) => setAddressForm({ ...addressForm, buildingName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Street / Area / Sector *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mahanagar / Gomti Nagar"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="226006"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">City</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">State</label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="Near Gole Market"
                    value={addressForm.landmark}
                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Address type & default */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-2">
                    {['Home', 'Work', 'Other'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddressForm({ ...addressForm, addressType: type })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          addressForm.addressType === type
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center space-x-1.5 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Set as Default</span>
                  </label>
                </div>

                <div className="flex space-x-2 pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelAddressForm}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    {editingAddressId ? 'Update Address' : 'Save Address'}
                  </button>
                </div>
              </form>
            )}

            {/* List of addresses */}
            <div className="space-y-3">
              {user?.addresses?.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <span>No saved addresses found. Add an address for seamless 1-click checkout!</span>
                </div>
              ) : (
                user?.addresses?.map((addr) => {
                  const Icon = addr.addressType === 'Home' ? Home : addr.addressType === 'Work' ? Briefcase : Building;

                  return (
                    <div
                      key={addr._id}
                      className="p-4 rounded-2xl border border-gray-200/80 hover:border-emerald-300 bg-white transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="p-1 bg-emerald-50 text-emerald-700 rounded-lg">
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-bold text-xs text-gray-900">{addr.fullName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase">
                            {addr.addressType}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Default Address
                            </span>
                          )}
                        </div>

                        {/* Edit & Delete actions */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleStartEdit(addr)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                            title="Edit Address"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteAddress(addr._id)}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete Address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed">
                        {addr.houseNumber && `${addr.houseNumber}, `}
                        {addr.buildingName && `${addr.buildingName}, `}
                        {addr.street}
                        {addr.landmark && ` (Landmark: ${addr.landmark})`}, {addr.city}, {addr.state} -{' '}
                        <span className="font-mono font-semibold text-gray-800">{addr.pincode}</span>
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                        <span className="text-gray-600 font-medium">📞 {addr.phone}</span>
                        <div className="flex items-center space-x-2">
                          {!addr.isDefault && (
                            <button
                              onClick={() => setDefaultAddress(addr._id)}
                              className="text-[11px] font-bold text-emerald-700 hover:underline"
                            >
                              Make Default
                            </button>
                          )}
                          <button
                            onClick={() => {
                              selectLocation({
                                pincode: addr.pincode,
                                area: `${addr.houseNumber ? addr.houseNumber + ', ' : ''}${addr.street}`,
                                city: addr.city,
                                state: addr.state,
                              });
                              toast.success(`Active delivery address set to ${addr.pincode}`);
                            }}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors"
                          >
                            Deliver Here
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
