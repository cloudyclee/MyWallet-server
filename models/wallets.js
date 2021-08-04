const mongoose = require( "mongoose" );

const transSchema = mongoose.Schema( {
    date: {
        type: Date,
        require: true,
        default: Date.now
    },
    amount: {
        type: Number,
        require: true
    },
    transType: {
        type: String,
        enum: [ "expense", "income" ],
        require: true
    },
    consumeType: {
        type: String,
        require: true,
    },
    note: {
        type: String,
        maxLength: 100
    },
} );

const walletSchema = mongoose.Schema( {
    walletUserID: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: "User"
    },
    walletName: {
        type: String,
        require: true,
        minLength: 2,
        maxLength: 30
    },
    initialTotal: {
        type: Number,
        require: true
    },
    totalAmounts: {
        type: Number,
    },
    transaction: {
        type: [ transSchema ],
        default: []
    }
} );

const Wallet = mongoose.model( "Wallet", walletSchema );
module.exports = Wallet;