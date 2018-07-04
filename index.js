'use strict';

const shim = require('fabric-shim');
const SimpleAsset = require('./lib/simple-asset');

const chaincode = new SimpleAsset();
shim.start(chaincode);