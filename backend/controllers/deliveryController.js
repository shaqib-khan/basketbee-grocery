import DeliveryZone from '../models/DeliveryZone.js';

// @desc    Check delivery serviceability for a PIN code
// @route   GET /api/delivery/check/:pincode
// @access  Public
export const checkDeliveryServiceability = async (req, res, next) => {
  try {
    const { pincode } = req.params;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        serviceable: false,
        available: false,
        message: 'Please provide a valid 6-digit Indian PIN code',
      });
    }

    const cleanPin = pincode.trim();
    const zone = await DeliveryZone.findOne({
      pincode: cleanPin,
      isActive: true,
      deliveryAvailable: true,
    });

    if (!zone) {
      return res.json({
        success: true,
        serviceable: false,
        available: false,
        message: `Sorry! Delivery is not currently available at PIN code ${cleanPin}.`,
        pincode: cleanPin,
        zone: null,
        data: null,
      });
    }

    const zoneData = {
      _id: zone._id,
      pincode: zone.pincode,
      locality: zone.locality,
      city: zone.city,
      state: zone.state,
      deliveryAvailable: zone.deliveryAvailable,
      minimumOrderAmount: zone.minimumOrderAmount,
      deliveryFee: zone.deliveryFee,
      freeDeliveryAbove: zone.freeDeliveryAbove,
      estimatedDeliveryTime: zone.estimatedDeliveryTime,
      expressAvailable: zone.expressAvailable !== false,
      expressDeliveryTime: zone.expressDeliveryTime || '10–15 mins',
      expressDeliveryFee: zone.expressDeliveryFee ?? 39,
      expressFreeAbove: zone.expressFreeAbove ?? 699,
      isActive: zone.isActive,
    };

    res.json({
      success: true,
      serviceable: true,
      available: true,
      message: `✓ Delivery available at ${zone.locality}, ${zone.city} (${zone.pincode})!`,
      zone: zoneData,
      data: zoneData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all serviceable delivery locations
// @route   GET /api/delivery/serviceable
// @access  Public
export const getServiceableZones = async (req, res, next) => {
  try {
    const zones = await DeliveryZone.find({ isActive: true, deliveryAvailable: true }).sort({ locality: 1 });
    res.json({
      success: true,
      count: zones.length,
      data: zones,
      zones,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all delivery zones (Admin)
// @route   GET /api/delivery/zones
// @access  Private/Admin
export const getAllZones = async (req, res, next) => {
  try {
    const zones = await DeliveryZone.find({}).sort({ pincode: 1 });
    res.json({
      success: true,
      count: zones.length,
      data: zones,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new delivery zone (Admin)
// @route   POST /api/delivery/zones
// @access  Private/Admin
export const createDeliveryZone = async (req, res, next) => {
  try {
    const {
      pincode,
      locality,
      city = 'Lucknow',
      state = 'Uttar Pradesh',
      deliveryAvailable = true,
      minimumOrderAmount = 199,
      deliveryFee = 25,
      freeDeliveryAbove = 499,
      estimatedDeliveryTime = '30–45 mins',
      expressAvailable = true,
      expressDeliveryTime = '10–15 mins',
      expressDeliveryFee = 39,
      expressFreeAbove = 699,
      isActive = true,
    } = req.body;

    if (!pincode || !locality) {
      return res.status(400).json({
        success: false,
        message: 'PIN code and locality name are required',
      });
    }

    const cleanPin = pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN code must be a valid 6-digit Indian PIN code',
      });
    }

    const existing = await DeliveryZone.findOne({ pincode: cleanPin });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `PIN code ${cleanPin} already exists in delivery serviceability system`,
      });
    }

    const zone = await DeliveryZone.create({
      pincode: cleanPin,
      locality: locality.trim(),
      city: city.trim(),
      state: state.trim(),
      deliveryAvailable,
      minimumOrderAmount: Number(minimumOrderAmount),
      deliveryFee: Number(deliveryFee),
      freeDeliveryAbove: Number(freeDeliveryAbove),
      estimatedDeliveryTime,
      expressAvailable,
      expressDeliveryTime,
      expressDeliveryFee: Number(expressDeliveryFee),
      expressFreeAbove: Number(expressFreeAbove),
      isActive,
    });

    res.status(201).json({
      success: true,
      message: 'Delivery PIN code added successfully',
      data: zone,
      zone,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery zone (Admin)
// @route   PUT /api/delivery/zones/:id
// @access  Private/Admin
export const updateDeliveryZone = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Delivery zone not found',
      });
    }

    const fields = [
      'locality',
      'city',
      'state',
      'deliveryAvailable',
      'minimumOrderAmount',
      'deliveryFee',
      'freeDeliveryAbove',
      'estimatedDeliveryTime',
      'expressAvailable',
      'expressDeliveryTime',
      'expressDeliveryFee',
      'expressFreeAbove',
      'isActive',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        zone[field] = req.body[field];
      }
    });

    await zone.save();

    res.json({
      success: true,
      message: 'Delivery zone updated successfully',
      data: zone,
      zone,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete delivery zone (Admin)
// @route   DELETE /api/delivery/zones/:id
// @access  Private/Admin
export const deleteDeliveryZone = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Delivery zone not found',
      });
    }

    await zone.deleteOne();

    res.json({
      success: true,
      message: 'Delivery PIN code removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check delivery serviceability via POST
// @route   POST /api/delivery/check-serviceability
// @access  Public
export const checkServiceabilityPost = async (req, res, next) => {
  try {
    const pincode = req.body.pincode || req.body.pin || '';
    req.params.pincode = String(pincode);
    return checkDeliveryServiceability(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Get active delivery options (10-minute Express vs Standard)
// @route   GET /api/delivery/options
// @access  Public
export const getDeliveryOptions = async (req, res, next) => {
  try {
    const { pincode } = req.query;
    let zone = null;
    if (pincode && /^\d{6}$/.test(pincode)) {
      zone = await DeliveryZone.findOne({ pincode: pincode.trim(), isActive: true });
    }

    const options = [
      {
        id: 'express',
        name: '10-Minute Express Delivery',
        badge: 'LIGHTNING FAST',
        description: 'Packed from nearest BasketBee Quick Store & delivered in 10-15 mins',
        estimatedTime: zone?.expressDeliveryTime || '10–15 mins',
        fee: zone ? zone.expressDeliveryFee : 39,
        freeAbove: zone ? zone.expressFreeAbove : 699,
        isAvailable: zone ? zone.expressAvailable !== false : true,
      },
      {
        id: 'standard',
        name: 'Standard Scheduled Delivery',
        badge: 'SAVER',
        description: 'Fresh warehouse produce delivered in 30-45 mins or chosen slot',
        estimatedTime: zone?.estimatedDeliveryTime || '30–45 mins',
        fee: zone ? zone.deliveryFee : 25,
        freeAbove: zone ? zone.freeDeliveryAbove : 499,
        isAvailable: true,
      },
    ];

    res.json({
      success: true,
      pincode: pincode || null,
      serviceable: zone ? zone.deliveryAvailable !== false : true,
      data: options,
      options,
    });
  } catch (error) {
    next(error);
  }
};
