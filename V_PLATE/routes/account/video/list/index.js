var express = require('express');
var router = express.Router();

const incompletion = require( './incompletion' ) ;
router.use( '/incompletion' , incompletion ) ;

const completion = require( './completion' ) ;
router.use( '/completion' , completion ) ;

module.exports = router;