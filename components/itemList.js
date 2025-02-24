'use strict';
const fetch = require("node-fetch");

module.exports = {
  metadata: {
    name: "ListItems",
    properties: {
      instanceName: { type: "string", required: true },
      username: { type: "string", required: true },
      requestToken: { type: "string", required: true },
      catId: { type: "string", required: true }
    },
    supportedActions: ['success', 'error']
  },

  invoke: async (conversation, done) => {
    const { instanceName, username, requestToken, catId } = conversation.properties();
    
    try {
    //   const apiUrl = `${instanceName}?q=CategoryName=${encodeURIComponent(catId)}`;
    const apiUrl = `${instanceName}?q=CategoryName='${encodeURIComponent(catId)}'`;

      console.log("Fetching items from:", apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${requestToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API response error:", response.status, response.statusText, errorData);
        conversation.transition('error');
        done();
        return;
      }

      const data = await response.json();
      console.log("API response data:", JSON.stringify(data, null, 2));

      if (!data.items || data.items.length === 0) {
        console.warn(`No items found for category: ${catId}`);
        conversation.variable('AllItems', []);
        conversation.transition('success');
        done();
        return;
      }

      const itemList = data.items.map(item => ({
        name: item.Item || "Unknown Item",
        description: item.ItemDescription || "No description available",
        price: item.Price || "50",
      }));

      conversation.variable('AllItems', itemList);
      conversation.transition('success');
    } catch (error) {
      console.error("Error fetching items:", error);
      conversation.transition('error');
    } finally {
      done();
    }
  }
};

