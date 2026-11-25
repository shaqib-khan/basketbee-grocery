import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    comment: {
      type: String,
      required: [true, 'Please provide review comment'],
      trim: true,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
      maxlength: 140,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: 'Fresho',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    categorySlug: {
      type: String,
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      default: 'General',
      index: true,
    },
    description: {
      type: String,
      default: 'Premium grocery item sourced from verified suppliers with strict quality audits.',
    },
    weight: {
      type: String,
      required: [true, 'Please provide weight / packaging size (e.g. 1 kg, 500 g)'],
      default: '1 kg',
    },
    unit: {
      type: String,
      required: [true, 'Please provide unit (e.g. 1 kg, 500 g, 1 pc)'],
      default: '1 kg',
    },
    mrp: {
      type: Number,
      required: [true, 'Please provide MRP (Maximum Retail Price)'],
      min: [0, 'MRP must be a non-negative number'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Please provide selling price'],
      min: [0, 'Selling price must be a non-negative number'],
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Backwards-compatibility aliases for existing queries & frontend
    originalPrice: {
      type: Number,
      min: 0,
    },
    discountedPrice: {
      type: Number,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      default: 50,
      min: 0,
    },
    image: {
      type: String,
      required: [true, 'Please provide primary image URL'],
    },
    images: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    numberOfReviews: {
      type: Number,
      default: 32,
    },
    numReviews: {
      type: Number,
      default: 32,
    },
    reviews: [reviewSchema],
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFreshPick: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    nutritionalInfo: {
      calories: { type: String, default: 'N/A' },
      protein: { type: String, default: 'N/A' },
      fat: { type: String, default: 'N/A' },
      carbs: { type: String, default: 'N/A' },
      fiber: { type: String, default: 'N/A' },
    },
  },
  {
    timestamps: true,
  }
);

// Automatic discount calculation & validation hook
productSchema.pre('validate', function (next) {
  // Sync mrp and originalPrice if one is set
  if (this.mrp === undefined && this.originalPrice !== undefined) {
    this.mrp = this.originalPrice;
  }
  if (this.originalPrice === undefined && this.mrp !== undefined) {
    this.originalPrice = this.mrp;
  }

  // Sync sellingPrice and discountedPrice
  if (this.sellingPrice === undefined && this.discountedPrice !== undefined) {
    this.sellingPrice = this.discountedPrice;
  }
  if (this.discountedPrice === undefined && this.sellingPrice !== undefined) {
    this.discountedPrice = this.sellingPrice;
  }

  // Ensure weight and unit stay aligned
  if (!this.weight && this.unit) {
    this.weight = this.unit;
  }
  if (!this.unit && this.weight) {
    this.unit = this.weight;
  }

  // Enforce sellingPrice cannot exceed mrp
  if (this.mrp !== undefined && this.sellingPrice !== undefined && this.sellingPrice > this.mrp) {
    return next(new Error(`Selling price (₹${this.sellingPrice}) cannot exceed MRP (₹${this.mrp})`));
  }

  // Calculate discount percentage automatically: ((mrp - sellingPrice) / mrp) * 100
  if (this.mrp > 0 && this.sellingPrice !== undefined) {
    if (this.mrp > this.sellingPrice) {
      this.discountPercentage = Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
    } else {
      this.discountPercentage = 0;
    }
  } else {
    this.discountPercentage = 0;
  }
  this.discountPercent = this.discountPercentage;

  // Sync availability & reviews
  this.isAvailable = this.stock > 0;
  if (this.numberOfReviews !== undefined) {
    this.numReviews = this.numberOfReviews;
  } else if (this.numReviews !== undefined) {
    this.numberOfReviews = this.numReviews;
  }

  next();
});

// Text index for search
productSchema.index({
  name: 'text',
  brand: 'text',
  description: 'text',
  categoryName: 'text',
  subcategory: 'text',
  tags: 'text',
});

const Product = mongoose.model('Product', productSchema);
export default Product;
