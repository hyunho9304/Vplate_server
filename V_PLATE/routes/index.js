var express = require('express');
var router = express.Router();

const account = require( './account/index' ) ;
router.use( '/account' , account ) ;

const admin = require( './admin/index' ) ;
router.use( '/admin' , admin ) ;

const community = require( './community/index' ) ;
router.use( '/community' , community ) ;

router.get('/', (req,res) => {
	res.status(200).send("Hello Vplate!")
})

module.exports = router;
