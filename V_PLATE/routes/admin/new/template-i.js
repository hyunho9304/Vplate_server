//	template 삽입	admin/new/template

const express = require('express');
const router = express.Router();
const pool = require( '../../../config/dbPool' ) ;	
const async = require( 'async' ) ;
const moment = require( 'moment' ) ;
const jwt = require( 'jsonwebtoken' ) ;

const multer = require('multer' );		
const multerS3 = require( 'multer-s3' ) ;	
const aws = require( 'aws-sdk' ) ;	
aws.config.loadFromPath('./config/aws_config.json');
const s3 = new aws.S3();			

const upload = multer({ 
    storage: multerS3({
        s3: s3,
        bucket: 'hyunho9304', 
        acl: 'public-read', 
        key: function(req, file, callback) {
            callback(null, Date.now() + '.' + file.originalname.split('.').pop());
        }
    })
});

router.post( '/' , upload.array( 'file' , 12 ) , function( req , res ) {

	let token = req.headers.tt ;

	let title = req.body.title ;
	let hashtag = req.body.hashtag ;
	let content = req.body.content ;
	let type = req.body.type ;
	let length = req.body.length ;
	let sceneNum = req.body.sceneNum ;
	let clip = req.body.clip ;
	let textNum = req.body.textNum ;
	let photoNum = req.body.photoNum ;
	let videoNum = req.body.videoNum ;
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
					if( result.length !== 0 ) {
						res.status(401).send({
							status : "fail" ,
							msg : "already title in DB"
						}) ;
						connection.release() ;
						callback( "already title in DB" ) ;
					} else {
						callback( null , connection ) ;
					}
				}
			}) ;	//	connection.query

		} ,

		function( connection , callback ) {

			let insertTemplate = 'INSERT INTO template VALUES ( ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? )' ;
			let array = [ null , title , hashtag , content , type , length , sceneNum , clip , textNum , photoNum , videoNum , 0 , uploadtime , req.files[0].location , req.files[1].location ] ;

			connection.query( insertTemplate , array , function( err , result ) {
				if (err) {
                    res.status(500).send({
                       	status: "fail",
                        msg : "internal server err " 
                    });
                    connection.release();
                    callback( "insertTemplateQuery err" + err );
                }
                else {
                	callback( null , connection ) ;
                }
			}) ;
		} , 	//	function

		function( connection , callback ) {

			let indexQuery = 'SELECT template_id FROM template WHERE template_title = ?' ;

			connection.query( indexQuery , title , function( err , result ) {
				if( err ) {
					res.status(500).send({
						status : "fail" ,
						msg : "internal server err"
					}) ;
					connection.release() ;
					callback( "indexQuery err" ) ;
				}
				else {

					let insertScene = 'INSERT INTO scene VALUES( ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? )' ;
					let array = [ null ] ;

					for( let i = 2 ; i < req.files.length ; i++ )
						array.push( req.files[i].location) ;
					for( let i = 0 ; i < 12 - req.files.length ; i++ )
						array.push( null ) ;

					array.push( result[0].template_id ) ;

					connection.query( insertScene , array , function( err , result2 ) {
						if( err ) {
							res.status(500).send({
								status : "fail" ,
								msg : "internal server err"
							}) ;
							connection.release() ;
							callback( "insertScene err" + err ) ;
						} else {
							res.status( 201).send( {
                        		status : "success" ,
                     			msg : "successful upload template & scene inform file" ,
                    		});
                    		connection.release() ;
                    		callback( "successful upload template & scene inform file" ) ;
						}
					}) ;
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