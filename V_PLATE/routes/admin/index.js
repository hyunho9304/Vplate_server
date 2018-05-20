var express = require('express');
var router = express.Router();

const inform = require( './inform' ) ;
router.use( '/inform' , inform ) ;

const newa = require( './new/index' ) ;
router.use( '/new' , newa ) ;

const del = require( './delete/index' ) ;
router.use( '/delete' , del ) ;

const form = require( './form/index' ) ;
router.use( '/form' , form ) ;


module.exports = router;
