//	template 삭제	/admin/delete/template

const express = require('express');
const router = express.Router();
const pool = require( '../../../config/dbPool' ) ;	
const async = require( 'async' ) ;
const moment = require( 'moment' ) ;
const jwt = require( 'jsonwebtoken' ) ;

router.post( '/' , function( req , res ) {

	let title = req.body.title ;

	let task = [

		function( callback ) {

			let token = req.headers.tt ;
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
					console.log( data ) ;
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

			let checkTitleQuery = 'SELECT * FROM template WHERE template_title = ?' ;

			connection.query( checkTitleQuery , title , function( err , result ) {
				if( err ) {
					res.status(500).send({
						status : "fail" ,
						msg : "internal server err"
					}) ;
					callback( "checkTitleQuery err" ) ;
				} else {
					if( result.length === 0 ) {
						res.status(401).send({
							status : "fail" ,
							msg : "no title in DB"
						}) ;
						connection.release() ;
						callback( "not title in DB" ) ;
					} else {
						callback( null , connection ) ;
					}
				}
			}) ;	//	connection.query
		} ,

		function( connection , callback ) {

			let deleteTemplateQuery = 'DELETE FROM template WHERE template_title = ?' ;
			
			connection.query( deleteTemplateQuery , title , function( err , result ) {
				if (err) {
                    res.status(500).send({
                       	status: "fail",
                        msg : "internal server err" 
                    });
                    connection.release();
                    callback( "deleteTemplateQuery err");
                }
                else {
                    res.status(201).send( {
                        status : "success" ,
                        msg : "successfully delete template data" ,
                    });
                    connection.release() ;
                    callback( null , "successfully delete template data" ) ;
                }
			}) ;	//	connection.query
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