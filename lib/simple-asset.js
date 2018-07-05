'use strict';

const shim = require('fabric-shim');

/**
 * SimpleAsset implements a simple chaincode to manage an asset.
 * @class
 */
class SimpleAsset {
    /**
     * Init is called during chaincode instantiation to initialize any
     * data. Note that chaincode upgrade also calls this function to reset
     * or to migrate data.
     * @async
     * @param {ChaincodeStub} stub Fabric stub interface.
     * @returns {SuccessResponse|ErrorResponse} Response object.
     */
    async Init(stub) {
        // Get the arguments from the transaction proposal
        const args = stub.getStringArgs();

        // Set up any variables or assets here

        try {
            await this.set(stub, args);
        } catch (error) {
            return shim.error(Buffer.from(error.message));
        }

        return shim.success();
    }

    /**
     * Invoke is called per transaction on the chaincode. Each transaction is
     * either a 'get' or a 'set' on the asset created by Init function. The 'set'
     * method may create a new asset by specifying a new key-value pair.
     * @async
     * @param {ChaincodeStub} stub Fabric stub interface.
     * @returns {SuccessResponse|ErrorResponse} Response object.
     */
    async Invoke(stub) {
        // Extract the function and args from the transaction proposal
        const { fcn: functionName, params: args } = stub.getFunctionAndParameters();

        let invokeFunction;
        switch (functionName) {
            case 'set':
                invokeFunction = this.set;
                break;
            case 'get':
                invokeFunction = this.get;
                break;
            default:
                return shim.error(Buffer.from(`Unsupported function: ${functionName}`));
        }

        try {
            const resultPayload = await invokeFunction(stub, args);
            return shim.success(resultPayload);
        } catch (error) {
            return shim.error(Buffer.from(`Error invoking ${functionName}: ${error.message}`));
        }
    }

    /**
     * Set stores the asset (both key and value) on the ledger. If the key exists,
     * it will override the value with the new one.
     * @async
     * @param {ChaincodeStub} stub Fabric stub interface.
     * @param {Array.<String>} args Function arguments.
     */
    async set(stub, args) {
        if (args.length !==  2) {
            throw new Error('Incorrect arguments. Expecting a key and a value');
        }

        const assetKey = args[0];
        const assetValue = args[1];
        try {
            // Store the key and the value on the ledger by calling stub.putState()
            await stub.putState(assetKey, Buffer.from(assetValue));
        } catch (error) {
            throw new Error(`Failed to set asset: ${assetKey}`);
        }
    }

    /**
     * Get returns the value of the specified asset key.
     * @async
     * @param {ChaincodeStub} stub Fabric stub interface.
     * @param {Array.<String>} args Function arguments.
     * @returns {Buffer} Result payload.
     */
    async get(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect arguments. Expecting a key');
        }

        const assetKey = args[0];
        let assetValue;
        try {
            // Get the value for a key from the ledger using stub.getState()
            assetValue = await stub.getState(assetKey);
        } catch (error) {
            throw new Error(`Failed to get asset: ${assetKey} with error: ${error.message}`);
        }

        if (!assetValue) {
            throw new Error(`Asset not found: ${assetKey}`);
        }

        return Buffer.from(assetValue);
    }

}

module.exports = SimpleAsset;