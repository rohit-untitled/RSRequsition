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
  requisitionPayload.lines[0].Price = headerValues.selectedLaptopAmt;
  requisitionPayload.lines[0].RequestedDeliveryDate = headerValues.RequestedDeliveryDate;
  requisitionPayload.lines[0].DestinationOrganizationId = headerValues.DestinationOrganizationId;
  requisitionPayload.lines[0].DeliverToLocationId = headerValues.DeliverToLocationId;
  requisitionPayload.lines[0].distributions[0].CurrencyAmount = headerValues.Amount;
  requisitionPayload.lines[0].ItemDescription = headerValues.Description;
  // charge account
  requisitionPayload.lines[0].distributions[0].ChargeAccount = headerValues.ChargeAccount;

  conversation.logger().info('Header Payload: ', requisitionPayload);

  let url = instanceURL +"/fscmRestApi/resources/latest/purchaseRequisitions";
  conversation.logger().info('Create Requisition Header URL: ', url);
  let response = axios({
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${requestToken}` ,
      "Content-Type" : "application/vnd.oracle.adf.resourceitem+json"
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

exports.processRequisition = async function(payload, callback, conversation, done) {
  try {
    
    let personDetail = await person.getPerson(payload.instanceName, payload.userName, payload.requestToken, conversation);
    conversation.logger().info('Person Details: ', personDetail);
    let BUPayload = BUPayloadHolder[payload.fusionType]
    requisitionPayload = requisitionPayloadHolder[payload.fusionType]
    let headerValues = {};
    headerValues.RequestedDeliveryDate = payload.deliveryDate;
    headerValues.RequesterId = await personDetail.items[0].PersonId;
    headerValues.PreparerEmail = await personDetail.items[0].WorkEmail;
    headerValues.RequisitioningBU = await personDetail.items[0].assignments.items[0].BusinessUnitName;
    headerValues.DestinationOrganizationId = BUPayload[headerValues.RequisitioningBU]['DestinationOrganizationId'];
    headerValues.DeliverToLocationId = BUPayload[headerValues.RequisitioningBU]['DeliverToLocationId'];
    headerValues.CurrencyCode = BUPayload[headerValues.RequisitioningBU]['CurrencyCode'];
    // headerValues.Amount = BUPayload[headerValues.RequisitioningBU]['Amount'];
    headerValues.Justification = payload.justification;
    headerValues.selectedLaptopAmt = payload.selectedLaptopAmt;
    // headerValues.ItemDescription = payload.selectedLaptopDesc;
    headerValues.Description = payload.selectedLaptopDesc;
    // headerValues.Supplier = BUPayload[headerValues.RequisitioningBU]['Supplier'];
    // headerValues.SupplierSite = BUPayload[headerValues.RequisitioningBU]['SupplierSite'];
    // headerValues.SupplierContact = BUPayload[headerValues.RequisitioningBU]['SupplierContactName'];
    // charge account
    headerValues.ChargeAccount = BUPayload[headerValues.RequisitioningBU]['ChargeAccount'];

    conversation.logger().info('Headers constructed with Person API: ', headerValues);
    
    let reqHeader = await createHeader(headerValues, payload.instanceName, payload.requestToken,conversation);

    conversation.logger().info('Processing requisition submission for Requisition ID: ', reqHeader.Requisition);
    conversation.logger().info('Processing requisition submission : ',reqHeader.RequisitionHeaderId );
    let createReq = await createRequisition(reqHeader.RequisitionHeaderId, payload.instanceName, payload.requestToken,conversation);

    if(createReq.result == 'SUCCESS'){
      callback(conversation, done, reqHeader, 200);
    }
    else {
      callback(conversation, done, null, 500);
    }


  } catch(err) {
    conversation.logger().info(err);
    callback(conversation, done, null, 500);
  }
}