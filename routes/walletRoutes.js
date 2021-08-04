const router = require( "express" ).Router();
const Wallet = require( "../models" ).walletModel;
const walletValidation = require( "../validation" ).walletValidation;

// create new wallet for the user
router.post( "/", async ( req, res ) => {
    const returnObj = { success: false, msg: "" };
    // data validation
    const { error } = walletValidation( req.body );
    if ( error ) {
        returnObj.msg = error.details[ 0 ].message;
        return res.status( 400 ).send( returnObj );
    }
    // if data is valid, save data
    const { walletName, initialTotal } = req.body;
    try {
        const newWallet = await new Wallet( { walletName, initialTotal, walletUserID: req.user._id } ).save();
        returnObj.success = true;
        returnObj.msg = "wallet has been created";
        returnObj.saveObj = newWallet;
        res.status( 200 ).send( returnObj );
    } catch ( error ) {
        console.log( error );
        returnObj.msg = "帳戶建立失敗，請洽客服人員";
        res.status( 500 ).send( returnObj );
    }
} );
// get user's all wallets
router.get( "/", async ( req, res ) => {
    const returnObj = { success: false, msg: "" };
    try {
        const wallets = await Wallet.find( { walletUserID: req.user._id } );
        if ( wallets.length > 0 ) {
            returnObj.success = true;
            returnObj.msg = "query successfully";
            returnObj.wallets = wallets;
            res.status( 200 ).send( returnObj );
        } else {
            returnObj.msg = "尚未建立錢包帳戶。請先創立錢包帳戶";
            res.status( 400 ).send( returnObj );
        }
    } catch ( error ) {
        console.log( error );
        returnObj.msg = "載入資料時發生錯誤，請洽客服人員";
        res.status( 500 ).send( returnObj );
    }
} );
// get one of the user's wallet
router.get( "/:_id", async ( req, res ) => {
    const returnObj = { success: false, msg: "" };
    try {
        const { _id } = req.params;
        const wallet = await Wallet.findOne( { _id, walletUserID: req.user._id } );
        if ( wallet ) {
            returnObj.success = true;
            returnObj.msg = "query successfully";
            returnObj.wallet = wallet;
            res.status( 200 ).send( returnObj );
        } else {
            returnObj.msg = "用戶資訊錯誤";
            res.status( 401 ).send( returnObj );
        }
    } catch ( error ) {
        console.log( error );
        returnObj.msg = "載入資料時發生錯誤，請洽客服人員";
        res.status( 500 ).send( returnObj );
    }
} );

// update wallet
router.patch( "/:_id", ( req, res ) => {
    const { _id } = req.params;
    const returnObj = { success: false, msg: "" };

    // get the wallet
    Wallet.findOne( { _id, walletUserID: req.user._id }, async function ( err, wallet ) {
        if ( err ) {
            console.log( err );
            returnObj.msg = "內部系統錯誤，請洽客服人員";
            return res.status( 500 ).send( returnObj );
        }
        if ( !wallet ) {
            returnObj.msg = "用戶訊息錯誤，請再嘗試一次";
            return res.status( 400 ).send( returnObj );
        } else {
            // set updateed document
            Object.keys( req.body ).forEach( key => {
                wallet[ key ] = req.body[ key ];
            } );

            // validation
            // an not-so-good way to make objectId verifiable
            const walletObj = wallet.toObject();
            walletObj.walletUserID = walletObj.walletUserID.toString();
            delete walletObj.__v;
            delete walletObj._id;
            if ( walletObj.transaction ) {
                walletObj.transaction.forEach( item => {
                    item._id = item._id.toString();
                } );
            }
            const { error } = walletValidation( walletObj );
            if ( error ) {
                console.log( error );
                returnObj.msg = error.details[ 0 ].message;
                return res.status( 400 ).send( returnObj );
            }

            // update the wallet
            try {
                const updateWallet = await Wallet.findOneAndUpdate( { _id, walletUserID: req.user._id }, wallet, { new: true, runValidators: true } );
                returnObj.success = true;
                returnObj.msg = "update successfully";
                returnObj.wallet = updateWallet;
                res.status( 200 ).send( returnObj );
            } catch ( error ) {
                console.log( error );
                returnObj.msg = "抱歉，您的資料未成功更新，請洽客服人員";
                return res.status( 500 ).send( returnObj );
            }
        }
    } );
} );

// delete one
router.delete( "/:_id", ( req, res ) => {
    const { _id } = req.params;
    const returnObj = { success: false, msg: "" };
    // validation
    Wallet.findOneAndDelete( { _id, walletUserID: req.user._id }, function ( err, wallet ) {
        if ( err ) {
            consoole.log( err );
            returnObj.msg = "內部系統錯誤";
            return res.status( 500 ).send( returnObj );
        }
        if ( !wallet ) {
            returnObj.msg = "資料錯誤，請再嘗試一次";
            return res.status( 400 ).send( returnObj );
        } else {
            returnObj.success = true;
            returnObj.msg = "帳戶刪除成功";
            return res.status( 200 ).send( returnObj );
        }
    } );
} );

// delete all
router.delete( "/", async ( req, res ) => {
    const returnObj = { success: false, msg: "" };
    // validation
    if ( !req.user.isAdmin() ) {
        returnObj.msg = "您的權限不足以支持您行使此動作";
        return res.status( 401 ).send( returnObj );
    }
    try {
        await Wallet.deleteMany( {} );
        returnObj.success = true;
        returnObj.msg = "帳戶刪除成功";
        return res.status( 200 ).send( returnObj );
    } catch ( error ) {
        console.log( error );
        returnObj.msg = "內部系統錯誤";
        return res.status( 500 ).send( returnObj );
    }
} );

// test the route only the users whose account type is adimin can get in
router.get( "/admin", ( req, res ) => {
    if ( !req.user.isAdmin() ) {
        res.status( 403 ).send( "you are not allowed" );
    } else {
        res.status( 200 ).send( "Hello admin" );
    }
} );

module.exports = router;