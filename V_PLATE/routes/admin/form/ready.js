//	회원이 올린 자료 데이터 시간순	/admin/form/ready

const express = require('express');
const router = express.Router();
const pool = require( '../../../config/dbPool' ) ;	
const async = require( 'async' ) ;
const moment = require( 'moment' ) ;
const jwt = require( 'jsonwebtoken' ) ;


router.get( '/' , function( req ,res ) {

	let token = req.headers.tt ;
	
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

			let selectMymedia = 'SELECT * FROM mymedia MM , template T , materials MT ' +
			'WHERE MM.mymedia_id = MT.mymedia_id AND MM.template_id = T.template_id ' + 
			'ORDER BY MM.mymedia_uploadtime DESC' ;

			connection.query( selectMymedia  , function( err , result ) {
				if( err ) {
					res.status(500).send({
                       	status: "fail",
                        msg : "internal server err " 
                    });
                    connection.release();
                    callback( "uploadCommunityQuery err" + err );
				} else {

					let list = [] ;

					for( let i = 0 ; i < result.length ; i++ ) {

						if( i >= result.length )
							break ;

						if( result[i].mymedia_completionVideo == null ) {

							let data = {

								mymedia_id : result[i].mymedia_id ,
								template_title : result[i].template_title ,
								materials_file1 : result[i].materials_file1 ,
								materials_file2 : result[i].materials_file2 ,
								materials_file3 : result[i].materials_file3 ,
								materials_file4 : result[i].materials_file4 ,
								materials_file5 : result[i].materials_file5 ,
								materials_file6 : result[i].materials_file6 ,
								materials_file7 : result[i].materials_file7 ,
								materials_file8 : result[i].materials_file8 ,
								materials_file9 : result[i].materials_file9 ,
								materials_file10 : result[i].materials_file10 ,
								materials_file11 : result[i].materials_file11 ,
								materials_file12 : result[i].materials_file12 ,
								materials_file13 : result[i].materials_file13 ,
								materials_file14 : result[i].materials_file14 ,
								materials_file15 : result[i].materials_file15 ,
								materials_file16 : result[i].materials_file16 ,
								materials_file17 : result[i].materials_file17 ,
								materials_file18 : result[i].materials_file18 ,
								materials_file19 : result[i].materials_file19 ,
								materials_file20 : result[i].materials_file20 ,
								materials_file21 : result[i].materials_file21 ,
								materials_file22 : result[i].materials_file22 ,
								materials_file23 : result[i].materials_file23 ,
								materials_file24 : result[i].materials_file24 ,
								materials_file25 : result[i].materials_file25 ,
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
					form : list
				} ,
				msg: "successfully get user request form ready lists"
			});
			callback ( null , "successfully get user request form ready lists" ) ;
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
