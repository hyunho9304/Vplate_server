var express = require('express');
var router = express.Router();

const latest = require( './latest' ) ;
router.use( '/latest' , latest ) ;

const popularity = require( './popularity' ) ;
router.use( '/popularity' , popularity ) ;

const choice = require( './choice' ) ;
router.use( '/choice' , choice ) ;

module.exports = router;