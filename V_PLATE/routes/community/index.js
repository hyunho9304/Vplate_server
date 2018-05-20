var express = require('express');
var router = express.Router();

const bookmark = require( './bookmark' ) ;
router.use( '/bookmark' , bookmark ) ;

const upload = require( './upload' ) ;
router.use( '/upload' , upload ) ;

const del = require( './delete' ) ;
router.use( '/delete' , del ) ;

const list = require( './list/index' ) ;
router.use( '/list' , list ) ;

module.exports = router;
