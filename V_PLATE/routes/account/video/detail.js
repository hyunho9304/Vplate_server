//	나의영상 보기	account/video/detail

const express = require('express');
const router = express.Router();
const pool = require( '../../../config/dbPool' ) ;	//	경로하나하나
const async = require( 'async' ) ;		//	install
const moment = require( 'moment' ) ;
const jwt = require( 'jsonwebtoken' ) ;

router.get( '/' , function( req , res ) {

	let token = req.headers.tt ;

	let mymediaid = req.query.mymediaid ;
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

			let mymediaDetail = 'SELECT * FROM mymedia M , template T ' +
			'WHERE M.template_id = T.template_id AND M.mymedia_id = ?' ;

			connection.query( mymediaDetail , mymediaid , function( err , result ){
				if( err ) {
					res.status(500).send({
						status : "fail" ,
						msg : "internal server err"
					}) ;
					connection.release() ;
					callback( "mymediaDetailQuery err" + err ) ;
				} else {

					let detail = {

					mymedia_id : result[0].mymedia_id ,
					mymedia_completionVideo : result[0].mymedia_completionVideo ,
					template_type : result[0].template_type ,
					mymedia_uploadtime : result[0].mymedia_uploadtime ,
					template_textNum : result[0].template_textNum ,
					template_photoNum : result[0].template_photoNum ,
					template_videoNum : result[0].template_videoNum ,
					template_title : result[0].template_title ,
					template_hashtag : result[0].template_hashtag ,
					template_length : result[0].template_length ,
					template_content : result[0].template_content ,
					
					}
					connection.release() ;
					callback( null , detail ) ;
				}
			}) ;
		} ,

		function( detail , callback ) {

			res.status(200).send({
				status : "success" ,
				data : detail ,
				msg : "successfully get mymedia detail data"
			}) ;
			callback( null , "successfully get mymedia detail data" ) ;
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