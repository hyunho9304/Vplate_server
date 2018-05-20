//	비밀번호찾기	account/setting/search

const express = require( 'express' ) ;
const router = express.Router() ;
const pool = require( '../../../config/dbPool' ) ;
const async = require( 'async' ) ;
const moment = require( 'moment' ) ;

router.post( '/' , function( req , res ) {

	let email = req.body.email ;
	let name = req.body.name ;
	let answer1 = req.body.answer1 ;
	let answer2 = req.body.answer2 ;

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

			let checkInformQuery = 'SELECT * FROM user WHERE user_email = ? AND user_name = ?' ;
			let array = [ email , name ] ;

			connection.query( checkInformQuery , array , function( err , result ) {
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
							msg : "failed input name/email"
						}) ;
						connection.release() ;
						callback( "failed input name/email" ) ;
					} else {
						callback( null , connection ) ;
					}
				}
			}) ;	//	connection.query
		} ,	//	function

		function( connection , callback ) {

			let checkAnswerQuery = 'SELECT * FROM user WHERE user_answer1 = ? AND user_answer2 = ?' ;
			let array = [ answer1 , answer2 ] ;

			connection.query( checkAnswerQuery , array , function( err , result ) {
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
							msg : "failed input answer"
						}) ;
						connection.release() ;
						callback( "failed input answer" ) ;
					} else {
						res.status(201).send({
							status : "success" ,
							msg : "successfully confirm inform"
						}) ;
						connection.release() ;
						callback( null , "successfully confirm inform") ;
					}
				}
			}) ;	//	connection.query
		} ,	//	function
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