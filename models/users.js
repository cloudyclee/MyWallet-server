const mongoose = require( "mongoose" );
const bcrypt = require( "bcrypt" );

const arrayLimit = ( val ) => {
    let valid = true;
    val.forEach( elem => {
        if ( elem.length >= 10 || elem.length < 2 ) {
            valid = false;
            return;
        }
    } );
    return valid;
};
const userSchema = mongoose.Schema( {
    userName: {
        type: String,
        require: true,
        minLength: 2,
        maxLength: 50
    },
    userEmail: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        default: Date.now,
        require: true
    },
    // local login
    password: {
        type: String,
        minLength: 6,
        maxLength: 1024
    },
    // google login
    googleID: {
        type: String
    },
    accountType: {
        type: String,
        require: true,
        enum: [ "user", "admin" ]
    },
    // user settings
    mainWallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet"
    },
    expenseType: {
        type: [ String ],
        default: [ "飲食", "休閒娛樂", "服飾", "交通", "帳單", "家庭", "教育", "保險與投資", "禮物與捐贈", "醫療", "旅遊", "電子產品", "其他" ],
        validate: [ arrayLimit, '類別長度需介於2至10字元之間' ]
    },
    incomeType: {
        type: [ String ],
        default: [ "受贈", "繼承", "薪水", "銷售", "獎金", "投資與利息", "其他" ],
        validate: [ arrayLimit, '類別長度需介於2至10字元之間' ]
    }
} );


// account type validation middleware
userSchema.methods.isUser = function () {
    return this.accountType === "user";
};
userSchema.methods.isAdmin = function () {
    return this.accountType === "admin";
};
// compare password
userSchema.methods.comparePassword = function ( password, cb ) {
    bcrypt.compare( password, this.password, ( err, isMatch ) => {
        if ( err ) {
            return cb( err, isMatch );
        } else {
            return cb( null, isMatch );
        }
    } );
};

// set user's password hash function as a pre-middleware before save the data
userSchema.pre( "save", async function ( next ) {
    if ( !this.googleID && ( this.isModified( "password" ) || this.isNew ) ) {
        const hash = await bcrypt.hash( this.password, 10 );
        this.password = hash;
        next();
    } else {
        return next();
    }
} );


// export
const User = mongoose.model( "User", userSchema );
module.exports = User;