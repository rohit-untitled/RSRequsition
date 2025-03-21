var callRequisitionAPIs = require("../lib/callRequisitionAPIs");
module.exports = {
    metadata: function metadata() {
        return {
            name: "ItemRequisition",
            properties: {
                instanceName: {
                    type: "string",
                    required: true
                },
                userName: {
                    type: "string",
                    required: true
                },
                requestToken: {
                    type: "string",
                    required: true
                },
                selectedItem: {
                    type: "string",
                    required: true
                },
                selectedItemDesc: {
                    type: "string",
                    required: true
                },
                selectedItemPrice: {
                    type: "string",
                    required: true
                },
                quantity: {
                    type: "int",
                    required: true
                },
                justification: {
                    type: "string",
                    required: true
                },
                CategoryId: {
                    type: "string",
                    required: true
                },
                CategoryName: {
                    type: "string",
                    required: true
                },
                fusionEnv: {
                    type:"string",
                    required: true
                },
            },
            supportedActions: ["done_procurement", "resetVariables", "notSupported"]
        };
    },

    invoke: (conversation, done) => {
        var instanceName = conversation.properties().instanceName;
        var userName = conversation.properties().userName;
        var requestToken = conversation.properties().requestToken;
        var fusionEnv = conversation.properties().fusionEnv.toUpperCase();
        var selectedItem = conversation.properties().selectedItem;
        var selectedItemDesc = conversation.properties().selectedItemDesc;
        var selectedItemPrice = conversation.properties().selectedItemPrice;
        var quantity = conversation.properties().quantity;
        var justification = conversation.properties().justification;
        var categoryId = conversation.properties().CategoryId;
        var categoryName = conversation.properties().CategoryName;
    

        conversation.logger().info(
            "Instance name ==>" + instanceName,
            "Username ==>" + userName,
            // "Request Token ==>" + requestToken,
            "Fusion Env ==>" + fusionEnv,
            "Item ==>" + selectedItem,
            "Description ==>" + selectedItemDesc,
            "Quantity ==>" + quantity,
            "Amount ==>" + selectedItemPrice,
            "Justification ==>" + justification,
            "CategoryId ==>" + categoryId,
            "CategoryName ==>" + categoryName,
        );
    
        var queryObject = {};
        queryObject.instanceName = instanceName;
        queryObject.requestToken = requestToken;

        if(fusionEnv.includes('HRZ') || fusionEnv.includes('HED')){
            conversation.logger().info('Valid Environment', fusionEnv)
        }else{
            conversation.logger().info('InvalidEnvironment', fusionEnv)
            conversation.keepTurn(true);
            conversation.transition("notSupported");
            done();
        }
        callRequisitionAPIs.requisitionAPI(instanceName, userName, requestToken, fusionEnv,categoryId,categoryName, selectedItem, selectedItemDesc, quantity, selectedItemPrice, justification, conversation, done);
    }

}