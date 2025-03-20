var axios = require('axios');
var person = require('../person/getPerson');
var BUPayloadHolder = require('./bUPayload.json');
var requisitionPayloadHolder = require('./requisitionPayloadSkleton.json');
var requisitionPayload;

function createHeader(headerValues, instanceURL, requestToken, conversation) {
  conversation.logger().info('Creating Requisition Header');

  requisitionPayload.RequisitioningBU = headerValues.RequisitioningBU;
  requisitionPayload.PreparerEmail = headerValues.PreparerEmail;
  requisitionPayload.PreparerId = headerValues.PreparerId;
  requisitionPayload.Description = headerValues.Description;
  requisitionPayload.Justification = headerValues.Justification;
  requisitionPayload.lines[0].RequesterId = headerValues.RequesterId;
  requisitionPayload.lines[0].CurrencyCode = headerValues.CurrencyCode;
  requisitionPayload.lines[0].Price = headerValues.selectedItemPrice;
  requisitionPayload.lines[0].RequestedDeliveryDate = headerValues.RequestedDeliveryDate;
  requisitionPayload.lines[0].DestinationOrganizationId = headerValues.DestinationOrganizationId;
  requisitionPayload.lines[0].DeliverToLocationId = headerValues.DeliverToLocationId;
  requisitionPayload.lines[0].distributions[0].CurrencyAmount = headerValues.Amount;
  requisitionPayload.lines[0].ItemDescription = headerValues.Description;

  requisitionPayload.lines[0].CategoryId = headerValues.CategoryName;
  requisitionPayload.lines[0].CategoryName = headerValues.CategoryId;
  // charge account
  requisitionPayload.lines[0].distributions[0].ChargeAccount = headerValues.ChargeAccount;

  conversation.logger().info('Header Payload: ', requisitionPayload);
  conversation.logger().info('Header Payload: ', JSON.stringify(requisitionPayload, null, 2));

  let url = instanceURL + "/fscmRestApi/resources/latest/purchaseRequisitions";
  conversation.logger().info('Create Requisition Header URL: ', url);
  let response = axios({
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requestToken}`,
      "Content-Type": "application/vnd.oracle.adf.resourceitem+json"
    },
    data: requisitionPayload,
    url
  })
    .then(res => {
      conversation.logger().info('Create header success!');
      return res.data;
    })
    .catch(err => {
      conversation.logger().error('Create Header Error: ', err.response ? err.response.data : err);
      throw new Error('Failed to create requisition header.');
    });

  return response;
}

async function createRequisition(RequisitionHeaderId, instanceURL, requestToken, conversation) {
  conversation.logger().info('Submitting Requisition. Header ID: ', RequisitionHeaderId);

  const url = `${instanceURL}/fscmRestApi/resources/latest/purchaseRequisitions/${RequisitionHeaderId}`;
  conversation.logger().info('Submit Requisition URL: ', url);

  try {
    const response = await axios({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${requestToken}`,
        "Content-Type": "application/vnd.oracle.adf.action+json"
      },
      data: { "name": "submitRequisition" },
      url
    });

    conversation.logger().info('Submit requisition success!');
    return response.data;
  } catch (err) {
    if (err.response) {
      conversation.logger().info('Submit Requisition Error: ', err.response.data);
    } else {
      conversation.logger().info('Submit Requisition Error: ', err.message);
    }
  }
}

async function fetchTaskDetailsForRequisition(requisitionNumber, instanceURL, requestToken, conversation) {
  conversation.logger().info('Fetching task details for Requisition Number: ', requisitionNumber);

  const url = `${instanceURL}/bpm/api/4.0/tasks`;
  conversation.logger().info('Fetch Task Details URL: ', url);

  try {
    const response = await axios({
      method: 'GET',
      headers: {
        Authorization: `Bearer ${requestToken}`,
        "Content-Type": "application/json"
      },
      url
    });

    if (response.data && response.data.items) {
      const tasks = response.data.items;

      // Find the task that contains the requisition number in the title
      const matchingTask = tasks.find(task => 
        task.title.includes(`Requisition ${requisitionNumber} Approved`)
      );

      if (matchingTask) {
        const taskId = matchingTask.number;  
        const requisitionUrl = `${instanceURL}/fscmRestApi/resources/latest/purchaseRequisitions/${requisitionNumber}`;
        
        conversation.logger().info(`taskId: ${taskId}`);
        conversation.logger().info(`Requisition Details URL: ${requisitionUrl}`);
        return requisitionUrl;
      } else {
        conversation.logger().warn(`No matching task found for Requisition Number: ${requisitionNumber}`);
        return null;
      }
    } else {
      conversation.logger().warn('No tasks found in response.');
      return null;
    }
  } catch (err) {
    conversation.logger().error('Fetch Task Details Error: ', err.response ? err.response.data : err.message);
    throw new Error('Failed to fetch task details.');
  }
}


