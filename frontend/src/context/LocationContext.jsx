import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { deliveryAPI } from '../services/api';

const LocationContext = createContext();

export const DEFAULT_LUCKNOW_LOCATIONS = [
  { pincode: '226016', area: 'Indira Nagar', city: 'Lucknow', state: 'Uttar Pradesh', estimatedDeliveryTime: '30-45 mins', deliveryFee: 29 },
  { pincode: '226010', area: 'Gomti Nagar', city: 'Lucknow', state: 'Uttar Pradesh', estimatedDeliveryTime: '30-40 mins', deliveryFee: 29 },
  { pincode: '226001', area: 'Hazratganj', city: 'Lucknow', state: 'Uttar Pradesh', estimatedDeliveryTime: '25-35 mins', deliveryFee: 29 },
  { pincode: '226006', area: 'Mahanagar', city: 'Lucknow', state: 'Uttar Pradesh', estimatedDeliveryTime: '30-40 mins', deliveryFee: 29 },
  { pincode: '226024', area: 'Vikas Nagar', city: 'Lucknow', state: 'Uttar Pradesh', estimatedDeliveryTime: '35-50 mins', deliveryFee: 29 },
  { pincode: '226021', area: 'Jankipuram', city: 'Lucknow', state: 'Uttar Pradesh', estimatedDeliveryTime: '40-55 mins', deliveryFee: 35 },
  { pincode: '226028', area: 'Alambagh', city: 'Lucknow', state: 'Uttar Pradesh', estimatedDeliveryTime: '45-60 mins', deliveryFee: 39 },
  { pincode: '226004', area: 'Chowk', city: 'Lucknow', state: 'Uttar Pradesh', estimatedDeliveryTime: '35-45 mins', deliveryFee: 29 },
];

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(() => {
    const saved =
      localStorage.getItem('basketbee_location') ||
      localStorage.getItem('freshly_location');
    return saved
      ? JSON.parse(saved)
      : {
          pincode: '226016',
          area: 'Indira Nagar',
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          isServiceable: true,
          estimatedDeliveryTime: '30-45 mins',
          deliveryFee: 29,
          freeDeliveryAbove: 499,
          minimumOrderAmount: 199,
        };
  });

  const [serviceableZones, setServiceableZones] = useState([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Fetch serviceable zones on load
  const loadServiceableZones = useCallback(async () => {
    try {
      const res = await deliveryAPI.getServiceableZones();
      if (res.success && Array.isArray(res.data)) {
        setServiceableZones(res.data);
      }
    } catch (err) {
      console.warn('Could not load serviceable zones from API:', err.message);
    }
  }, []);

  useEffect(() => {
    loadServiceableZones();
  }, [loadServiceableZones]);

  useEffect(() => {
    if (currentLocation) {
      localStorage.setItem('basketbee_location', JSON.stringify(currentLocation));
      localStorage.setItem('freshly_location', JSON.stringify(currentLocation));
    }
  }, [currentLocation]);

  // Check PIN code serviceability with backend API
  const checkServiceability = async (pincode) => {
    const cleanPin = String(pincode).trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return {
        serviceable: false,
        message: 'Please enter a valid 6-digit Indian PIN code.',
      };
    }

    try {
      const res = await deliveryAPI.checkPincode(cleanPin);
      if (res.success) {
        const isServiceable = Boolean(res.serviceable ?? res.available ?? res.data?.deliveryAvailable);
        const zone = res.zone || res.data || null;
        return {
          serviceable: isServiceable,
          zone,
          message: isServiceable
            ? `✓ Delivery available in ${zone?.locality || 'this area'} (Estimated: ${zone?.estimatedDeliveryTime || '30-45 mins'})`
            : res.message || 'Sorry! Delivery is not currently available at this PIN code.',
        };
      }
      return {
        serviceable: false,
        message: 'Sorry! Delivery is not currently available at this PIN code.',
      };
    } catch {
      // Fallback local check if API is momentarily unreachable
      const localMatch = DEFAULT_LUCKNOW_LOCATIONS.find((loc) => loc.pincode === cleanPin);
      if (localMatch) {
        return {
          serviceable: true,
          zone: {
            pincode: localMatch.pincode,
            locality: localMatch.area,
            city: localMatch.city,
            state: localMatch.state,
            estimatedDeliveryTime: localMatch.estimatedDeliveryTime,
            deliveryFee: localMatch.deliveryFee,
            freeDeliveryAbove: 499,
          },
          message: `✓ Delivery available in ${localMatch.area} (Estimated: ${localMatch.estimatedDeliveryTime})`,
        };
      }
      return {
        serviceable: false,
        message: 'Sorry! Delivery is not currently available at this PIN code.',
      };
    }
  };

  // Set active location
  const selectLocation = (loc) => {
    const updated = {
      pincode: loc.pincode,
      area: loc.area || loc.locality || 'Delivery Area',
      city: loc.city || 'Lucknow',
      state: loc.state || 'Uttar Pradesh',
      isServiceable: loc.isServiceable !== false,
      estimatedDeliveryTime: loc.estimatedDeliveryTime || '30-45 mins',
      deliveryFee: loc.deliveryFee ?? 29,
      freeDeliveryAbove: loc.freeDeliveryAbove ?? 499,
      minimumOrderAmount: loc.minimumOrderAmount ?? 199,
    };
    setCurrentLocation(updated);
    setIsLocationModalOpen(false);
  };

  // Browser Geolocation API with reverse geocoding
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      return {
        success: false,
        message: 'Geolocation is not supported by your browser. Please select location manually.',
      };
    }

    setIsDetecting(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocode using OpenStreetMap Nominatim
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const address = data.address || {};
            const pincode = address.postcode ? address.postcode.replace(/\s+/g, '') : null;
            const locality = address.suburb || address.neighbourhood || address.residential || address.road || address.county || 'Detected Area';
            const city = address.city || address.town || address.village || address.state_district || 'Lucknow';
            const state = address.state || 'Uttar Pradesh';

            if (pincode && /^\d{6}$/.test(pincode)) {
              // Check backend serviceability
              const serviceCheck = await checkServiceability(pincode);
              const detectedLoc = {
                pincode,
                area: locality,
                city,
                state,
                isServiceable: serviceCheck.serviceable,
                estimatedDeliveryTime: serviceCheck.zone?.estimatedDeliveryTime || '30-45 mins',
                deliveryFee: serviceCheck.zone?.deliveryFee ?? 29,
                freeDeliveryAbove: serviceCheck.zone?.freeDeliveryAbove ?? 499,
                minimumOrderAmount: serviceCheck.zone?.minimumOrderAmount ?? 199,
                lat: latitude,
                lon: longitude,
              };

              setCurrentLocation(detectedLoc);
              setIsDetecting(false);
              resolve({
                success: true,
                location: detectedLoc,
                serviceable: serviceCheck.serviceable,
                message: serviceCheck.serviceable
                  ? `Location detected: ${locality}, ${city} (${pincode}). Delivery is available!`
                  : `Location detected: ${locality}, ${city} (${pincode}). Sorry, delivery is not available yet at this PIN code.`,
              });
            } else {
              // Default to central Lucknow demo if PIN code isn't 6 digits
              const fallback = DEFAULT_LUCKNOW_LOCATIONS[0];
              setCurrentLocation({
                pincode: fallback.pincode,
                area: locality || fallback.area,
                city: city || fallback.city,
                state: state || fallback.state,
                isServiceable: true,
                estimatedDeliveryTime: fallback.estimatedDeliveryTime,
                deliveryFee: fallback.deliveryFee,
              });
              setIsDetecting(false);
              resolve({
                success: true,
                location: fallback,
                serviceable: true,
                message: `Location detected near ${locality}, ${city}. Set to Lucknow zone.`,
              });
            }
          } catch (err) {
            console.warn('Reverse geocoding error:', err);
            // Graceful fallback to default Lucknow location
            const fallback = DEFAULT_LUCKNOW_LOCATIONS[0];
            setCurrentLocation({ ...fallback, isServiceable: true });
            setIsDetecting(false);
            resolve({
              success: true,
              location: fallback,
              serviceable: true,
              message: 'Location set to Lucknow (Indira Nagar 226016).',
            });
          }
        },
        (error) => {
          setIsDetecting(false);
          let errMsg = 'Failed to detect location. Please select your locality or enter PIN code manually.';
          if (error.code === error.PERMISSION_DENIED) {
            errMsg = 'Location permission was denied. Please select your address manually.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errMsg = 'Location information is unavailable. Please select your PIN code manually.';
          } else if (error.code === error.TIMEOUT) {
            errMsg = 'Location request timed out. Please select your PIN code manually.';
          }
          resolve({ success: false, message: errMsg, permissionDenied: error.code === error.PERMISSION_DENIED });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        setCurrentLocation,
        selectLocation,
        checkServiceability,
        detectLocation,
        isDetecting,
        isLocationModalOpen,
        setIsLocationModalOpen,
        serviceableZones,
        popularLocations: DEFAULT_LUCKNOW_LOCATIONS,
        selectedAddress,
        setSelectedAddress,
        loadServiceableZones,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
