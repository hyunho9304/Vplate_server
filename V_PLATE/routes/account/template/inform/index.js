var express = require('express');
var router = express.Router();

const detail = require( './detail' ) ;
router.use( '/detail' , detail ) ;

const scene = require( './scene' ) ;
router.use( '/scene' , scene ) ;

module.exports = router;