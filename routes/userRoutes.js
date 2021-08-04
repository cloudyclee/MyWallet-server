const router = require( "express" ).Router();
const passport = require( "passport" );
const jwt = require( "jsonwebtoken" );
const { OAuth2Client } = require( 'google-auth-library' );
const User = require( "../models" ).userModel;
const registerValidation = require( "../validation" ).registerValidation;
const loginValidation = require( "../validation" ).loginValidation;
const userValidation = require( "../validation" ).userValidation;

// testing route
router.get( "/test", ( req, res ) => {
    res.send( "API is working" );
} );

// register
router.post( "/register", async ( req, res ) => {
    const returnObj = { success: false, msg: "" };
    // data validation
    const { error } = registerValidation( req.body );
    if ( error ) {
        console.log( error );
        returnObj.msg = error.details[ 0 ].message;
        return res.status( 400 ).send( returnObj );
    }
    // check if user exists
    await User.findOne( { userEmail: req.body.userEmail }, function ( err, foundUser ) {
        if ( err ) {
            console.log( err );
            returnObj.msg = "內部系統錯誤，請洽客服人員";
            return res.status( 500 ).send( returnObj );
        }
        if ( foundUser ) {
            returnObj.msg = "此信箱已被註冊，請使用其他電子郵件信箱";
            return res.status( 400 ).send( returnObj );
        }
    } );
    // if it is new user, then save user's data
    try {
        const newUser = await new User( {
            userName: req.body.userName,
            userEmail: req.body.userEmail,
            password: req.body.password,
            accountType: req.body.accountType
        } ).save();
        returnObj.success = true;
        returnObj.msg = "register successfully";
        returnObj.savedObj = newUser;
        res.status( 200 ).send( returnObj );
    } catch ( error ) {
        console.log( error );
        returnObj.msg = "抱歉，您的資料未成功更新，請洽客服人員";
        res.status( 500 ).send( returnObj );
    }
} );

// login
router.post( "/login", ( req, res ) => {
    const returnObj = { success: false, msg: "" };
    // data validation
    const { error } = loginValidation( req.body );
    if ( error ) {
        console.log( error );
        returnObj.msg = error.details[ 0 ].message;
        return res.status( 400 ).send( returnObj );
    }
    // check if the email exists
    User.findOne( { userEmail: req.body.userEmail }, function ( err, user ) {
        if ( err ) {
            console.log( err );
            returnObj.msg = "內部系統錯誤，請洽客服人員";
            return res.status( 500 ).send( returnObj );
        }
        if ( !user ) {
            returnObj.msg = "信箱或密碼不正確";
            return res.status( 401 ).send( returnObj );
        } else {
            // if user exists, compare password
            user.comparePassword( req.body.password, function ( err, isMatch ) {
                if ( err ) {
                    console.log( err );
                    returnObj.msg = "內部系統錯誤，請洽客服人員";
                    return res.status( 500 ).send( returnObj );
                }
                // if password is matched, log in seccessfully
                if ( isMatch ) {
                    const tokenObj = { _id: user._id, userEmail: user.userEmail };
                    const token = jwt.sign( tokenObj, process.env.SECRET );
                    returnObj.success = true;
                    returnObj.msg = "logged in successfully";
                    returnObj.user = user;
                    returnObj.token = `JWT ${ token }`;
                    return res.status( 200 ).send( returnObj );
                } else {
                    returnObj.msg = "信箱或密碼不正確";
                    return res.status( 401 ).send( returnObj );
                }
            } );
        }
    } );

} );

// update user info
router.patch( "/user", passport.authenticate( "jwt", { session: false } ), ( req, res ) => {
    const { _id } = req.user;
    const returnObj = { success: false, msg: "" };

    User.findOne( { _id }, async function ( err, user ) {
        if ( err ) {
            console.log( err );
            returnObj.msg = "內部系統錯誤，請洽客服人員";
            return res.status( 500 ).send( returnObj );
        }
        if ( !user ) {
            returnObj.msg = "用戶訊息錯誤，請再嘗試一次";
            return res.status( 400 ).send( returnObj );
        } else {
            // validation
            const { error } = userValidation( req.body );
            if ( error ) {
                console.log( error );
                returnObj.msg = error.details[ 0 ].message;
                return res.status( 400 ).send( returnObj );
            }

            // set updateed document
            Object.keys( req.body ).forEach( key => {
                user[ key ] = req.body[ key ];
            } );

            // two situations: changed password or not
            if ( req.body.password ) {
                try {
                    const updateUser = await user.save();
                    returnObj.success = true;
                    returnObj.msg = "update successfully";
                    returnObj.user = updateUser;
                    res.status( 200 ).send( returnObj );
                } catch ( error ) {
                    console.log( error );
                    returnObj.msg = "抱歉，您的資料未成功更新，請洽客服人員";
                    res.status( 500 ).send( returnObj );
                }
            } else {
                try {
                    const updateUser = await User.findOneAndUpdate( { _id }, user, { new: true, runValidators: true } );
                    returnObj.success = true;
                    returnObj.msg = "update successfully";
                    returnObj.user = updateUser;
                    res.status( 200 ).send( returnObj );
                } catch ( error ) {
                    console.log( error );
                    returnObj.msg = "抱歉，您的資料未成功更新，請洽客服人員";
                    return res.status( 500 ).send( returnObj );
                }
            }
        }
    } );
} );

