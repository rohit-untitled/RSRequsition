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
        const categoryItems = items.map(item =>
            `<tr><td>${item.CatalogName}</td><td>${item.CategoryName}</td><td>${item.Item}</td></tr>`
        ).join("");

        let categoryTable;
        if (categoryItems.length === 0) {
            categoryTable = "<p style='font-weight: bold; color: red;'>No item categories found.</p>";
        } else {
            categoryTable = `
                <style>
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
                        background: #fff;
                    }
                    th, td {
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    th {
                        background-color: #007bff;
                        color: white;
                        text-transform: uppercase;
                    }
                    tr:hover {
                        background-color: #f1f1f1;
                    }
                    td {
                        color: #333;
                    }
                    @media (max-width: 600px) {
                        table {
                            font-size: 12px;
                        }
                        th, td {
                            padding: 8px;
                        }
                    }
                </style>
                <table>
                    <tr>
                        <th>Catalog Name</th>
                        <th>Category Name</th>
                        <th>Item</th>
                    </tr>
                    ${categoryItems}
                </table>`;
        }

        conversation.variable('categoryList', categoryTable);
        conversation.keepTurn(true);
        conversation.transition("done_procurement");
    } catch (error) {
        conversation.logger().error("Error fetching item categories: ", error);
        conversation.keepTurn(true);
        conversation.transition("resetVariables");
    } finally {
        done();
    }
};
