//	community 삭제	community/delete

const express = require('express');
const router = express.Router();
const pool = require( '../../config/dbPool' ) ;	
const async = require( 'async' ) ;
const moment = require( 'moment' ) ;
const jwt = require( 'jsonwebtoken' ) ;

router.delete( '/' , function( req ,res ) {

	let token = req.headers.tt ;

	let communityid = req.query.communityid ;

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

			let deleteCommunity = 'DELETE FROM community WHERE community_id = ?' ;

			connection.query( deleteCommunity , communityid , function( err , result ) {
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "deleteCommunityQuery err" + err ) ;
				} else {
					res.status(201).send({
						status : "success" ,
						msg : "successfully delete community"
					}) ;
					connection.release() ;
					callback( null , "successfully delete community" ) ;
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