exports.processRequisition = async function (payload, callback, conversation, done) {
  try {
    // Fetch person details
    let personDetail = await person.getPerson(payload.instanceName, payload.userName, payload.requestToken, conversation);
    conversation.logger().info('Person Details: ', personDetail);

    // Check if personDetail is structured correctly
    if (!personDetail || !personDetail.items || !personDetail.items[0] || !personDetail.items[0].assignments || !personDetail.items[0].assignments.items || !personDetail.items[0].assignments.items[0]) {
      throw new Error('Person details are not structured as expected.');
    }
    let fusionType = "HRZ";
    // Load BUPayload and requisitionPayload
    let BUPayload = BUPayloadHolder[fusionType];
    requisitionPayload = requisitionPayloadHolder[fusionType];

    // Log BUPayload to verify its structure
    conversation.logger().info('BUPayload: ', BUPayload);

    // Construct headerValues
    let headerValues = {};
    headerValues.RequestedDeliveryDate = payload.deliveryDate;
    headerValues.RequesterId = personDetail.items[0].PersonId;
    headerValues.PreparerEmail = personDetail.items[0].WorkEmail;
    headerValues.RequisitioningBU = personDetail.items[0].assignments.items[0].BusinessUnitName;

    // Log the normalized RequisitioningBU
    conversation.logger().info('Normalized RequisitioningBU: ', headerValues.RequisitioningBU);

    // Ensure BUPayload[headerValues.RequisitioningBU] exists
    if (!BUPayload[headerValues.RequisitioningBU]) {
      throw new Error(`Business Unit "${headerValues.RequisitioningBU}" not found in BUPayload.`);
    }

    // Populate headerValues from BUPayload
    headerValues.DestinationOrganizationId = BUPayload[headerValues.RequisitioningBU]['DestinationOrganizationId'];
    headerValues.DeliverToLocationId = BUPayload[headerValues.RequisitioningBU]['DeliverToLocationId'];
    headerValues.CurrencyCode = BUPayload[headerValues.RequisitioningBU]['CurrencyCode'];
    headerValues.Justification = payload.justification;
    headerValues.selectedItemPrice = payload.selectedItemPrice;
    headerValues.Description = payload.selectedItemDesc;
    // categories assignment
    headerValues.CategoryId = payload.categoryId;
    headerValues.CategoryName = payload.categoryName;
    headerValues.ChargeAccount = BUPayload[headerValues.RequisitioningBU]['ChargeAccount'];

    conversation.logger().info('Headers constructed with Person API: ', headerValues);
    conversation.logger().info('Headers constructed with Person API: ', JSON.stringify(headerValues, null, 2));

    // Create requisition header
    let reqHeader = await createHeader(headerValues, payload.instanceName, payload.requestToken, conversation);

    conversation.logger().info('Processing requisition submission for Requisition ID: ', reqHeader.Requisition);
    conversation.logger().info('Processing requisition submission : ', reqHeader.RequisitionHeaderId);

    // Submit requisition
    let createReq = await createRequisition(reqHeader.RequisitionHeaderId, payload.instanceName, payload.requestToken, conversation);

    if (createReq.result == 'SUCCESS') {
      // Fetch task details for the created requisition
      let taskDetails = await fetchTaskDetailsForRequisition(reqHeader.Requisition, payload.instanceName, payload.requestToken, conversation);

      // Pass requisition and task details to the callback
      callback(conversation, done, {
        Requisition: reqHeader.Requisition,
        taskDetails: taskDetails,
        instanceName: payload.instanceName,
        requestToken: payload.requestToken
      }, 200);
    } else {
      callback(conversation, done, null, 500);
    }
  } catch (err) {
    conversation.logger().error('Error in processRequisition: ', err);
    callback(conversation, done, null, 500);
  }
};
