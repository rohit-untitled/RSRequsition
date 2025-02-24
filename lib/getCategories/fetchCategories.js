const fetch = require("node-fetch");

exports.getItemCategories = async function (apiUrl, requestToken, conversation, done) {
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${requestToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
        }

        const data = await response.json();
        conversation.logger().info("API response data: " + JSON.stringify(data, null, 2));

        const items = data.items || [];
        const categoryList = [];

        // Store category names and IDs as a list of objects
        items.forEach(item => {
            if (!categoryList.some(cat => cat.CategoryName === item.CategoryName)) {
                categoryList.push({
                    CategoryName: item.CategoryName,
                    CategoryId: item.CategoryId
                });
            }
        });

        // Store the single list of objects
        conversation.variable('categoryList', categoryList);

        conversation.keepTurn(true);
        conversation.transition("displayCategoryList");

    } catch (error) {
        conversation.logger().error("Error fetching item categories: ", error);
        conversation.keepTurn(true);
        conversation.transition("showError");
    } finally {
        done();
    }
};
