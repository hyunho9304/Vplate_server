//push 알림 ON/OFF	account/setting/push

const express = require( 'express' ) ;
const router = express.Router() ;
const pool = require( '../../../config/dbPool' ) ;
const async = require( 'async' ) ;
const moment = require( 'moment' ) ;
const jwt = require('jsonwebtoken');

router.post('/', function(req, res){
	
	let token = req.headers.tt ;

	let email = '';
	let task = [

		function( callback ) {

			let secret = req.app.get('jwt-secret');

			jwt.verify( token , secret , function( err , data) {
				if( err ) {
					console.log( err.message ) ;

					if( err.message === 'jwt must be provided' ) {
						res.status(403).send({
							status : "fail" ,
							msg : "jwt must be provided"
						}) ;
						callback( "jwt must be provided" ) ;
					} else if( err.message === 'invalid signature' ) {
						res.status(403).send({
							status : "fail" ,
							msg : "invalid signature"
						}) ;
						callback( "invalid token" ) ;
					} else if( err.message === 'jwt expired' ) {
						res.status(403).send({
							status : "fail" ,
							msg : "jwt expired"
						}) ;
						callback( "jwt expired" ) ;
					} else {
						res.status(403).send({
							status : "fail" ,
							msg : err
						}) ;
						callback( err ) ;
					}
				} else {
				//	console.log(data);
					email = data.email ;
    				callback( null ) ;	//	여기다가 null , data 로 넘기기
				}
			}) ;
		} ,

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

		function(connection, callback){
			let selectUserPush = 'SELECT * FROM user WHERE user_email = ?';

			connection.query( selectUserPush , email, function(err, result){
				if(err){
					res.status(500).send({
						status : "fail",
						msg : "internal server error"
					});
					connection.release();
					callback("selectUserPushQueryerr" + err );
				} else {
					if(result[0].user_push === 0){
						
						let updateONpushing = 'UPDATE user SET user_push = 1 WHERE user_email = ?'

						connection.query( updateONpushing , email , function( err , result ) {
							if( err) {
								res.status(500).send({
									status : "fail" ,
									msg : "internal server err"
								})
								connection.release() ;
								callback( "updateONpushingQuery err" + err ) ;
							} else {
								let num = 1 ;
								connection.release() ;
								callback( null , num ) ;
							}
						}) ;
					} else{
						
						let updateOFFpushing = 'UPDATE user SET user_push = 0 WHERE user_email = ?' ;

						connection.query( updateOFFpushing , email , function( err , result ) {
							if( err) {
								res.status(500).send({
									status : "fail" ,
									msg : "internal server err"
								})
								connection.release() ;
								callback( "updateOFFpushingQuery err" + err ) ;
							} else {
								let num = 0 ;
								connection.release() ;
								callback( null , num ) ;
							}
						}) ;
					}
				}
			});
		} ,

		function( result , callback ) {

			res.status(201).send({
				status : "success" ,
				push : result ,
				msg : "successfully update user_push"
			});
			callback( null , "successfully update user_push" ) ;
		}
	];

	async.waterfall(task, function(err, result) {

        let logtime = moment().format('MMMM Do YYYY, h:mm:ss a');

        if (err)
            console.log(' [ ' + logtime + ' ] ' + err);
        else
            console.log(' [ ' + logtime + ' ] ' + result);
    }); //async.waterfall
});

module.exports = router;