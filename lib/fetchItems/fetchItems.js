const fetch = require("node-fetch");
const NO_IMAGE  = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/300px-No_image_available.svg.png";

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
                    image: item.ImageUrl || NO_IMAGE,
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
