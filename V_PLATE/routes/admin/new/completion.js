//	mymedia 업로드( 영상 완료)	admin/new/completion

const express = require('express');
const router = express.Router();
const pool = require( '../../../config/dbPool' ) ;	
const async = require( 'async' ) ;
const moment = require( 'moment' ) ;
const jwt = require( 'jsonwebtoken' ) ;

const FCM = require( 'fcm-node' ) ;
const serverKey = require('../../../config/firebase')
const fcm = new FCM(serverKey);

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

router.post( '/' , upload.single( 'file' ) , function( req , res ) {

	let token = req.headers.tt ;

	let mymediaid = req.query.mymediaid ;
	let uploadtime = moment().format( "YYYYMMDDHHmmss" ) ;
	
	let completionVideo = req.file.location ;

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
					console.log(data);
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

			let selectFCM_key = 'SELECT * FROM user U , mymedia M ' +
			'WHERE U.user_email = M.user_email AND M.mymedia_id = ?'
			
			connection.query( selectFCM_key , mymediaid , function( err , result ) {
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "selectFCM_keyQuery err" ) ;
				} else {
					callback( null , connection , result[0].user_push , result[0].user_email , result[0].fcm_key ) ;
				}
			}) ;
		} ,

		function( connection , push , email , key , callback ) {

			let updateCompletion = 'UPDATE mymedia SET mymedia_completionVideo = ? , mymedia_uploadtime = ? WHERE mymedia_id = ?' ;
			let array = [ completionVideo , uploadtime , mymediaid ] ;

			connection.query( updateCompletion , array , function( err , result ) {
				if( err ) {
					res.status(500).send( {
						status : "fail" ,
						msg : "internal server err"
					});
					connection.release() ;
					callback( "updateCompletionQuery err" ) ;
				} else {

					if( push === 1 ) {

						var push_data = {

							to : key ,
							notification : {
								title: "VPLATE",
       		 					body: "요청하신 영상이 업로드 되었습니다~^^",
        						sound: "default",
        						click_action: "FCM_PLUGIN_ACTIVITY",
        						icon: "fcm_push_icon"
							} ,
							priority : "high" ,
							restricted_package_name : "com.vplate" ,
							data : {
								num1 : 2000 ,
								num2 : 3000
							}
						} ;

						fcm.send( push_data , function( err , response ) {
							if(err){
								console.error( "Push 메시지 발송에 실패했습니다." ) ;
								console.error( err ) ;
								return ;
							} else {
								console.log( "Push 메시지가 발송되었습니다." ) ;
								console.log( response ) ;
							}
						}) ;
					}

					res.status(201).send({
						status : "success" ,
						msg : "successfully update completionVideo"
					}) ;
					connection.release() ;
					callback( null , "successfully update completionVideo" ) ;
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