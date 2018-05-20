//  중복검사    13.124.195.255:3003/account/overlap

const express = require('express');
const router = express.Router();
const pool = require('../../config/dbPool');
const async = require('async');
const moment = require('moment');

router.post('/', function(req, res) {

    let email = req.body.email;

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
            }); //  pool.getConnection
        }, //   function

        function(connection, callback) {

            let checkEmailQuery = 'SELECT * FROM user WHERE user_email = ?';

            connection.query(checkEmailQuery, email, function(err, result) {
                if (err) {
                    res.status(500).send({
                        status: "fail",
                        msg: "internal server err"
                    });
                    callback("checkEmailQuery err");
                } else {
                    if (result.length !== 0) {
                        res.status(401).send({
                            status: "fail",
                            msg: "already email in DB"
                        });
                        connection.release();
                        callback("already email in DB");
                    } else {
                        res.status(201).send({
                            status: "success",
                            msg: "no duplication of email"
                        });
                        connection.release();
                        callback("no duplication of email");
                    }
                }
            }); //  connection.query
        } //    function( email 중복 확인 )
    ];
    async.waterfall(task, function(err, result) {

        let logtime = moment().format('MMMM Do YYYY, h:mm:ss a');

        if (err)
            console.log(' [ ' + logtime + ' ] ' + err);
        else
            console.log(' [ ' + logtime + ' ] ' + result);
    }); //async.waterfall
});

module.exports = router;