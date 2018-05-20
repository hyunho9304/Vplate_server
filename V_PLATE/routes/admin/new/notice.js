//	공지사항	admin/new/notice

const express = require('express');
const router = express.Router();
const pool = require( '../../../config/dbPool' ) ;	
const async = require( 'async' ) ;
const moment = require( 'moment' ) ;
const jwt = require( 'jsonwebtoken' ) ;

const serverkey = 'AAAA8Er4oYs:APA91bFk5IYKWXLW6-O3NE5mhnZmCW2xBlfV0bbnf8nP9P95qGMnzwbBtQLkYpPN5g2EqrDqhFDLd-1s2s73cBKavrPGnFPEHnz9IfQriGG0XsghGiDqnk2LLtt_6aXddDcIi-LlY5_w' ;
const FCM = require( 'fcm-node' ) ;
const fcm = new FCM( serverkey ) ;

router.post( '/' , function( req , res ){

	let token = req.headers.tt ;

	let title = req.body.title ;
	let content = req.body.content ;

	let uploadtime = moment().format( "YYYYMMDDHHmmss" ) ;

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
					console.log(data);
					if( data.email !== "admin@vplate.com" ) {
						res.status(403).send({
							status : "fail" ,
							msg : "Have no authority( not admin )"
						}) ;
						callback( "Have no authority( not admin )" ) ;
					} else {
    					callback( null ) ;	//	여기다가 null , data 로 넘기기
					}
				}
			}) ;
		} ,

		function( callback ) {
			pool.getConnection( function( err , connection ) {
				if(err) {
					res.status(500).send( {	
						status : "fail" ,
						msg : "internal server err"
					});
					callback( "getConnection err" ) ;
				} else {
					callback( null , connection ) ;
				}
			});	//	getConnection
		},	//	function

		function( connection , callback ) {

			let selectNotice = 'SELECT * FROM notice WHERE notice_title = ?' ;

			connection.query( selectNotice , title , function( err, result ) {
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "selectNoticeQuery err" + err ) ;
				} else {
					if( result.length !== 0 ){
						res.status(401).send({
							status : "fail" ,
							msg : "already title in notice"
						}) ;
						connection.release() ;
						callback( "already title in notice" ) ;
					}
					else {
						callback( null , connection ) ;
					}
				}
			}) ;
		} ,

		function( connection , callback ) {

			let insertNotice = 'INSERT INTO notice VALUES( ? , ? , ? , ? )' ;
			let array = [ null , title , content , uploadtime ] ;
			
			connection.query( insertNotice , array , function( err , result ) {
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "insertNoticeQuery err" ) ;
				} else {
					callback( null , connection ) ;
				}
			}) ;
		} ,

		function( connection , callback ) {

			let selectFCM_key = 'SELECT * FROM user' ;

			connection.query( selectFCM_key , function( err , result ) {
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "updateCompletionQuery err" ) ;
				} else {

					for( let i = 0 ; i < result.length ; i++ ) {

						if( result[i].user_push === 1  && result[i].fcm_key !== null ) {

							var push_data = {

								to : result[i].fcm_key ,
								notification : {
									title: title,
       		 						body: content,
        							sound: "default",
        							click_action: "FCM_PLUGIN_ACTIVITY",
        							icon: "fcm_push_icon"
								} ,
								priority : "high" ,
								restricted_package_name : "com.vplate" ,
								data : {
									num1 : 2000 ,
									num2 : 3000
								}
							} ;

							fcm.send( push_data , function( err , response ) {
								if(err){
									console.error( "Push 메시지 발송에 실패했습니다." ) ;
									console.error( err ) ;
									return ;
								} else {
									console.log( "Push 메시지가 발송되었습니다." ) ;
									console.log( response ) ;
								}
							}) ;
						}
					}

					res.status(201).send({
						status : "success" ,
						msg : "successfully insert notice"
					}) ;
					connection.release() ;
					callback( null , "successfully insert notice" ) ;
				}
			}) ;
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