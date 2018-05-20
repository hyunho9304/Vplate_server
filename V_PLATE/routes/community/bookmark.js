//	북마크 설정	커뮤니티 13.124.195.255:3003/community/bookmark

const express = require('express');
const router = express.Router();
const pool = require( '../../config/dbPool' ) ;	//	경로하나하나
const async = require( 'async' ) ;		//	install
const moment = require( 'moment' ) ;
const jwt = require('jsonwebtoken');

router.put( '/' , function( req ,res ) {

	let token = req.headers.tt ;

	let email = '' ;
	let communityid = req.body.communityid ;

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

			let selectBookmarkCommunity = 'SELECT * FROM bookmarkCommunity WHERE user_email = ? AND community_id = ?' ;
			let array = [ email , communityid ] ;

			connection.query( selectBookmarkCommunity , array , function( err , result ) {
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "selectBookmarkCommunityQuery err " + err ) ;
				} else {

					if( result.length === 0 ) {		//	bookmark 하기 & hits++
						
						let insertBookmarkCommunity = 'INSERT INTO bookmarkCommunity VALUES( ? , ? , ? , ? )' ;
						let array = [ null , uploadtime , email , communityid ] ;

						connection.query( insertBookmarkCommunity , array , function( err , result2 ) {
							if( err ) {
								res.status(500).send( {
									status : "fail" ,
									msg : "internal server err"
								});
								connection.release() ;
								callback( "insertBookmarkCommunityQuery err" + err ) ;
							} else {

								let hitsupCommunity = 'UPDATE community SET community_hits = community_hits + 1 WHERE community_id = ?'

								connection.query( hitsupCommunity , communityid , function( err , result3 ){
									if( err ) {
										res.status(500).send( {
											status : "fail" ,
											msg : "internal server err"
										});
										connection.release() ;
										callback( "hitsupCommunityQuery err" + err ) ;
									} else {
										let num = 1 ;
										connection.release() ;
										callback( null , num ) ;
									}
								}) ;
							}
						});
					}
					else {	//	bookmark 제거 & hits--

						let deleteBookmarkCommunity = 'DELETE FROM bookmarkCommunity WHERE user_email = ? AND community_id = ?'
						let array = [ email , communityid ] ;

						connection.query( deleteBookmarkCommunity , array , function( err , result2 ) {
							if( err ) {
								res.status(500).send( {
									status : "fail" ,
									msg : "internal server err"
								});
								connection.release() ;
								callback( "deleteBookmarkCommunityQuery err" + err ) ;
							} else {

								let hitsdownCommunity = 'UPDATE community SET community_hits = community_hits - 1 WHERE community_id = ?'

								connection.query( hitsdownCommunity , communityid , function( err , result3 ){
									if( err ) {
										res.status(500).send( {
											status : "fail" ,
											msg : "internal server err"
										});
										connection.release() ;
										callback( "hitsdownCommunityQuery err" + err ) ;
									} else {
										let num = 0 ;
										connection.release() ;
										callback( null , num ) ;
									}
								}) ;
							}
						});
					}
				}
			}) ;
		} ,

		function( result , callback ) {

			res.status(201).send({
				status : "success" ,
				bookmark : result ,
				msg: "successfully regist bookmarkCommunity // successfully delete bookmarkCommunity & hits++ // hits--"
			});
			callback ( null , "successfully regist bookmarkCommunity // successfully delete bookmarkCommunity & hits++ // hits--" ) ;
		}
	];

	async.waterfall(task, function(err, result) {

        let logtime = moment().format('MMMM Do YYYY, h:mm:ss a');

        if (err)
            console.log(' [ ' + logtime + ' ] ' + err);
        else
            console.log(' [ ' + logtime + ' ] ' + result);
    }); //async.waterfall
}) ;

module.exports = router;