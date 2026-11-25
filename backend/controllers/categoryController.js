import Category from '../models/Category.js';
import Product from '../models/Product.js';

// Helper to create clean URL slug
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: { $ne: false } };

    const categories = await Category.find(filter).sort({ displayOrder: 1, name: 1 });

    // Ensure item counts are accurate
    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({
          $or: [{ category: cat._id }, { categorySlug: cat.slug }],
        });
        const doc = cat.toObject();
        doc.itemCount = count;
        return doc;
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category by ID or slug
// @route   GET /api/categories/:idOrSlug
// @access  Public
export const getCategoryByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    let category = null;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(idOrSlug);
    }

    if (!category) {
      category = await Category.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const products = await Product.find({
      $or: [{ category: category._id }, { categorySlug: category.slug }],
    });

    const categoryObj = category.toObject();
    categoryObj.itemCount = products.length;

    res.json({
      success: true,
      data: categoryObj,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category (Admin)
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  try {
    const {
      name,
      slug: customSlug,
      description = '',
      icon = 'ShoppingBag',
      image = '',
      imageUrl = '',
      subcategories = [],
      displayOrder = 0,
      isActive = true,
      isPopular = false,
    } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const slug = customSlug ? createSlug(customSlug) : createSlug(name);
    const existing = await Category.findOne({
      $or: [{ slug }, { name: new RegExp(`^${name.trim()}$`, 'i') }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name or slug already exists',
      });
    }

    const finalImage = image || imageUrl || '';

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      icon: icon.trim(),
      image: finalImage,
      imageUrl: finalImage,
      subcategories: Array.isArray(subcategories) ? subcategories : [],
      displayOrder: Number(displayOrder) || 0,
      isActive: isActive !== false,
      isPopular: Boolean(isPopular),
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const {
      name,
      slug,
      description,
      icon,
      image,
      imageUrl,
      subcategories,
      displayOrder,
      isActive,
      isPopular,
    } = req.body;

    if (name) {
      category.name = name.trim();
    }
    if (slug) {
      category.slug = createSlug(slug);
    }
    if (description !== undefined) {
      category.description = description;
    }
    if (icon !== undefined) {
      category.icon = icon;
    }
    if (image !== undefined || imageUrl !== undefined) {
      const finalImg = image || imageUrl || '';
      category.image = finalImg;
      category.imageUrl = finalImg;
    }
    if (subcategories !== undefined) {
      category.subcategories = Array.isArray(subcategories) ? subcategories : [];
    }
    if (displayOrder !== undefined) {
      category.displayOrder = Number(displayOrder);
    }
    if (isActive !== undefined) {
      category.isActive = Boolean(isActive);
    }
    if (isPopular !== undefined) {
      category.isPopular = Boolean(isPopular);
    }

    const updated = await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Safety: check if products reference this category
    const productCount = await Product.countDocuments({
      $or: [{ category: category._id }, { categorySlug: category.slug }],
    });

    if (productCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category containing ${productCount} active products. Move or delete products first, or pass force=true.`,
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
