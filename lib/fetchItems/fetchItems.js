// const fetch = require("node-fetch");

// exports.getItemsList = async function (apiUrl, requestToken, catId, conversation, done) {

//     // const apiUrl = `${instanceName}?q=CategoryName='${encodeURIComponent(catId)}'`;
//     const queryUrl = `${apiUrl}?q=CategoryName='${encodeURIComponent(catId)}'`;
//     console.log("Fetching items from:", queryUrl);
//     try {
//         const response = await fetch(queryUrl, {
//             method: "GET",
//             headers: {
//                 Authorization: `Bearer ${requestToken}`,
//                 "Content-Type": "application/json",
//             },
//         });

//         if (!response.ok) {
//             const errorData = await response.json().catch(() => ({}));
//             console.error("API response error:", response.status, response.statusText, errorData);
//             conversation.transition('error');
//             done();
//             return;
//           }

//           const data = await response.json();
//           conversation.logger().info("API response data: " + JSON.stringify(data, null, 2));

//           const items = data.items || [];
//           const itemLists = [];


//           items.forEach((item) => {
//             if(!itemLists.some((it) => it.Item === item.Item)){
//                 itemList.push({
//                     Item: item.Item,
//                     ItemDescription: item.ItemDescription,
//                     price: item.Price ? String(item.Price) : "50",
//                 });
//             }
//           });

//           if(itemLists.length === 0){
//             throw new Error("No items found for the particular categpry");
//           }

//           // store full item list in memory
//           conversation.variable("fullItemList", itemLists);

//           // sets initial pagination index
//           conversation.variable("itemIndex", 0);

//           // send only the first 3 items initially
//           conversation.variable("itemList", itemList.slice(0, 3));

//           conversation.keepTurn(true);
//           conversation.transition("displayItemList");

//           if (!data.items || data.items.length === 0) {
//             console.warn(`No items found for category: ${catId}`);
//             conversation.variable('AllItems', []);
//             conversation.transition('success');
//             done();
//             return;
//           }

//           const itemList = data.items.map(item => ({
//             name: item.Item || "Unknown Item",
//             description: item.ItemDescription || "No description available",
//             price: item.Price ? String(item.Price) : "50",
    
//           }));
//           console.log("Final itemList:", JSON.stringify(itemList, null, 2));
//           conversation.variable('AllItems', itemList);
//           conversation.transition('success');

//         } catch (error) {
//             console.error("Error fetching items:", error);
//             conversation.transition('error');
//           } finally {
//             done();
//           }

// };

// exports.getNextItems = async function (conversation, done) {
//     try {
//         const fullCategoryList = conversation.variable("fullCategoryList") || [];
//         let categoryIndex = conversation.variable("categoryIndex") || 0;

//         // Increment index BEFORE slicing to ensure next categories are fetched immediately
//         categoryIndex += 3;

//         if (categoryIndex >= fullCategoryList.length) {
//             categoryIndex = 0; // Reset to start if out of range
//         }

//         const nextCategories = fullCategoryList.slice(categoryIndex, categoryIndex + 3);

//         conversation.variable("categoryList", nextCategories);

//         // Save updated index for next pagination
//         conversation.variable("categoryIndex", categoryIndex);

//         conversation.keepTurn(true);
//         conversation.transition("displayCategoryList");
//     } catch (error) {
//         conversation.logger().error("Error fetching next categories: ", error);
//         conversation.keepTurn(true);
//         conversation.transition("showError");
//     } finally {
//         done();
//     }
// };


// // Function to fetch the previous set of categories
// exports.getPreviousItems = async function (conversation, done) {
//     try {
//         const fullCategoryList = conversation.variable("fullCategoryList") || [];
//         let categoryIndex = conversation.variable("categoryIndex") || 3;

//         // Move back 3 categories, but don't go below 0
//         categoryIndex = Math.max(categoryIndex - 6, 0);

//         const prevCategories = fullCategoryList.slice(categoryIndex, categoryIndex + 3);
//         conversation.variable("categoryList", prevCategories);

//         // Update index for the next pagination
//         conversation.variable("categoryIndex", categoryIndex + 3);

//         conversation.keepTurn(true);
//         conversation.transition("displayCategoryList");
//     } catch (error) {
//         conversation.logger().error("Error fetching previous categories: ", error);
//         conversation.keepTurn(true);
//         conversation.transition("showError");
//     } finally {
//         done();
//     }
// };

// // Function to fetch all categories at once
// exports.getAllItems = async function (conversation, done) {
//     try {
//         const fullCategoryList = conversation.variable("fullCategoryList") || [];

