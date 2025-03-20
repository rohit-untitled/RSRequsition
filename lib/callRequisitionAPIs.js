var URL = require('url').URL;
var log4js = require("log4js");
var logger = log4js.getLogger();
var requisition = require('./requisition/createRequisition');
const SYSTEM_SETTINGS_CONSTANTS = require("../lib/fusion/ApprovalSystemVariableNames.js");
var restUtil = require("../lib/fusion/ibcsRestUtil.js");
var axios = require('axios');

module.exports = {
  requisitionAPI: async function (instanceName, userName, requestToken, fusionEnv, categoryId, categoryName, selectedItem, selectedItemDesc, selectedItemPrice, justification, conversation, done) {
    conversation.logger().info("The Fusion Type is ", fusionEnv);
    conversation.logger().info("The selectedItem is ", selectedItem);
    conversation.logger().info("The category id is ", categoryId);
    conversation.logger().info("The category name is ", categoryName);
    var now = new Date();
    var expiry = now.getMonth() == 11 ? new Date(now.getFullYear() + 1, 0, 1) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
    var deliveryDate = expiry.toISOString().replace('T', ' ').substr(0, 10);
    var payload = {};
    var instanceHostname = new URL(instanceName);
    instanceHostname = instanceHostname.hostname;
    payload.instanceName = "https://" + instanceHostname;
    payload.deliveryDate = deliveryDate;
    payload.requestToken = requestToken;
    payload.userName = userName;
    payload.categoryId = categoryId;
    payload.categoryName = categoryName;
    payload.selectedItem = selectedItem;
    payload.selectedItemDesc = selectedItemDesc;
    payload.selectedItemPrice = selectedItemPrice;
    payload.justification = justification;
    payload.fusionEnv = fusionEnv;
    requisition.processRequisition(payload, this.callback, conversation, done);
  },

  callback: async function (conversation, done, result, status) {
    conversation.logger().info("Final Result ==" + JSON.stringify(result));

    if (result != null) {
      if (status === 200) {
        try {
          var approvalsRestUrl =
            "/bpm/api/4.0/tasks?metadataFlag=true&showActionFlag=true&onlyData=true&offset=0&limit=25&orderBy=assignedDate:desc";

          var restOptions = {
            url: approvalsRestUrl,
            auth: conversation.variable(
              SYSTEM_SETTINGS_CONSTANTS._SYSTEM_CONFIG_DA_FA_IBCS_CONFIG_APPROVALS_AUTH
            ),
            body: null,
            successFunction: (response) => {
              var taskDetails = response.data.items;
              conversation.logger().info("Task Details Response: " + JSON.stringify(taskDetails, null, 2));

              if (taskDetails && taskDetails.length > 0) {
                var fullUrl = "";
                var FARestEndPoint = conversation.variable(SYSTEM_SETTINGS_CONSTANTS._SYSTEM_CONFIG_DA_FA_REST_END_POINT);
                let endpointUrl = FARestEndPoint + "/fscmUI";
                let worklistUrl = FARestEndPoint + "/integration/worklistapp/faces/home.jspx";
                let uri =
                  "/faces/adf.task-flow?" +
                  "adf.tfId=WorklistWrapperTF" +
                  "&" +
                  "adf.tfDoc=/WEB-INF/oracle/apps/fnd/applcore/worklist/view/WorklistWrapperTF.xml";
                let url = endpointUrl + uri;

                let reqNumber = result.Requisition;
                let task = taskDetails.find((element) => element.title.includes(`Requisition ${reqNumber}`));

                // If requisition is not found, check for the previous requisition
                if (!task && reqNumber > 1) {
                  conversation.logger().info(`Requisition ${reqNumber} not found, checking for ${reqNumber - 1}`);
                  task = taskDetails.find((element) => element.title.includes(`Requisition ${reqNumber - 1}`));
                }

                if (task) {
                  conversation.logger().info(`Task found for Requisition: ${task.title}`);

                  if (task.detailsURL && task.detailsURL.href) {
                    fullUrl =
                      url +
                      "&taskDisplayUrl=" +
                      encodeURIComponent(task.detailsURL.href, "UTF-8") +
                      "&taskId=" +
                      task.taskId +
                      "&redirectURL=" +
                      encodeURIComponent(worklistUrl);

                    conversation.logger().info("Requisition URL: " + fullUrl);
                    conversation.variable('requisitionNumber', reqNumber);
                    conversation.variable('requisitionUrl', fullUrl);
                    conversation.keepTurn(true);
                    conversation.transition("done_procurement");
                    done();
                  } else {
                    conversation.logger().error("detailsURL or href is missing in the task details.");
                    conversation.keepTurn(true);
                    conversation.transition("resetVariables");
                    done();
                  }
                } else {
                  conversation.logger().error(`No task found for Requisition: ${reqNumber} or ${reqNumber - 1}`);
                  conversation.keepTurn(true);
                  conversation.transition("resetVariables");
                  done();
                }
              } else {
                conversation.logger().error("No task details found.");
                conversation.keepTurn(true);
                conversation.transition("resetVariables");
                done();
              }
            },
            errorFunction: (err) => {
              conversation.logger().error("Error fetching task details: ", err);
              conversation.keepTurn(true);
              conversation.transition("resetVariables");
              done();
            },
            conversation: conversation,
            done: done,
            method: "GET",
          };

          // Use invokeREST instead of restUtil.get
          restUtil.invokeREST(restOptions);
        } catch (error) {
          conversation.logger().error("Exception in callback: ", error);
          conversation.keepTurn(true);
          conversation.transition("resetVariables");
          done();
        }
      } else {
        conversation.logger().error("Error: Status code " + status);
        conversation.keepTurn(true);
        conversation.transition("resetVariables");
        done();
      }
    }
  },

                                         
// == >> working call back

// callback: async function (conversation, done, result, status) {
    
//     conversation.logger().info("Final Result ==" + JSON.stringify(result));
  
//     if (result != null) {
//       if (status === 200) {
//         try {
//           const fetchTaskDetails = async () => {
//             const url = `${result.instanceName}/bpm/api/4.0/tasks?metadataFlag=true&showActionFlag=true&onlyData=true&offset=0&limit=25&orderBy=assignedDate:desc`;
//             const response = await axios({
//               method: 'GET',
//               headers: {
//                 Authorization: `Bearer ${result.requestToken}`,
//                 "Content-Type": "application/json",
//               },
//               url,
//             });
//             return response.data.items;
//           };
  
//           let taskDetails = await fetchTaskDetails();
//           conversation.logger().info("Initial Task Details Response: " + JSON.stringify(taskDetails, null, 2));
  
//           if (taskDetails && taskDetails.length > 0) {
//             let fullUrl = "";
//             const FARestEndPoint = conversation.variable(SYSTEM_SETTINGS_CONSTANTS._SYSTEM_CONFIG_DA_FA_REST_END_POINT);
//             const endpointUrl = FARestEndPoint + "/fscmUI";
//             const worklistUrl = FARestEndPoint + "/integration/worklistapp/faces/home.jspx";
//             const uri =
//               "/faces/adf.task-flow?" +
//               "adf.tfId=WorklistWrapperTF" +
//               "&" +
//               "adf.tfDoc=/WEB-INF/oracle/apps/fnd/applcore/worklist/view/WorklistWrapperTF.xml";
//             const url = endpointUrl + uri;
  
//             const reqNumber = result.Requisition;
//             let task = null;
//             const startTime = Date.now();
//             const maxWaitTime = 60000; // 55 seconds
  
//             // Keep trying to find the current requisition for up to 55 seconds
//             while (Date.now() - startTime < maxWaitTime) {
//               task = taskDetails.find((element) => element.title.includes(`Requisition ${reqNumber}`));
  
//               if (task) {
//                 break; // Exit the loop if the task is found
//               }
  
//               // Wait for 5 seconds before retrying
//               conversation.logger().info(`Requisition ${reqNumber} not found, retrying in 5 seconds...`);
//               await new Promise((resolve) => setTimeout(resolve, 1000));
  
//               // Fetch task details again
//               taskDetails = await fetchTaskDetails();
//             }
  
//             // If the current requisition is still not found after 55 seconds, check for the previous requisition
//             if (!task && reqNumber > 1) {
//               conversation.logger().info(`Requisition ${reqNumber} not found after 55 seconds, checking for ${reqNumber - 1}`);
//               task = taskDetails.find((element) => element.title.includes(`Requisition ${reqNumber - 1}`));
//             }
  
//             if (task) {
//               conversation.logger().info(`Task found for Requisition: ${task.title}`);
  
//               // Check if detailsURL and href exist
//               if (task.detailsURL && task.detailsURL.href) {
//                 fullUrl =
//                   url +
//                   "&taskDisplayUrl=" +
//                   encodeURIComponent(task.detailsURL.href, "UTF-8") +
//                   "&taskId=" +
//                   task.taskId +
//                   "&redirectURL=" +
//                   encodeURIComponent(worklistUrl);
  
//                 conversation.logger().info("Requisition URL: " + fullUrl);
//                 conversation.variable("requisitionNumber", reqNumber);
//                 conversation.variable("requisitionUrl", fullUrl);
//                 conversation.keepTurn(true);
//                 conversation.transition("done_procurement");
//                 done();
//               } else {
//                 // If detailsURL or href is missing, try to get the previous requisition's detailsURL
//                 if (reqNumber > 1) {
//                   conversation.logger().info(`detailsURL or href is missing for Requisition ${reqNumber}, checking for ${reqNumber - 1}`);
//                   const previousTask = taskDetails.find((element) => element.title.includes(`Requisition ${reqNumber - 1}`));
  
//                   if (previousTask && previousTask.detailsURL && previousTask.detailsURL.href) {
//                     fullUrl =
//                       url +
//                       "&taskDisplayUrl=" +
//                       encodeURIComponent(previousTask.detailsURL.href, "UTF-8") +
//                       "&taskId=" +
//                       previousTask.taskId +
//                       "&redirectURL=" +
//                       encodeURIComponent(worklistUrl);
  
//                     conversation.logger().info("Requisition URL (fallback to previous requisition): " + fullUrl);
//                     conversation.variable("requisitionNumber", reqNumber - 1);
//                     conversation.variable("requisitionUrl", fullUrl);
//                     conversation.keepTurn(true);
//                     conversation.transition("done_procurement");
//                     done();
//                   } else {
//                     conversation.logger().error("detailsURL or href is missing for the previous requisition as well.");
//                     conversation.keepTurn(true);
//                     conversation.transition("resetVariables");
//                     done();
//                   }
//                 } else {
//                   conversation.logger().error("detailsURL or href is missing, and no previous requisition to fall back to.");
//                   conversation.keepTurn(true);
//                   conversation.transition("resetVariables");
//                   done();
//                 }
//               }
//             } else {
//               conversation.logger().error(`No task found for Requisition: ${reqNumber} or ${reqNumber - 1}`);
//               conversation.keepTurn(true);
//               conversation.transition("resetVariables");
//               done();
//             }
//           } else {
//             conversation.logger().error("No task details found.");
//             conversation.keepTurn(true);
//             conversation.transition("resetVariables");
//             done();
//           }
//         } catch (error) {
//           conversation.logger().error("Exception in callback: ", error);
//           conversation.keepTurn(true);
//           conversation.transition("resetVariables");
//           done();
//         }
//       } else {
//         conversation.logger().error("Error: Status code " + status);
//         conversation.keepTurn(true);
//         conversation.transition("resetVariables");
//         done();
//       }
//     }
// },


// == > working code

/*
callback: async function (conversation, done, result, status) {
  conversation.logger().info("Final Result ==" + JSON.stringify(result));

  if (result != null) {
      if (status === 200) {
          try {
              const fetchTaskDetails = async () => {
                  const url = `${result.instanceName}/bpm/api/4.0/tasks?metadataFlag=true&showActionFlag=true&onlyData=true&offset=0&limit=25&orderBy=assignedDate:desc`;
                  const response = await axios({
                      method: 'GET',
                      headers: {
                          Authorization: `Bearer ${result.requestToken}`,
                          "Content-Type": "application/json",
                      },
                      url,
                  });
                  return response.data.items;
              };

              let taskDetails = await fetchTaskDetails();
              conversation.logger().info("Initial Task Details Response: " + JSON.stringify(taskDetails, null, 2));

              const reqNumber = result.Requisition;
              let task = null;
              const startTime = Date.now();
              const maxWaitTime = 40000; 
              const retryInterval = 5000; 

              while (Date.now() - startTime < maxWaitTime) {
                  task = taskDetails.find((element) => element.title.includes(`Requisition ${reqNumber}`));

                  if (task) {
                      break; 
                  }

                  conversation.logger().info(`Requisition ${reqNumber} not found, retrying in 5 seconds...`);
                  await new Promise((resolve) => setTimeout(resolve, retryInterval));

                  // Fetch task details again
                  taskDetails = await fetchTaskDetails();
              }

              // If still not found, return a placeholder response
              if (!task) {
                  conversation.logger().warn(`Requisition ${reqNumber} not found after 45 seconds. Returning fallback response.`);
                  conversation.variable("requisitionNumber", reqNumber);
                  conversation.variable("requisitionUrl", "https://google.com"); 
                  conversation.keepTurn(true);
                  conversation.transition("done_procurement");
                  done();
                  return;
              }

              // Construct the requisition URL
              const FARestEndPoint = conversation.variable(SYSTEM_SETTINGS_CONSTANTS._SYSTEM_CONFIG_DA_FA_REST_END_POINT);
              const endpointUrl = FARestEndPoint + "/fscmUI";
              const worklistUrl = FARestEndPoint + "/integration/worklistapp/faces/home.jspx";
              const uri =
                  "/faces/adf.task-flow?" +
                  "adf.tfId=WorklistWrapperTF" +
                  "&" +
                  "adf.tfDoc=/WEB-INF/oracle/apps/fnd/applcore/worklist/view/WorklistWrapperTF.xml";
              const url = endpointUrl + uri;

              let fullUrl =
                  url +
                  "&taskDisplayUrl=" +
                  encodeURIComponent(task.detailsURL.href, "UTF-8") +
                  "&taskId=" +
                  task.taskId +
                  "&redirectURL=" +
                  encodeURIComponent(worklistUrl);

              conversation.logger().info("Requisition URL: " + fullUrl);
              conversation.variable("requisitionNumber", reqNumber);
              conversation.variable("requisitionUrl", fullUrl);
              conversation.keepTurn(true);
              conversation.transition("done_procurement");
              done();
          } catch (error) {
              conversation.logger().error("Exception in callback: ", error);
              conversation.keepTurn(true);
              conversation.transition("resetVariables");
              done();
          }
      } else {
          conversation.logger().error("Error: Status code " + status);
          conversation.keepTurn(true);
          conversation.transition("resetVariables");
          done();
      }
  }
}
  */

}