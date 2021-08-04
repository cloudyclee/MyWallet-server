const JwtStrategy = require( "passport-jwt" ).Strategy;
const ExtractJwt = require( "passport-jwt" ).ExtractJwt;
const User = require( "../models/users" );

// jwt
module.exports = ( passport ) => {
    let opts = {};
    // extract token form header
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme( "jwt" );
    opts.secretOrKey = process.env.SECRET;
    // set json web token machanism
    passport.use( new JwtStrategy( opts, function ( jwt_payload, done ) {
        // check if this token exists
        User.findOne( { _id: jwt_payload._id }, ( err, user ) => {
            if ( err ) {
                return done( err, false );
            }
            if ( user ) {
                return done( null, user );
            } else {
                return done( null, false );
            }
        } );
    } ) );
};