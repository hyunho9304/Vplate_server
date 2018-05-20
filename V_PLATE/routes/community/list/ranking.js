//	커뮤니티 랭킹 탑텐		community/list/ranking

const express = require('express');
const router = express.Router();
const pool = require( '../../../config/dbPool' ) ;	//	경로하나하나
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

			let selectCommunity = 'SELECT * FROM community C , mymedia M , user U ' +
			'WHERE C.mymedia_id = M.mymedia_id AND M.user_email = U.user_email ' +
			'ORDER BY community_hits DESC' ;

			connection.query( selectCommunity ,  function( err , result ) {
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "selectCommunityQuery err" + err ) ;
				} else {
					callback( null , connection , result ) ;
				}
			});
		} ,

		function( connection , object , callback ) {

			let infoBookmark = 'SELECT * FROM bookmarkCommunity WHERE user_email = ?' ;

			connection.query( infoBookmark , email , function( err , result ) {
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "selectCommunityQuery err" + err ) ;
				} else {

					let list = [] ;
					let flag = '' ;

					for( let i = 0 ; i < 10 ; i++ ) {

						if( i >= result.length )
							break;

						let index = 0 ;
						for( let j = 0 ; j < result.length ; j++ ) {

							if( object[i].community_id === result[j].community_id )
								index = i ;
						}

						if( index === 0)
							flag = 0 ;
						else
							flag = 1 ;

						let data = {
							community_id : object[i].community_id ,
							email : object[i].user_email ,
							nickname : object[i].user_nickname ,
							profile : object[i].user_profile ,
							uploadtime : object[i].community_uploadtime ,
							content : object[i].community_content ,
							uploadvideo : object[i].mymedia_completionVideo ,
							bookmark : flag ,
							hits : object[i].community_hits ,
							length : object[i].template_length
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
					community : list
				} ,
				msg: "successfully get community ranking TOP 10 lists"
			});
			callback ( null , "successfully get community ranking TOP 10 lists" ) ;
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