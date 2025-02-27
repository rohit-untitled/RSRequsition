var URL = require('url').URL;

var requisition = require('./requisition/createRequisition');

module.exports = {
    requisitionAPI: async function (instanceName, userName, requestToken, fusionEnv, selectedItemDesc, selectedItemPrice, justification, conversation, done) {
        conversation.logger().info("The Fusion Type is ", fusionEnv)
        var now  = new Date();
        var expiry = now.getMonth() == 11 ? new Date(now.getFullYear() + 1, 0, 1) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
        var deliveryDate = expiry.toISOString().replace('T', ' ').substr(0, 10);
        var payload = {}
        var instanceHostname = new URL(instanceName);
        instanceHostname = instanceHostname.hostname;
        payload.instanceName = "https://" + instanceHostname;
        payload.deliveryDate = deliveryDate;
        payload.requestToken = requestToken;
        payload.userName = userName;
        // payload.selectedItem = selectedItem;
        payload.selectedItemDesc = selectedItemDesc;
        payload.selectedItemPrice = selectedItemPrice;
        payload.justification = justification;
        payload.fusionEnv = fusionEnv;
        requisition.processRequisition(payload, this.callback, conversation, done)
        
    },
    callback: function(conversation, done, result, status){
        conversation.logger().info("Final Result ==" + JSON.stringify(result));
        if(result != null){
            if(status === 200){
                var requisition = result.Requisistion;
                conversation.logger().info("Requisition Response "+ JSON.stringify(requisition));
                conversation.variable('requisitionNumber', requisition);
                conversation.keepTurn(true);
                conversation.transition("done_procurement");
                done();
            }else {
                conversation.keepTurn(true);
                conversation.transition("resetVariables");
                done();
            }
        } else {
            conversation.keepTurn(true);
            conversation.transition("resetVariables");
            done();
        }
    }
}