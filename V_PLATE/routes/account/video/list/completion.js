//	mymedia 목록 ( 최신/완성 )	/account/video/list/completion

const express = require('express');
const router = express.Router();
const pool = require( '../../../../config/dbPool' ) ;	//	경로하나하나
const async = require( 'async' ) ;		//	install
const moment = require( 'moment' ) ;
const jwt = require( 'jsonwebtoken' ) ;

router.get( '/' , function( req ,res ) {

	let token = req.headers.tt ;
	let email = '' ;

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
					res.status( 500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					callback( "getConnection err") ;
				} else {
					callback( null , connection ) ;
				}
			});
		} ,

		function( connection , callback ) {

			let selectMymedia = 'SELECT * FROM mymedia M , template T ' +
			'WHERE M.template_id = T.template_id ' +
			'ORDER BY M.mymedia_uploadtime DESC'

			connection.query( selectMymedia , function( err , result ){
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "selectMymediaQuery err" + err ) ;
				} else {

					let list = [] ;

					for( let i = 0 ; i < result.length ; i++ ) {

						if( i >= result.length )
							break ;

						if( ( result[i].mymedia_completionVideo !== null ) && ( result[i].user_email == email ) )  {

							let data = {

								mymedia_id : result[i].mymedia_id ,
								thumbnail : result[i].template_thumbnail ,
								type : result[i].template_type ,
								title : result[i].template_title ,
								hashtag : result[i].template_hashtag ,
								uploadtime : result[i].mymedia_uploadtime ,
								length : result[i].template_length
							}
							list.push( data ) ;
						}
					}
					connection.release() ;
					callback( null , list ) ;
				}
			}) ;
		} , 

		function( list , callback ) {

			res.status(200).send({
				status : "success" ,
				data : {
					mymedia : list
				} ,
				msg: "successfully get mymedia completion lists"
			});
			callback ( null , "successfully get mymedia completion lists" ) ;
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