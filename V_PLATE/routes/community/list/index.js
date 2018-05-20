var express = require('express');
var router = express.Router();

const latest = require( './latest' ) ;
router.use( '/latest' , latest ) ;

const ranking = require( './ranking' ) ;
router.use( '/ranking' , ranking ) ;

const user = require( './user' ) ;
router.use( '/user' , user ) ;

module.exports = router;