//	템플릿 씬 정보	13.124.195.255:3003/account/template/detail

const express = require('express');
const router = express.Router();
const pool = require( '../../../../config/dbPool' ) ;	//	경로하나하나
const async = require( 'async' ) ;		//	install
const moment = require( 'moment' ) ;
const jwt = require('jsonwebtoken');

router.get( '/' , function( req , res ) {

	let token = req.headers.tt ;

	let templateid = req.query.templateid ;

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

			let templateScene = 'SELECT * FROM scene WHERE template_id = ?' ;

			connection.query( templateScene , templateid , function( err , result ) {
				if( err ) {
					res.status(500).send({
						status : "fail" ,
						msg : "internal server err"
					}) ;
					connection.release() ;
					callback( "templateSceneQuery err" + err ) ;
				} else {

					console.log( result ) ;

					if( result.length === 0 ) {
						res.status(500).send({
							status : "fail" ,
							msg : "template_id does not exist"
						}) ;
						connection.release() ;
						callback( "template_id does not exist")
					} else {

						res.status(200).send({
							status : "success" ,
							data : [
								result[0].scene_first ,
								result[0].scene_second ,
								result[0].scene_third ,
								result[0].scene_fourth ,
								result[0].scene_fifth ,
								result[0].scene_sixth ,
								result[0].scene_seventh ,
								result[0].scene_eighth ,
								result[0].scene_ninth ,
								result[0].scene_tenth
							] ,
							msg : "successfully get template scene data"
						});
						connection.release() ;
						callback( null , "successfully get template scene data" ) ;
					}
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