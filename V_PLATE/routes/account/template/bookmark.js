//	북마크 설정 템플릿	13.124.195.255:3003/account/template/bookmark

const express = require('express');
const router = express.Router();
const pool = require( '../../../config/dbPool' ) ;	//	경로하나하나
const async = require( 'async' ) ;		//	install
const moment = require( 'moment' ) ;
const jwt = require('jsonwebtoken');

router.put( '/' , function( req , res ) {

	let token = req.headers.tt ;

	let email = '' ;
	let templateid = req.body.templateid ;

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
				//	console.log(data);
					email = data.email ;
    				callback( null ) ;	//	여기다가 null , data 로 넘기기
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

			let selectBookmarkTemplate = 'SELECT * FROM bookmarkTemplate WHERE user_email = ? AND template_id = ?' ;
			let array = [ email , templateid ] ;

			connection.query( selectBookmarkTemplate , array , function( err , result ) {
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "selectBookmarkTemplateQuery err " + err ) ;
				} else {

					if( result.length === 0 ) {		//	bookmark 하기
						
						let insertBookmarkTemplate = 'INSERT INTO bookmarkTemplate VALUES( ? , ? , ? , ? )' ;
						let array = [ null , uploadtime , email , templateid ] ;

						connection.query( insertBookmarkTemplate , array , function( err , result2 ) {
							if( err ) {
								res.status(500).send( {
									status : "fail" ,
									msg : "internal server err"
								});
								connection.release() ;
								callback( "insertBookmarkTemplateQuery err" ) ;
							} else {

								let num = 1 ;
								connection.release() ;
								callback( null , num ) ;
							}
						});
					}
					else {	//	bookmark 제거

						let deleteBookmarkTemplate = 'DELETE FROM bookmarkTemplate WHERE user_email = ? AND template_id = ?'
						let array = [ email , templateid ] ;

						connection.query( deleteBookmarkTemplate , array , function( err , result3 ) {
							if( err ) {
								res.status(500).send( {
									status : "fail" ,
									msg : "internal server err"
								});
								connection.release() ;
								callback( "deleteBookmarkTemplateQuery err" ) ;
							} else {
								
								let num = 0 ;
								connection.release() ;
								callback( null , num ) ;
							}
						});
					}
				}
			}) ;
		} ,

		function( result , callback ) {
			console.log( result ) ;
			
			res.status(201).send({
				status : "success" ,
				bookmark : result ,
				msg: "successfully regist bookmarkTemplate // successfully delete bookmarkTemplate"
			});
			callback ( null , "successfully regist bookmarkTemplate // successfully delete bookmarkTemplate" ) ;
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