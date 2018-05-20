var express = require('express');
var router = express.Router();

const list = require( './list/index' ) ;
router.use( '/list' , list ) ;

const bookmark = require( './bookmark' ) ;
router.use( '/bookmark' , bookmark ) ;

const inform = require( './inform/index' ) ;
router.use( '/inform' , inform ) ;

module.exports = router;