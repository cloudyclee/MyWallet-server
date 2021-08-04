const express = require( "express" );
const mongoose = require( "mongoose" );
const passport = require( "passport" );
const cors = require( "cors" );

// import model
//const User = require( "./models" ).userModel;
//const Wallet = require( "./models" ).walletModel;

// import routes
const userRouter = require( "./routes" ).userRoutes;
const walletRouter = require( "./routes" ).walletRoutes;

// initialize express
const app = express();

// add environment variables
const dotenv = require( "dotenv" );
dotenv.config();
const uri = process.env.MONGOOSE_URI;

// set passport middleware which will later be used in /api/auth/google route 
require( "./config/passport" );
// set passport middleware which use jwt strategy ansd will be used in /api/wallet route
require( "./config/passport_jwt" )( passport );

// connext to mongoDB atlas
mongoose.connect( uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
} ).then( () => {
    console.log( "Successfully connected to mongo atlas" );
} ).catch( ( err ) => {
    console.log( err );
} );

// middleware
// set parser
app.use( express.json() );
app.use( express.urlencoded( { extended: true } ) );
app.use( cors() );
// initialize passport module
app.use( passport.initialize() );
// set routes
app.use( "/api/auth", userRouter );
app.use( "/api/wallet", passport.authenticate( "jwt", { session: false } ), walletRouter );


app.get( "/", ( req, res ) => {
    res.send( "Welcome to Homepage" );
} );
app.get( "/*", ( req, res ) => {
    res.status( 404 ).send( { success: false, msg: "This page doesn't exist" } );
} );

app.listen( process.env.PORT || 3000, () => {
    console.log( "Server is running on port 8080" );
} );