var URL = require('url').URL;
var fetchCategories = require('./getCategories/fetchCategories');

module.exports = {
    procurementCBAPI: async function (instanceName, userName, requestToken, fusionEnv, conversation, done) {
        try {
            var now = new Date();
            var expiry = now.getMonth() == 11 ? new Date(now.getFullYear() + 1, 0, 1) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
            var deliveryDate = expiry.toISOString().replace('T', ' ').substr(0, 10);

            conversation.logger().info("deliveryDate ==>" + deliveryDate);
            conversation.logger().info("fusion environment ==>" + fusionEnv);

            var apiUrl = instanceName;

            let payload = {
                instanceName: instanceName,
                deliveryDate: deliveryDate,
                requestToken: requestToken,
                userName: userName
            };

   
            await fetchCategories.getItemCategories(apiUrl, requestToken, conversation, done);
        } catch (error) {
            conversation.logger().error("Error in procurementCBAPI: ", error);
            conversation.keepTurn(true);
            conversation.transition("resetVariables");
            done();
        }
    }
};
