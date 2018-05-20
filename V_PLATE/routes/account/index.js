var express = require('express');
var router = express.Router();

const setting = require( './setting/index' ) ;
router.use( '/setting' , setting ) ;

const template = require( './template/index' ) ;
router.use( '/template' , template ) ;

const signup = require( './signup' ) ;
router.use( '/signup' , signup ) ;

const signin = require( './signin' ) ;
router.use( '/signin' , signin ) ;

const overlap =require( './overlap' ) ;
router.use( '/overlap' , overlap ) ;

const video = require( './video/index' ) ;
router.use( '/video' , video ) ;

module.exports = router;