//         conversation.variable("categoryList", fullCategoryList);

//         conversation.keepTurn(true);
//         conversation.transition("displayCategoryList");
//     } catch (error) {
//         conversation.logger().error("Error fetching all categories: ", error);
//         conversation.keepTurn(true);
//         conversation.transition("showError");
//     } finally {
//         done();
//     }
// };




const fetch = require("node-fetch");

exports.getItemsList = async function (apiUrl, requestToken, catId, conversation, done) {

    // const apiUrl = `${instanceName}?q=CategoryName='${encodeURIComponent(catId)}'`;
    const queryUrl = `${apiUrl}?q=CategoryName='${encodeURIComponent(catId)}'`;
    console.log("Fetching items from:", queryUrl);
    try {
        const response = await fetch(queryUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${requestToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("API response error:", response.status, response.statusText, errorData);
            conversation.transition('error');
            done();
            return;
          }

          const data = await response.json();
          conversation.logger().info("API response data: " + JSON.stringify(data, null, 2));

          const items = data.items || [];
          const itemLists = [];


          items.forEach((item) => {
            if(!itemLists.some((it) => it.Item === item.Item)){
                itemLists.push({
                    name: item.Item,
                    description: item.ItemDescription,
                    price: item.Price ? String(item.Price) : "50",
                });
            }
          });

          if(itemLists.length === 0){
            throw new Error("No items found for the particular category");
          }

          // store full item list in memory
          conversation.variable("fullItemList", itemLists);

          // sets initial pagination index
          conversation.variable("itemIndex", 0);

          // send only the first 3 items initially
          conversation.variable("itemLists", itemLists.slice(0, 3));

          conversation.keepTurn(true);
          conversation.transition("displayItemList");

        //   if (!data.items || data.items.length === 0) {
        //     console.warn(`No items found for category: ${catId}`);
        //     conversation.variable('AllItems', []);
        //     conversation.transition('success');
        //     done();
        //     return;
        //   }

        //   const itemList = data.items.map(item => ({
        //     name: item.Item || "Unknown Item",
        //     description: item.ItemDescription || "No description available",
        //     price: item.Price ? String(item.Price) : "50",
    
        //   }));
        //   console.log("Final itemList:", JSON.stringify(itemList, null, 2));
        //   conversation.variable('AllItems', itemList);
        //   conversation.transition('success');

        } catch (error) {
            console.error("Error fetching items:", error);
            conversation.keepTurn(true);
            conversation.transition('showError');
          } finally {
            done();
          }

};

exports.getNextItems = async function (conversation, done) {
  try{
    const fullItemList = conversation.variable("fullItemList") || [];
    let itemIndex = conversation.variable("itemIndex") || 0;

    // increment index before slicing
    itemIndex += 3;

    if(itemIndex >= fullItemList.length){
      itemIndex = 0;
    }
    const nextItems = fullItemList.slice(itemIndex, itemIndex+3);

    conversation.variable("itemLists", nextItems);

    // save updated index for next pagination
    conversation.variable("itemIndex", itemIndex);
    conversation.keepTurn(true);
    conversation.transition("displayItemList");
  } catch (error) {
    conversation.logger().error("Error fetching next categories: ", error);
    conversation.keepTurn(true);
    conversation.transition("showError");
  } finally {
      done();
  }

};


// Function to fetch the previous set of categories
exports.getPreviousItems = async function (conversation, done) {
  try{
    const fullItemList = conversation.variable("fullItemList") || [];
    let itemIndex = conversation.variable("itemIndex") || 3;

    // Move back 3 items, but don't go below 0
    itemIndex = Math.max(itemIndex - 6, 0);

    const prevItems = fullItemList.slice(itemIndex, itemIndex + 3);
    conversation.variable("itemLists", prevItems);

    // update index for the next pagination
    conversation.variable("itemIndex", itemIndex+3);

    conversation.keepTurn(true);
    conversation.transition("displayItemList");
  } catch (error) {
    conversation.logger().error("Error fetching previous items: ", error);
    conversation.keepTurn(true);
    conversation.transition("showError");
  } finally {
      done();
  }
};

// Function to fetch all items at once
exports.getAllItems = async function (conversation, done) {
  try{
    const fullItemList = conversation.variable("fullItemList") || [];

    conversation.variable("itemLists", fullItemList);
    conversation.keepTurn(true);
    conversation.transition("displayItemList");
  } catch (error) {
    conversation.logger().error("Error fetching all items: ", error);
    conversation.keepTurn(true);
    conversation.transition("showError");
  } finally {
      done();
  }
};
