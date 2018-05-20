var express = require('express');
var router = express.Router();

const template_i = require( './template-i' ) ;
router.use( '/template' , template_i ) ;

const completion = require( './completion' ) ;
router.use( '/completion' , completion ) ;

const notice = require( './notice' ) ;
router.use( '/notice' , notice ) ;

module.exports = router;
