//	mymedia 업로드( 영상 요청 )	account/video/upload

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

router.post( '/' , upload.array( 'file' , 26 ) , function( req , res ) {

	let token = req.headers.tt ;

	let templateid = req.query.templateid ;

	let source = req.body.source ;

	let email = '' ;
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

			let templateHitsPlus = 'UPDATE template SET template_hits = template_hits + 1 WHERE template_id = ?' ;

			connection.query( templateHitsPlus , templateid , function( err , result ) {
				if( err ) {
					res.status(500).send({
						status : "fail" , 
						msg : "internal server err"
					}) ;
					connection.release() ;
					callback( "templateHitsPlus err" + err ) ;
				} else {
					callback( null , connection ) ;
				}
			}) ;
		} ,

		function( connection , callback ) {

			let uploadMymedia = 'INSERT INTO mymedia VALUES( ? , ? , ? , ? , ? )' ;
			let array = [ null , null , uploadtime , email , templateid ] ;
			
			connection.query( uploadMymedia , array , function( err , result ){
				if( err ) {
					res.status(500).send({
                       	status: "fail",
                        msg : "internal server err " 
                    });
                    connection.release();
                    callback( "uploadMymediaQuery err" + err );
				} else{
					callback( null , connection ) ;
				}
			}) ;
		} ,

		function( connection , callback ) {

			let clipNumber = 'SELECT * FROM template WHERE template_id = ?' ;

			connection.query( clipNumber , templateid , function( err , result ) {
				if( err ) {
					res.status(500).send({
						status : "fail" ,
						msg : "internal server err"
					}) ;
					connection.release() ;
					callback( "clipNumber err" + err ) ;
				} else {
					callback( null , connection , result[0].template_clip ) ;
				} 
			}) ;
		} ,

		function( connection , num , callback ) {

			let indexQuery = 'SELECT mymedia_id FROM mymedia WHERE mymedia_uploadtime = ?' ;

			connection.query( indexQuery , uploadtime , function( err , result ) {
				if( err ) {
					res.status(500).send({
						status : "fail" ,
						msg : "internal server err"
					}) ;
					connection.release() ;
					callback( "indexQuery err" + err ) ;
				} else {
					callback( null , connection , num , result[0].mymedia_id ) ;
				} 
			}) ;
		} ,

		function( connection , num , num2 , callback ) {

			let uploadMaterials = 'INSERT INTO materials VALUES( ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? )' ;
//	source = [ "hahahaha" , "lhlhlhlhlhl" , null , null , "hdhdhD" , null ]
			let array = [ null ] ;

			let temp = JSON.parse( source ) ;

			let cnt = 0 ;
			for( let i = 0 ; i < num ; i++ ) {

				if( temp[i] !== null )
					array.push( temp[i] ) ;
				else {

					if( req.files[cnt].loaction !== "undefined" )
						array.push( req.files[cnt++].location ) ;
				}
			}
			for( let i = num ; i < 25 ; i++ ) {
				array.push( "null" ) ;
			}
			array.push( num2 ) ;

			console.log( array ) ;

			connection.query( uploadMaterials , array , function( err , result ) {
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
                     	msg : "successfully upload mymedia & files inform file" ,
                    });
                    connection.release() ;
                    callback( "successful upload mymedia & files inform file" ) ;
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

});

module.exports = router;
