const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

const loginRules = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

const registerRules = [
    body('full_name').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim(),
    body('business_name').optional().trim(),
    body('role').optional().isIn(['Administrator', 'Store Manager', 'Sales Attendant']).withMessage('Invalid role'),
    handleValidationErrors
];

const medicineRules = [
    body('medicine_name').trim().notEmpty().withMessage('Medicine name is required').isLength({ max: 100 }),
    body('category').isIn(['Antibiotic', 'Antiparasitic', 'Supplement', 'Pesticide', 'Antifungal', 'Anti-inflammatory', 'Vaccine', 'Other']).withMessage('Invalid category'),
    body('manufacturer').optional().trim(),
    body('batch_number').optional().trim(),
    body('expiry_date').isISO8601().withMessage('Valid expiry date is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
    body('description').optional().trim(),
    handleValidationErrors
];

const medicineUpdateRules = [
    body('medicine_name').optional().trim().notEmpty().withMessage('Medicine name cannot be empty').isLength({ max: 100 }),
    body('category').optional().isIn(['Antibiotic', 'Antiparasitic', 'Supplement', 'Pesticide', 'Antifungal', 'Anti-inflammatory', 'Vaccine', 'Other']).withMessage('Invalid category'),
    body('manufacturer').optional().trim(),
    body('batch_number').optional().trim(),
    body('expiry_date').optional().isISO8601().withMessage('Valid expiry date is required'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
    body('description').optional().trim(),
    handleValidationErrors
];

const supplierRules = [
    body('supplier_name').trim().notEmpty().withMessage('Supplier name is required').isLength({ max: 100 }),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('address').optional().trim(),
    body('contact_person').optional().trim(),
    body('payment_terms').optional().trim(),
    handleValidationErrors
];

const supplierUpdateRules = [
    body('supplier_name').optional().trim().notEmpty().withMessage('Supplier name cannot be empty').isLength({ max: 100 }),
    body('phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('address').optional().trim(),
    body('contact_person').optional().trim(),
    body('payment_terms').optional().trim(),
    handleValidationErrors
];

const saleRules = [
    body('medicine_id').notEmpty().withMessage('Medicine ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('selling_price').isFloat({ min: 0 }).withMessage('Selling price must be a non-negative number'),
    body('sale_date').optional().isISO8601().withMessage('Valid sale date is required'),
    body('customer_name').optional().trim(),
    body('payment_method').optional().isIn(['Cash', 'Mobile Money', 'Bank Transfer', 'Credit']).withMessage('Invalid payment method'),
    body('notes').optional().trim(),
    handleValidationErrors
];

const purchaseRules = [
    body('supplier_id').notEmpty().withMessage('Supplier ID is required'),
    body('medicine_id').notEmpty().withMessage('Medicine ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('buying_price').isFloat({ min: 0 }).withMessage('Buying price must be a non-negative number'),
    body('purchase_date').optional().isISO8601().withMessage('Valid purchase date is required'),
    body('invoice_number').optional().trim(),
    body('notes').optional().trim(),
    handleValidationErrors
];

const userRules = [
    body('full_name').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim(),
    body('business_name').optional().trim(),
    body('role').optional().isIn(['Administrator', 'Store Manager', 'Sales Attendant']).withMessage('Invalid role'),
    handleValidationErrors
];

const userUpdateRules = [
    body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty').isLength({ max: 100 }),
    body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').optional().trim(),
    body('business_name').optional().trim(),
    body('role').optional().isIn(['Administrator', 'Store Manager', 'Sales Attendant']).withMessage('Invalid role'),
    handleValidationErrors
];

const idParamRule = [
    param('id').notEmpty().withMessage('ID parameter is required'),
    handleValidationErrors
];

const alertStatusRule = [
    query('status').optional().isIn(['unread', 'read', 'archived']).withMessage('Invalid status filter'),
    query('alert_type').optional().isIn(['low_stock', 'expiry', 'expired', 'system']).withMessage('Invalid alert type filter'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
    handleValidationErrors
];

const reportDateRangeRules = [
    query('from').optional().isISO8601().withMessage('Invalid from date'),
    query('to').optional().isISO8601().withMessage('Invalid to date'),
    handleValidationErrors
];

module.exports = {
    loginRules,
    registerRules,
    medicineRules,
    medicineUpdateRules,
    supplierRules,
    supplierUpdateRules,
    saleRules,
    purchaseRules,
    userRules,
    userUpdateRules,
    idParamRule,
    alertStatusRule,
    reportDateRangeRules,
    handleValidationErrors
};
