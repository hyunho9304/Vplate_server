//  회원가입    13.124.195.255:3003/sign/up

const express = require('express');
const router = express.Router();
const pool = require('../../config/dbPool');
const async = require('async');
const moment = require( 'moment' ) ;

const crypto = require('crypto');

const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
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

router.post('/', upload.single('profile'), function(req, res) {


    let email = req.body.email;
    let pwd = req.body.pwd;
    let answer1 = req.body.answer1;
    let answer2 = req.body.answer2;
    let nickname = req.body.nickname;
    let name = req.body.name;
    let outside_key = req.body.outside_key ;
    let type = req.body.type ;

    let file_1 = '';

    if (req.file == null)
        file_1 = null;
    else
        file_1 = req.file.location;

    if ( outside_key === undefined ) { // 일반 회원가입

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
                }); //  getConnection
            }, //   function

            function(connection, callback) { // 회원가입 진행

                crypto.randomBytes(32, function(err, buffer) {
                    if (err) {
                        res.status(500).send({
                            status: "fail",
                            msg: "internal server err"
                        });
                        connection.release();
                        callback("crypto randomBytes err");
                    } else {

                        let salt = buffer.toString('base64');

                        crypto.pbkdf2(pwd, salt, 100000, 64, 'sha512', function(err, hashed) {
                            if (err) {
                                res.status(500).send({
                                    status: "fail",
                                    msg: "internal server err"
                                });
                                connection.release();
                                callback("crypto pbkdf2 err");
                            } else {

                                let cryptopwd = hashed.toString('base64');
                                let InsertUserQuery = 'INSERT INTO user VALUES( ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? )';
                                let array = [ email , type , cryptopwd , salt , answer1 , answer2 , nickname , name , 1 , file_1 , null , null ] ;

                                connection.query(InsertUserQuery, array , function(err, result) {
                                    if (err) {
                                        res.status(500).send({
                                            status: "fail",
                                            msg: "internal server err"
                                        });
                                        connection.release();
                                        callback("insertUserQuery err");
                                    } else {
                                        res.status(201).send({
                                            status: "success",
                                            msg: "successfully signup"
                                        });
                                        connection.release();
                                        callback(null, "successfully signup");
                                    }
                                });
                            }
                        }); //  crypto.pbkdf2
                    }
                }); //  crypto.randomBytes
            } //    function
        ];
        async.waterfall(task, function(err, result) {

            let logtime = moment().format('MMMM Do YYYY, h:mm:ss a');

            if (err)
                console.log(' [ ' + logtime + ' ] ' + err);
            else
                console.log(' [ ' + logtime + ' ] ' + result);
        }); //async.waterfall
    } else { // 페이스북 회원가입 경우 , email , nickname , name , profile , outside_key

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
                    }0
                }); //  getConnection
            }, //   function

            function(connection, callback) { // 회원가입 진행

                crypto.randomBytes(32, function(err, buffer) {
                    if (err) {
                        res.status(500).send({
                            status: "fail",
                            msg: "internal server err"
                        });
                        connection.release();
                        callback("crypto randomBytes err");
                    } else {

                        let salt = buffer.toString('base64');

                        crypto.pbkdf2( outside_key , salt , 100000, 64, 'sha512', function(err, hashed) {
                            if (err) {
                                res.status(500).send({
                                    status: "fail",
                                    msg: "internal server err"
                                });
                                connection.release();
                                callback("crypto pbkdf2 err");
                            } else {

                                let cryptofacebook = hashed.toString('base64');
                                let InsertUserQuery = 'INSERT INTO user VALUES( ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? )';
                                let array = [ email , type , null , salt , null , null , nickname , name , 1 , file_1 , null , cryptofacebook ] ;
                               
                                connection.query(InsertUserQuery , array , function(err, result) {
                                    if (err) {
                                        res.status(500).send({
                                            status: "fail",
                                            msg: "internal server err"
                                        });
                                        connection.release();
                                        callback("insertUserQuery err");
                                    } else {
                                        res.status(201).send({
                                            status: "success",
                                            msg: "successfully signup ( outside )"
                                        });
                                        connection.release();
                                        callback(null, "successfully signup ( outside )");
                                    }
                                });
                            }
                        }); //  crypto.pbkdf2
                    }
                }); //  crypto.randomBytes
            } //    function
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