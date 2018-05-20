var express = require('express');
var router = express.Router();

const template_d = require( './template-d' ) ;
router.use( '/template' , template_d ) ;

module.exports = router;
