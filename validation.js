const Joi = require( 'joi' );
Joi.objectId = require( 'joi-objectid' )( Joi );

// set validation function with Joi
const registerValidation = ( data ) => {
    // set validation schema 
    const schema = Joi.object( {
        userName: Joi.string().required().min( 2 ).max( 50 ),
        userEmail: Joi.string().required().email().messages( {
            "string.email": "非正確的電子郵件地址"
        } ),
        password: Joi.string().required().min( 6 ).max( 1024 ),
        accountType: Joi.string().required().valid( "user", "admin" )
    } );
    // return result of validation
    return schema.validate( data );
};
const loginValidation = ( data ) => {
    const schema = Joi.object( {
        userEmail: Joi.string().required().email().messages( {
            "string.email": "非正確的電子郵件地址"
        } ),
        password: Joi.string().required().min( 6 ).max( 1024 ).messages( {
            "string.empty": "請輸入密碼"
        } ),
    } );
    return schema.validate( data );
};
const userValidation = ( data ) => {
    const schema = Joi.object( {
        userName: Joi.string().min( 2 ).max( 50 ),
        userEmail: Joi.string().email().messages( {
            "string.email": "非正確的電子郵件地址"
        } ),
        password: Joi.string().min( 6 ).max( 1024 ),
        accountType: Joi.string().valid( "user", "admin" ),
        expenseType: Joi.array().items( Joi.string().min( 2 ).max( 10 ) ),
        incomeType: Joi.array().items( Joi.string().min( 2 ).max( 10 ) ),
        mainWallet: Joi.objectId(),
        id: Joi.objectId(),
        date: Joi.date(),
    } );
    return schema.validate( data );
};

const walletValidation = ( data ) => {
    const schema = Joi.object( {
        id: Joi.objectId(),
        walletName: Joi.string().required().min( 2 ).max( 30 ),
        initialTotal: Joi.number().required(),
        transaction: Joi.array().items( {
            _id: Joi.objectId(),
            date: Joi.date().required(),
            amount: Joi.number().required(),
            transType: Joi.string().required().valid( "expense", "income" ),
            consumeType: Joi.string().required(),
            note: Joi.string().max( 100 )
        } ),
        totalAmounts: Joi.number(),
        walletUserID: Joi.objectId(),
    } );
    return schema.validate( data );
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.userValidation = userValidation;
module.exports.walletValidation = walletValidation;