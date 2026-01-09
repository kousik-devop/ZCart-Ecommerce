const { body, validationResult } = require('express-validator');

// ✅ MUST match test expectation
function respondWithValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'All fields are required'
        });
    }
    next();
}

// ✅ MUST match test payload
const userRegistrationValidator = [
    body('username')
        .isString()
        .isLength({ min: 3 }),

    body('email')
        .isEmail(),

    body('password')
        .isString()
        .isLength({ min: 6 }),

    body('firstname')
        .isString(),

    body('lastname')
        .isString(),
];

const userLoginValidator = [
    body('email')
        .isEmail(),

    body('password')
        .isString()
        .isLength({ min: 6 }),
];

const addressValidator = [
    body('street')
        .isString(),

    body('city')
        .isString(),

    body('state')
        .isString(),

    body('zipCode')
        .isString(),

    body('country')
        .isString(),
]

module.exports = {
    userRegistrationValidator,
    userLoginValidator,
    addressValidator,
    respondWithValidationErrors
};
