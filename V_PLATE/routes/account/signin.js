//	로그인		13.124.195.255:3003/sign/in

const express = require('express');
const router = express.Router();
const pool = require('../../config/dbPool');
const async = require('async');
const crypto = require('crypto');
const moment = require( 'moment' ) ;
const jwt = require('jsonwebtoken');

router.post('/', function(req, res) {

    let email = req.body.email;
    let pwd = req.body.pwd;
    let outside_key = req.body.outside_key;
    let fcm_key = req.body.fcm_key ;

    if ( outside_key === undefined ) {	//	일반로그인

        let task = [

            function(callback) {
                pool.getConnection(function(err, connection) {
                    if (err) {
                        res.status(500).send({
                            status: "fail",
                            msg: "internal server err"
                        });
                        callback("connection err");
                    } else {
                        callback(null, connection);
                    }
                }); //	pool.getConnection
            }, //	function

            function(connection, callback) {

                let checkEmail = 'SELECT * FROM user WHERE user_email = ?';

                connection.query(checkEmail , email, function(err, result) {
                    if (err) {
                        res.status(500).send({
                            status: "fail",
                            msg: "internal server err"
                        });
                        connection.release();
                        callback( "checkEmailQuery err" ) ;
                    } else {
                        if (result.length === 0) {
                            res.status(401).send({
                                status: "fail",
                                msg: "failed login_email"
                            });
                            connection.release();
                            callback("failed login_email");
                        } else {
                            callback(null, connection, result[0]);
                        }
                    }
                }); //	connection.query
            }, //	function

            function(connection, object, callback) {

                crypto.pbkdf2(pwd, object.user_salt, 100000, 64, 'sha512', function(err, hashed) {
                    if (err) {
                        res.status(500).send({
                            status: "fail",
                            msg: "internal server err"
                        });
                        connection.release();
                        callback("crypto pbkdf2 err");
                    } else {

                        let cryptopwd = hashed.toString('base64');

                        if (cryptopwd !== object.user_pwd) {

                            res.status(401).send({
                                status: "fail",
                                msg: "failed login_pwd"
                            });
                            connection.release();
                            callback("failed login_pwd");
                        } else {
                            callback( null , connection , object) ;
                        }
                    }
                }); //	crypto.pbkdf2
            } , //	function

            function( connection , object , callback ) {

                let updateClientToken = 'UPDATE user SET fcm_key = ? WHERE user_email = ?';
                let array = [ fcm_key , email ] ;

                connection.query( updateClientToken , array , function(err, result) {
                    if (err) {
                        res.status(500).send({
                            status: "fail",
                            msg: "internal server err"
                        });
                        connection.release();
                        callback("updateClientTokenQuery err")
                    } else {

                        let type = object.user_type ;

                        let secret = req.app.get('jwt-secret');

                        let option = {
                            algorithm: 'HS256',
                            expiresIn: 3600 * 24 * 30
                        };

                        let payload = {
                            type : object.user_type ,
                            email : object.user_email ,
                            name : object.user_name ,
                            nickname : object.user_nickname
                        };

                        jwt.sign(payload, secret, option, function(err, token) {
                            if (err) {
                                res.status(500), send({
                                    status: "fail",
                                    msg: "token Creation Fails"
                                });
                            } else {

                                let email = object.user_email ;
                                let name = object.user_name ;
                                let nickname = object.user_nickname ;
                                let push = object.user_push ;
                                let profile = object.user_profile ;

                                res.status(201).send({
                                    status: "success" ,
                                    data : {
                                        type ,
                                        email ,
                                        name ,
                                        nickname ,
                                        push ,
                                        profile
                                    } ,
                                    token: token ,
                                    msg: "successfully signin"
                                });
                                connection.release();
                                callback(null, "successfully signin");
                            }
                        });
                    }
                }); //  connection.query
            }
        ];

        async.waterfall(task, function(err, result) {

            let logtime = moment().format('MMMM Do YYYY, h:mm:ss a');

            if (err)
                console.log(' [ ' + logtime + ' ] ' + err);
            else
                console.log(' [ ' + logtime + ' ] ' + result);
        }); //async.waterfall
    } else {														//	페이스북로그인

    	let task = [

            function(callback) {
                pool.getConnection(function(err, connection) {
                    if (err) {
                        res.status(500).send({
                            status: "fail",
                            msg: "internal server err"
                        });
                        callback("internal server err");
                    } else {
                        callback(null, connection);
                    }
                }); //	pool.getConnection
            }, //	function

            function(connection, callback) {

                let checkEmail = 'SELECT * FROM user WHERE user_email = ?';

                connection.query(checkEmail , email, function(err, result) {
                    if (err) {
                        res.status(500).send({
                            status: "fail",
                            msg: "internal server err"
                        });
                        connection.release();
                        callback("checkEmailQuery err")
                    } else {
                        if (result.length === 0) {
                            res.status(401).send({
                                status: "fail",
                                msg: "failed login_email"
                            });
                            connection.release();
                            callback("failed login_email");
                        } else {
                            callback(null, connection, result[0]);
                        }
                    }
                }); //	connection.query
            }, //	function

            function(connection, object, callback) {

                crypto.pbkdf2( outside_key , object.user_salt, 100000, 64, 'sha512', function(err, hashed) {
                    if (err) {
                        res.status(500).send({
                            status: "fail",
                            msg: "internal server err"
                        });
                        connection.release();
                        callback("crypto pbkdf2 err");
                    } else {

                        let cryptoOutside_key = hashed.toString('base64');

                        if (cryptoOutside_key !== object.outside_key ) {

                            res.status(401).send({
                                status: "fail",
                                msg: "failed login_outside_key"
                            });
                            connection.release();
                            callback("failed login_outside_key");
                        } else {

                            let type = object.user_type ;

                            let secret = req.app.get('jwt-secret');

                            let option = {
                                algorithm: 'HS256',
                                expiresIn: 3600 * 24 * 30
                            };

                            let payload = {
                                type : object.user_type ,
                                email : object.user_email ,
                                name : object.user_name ,
                                nickname : object.user_nickname
                            };

                            jwt.sign(payload, secret, option, function(err, token) {
                                if (err) {
                                    res.status(500), send({
                                     status: "fail",
                                     msg: "token Creation Fails"
                                    });
                                } else {

                                    let email = object.user_email ;
                                    let name = object.user_name ;
                                    let nickname = object.user_nickname ;
                                    let push = object.user_push ;
                                    let profile = object.user_profile ;

                                    res.status(201).send({
                                        status: "success" ,
                                        data : {
                                            type ,
                                            email ,
                                            name ,
                                            nickname ,
                                            push ,
                                            profile
                                        } ,
                                        token: token ,
                                        msg: "successfully signin"
                                    });
                                    connection.release();
                                    callback(null, "successfully signin");
                                }
                            });
                        }
                    }
                }); //	crypto.pbkdf2
            } //	function
        ];

        async.waterfall(task, function(err, result) {

            let logtime = moment().format('MMMM Do YYYY, h:mm:ss a');

            if (err)
                console.log(' [ ' + logtime + ' ] ' + err);
            else
                console.log(' [ ' + logtime + ' ] ' + result);
        }); //async.waterfall
    }
});

module.exports = router;