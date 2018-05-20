var express = require('express');
var router = express.Router();

const ready = require( './ready' ) ;
router.use( '/ready' , ready ) ;

module.exports = router;
