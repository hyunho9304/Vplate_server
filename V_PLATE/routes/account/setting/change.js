//	비밀번호변경( 로그인화면 )	/setting/change

const express = require( 'express' ) ;
const router = express.Router() ;
const pool = require( '../../../config/dbPool' ) ;
const async = require( 'async' ) ;
const crypto = require( 'crypto' ) ;
const moment = require( 'moment' ) ;

router.post( '/' , function( req , res ) {

	let email = req.body.email ;
	let pwd = req.body.pwd ;

	let task = [

		function( callback ) {
			pool.getConnection( function( err , connection ) {
				if( err ){	
					res.status(500).send({
						status : "fail" ,
						msg : "internal server err"
					});
					callback( "internal server err" ) ;
				} else {
					callback( null , connection ) ;
				}
			}) ;	//	pool.getConnection
		} ,	//	function

		function( connection , callback ) {

			let checkEmailQuery = 'SELECT * FROM user WHERE user_email = ?' ;

			connection.query( checkEmailQuery , email , function( err , result ) {
				if( err ) {
					res.status(500).send({
						status : "fail" ,
						msg : "internal server err"
					}) ;
					connection.release() ;
					callback( "checkInformQuery err ")
				} else {
					if( result.length === 0 ) {
						res.status(401).send({
							status : "fail" ,
							msg : "be not a registered use"
						}) ;
						connection.release() ;
						callback( "be not a registered use" ) ;
					} else {
						callback( null , connection ) ;
					}
				}
			}) ;	//	connection.query
		} ,	//	function

		function( connection , callback ) {

			crypto.randomBytes( 32 , function( err , buffer ) {
				if( err ) {
					res.status(500).send({
						status : "fail" ,
						msg : "internal server err"
					}) ;
					connection.release() ;
					callback( "crypto randomBytes err" ) ;
				} else {

					let salt = buffer.toString( 'base64' ) ;

					crypto.pbkdf2( pwd , salt , 100000 , 64 , 'sha512' , function( err , hashed ) {
						if( err ) {
							res.status(500).send({
								status : "fail" ,
								msg : "internal server err"
							}) ;
							connection.release() ;
							callback( "crypto pbkdf2 err" ) ;
						} else {

							let cryptopwd = hashed.toString( 'base64' ) ;
							let updateUserQuery = 'UPDATE user SET user_pwd = ? , user_salt = ? WHERE user_email = ?' ;
							let array = [ cryptopwd , salt , email ] ;

							connection.query( updateUserQuery , array , function( err , result ) {
								if( err ) {
									res.status(500).send({
										status : "fail" ,
										msg : "internal server err"
									}) ;
									connection.release() ;
									callback( "insertUserQuery err" ) ;
								} else {
									res.status(201).send({
										status : "success" ,
										msg : "successfully change pwd"
									}) ;
									connection.release() ;
									callback( null , "successfully change pwd" ) ;
								}
							}) ;
						}
					}) ;	//	crypto.pbkdf2
				}
			}) ;	//	crypto.randomBytes
		}
	] ;

	async.waterfall(task, function(err, result) {

        let logtime = moment().format('MMMM Do YYYY, h:mm:ss a');

        if (err)
            console.log(' [ ' + logtime + ' ] ' + err);
        else
            console.log(' [ ' + logtime + ' ] ' + result);
    }); //async.waterfall
}) ;

module.exports = router;