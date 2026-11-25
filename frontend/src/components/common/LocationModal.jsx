import React, { useState, useEffect } from 'react';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import {
  MapPin,
  X,
  Check,
  Search,
  Navigation,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Home,
  Briefcase,
  Building,
} from 'lucide-react';

const LocationModal = () => {
  const {
    currentLocation,
    selectLocation,
    isLocationModalOpen,
    setIsLocationModalOpen,
    checkServiceability,
    detectLocation,
    isDetecting,
    serviceableZones,
    popularLocations,
  } = useLocation();

  const { user, isAuthenticated, addAddress, updateAddress, deleteAddress, setDefaultAddress, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState('pincode'); // 'pincode' | 'addresses' | 'new-address'
  const [searchTerm, setSearchTerm] = useState('');
  const [pincodeInput, setPincodeInput] = useState(currentLocation?.pincode || '');
  const [pinStatus, setPinStatus] = useState(null); // { checking: boolean, message: string, serviceable: boolean, zone: object }
  const [gpsStatus, setGpsStatus] = useState(null); // { message: string, isError: boolean }

  // Address form state
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    pincode: '',
    houseNumber: '',
    buildingName: '',
    street: '',
    landmark: '',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    addressType: 'Home',
    isDefault: false,
  });
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Pre-fill user details into address form
  useEffect(() => {
    if (user && !editingAddressId) {
      setAddressForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        phone: prev.phone || user.phone || '',
        pincode: prev.pincode || currentLocation?.pincode || '226016',
      }));
    }
  }, [user, currentLocation, editingAddressId]);

  if (!isLocationModalOpen) return null;

  // Handle GPS detect
  const handleDetectGPS = async () => {
    setGpsStatus({ message: 'Detecting your GPS location...', isError: false });
    const result = await detectLocation();
    if (result.success) {
      setGpsStatus({ message: result.message, isError: !result.serviceable });
      setPincodeInput(result.location?.pincode || '');
      setPinStatus({
        checking: false,
        message: result.message,
        serviceable: result.serviceable,
        zone: result.location,
      });
    } else {
      setGpsStatus({ message: result.message, isError: true });
    }
  };

  // Handle PIN check
  const handleCheckPincode = async (e) => {
    e?.preventDefault();
    const cleanPin = pincodeInput.trim();
    if (cleanPin.length !== 6) {
      setPinStatus({
        checking: false,
        message: 'Please enter a valid 6-digit Indian PIN code.',
        serviceable: false,
      });
      return;
    }

    setPinStatus({ checking: true, message: 'Checking delivery availability...', serviceable: false });
    const res = await checkServiceability(cleanPin);
    setPinStatus({
      checking: false,
      message: res.message,
      serviceable: res.serviceable,
      zone: res.zone,
    });
  };

  // Apply serviceable PIN as location
  const handleApplyZone = (zone) => {
    selectLocation({
      pincode: zone.pincode,
      area: zone.locality || zone.area,
      city: zone.city,
      state: zone.state,
      isServiceable: zone.deliveryAvailable !== false,
      estimatedDeliveryTime: zone.estimatedDeliveryTime,
      deliveryFee: zone.deliveryFee,
      freeDeliveryAbove: zone.freeDeliveryAbove,
      minimumOrderAmount: zone.minimumOrderAmount,
    });
  };

  // Select a saved address
  const handleSelectSavedAddress = async (addr) => {
    // Check serviceability of this saved address PIN code
    const res = await checkServiceability(addr.pincode);
    selectLocation({
      pincode: addr.pincode,
      area: `${addr.houseNumber ? addr.houseNumber + ', ' : ''}${addr.street || addr.landmark || addr.city}`,
      city: addr.city,
      state: addr.state,
      isServiceable: res.serviceable,
      estimatedDeliveryTime: res.zone?.estimatedDeliveryTime || '30-45 mins',
      deliveryFee: res.zone?.deliveryFee ?? 29,
      freeDeliveryAbove: res.zone?.freeDeliveryAbove ?? 499,
      minimumOrderAmount: res.zone?.minimumOrderAmount ?? 199,
    });
  };

  // Open edit address form
  const handleStartEdit = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      pincode: addr.pincode || '',
      houseNumber: addr.houseNumber || '',
      buildingName: addr.buildingName || '',
      street: addr.street || '',
      landmark: addr.landmark || '',
      city: addr.city || 'Lucknow',
      state: addr.state || 'Uttar Pradesh',
      addressType: addr.addressType || 'Home',
      isDefault: !!addr.isDefault,
    });
    setActiveTab('new-address');
  };

  // Submit address form
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!addressForm.fullName || !addressForm.phone || !addressForm.pincode || !addressForm.street) {
      setFormError('Please fill in all required fields (Name, Phone, Street/Area, PIN code).');
      return;
    }

    if (!/^\d{6}$/.test(addressForm.pincode)) {
      setFormError('Please enter a valid 6-digit PIN code.');
      return;
    }

    setAddressSubmitting(true);
    try {
      if (editingAddressId) {
        const res = await updateAddress(editingAddressId, addressForm);
        if (res.success) {
          setEditingAddressId(null);
          setActiveTab('addresses');
        } else {
          setFormError(res.message || 'Failed to update address');
        }
      } else {
        const res = await addAddress(addressForm);
        if (res.success) {
          setActiveTab('addresses');
        } else {
          setFormError(res.message || 'Failed to add address');
        }
      }
    } finally {
      setAddressSubmitting(false);
    }
  };

  // Available display zones: backend zones or demo fallback
  const displayZones = serviceableZones.length > 0 ? serviceableZones : popularLocations;

  const filteredZones = displayZones.filter((z) => {
    const loc = (z.locality || z.area || '').toLowerCase();
    const city = (z.city || '').toLowerCase();
    const pin = (z.pincode || '').toString();
    const q = searchTerm.toLowerCase();
    return loc.includes(q) || city.includes(q) || pin.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center space-x-2.5 text-emerald-900">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Select Delivery Location</h3>
              <p className="text-xs text-emerald-700 font-medium">
                Currently delivering in Lucknow, Uttar Pradesh
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-5 pt-2 bg-gray-50/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pincode')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'pincode'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Check PIN / Locality
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('otp');
              } else {
                setActiveTab('addresses');
              }
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'addresses'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Saved Addresses {user?.addresses?.length ? `(${user.addresses.length})` : ''}
          </button>
          {isAuthenticated && (
            <button
              onClick={() => {
                setEditingAddressId(null);
                setAddressForm({
                  fullName: user?.name || '',
                  phone: user?.phone || '',
                  pincode: currentLocation?.pincode || '226016',
                  houseNumber: '',
                  buildingName: '',
                  street: '',
                  landmark: '',
                  city: 'Lucknow',
                  state: 'Uttar Pradesh',
                  addressType: 'Home',
                  isDefault: false,
                });
                setActiveTab('new-address');
              }}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center space-x-1 ${
                activeTab === 'new-address'
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingAddressId ? 'Edit Address' : 'Add New Address'}</span>
            </button>
          )}
        </div>

        {/* Tab 1: PIN Code & Hub Finder */}
        {activeTab === 'pincode' && (
          <div className="p-5 overflow-y-auto space-y-4">
            {/* GPS Detection Button */}
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isDetecting}
              className="w-full py-3 px-4 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-sm"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>Detecting GPS Coordinates...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  <span>Detect my current location</span>
                </>
              )}
            </button>

            {gpsStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                  gpsStatus.isError
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {gpsStatus.isError ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <span>{gpsStatus.message}</span>
              </div>
            )}

            {/* PIN Code Verification Form */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Check Delivery by PIN Code
              </label>
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 226016"
                  value={pincodeInput}
                  onChange={(e) => {
                    setPincodeInput(e.target.value.replace(/\D/g, ''));
                    setPinStatus(null);
                  }}
                  className="flex-1 px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
                />
                <button
                  type="submit"
                  disabled={pinStatus?.checking || pincodeInput.trim().length !== 6}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center space-x-1"
                >
                  {pinStatus?.checking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Check PIN</span>
                </button>
              </form>

              {/* Status Message */}
              {pinStatus && (
                <div
                  className={`mt-2.5 p-2.5 rounded-lg text-xs flex items-start justify-between gap-2 ${
                    pinStatus.serviceable
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-medium'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <div className="flex items-start space-x-1.5">
                    {pinStatus.serviceable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{pinStatus.message}</span>
                  </div>
                  {pinStatus.serviceable && pinStatus.zone && (
                    <button
                      onClick={() => handleApplyZone(pinStatus.zone)}
                      className="px-2.5 py-1 bg-emerald-700 text-white text-xs font-bold rounded-md hover:bg-emerald-800 whitespace-nowrap transition-colors"
                    >
                      Deliver Here
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Locality Search & Serviceable Zones */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Supported Delivery Hubs (Lucknow)
                </span>
                <span className="text-xs text-emerald-700 font-medium">
                  {displayZones.length} Zones Active
                </span>
              </div>

              <div className="relative mb-2.5">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search locality (e.g. Indira Nagar, Gomti Nagar)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-50">
                {filteredZones.map((zone, idx) => {
                  const isSelected = currentLocation?.pincode === zone.pincode;
                  const localityName = zone.locality || zone.area;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleApplyZone(zone)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-semibold shadow-xs'
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900 text-sm">{localityName}</span>
                          <span className="font-mono text-xs px-2 py-0.5 bg-gray-200 text-gray-800 rounded-md">
                            {zone.pincode}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center space-x-2">
                          <span>{zone.city}, {zone.state}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">⚡ {zone.estimatedDeliveryTime || '30-45 mins'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {isSelected ? (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                            Selected
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-xs hover:underline">
                            Select
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Saved Addresses */}
        {activeTab === 'addresses' && (
          <div className="p-5 overflow-y-auto space-y-3">
            {!isAuthenticated ? (
              <div className="text-center py-8">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">Please sign in to view your saved addresses.</p>
                <button
                  onClick={() => openAuthModal('otp')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Sign In with Mobile OTP
                </button>
              </div>
            ) : user?.addresses && user.addresses.length > 0 ? (
              <div className="space-y-2.5">
                {user.addresses.map((addr) => {
                  const isCurrent = currentLocation?.pincode === addr.pincode;
                  const Icon = addr.addressType === 'Home' ? Home : addr.addressType === 'Work' ? Briefcase : Building;

                  return (
                    <div
                      key={addr._id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="p-1 bg-gray-100 rounded text-gray-700">
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-bold text-xs text-gray-900 uppercase tracking-wide">
                            {addr.addressType || 'Address'}
                          </span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                              Default
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
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

                      <div className="text-xs text-gray-700 mt-1 leading-relaxed">
                        <div className="font-semibold text-gray-900">{addr.fullName} • {addr.phone}</div>
                        <div>
                          {addr.houseNumber && `${addr.houseNumber}, `}
                          {addr.buildingName && `${addr.buildingName}, `}
                          {addr.street}
                        </div>
                        {addr.landmark && <div className="text-gray-500">Landmark: {addr.landmark}</div>}
                        <div className="text-gray-500">
                          {addr.city}, {addr.state} - <span className="font-mono font-semibold text-gray-800">{addr.pincode}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                        {!addr.isDefault && (
                          <button
                            onClick={() => setDefaultAddress(addr._id)}
                            className="text-[11px] text-gray-500 hover:text-emerald-700 underline font-medium"
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          onClick={() => handleSelectSavedAddress(addr)}
                          className="ml-auto px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Deliver to this Address
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">No saved addresses yet.</p>
                <button
                  onClick={() => setActiveTab('new-address')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Add Your First Address
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Add / Edit Address Form */}
        {activeTab === 'new-address' && (
          <form onSubmit={handleSaveAddress} className="p-5 overflow-y-auto space-y-3">
            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  placeholder="e.g. Rohan Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  placeholder="10-digit mobile"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  House / Flat / Block No.
                </label>
                <input
                  type="text"
                  value={addressForm.houseNumber}
                  onChange={(e) => setAddressForm({ ...addressForm, houseNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  placeholder="Flat 402 / House 12"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Apartment / Society Name
                </label>
                <input
                  type="text"
                  value={addressForm.buildingName}
                  onChange={(e) => setAddressForm({ ...addressForm, buildingName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  placeholder="Shalimar Gallant"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Street / Area / Locality *
              </label>
              <input
                type="text"
                required
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                placeholder="Sector B, Mahanagar"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  placeholder="226006"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={addressForm.landmark}
                onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                placeholder="Near Gole Market / Opposite Park"
              />
            </div>

            {/* Address Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Address Type
              </label>
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressForm({ ...addressForm, addressType: type })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      addressForm.addressType === type
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Set Default Checkbox */}
            <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Set as default delivery address</span>
            </label>

            {/* Submit / Cancel Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingAddressId(null);
                  setActiveTab('addresses');
                }}
                className="w-1/3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addressSubmitting}
                className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                {addressSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingAddressId ? 'Update Address' : 'Save Address'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Current: <strong>{currentLocation?.area || 'Indira Nagar'}, {currentLocation?.city || 'Lucknow'} ({currentLocation?.pincode || '226016'})</strong></span>
          </span>
          <span className="text-emerald-700 font-semibold">
            {currentLocation?.isServiceable !== false ? '✓ Serviceable' : '✕ Not Serviceable'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
