var express = require('express');
var router = express.Router();

const profile = require( './profile' ) ;
router.use( '/profile' , profile ) ;

const search = require( './search' ) ;
router.use( '/search' , search ) ;

const change = require( './change' ) ;
router.use( '/change' , change ) ;

const push = require( './push' ) ;
router.use( '/push' , push ) ;

module.exports = router;