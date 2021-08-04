const passport = require( "passport" );
const GoogleStrategy = require( "passport-google-oauth20" ).Strategy;
const User = require( "../models/users" );

// google Oauth 2.0
passport.use( new GoogleStrategy( {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth"  // set redirected page when finished login
}, ( accessToken, refreshToken, profile, done ) => {
    // passport callback function
    User.findOne( { googleID: profile.id } ).then( foundUser => {
        // if user is found, get user data
        if ( foundUser ) {
            done( null, foundUser );
        } else {
            // if user us not found, create a new user to DB
            new User( {
                userName: profile.displayName,
                userEmail: profile.emails[ 0 ].value,
                googleID: profile.id,
                accountType: "user"
            } ).save().then( ( newUser ) => {
                done( null, newUser );
            } );
        }
    } );
} ) );



