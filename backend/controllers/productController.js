import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';

// Helper to create slug
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// @desc    Get all products with filtering, search & pagination
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      subcategory,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      isBestSeller,
      isTrending,
      isFreshPick,
      sort,
      page = 1,
      limit = 24,
    } = req.query;

    const query = {};

    // Search keyword
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { categoryName: searchRegex },
        { subcategory: searchRegex },
        { tags: searchRegex },
        { description: searchRegex },
      ];
    }

    // Category filter (by slug or name)
    if (category && category !== 'all') {
      query.categorySlug = category.toLowerCase();
    }

    // Subcategory filter
    if (subcategory && subcategory !== 'all') {
      query.subcategory = subcategory;
    }

    // Price range on selling price
    if (minPrice || maxPrice) {
      query.$or = query.$or || [];
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);

      query.sellingPrice = priceFilter;
    }

    // Stock availability
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Flags
    if (isFeatured === 'true') query.isFeatured = true;
    if (isBestSeller === 'true') query.isBestSeller = true;
    if (isTrending === 'true') query.isTrending = true;
    if (isFreshPick === 'true') query.isFreshPick = true;

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOption = { sellingPrice: 1, discountedPrice: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { sellingPrice: -1, discountedPrice: -1 };
    } else if (sort === 'popularity' || sort === 'rating') {
      sortOption = { rating: -1, numberOfReviews: -1 };
    } else if (sort === 'discount') {
      sortOption = { discountPercentage: -1, discountPercent: -1 };
    } else if (sort === 'name_asc') {
      sortOption = { name: 1 };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product search suggestions
// @route   GET /api/products/search/suggestions
// @access  Public
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, suggestions: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const products = await Product.find({
      $or: [{ name: regex }, { brand: regex }, { categoryName: regex }],
    })
      .select('name image mrp sellingPrice discountedPrice unit weight categoryName slug')
      .limit(6);

    const categories = await Category.find({
      name: regex,
    })
      .select('name slug')
      .limit(3);

    res.json({
      success: true,
      data: {
        products,
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get homepage featured products (shelves)
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const [bestSellers, trending, freshPicks, discounts] = await Promise.all([
      Product.find({ isBestSeller: true }).limit(8),
      Product.find({ isTrending: true }).limit(8),
      Product.find({ categorySlug: { $in: ['fruits', 'vegetables', 'fruits-vegetables'] } }).limit(8),
      Product.find({ discountPercentage: { $gte: 15 } }).sort({ discountPercentage: -1 }).limit(8),
    ]);

    res.json({
      success: true,
      data: {
        bestSellers,
        trending,
        freshPicks,
        discounts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or slug
// @route   GET /api/products/:idOrSlug
// @access  Public
export const getProductByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    let product;
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSlug).populate('category');
    }

    if (!product) {
      product = await Product.findOne({ slug: idOrSlug }).populate('category');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Related products from same category
    const relatedProducts = await Product.find({
      categorySlug: product.categorySlug,
      _id: { $ne: product._id },
    }).limit(4);

    res.json({
      success: true,
      data: product,
      related: relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Full search products by query
// @route   GET /api/products/search
// @access  Public
export const searchProducts = async (req, res, next) => {
  try {
    const q = req.query.q || req.query.query || req.query.keyword || '';
    if (!q || q.trim().length === 0) {
      const all = await Product.find({ isAvailable: true }).limit(24);
      return res.json({ success: true, count: all.length, data: all });
    }

    const regex = new RegExp(q.trim(), 'i');
    const products = await Product.find({
      $or: [
        { name: regex },
        { brand: regex },
        { categoryName: regex },
        { subcategory: regex },
        { tags: regex },
        { description: regex },
      ],
    });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get products by category ID or slug
// @route   GET /api/products/category/:categoryId
// @access  Public
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    let query = {};

    if (categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      query = { category: categoryId };
    } else {
      query = { categorySlug: categoryId.toLowerCase() };
    }

    const products = await Product.find(query);

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product (Admin)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      brand,
      category,
      subcategory,
      description,
      mrp,
      sellingPrice,
      originalPrice,
      discountedPrice,
      weight,
      unit,
      stock,
      image,
      images,
      tags,
      isFeatured,
      isBestSeller,
      isTrending,
      isFreshPick,
      nutritionalInfo,
    } = req.body;

    const actualMrp = Number(mrp !== undefined ? mrp : originalPrice);
    const actualSelling = Number(sellingPrice !== undefined ? sellingPrice : discountedPrice);

    if (actualSelling > actualMrp) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Selling price (₹${actualSelling}) cannot exceed MRP (₹${actualMrp}).`,
      });
    }

    const catDoc = await Category.findById(category);
    if (!catDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category specified',
      });
    }

    const calculatedDiscount = actualMrp > actualSelling
      ? Math.round(((actualMrp - actualSelling) / actualMrp) * 100)
      : 0;

    const slug = `${createSlug(name)}-${Date.now().toString().slice(-4)}`;
    const productWeight = weight || unit || '1 kg';

    const product = await Product.create({
      name,
      slug,
      brand: brand || 'Fresho',
      category: catDoc._id,
      categoryName: catDoc.name,
      categorySlug: catDoc.slug,
      subcategory: subcategory || 'General',
      description: description || 'Fresh premium quality grocery product sourced directly from verified local farms and trusted distributors.',
      weight: productWeight,
      unit: productWeight,
      mrp: actualMrp,
      sellingPrice: actualSelling,
      discountPercentage: calculatedDiscount,
      originalPrice: actualMrp,
      discountedPrice: actualSelling,
      discountPercent: calculatedDiscount,
      stock: Number(stock) || 0,
      image,
      images: images && images.length ? images : [image],
      tags: tags || [],
      isFeatured: Boolean(isFeatured),
      isBestSeller: Boolean(isBestSeller),
      isTrending: Boolean(isTrending),
      isFreshPick: Boolean(isFreshPick),
      nutritionalInfo: nutritionalInfo || {},
    });

    // Update category item count
    catDoc.itemCount = await Product.countDocuments({ category: catDoc._id });
    await catDoc.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const newMrp = req.body.mrp !== undefined ? Number(req.body.mrp) : (req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : product.mrp);
    const newSelling = req.body.sellingPrice !== undefined ? Number(req.body.sellingPrice) : (req.body.discountedPrice !== undefined ? Number(req.body.discountedPrice) : product.sellingPrice);

    if (newSelling > newMrp) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Selling price (₹${newSelling}) cannot exceed MRP (₹${newMrp}).`,
      });
    }

    // If category changed, update category names & counts
    if (req.body.category && req.body.category !== product.category.toString()) {
      const catDoc = await Category.findById(req.body.category);
      if (catDoc) {
        product.category = catDoc._id;
        product.categoryName = catDoc.name;
        product.categorySlug = catDoc.slug;
      }
    }

    Object.assign(product, req.body);

    product.mrp = newMrp;
    product.sellingPrice = newSelling;
    product.originalPrice = newMrp;
    product.discountedPrice = newSelling;

    if (newMrp > newSelling) {
      product.discountPercentage = Math.round(((newMrp - newSelling) / newMrp) * 100);
    } else {
      product.discountPercentage = 0;
    }
    product.discountPercent = product.discountPercentage;

    if (req.body.weight) {
      product.weight = req.body.weight;
      product.unit = req.body.weight;
    }

    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const categoryId = product.category;
    await product.deleteOne();

    // Update category count
    if (categoryId) {
      const count = await Product.countDocuments({ category: categoryId });
      await Category.findByIdAndUpdate(categoryId, { itemCount: count });
    }

    res.json({
      success: true,
      message: 'Product removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product review & rating (Verified purchasers only)
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment, title = '' } = req.body;
    const numRating = Number(rating);

    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid rating between 1 and 5 stars',
      });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a written review comment',
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Prevent duplicate reviews from the same user for the same product
    const alreadyReviewed = product.reviews?.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product.',
      });
    }

    // Verified purchaser check: Ensure customer has purchased this product
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.product': product._id,
      orderStatus: { $in: ['Delivered', 'Processing', 'Shipped', 'Pending'] },
    });

    if (!hasPurchased && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only verified purchasers who have ordered this product can submit a review.',
      });
    }

    const review = {
      user: req.user._id,
      userName: req.user.name || 'Verified Shopper',
      rating: numRating,
      title: title.trim(),
      comment: comment.trim(),
      isVerifiedPurchase: !!hasPurchased || req.user.role === 'admin',
    };

    if (!product.reviews) {
      product.reviews = [];
    }
    product.reviews.push(review);

    // Recalculate dynamic rating & number of reviews
    product.numberOfReviews = product.reviews.length;
    product.numReviews = product.reviews.length;
    const totalRating = product.reviews.reduce((acc, item) => item.rating + acc, 0);
    product.rating = Number((totalRating / product.reviews.length).toFixed(1));

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Thank you! Your verified review has been submitted.',
      data: {
        rating: product.rating,
        numberOfReviews: product.numberOfReviews,
        reviews: product.reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).select('reviews rating numberOfReviews name');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      count: product.reviews?.length || 0,
      rating: product.rating || 0,
      numberOfReviews: product.numberOfReviews || 0,
      data: product.reviews || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review (Admin moderation)
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private/Admin
export const deleteProductReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.reviews = product.reviews.filter(
      (r) => r._id.toString() !== req.params.reviewId
    );

    product.numberOfReviews = product.reviews.length;
    product.numReviews = product.reviews.length;
    if (product.reviews.length > 0) {
      const totalRating = product.reviews.reduce((acc, item) => item.rating + acc, 0);
      product.rating = Number((totalRating / product.reviews.length).toFixed(1));
    } else {
      product.rating = 0;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Review removed successfully',
      data: {
        rating: product.rating,
        numberOfReviews: product.numberOfReviews,
        reviews: product.reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};
