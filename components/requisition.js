var callProcurementAPIs = require("../lib/callProcurementAPIs.js");

module.exports = {
    metadata: function metadata() {
        return {
            name: "Requisition",
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
                fusionEnv: {
                    type: "string",
                    required: true
                },
                action: {   
                    type: "string",
                    required: false
                }
            },
            supportedActions: ["done_procurement", "resetVariables", "notSupported"]
        };
    },

    invoke: (conversation, done) => {
        var instanceName = conversation.properties().instanceName;
        var userName = conversation.properties().userName;
        var requestToken = conversation.properties().requestToken;
        var fusionEnv = conversation.properties().fusionEnv.toUpperCase();
        var action = conversation.properties().action;

        conversation.logger().info(
            "Instance name ==>" + instanceName,
            "Username ==>" + userName,
            "Request Token ==>" + requestToken,
            "Fusion Env ==>" + fusionEnv,
            "Action ==> " + action
          );

        var queryObject = {};
        queryObject.instanceName = instanceName;
        queryObject.requestToken = requestToken;

        if (fusionEnv.includes('HRZ') || fusionEnv.includes('HED')) {
            conversation.logger().info('Valid Environment', fusionEnv)
        } else {
            conversation.logger().info('Invalid Environment', fusionEnv)
            conversation.keepTurn(true);
            conversation.transition("notSupported");
            done();
            return;
        }
        callProcurementAPIs.procurementCBAPI(instanceName, userName, requestToken, fusionEnv, action, conversation, done);
    }
};