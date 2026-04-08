const { body, param, query, validationResult } = require('express-validator');

// Helper to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Stock validation rules
const stockAllocationRules = [
  body('franchiseId')
    .notEmpty()
    .withMessage('Franchise ID is required')
    .isMongoId()
    .withMessage('Invalid franchise ID format'),
  body('stock')
    .isObject()
    .withMessage('Stock must be an object'),
  body('stock.*')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantities must be non-negative integers'),
  handleValidationErrors
];

const shopStockAllocationRules = [
  body('shopId')
    .notEmpty()
    .withMessage('Shop ID is required')
    .isMongoId()
    .withMessage('Invalid shop ID format'),
  body('stock')
    .isObject()
    .withMessage('Stock must be an object'),
  body('stock.*')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantities must be non-negative integers'),
  handleValidationErrors
];

// Transaction validation rules
const salesRecordRules = [
  body('shopId')
    .notEmpty()
    .withMessage('Shop ID is required')
    .isMongoId()
    .withMessage('Invalid shop ID format'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  body('items.*.flavor')
    .notEmpty()
    .withMessage('Flavor is required for each item')
    .isIn(['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'])
    .withMessage('Invalid flavor'),
  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required for each item')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  handleValidationErrors
];

const emptyBottleReturnRules = [
  body('shopId')
    .notEmpty()
    .withMessage('Shop ID is required')
    .isMongoId()
    .withMessage('Invalid shop ID format'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  body('items.*.flavor')
    .notEmpty()
    .withMessage('Flavor is required for each item')
    .isIn(['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'])
    .withMessage('Invalid flavor'),
  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required for each item')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  handleValidationErrors
];

// Franchise validation rules
const franchiseUpdateRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  handleValidationErrors
];

// Shop validation rules
const shopCreateRules = [
  body('name')
    .notEmpty()
    .withMessage('Shop name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .trim(),
  body('area')
    .notEmpty()
    .withMessage('Area is required')
    .trim(),
  body('contact')
    .notEmpty()
    .withMessage('Contact number is required')
    .matches(/^\d{10}$/)
    .withMessage('Contact number must be exactly 10 digits'),
  handleValidationErrors
];

const shopUpdateRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('location')
    .optional()
    .trim(),
  body('area')
    .optional()
    .trim(),
  body('contact')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Contact number must be exactly 10 digits'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  handleValidationErrors
];

// Production validation rules
const productionRecordRules = [
  body('stock')
    .isObject()
    .withMessage('Stock must be an object'),
  body('stock.orange')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Orange quantity must be a non-negative integer'),
  body('stock.blueberry')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Blueberry quantity must be a non-negative integer'),
  body('stock.jira')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Jira quantity must be a non-negative integer'),
  body('stock.lemon')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Lemon quantity must be a non-negative integer'),
  body('stock.mint')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mint quantity must be a non-negative integer'),
  body('stock.guava')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Guava quantity must be a non-negative integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors
];

// Auth validation rules
const loginRules = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const registerFranchiseRules = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('franchiseName')
    .notEmpty()
    .withMessage('Franchise name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Franchise name must be between 2 and 100 characters'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .trim(),
  handleValidationErrors
];

// Pagination/query validation rules
const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  handleValidationErrors
];

// MongoDB ID parameter validation
const mongoIdParamRules = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  stockAllocationRules,
  shopStockAllocationRules,
  salesRecordRules,
  emptyBottleReturnRules,
  franchiseUpdateRules,
  shopCreateRules,
  shopUpdateRules,
  productionRecordRules,
  loginRules,
  registerFranchiseRules,
  paginationRules,
  mongoIdParamRules
};
