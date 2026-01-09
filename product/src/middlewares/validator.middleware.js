const { body, validationResult } = require('express-validator');


function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formatted = errors.array().map(err => {
            const out = {
                type: 'field',
                msg: err.msg,
                location: err.location
            };
            if (Object.prototype.hasOwnProperty.call(err, 'value')) {
                out.value = err.value;
            }
            return out;
        });
        return res.status(400).json({ message: 'Validation error', errors: formatted });
    }
    next();
}

const createProductValidators = [
    body('title')
        .isString()
        .withMessage('title must be a string')
        .trim()
        .notEmpty()
        .withMessage('title is required'),
    body('description')
        .optional()
        .isString()
        .withMessage('description must be a string')
        .trim()
        .isLength({ max: 500 })
        .withMessage('description max length is 500 characters'),
    body('priceAmount')
        .notEmpty()
        .withMessage('priceAmount is required')
        .bail()
        .isFloat({ gt: 0 })
        .withMessage('priceAmount must be a number > 0'),
    body('priceCurrency')
        .optional()
        .isIn([ 'USD', 'INR' ])
        .withMessage('priceCurrency must be USD or INR'),
    handleValidationErrors
];



module.exports = { createProductValidators };