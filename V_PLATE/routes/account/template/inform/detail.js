//	템플릿 상세보기	13.124.195.255:3003/account/template/detail

const express = require('express');
const router = express.Router();
const pool = require( '../../../../config/dbPool' ) ;	//	경로하나하나
const async = require( 'async' ) ;		//	install
const moment = require( 'moment' ) ;
const jwt = require('jsonwebtoken');

router.get( '/' , function( req , res ) {

	let token = req.headers.tt ;

	let templateid = req.query.templateid ;
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
		//	email 이랑 templae_id 가지고 북마크 했는지 확인

		function( connection , callback ) {

			let templateDetail = 'SELECT * FROM template WHERE template_id = ?' ;

			connection.query( templateDetail , templateid , function( err , result ) {
				if( err ) {
					res.status(500).send({
						status : "fail" ,
						msg : "internal server err"
					}) ;
					connection.release() ;
					callback( "templateDetailQuery err" + err ) ;
				} else {

					if( result.length === 0 ) {
						res.status(500).send({
							status : "fail" ,
							msg : "template_id does not exist"
						}) ;
						connection.release() ;
						callback( "template_id does not exist")
					} else {
						callback( null , connection , result ) ;
					}
				}
			}) ;
		} ,

		function( connection , object , callback ) {

			let boolBookmark = 'SELECT * FROM bookmarkTemplate WHERE user_email = ? AND template_id = ?' ;

			connection.query( boolBookmark , [ email , templateid ] , function( err , result ){
				if( err ) {
					res.status(500).send({
						status : "fail" ,
						msg : "internal server err"
					}) ;
					connection.release() ;
					callback( "boolBookmarkQuery err" + err ) ;
				}
				else{

					let flag = '' ;

					if( result.length === 0 )
						flag = 0 ;
					else
						flag = 1 ;

					let detail = {

						template_id : object[0].template_id ,
						template_sceneNum : object[0].template_sceneNum ,
						template_clip : object[0].template_clip ,
						template_textNum : object[0].template_textNum ,
						template_photoNum : object[0].template_photoNum ,
						template_videoNum : object[0].template_videoNum ,
						template_title : object[0].template_title ,
						template_hashtag : object[0].template_hashtag ,
						template_content : object[0].template_content ,
						template_type : object[0].template_type ,
						template_hits : object[0].template_hits ,
						template_length : object[0].template_length ,
						template_bookmarkTemplate : flag ,
						template_uploadtime : object[0].template_uploadtime ,
						template_video : object[0].template_video
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
				msg : "successfully get template detail data"
			}) ;
			callback( null , "successfully get template detail data" ) ;
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