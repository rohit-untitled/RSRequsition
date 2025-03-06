var URL = require('url').URL;

var requisition = require('./requisition/createRequisition');

module.exports = {
    requisitionAPI: async function (instanceName, userName, requestToken, fusionEnv,categoryId,categoryName, selectedItem, selectedItemDesc, selectedItemPrice, justification, conversation, done) {
        conversation.logger().info("The Fusion Type is ", fusionEnv)
        conversation.logger().info("The selectedItem is ", selectedItem)
        conversation.logger().info("The category id is ", categoryId)
        conversation.logger().info("The category name is ", categoryName)
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
        payload.categoryId = categoryId;
        payload.categoryName = categoryName;
        payload.selectedItem = selectedItem;
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
                var requisition = result.Requisition;
                var requisitionUrl = `https://ehso-dev2.fa.us2.oraclecloud.com/integration/worklistapp/faces/home.jspx`;
                conversation.logger().info("Requisition Response "+ JSON.stringify(requisition));
                conversation.variable('requisitionNumber', requisition);
                conversation.variable('requisitionUrl', requisitionUrl);
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