// delete one 
router.delete( "/user/:_id", passport.authenticate( "jwt", { session: false } ), ( req, res ) => {
    const { _id } = req.params;
    const returnObj = { success: false, msg: "" };
    // validation
    if ( !req.user.isAdmin() ) {
        returnObj.msg = "您的權限不足以支持行使此動作";
        return res.status( 401 ).send( returnObj );
    }
    User.findOneAndDelete( { _id }, async function ( err, user ) {
        if ( err ) {
            consoole.log( err );
            returnObj.msg = "內部系統錯誤";
            return res.status( 500 ).send( returnObj );
        }
        if ( !user ) {
            returnObj.msg = "用戶訊息錯誤，請再嘗試一次";
            return res.status( 400 ).send( returnObj );
        } else {
            returnObj.success = true;
            returnObj.msg = "刪除成功";
            return res.status( 200 ).send( returnObj );
        }
    } );
} );

// delete all
router.delete( "/user", passport.authenticate( "jwt", { session: false } ), async ( req, res ) => {
    const returnObj = { success: false, msg: "" };
    // validation
    if ( !req.user.isAdmin() ) {
        returnObj.msg = "您的權限不足以支持行使此動作";
        return res.status( 401 ).send( returnObj );
    }
    try {
        await User.deleteMany( {} );
        returnObj.success = true;
        returnObj.msg = "刪除成功";
        return res.status( 200 ).send( returnObj );
    } catch ( error ) {
        console.log( error );
        returnObj.msg = "內部系統錯誤";
        return res.status( 500 ).send( returnObj );
    }
} );

// log in with google use Google One Tap
router.post( "/google", async ( req, res ) => {
    const returnObj = { success: false, msg: "" };
    const { credential } = req.body;
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    let newUser;
    let _id;
    let userEmail;

    try {
        const client = new OAuth2Client( GOOGLE_CLIENT_ID );
        const { payload } = await client.verifyIdToken( {
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        } );

        // check if the googleID exists
        User.findOne( { googleID: payload.sub }, async function ( err, user ) {
            if ( err ) {
                console.log( err );
                returnObj.msg = "內部系統錯誤，請洽客服人員";
                return res.status( 500 ).send( returnObj );
            }
            if ( !user ) {
                newUser = await new User( {
                    userName: payload.name,
                    userEmail: payload.email,
                    googleID: payload.sub,
                    accountType: "user"
                } ).save();
                _id = newUser._id;
                userEmail = newUser.userEmail;
            }

            const tokenObj = { _id: _id || user._id, userEmail: userEmail || user.userEmail };
            const token = jwt.sign( tokenObj, process.env.SECRET );
            returnObj.success = true;
            returnObj.msg = "logged in successfully";
            returnObj.user = newUser || user;
            returnObj.token = `JWT ${ token }`;
            return res.status( 200 ).send( returnObj );

        } );
    } catch ( err ) {
        console.log( err );
        returnObj.msg = "內部系統錯誤，請洽客服人員";
        return res.status( 500 ).send( returnObj );
    }
} );

// google Oauth 2.0
router.get( "/google",
    passport.authenticate( "google", { scope: [ "profile", "email" ], session: false } )
);
// Oauth callback route
router.get( "/redirect",
    passport.authenticate( "google", { failureRedirect: '/api/auth/google', session: false } ),
    ( req, res ) => {
        const returnObj = { success: false, msg: "" };
        // make token for user
        const tokenObj = { _id: req.user._id, userEmail: req.user.userEmail };
        const token = jwt.sign( tokenObj, process.env.SECRET );
        returnObj.success = true;
        returnObj.msg = "logged in successfully";
        returnObj.user = req.user;
        returnObj.token = `JWT ${ token }`;
        return res.status( 200 ).send( returnObj );
    } );

module.exports = router;