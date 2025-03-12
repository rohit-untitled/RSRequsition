var fetchItems = require('./fetchItems/fetchItems');

module.exports = {
    itemsList: async function (instanceName, userName, requestToken, catId, fusionEnv, action, conversation, done){
        try{
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

            if (action === "getNextItem") {
                await fetchItems.getNextItems(conversation, done);
            } else if (action === "getPreviousItem") {
                await fetchItems.getPreviousItems(conversation, done);
            } else if (action === "getAllItem") {
                await fetchItems.getAllItems(conversation, done);
            } else {
                await fetchItems.getItemsList(apiUrl, requestToken, catId, conversation, done);
            }
        }
        catch (error) {
            conversation.logger().error("Error in fetching the list: ", error);
            conversation.keepTurn(true);
            conversation.transition("resetVariables");
            done();
        }
    }
};