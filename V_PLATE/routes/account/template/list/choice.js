//	찜한 템플릿 모아보기	/account/template/list/choice

const express = require('express');
const router = express.Router();
const pool = require( '../../../../config/dbPool' ) ;	//	경로하나하나
const async = require( 'async' ) ;		//	install
const moment = require( 'moment' ) ;
const jwt = require( 'jsonwebtoken' ) ;

router.get( '/' , function( req ,res ) {

	let token = req.headers.tt ;
	
	var cursor = req.query.cursor * 1 ;

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

			let selectBookmarkTemplate = 'SELECT * FROM template T , bookmarkTemplate B ' +
				'WHERE T.template_id = B.template_id AND B.user_email = ? ORDER BY B.bt_uploadtime DESC' ;
		
			connection.query( selectBookmarkTemplate , email , function( err , result ) {
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "selectBookmarkTemplateQuery err" + err ) ;
				} else {

					let list = [] ;

					for( var i = cursor ; i <  cursor + 10  ; i++ ) {		//	0	10	20	30

						if( i >= result.length )
							break;
						let data = {

							template_id : result[i].template_id ,
							template_title : result[i].template_title ,
							template_hashtag : result[i].template_hashtag ,
							template_type : result[i].template_type ,
							template_hits : result[i].template_hits ,
							template_length : result[i].template_length ,
							template_uploadtime : result[i].template_uploadtime ,
							template_thumbnail : result[i].template_thumbnail
						}
						list.push( data ) ;
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
					template : list
				} ,
				msg : "successfully get template choice lists"
			}) ;
			callback( null , "successfully get template choice lists" ) ;
		}
	] ;

	async.waterfall(task, function(err, result) {

        let logtime = moment().format('MMMM Do YYYY, h:mm:ss a');

        if (err)
            console.log(' [ ' + logtime + ' ] ' + err);
        else
            console.log(' [ ' + logtime + ' ] ' + result);
    }); //async.waterfall
});

module.exports = router;