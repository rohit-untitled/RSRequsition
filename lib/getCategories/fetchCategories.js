// const fetch = require("node-fetch");

// exports.getItemCategories = async function (apiUrl, requestToken, conversation, done) {
//     try {
//         const response = await fetch(apiUrl, {
//             method: 'GET',
//             headers: {
//                 'Authorization': `Bearer ${requestToken}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
//         }

//         const data = await response.json();
//         conversation.logger().info("API response data: " + JSON.stringify(data, null, 2));

//         const items = data.items || [];
//         const categoryList = [];

//         // Store category names and IDs as a list of objects
//         items.forEach(item => {
//             if (!categoryList.some(cat => cat.CategoryName === item.CategoryName)) {
//                 categoryList.push({
//                     CategoryName: item.CategoryName,
//                     CategoryId: item.CategoryId
//                 });
//             }
//         });

//         // Store the single list of objects
//         conversation.variable('categoryList', categoryList);

//         conversation.keepTurn(true);
//         conversation.transition("displayCategoryList");

//     } catch (error) {
//         conversation.logger().error("Error fetching item categories: ", error);
//         conversation.keepTurn(true);
//         conversation.transition("showError");
//     } finally {
//         done();
//     }
// };

// -> working 


const fetch = require("node-fetch");

exports.getItemCategories = async function (apiUrl, requestToken, conversation, done) {
    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${requestToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
            conversation.transition('error');
            done();
            return;
        }

        const data = await response.json();
        conversation.logger().info("API response data: " + JSON.stringify(data, null, 2));

        const items = data.items || [];
        const categoryList = [];

        items.forEach((item) => {
            if (!categoryList.some((cat) => cat.CategoryName === item.CategoryName)) {
                categoryList.push({
                    CategoryName: item.CategoryName,
                    CategoryId: item.CategoryId,
                });
            }
        });

        if (categoryList.length === 0) {
            throw new Error("No categories found.");
        }

        // Store full category list in memory
        conversation.variable("fullCategoryList", categoryList);

        // Set initial pagination index
        conversation.variable("categoryIndex", 0);

        // Send only the first 3 categories initially
        conversation.variable("categoryList", categoryList.slice(0, 3));

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

exports.getNextCategories = async function (conversation, done) {
    try {
        const fullCategoryList = conversation.variable("fullCategoryList") || [];
        let categoryIndex = conversation.variable("categoryIndex") || 0;

        // Increment index BEFORE slicing to ensure next categories are fetched immediately
        categoryIndex += 3;

        if (categoryIndex >= fullCategoryList.length) {
            categoryIndex = 0; // Reset to start if out of range
        }

        const nextCategories = fullCategoryList.slice(categoryIndex, categoryIndex + 3);

        conversation.variable("categoryList", nextCategories);

        // Save updated index for next pagination
        conversation.variable("categoryIndex", categoryIndex);

        conversation.keepTurn(true);
        conversation.transition("displayCategoryList");
    } catch (error) {
        conversation.logger().error("Error fetching next categories: ", error);
        conversation.keepTurn(true);
        conversation.transition("showError");
    } finally {
        done();
    }
};


// Function to fetch the previous set of categories
exports.getPreviousCategories = async function (conversation, done) {
    try {
        const fullCategoryList = conversation.variable("fullCategoryList") || [];
        let categoryIndex = conversation.variable("categoryIndex") || 3;

        // Move back 3 categories, but don't go below 0
        categoryIndex = Math.max(categoryIndex - 6, 0);

        const prevCategories = fullCategoryList.slice(categoryIndex, categoryIndex + 3);
        conversation.variable("categoryList", prevCategories);

        // Update index for the next pagination
        conversation.variable("categoryIndex", categoryIndex + 3);

        conversation.keepTurn(true);
        conversation.transition("displayCategoryList");
    } catch (error) {
        conversation.logger().error("Error fetching previous categories: ", error);
        conversation.keepTurn(true);
        conversation.transition("showError");
    } finally {
        done();
    }
};

// Function to fetch all categories at once
exports.getAllCategories = async function (conversation, done) {
    try {
        const fullCategoryList = conversation.variable("fullCategoryList") || [];

        conversation.variable("categoryList", fullCategoryList);

        conversation.keepTurn(true);
        conversation.transition("displayCategoryList");
    } catch (error) {
        conversation.logger().error("Error fetching all categories: ", error);
        conversation.keepTurn(true);
        conversation.transition("showError");
    } finally {
        done();
    }
};
