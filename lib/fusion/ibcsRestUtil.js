const axios=require('axios').default;
const util = require('util');
var log4js = require('log4js');
var logger = log4js.getLogger();
const SYSTEM_SETTINGS_CONSTANTS=require("./ApprovalSystemVariableNames.js");

module.exports = {

    /**
    
    Pre Requisites 
    ---------------
    
       This method invoke the REST API's in the Fusion side . Whenever a user invokes an FA Service from a custom component we expect the custom component to follow the following standards :
        <StateName>:
        component: "<Custom Component Name>"
        transitions:
          actions:
            authFail: "<Either authentication state or a state which provides generic security exception>"
            clientError: "<State which gives a generic 400 error message (You could add _restErrorMessage variable to provide details in the state)>"
            serverError: "<State which gives a generic 500>"
          next: "<next state>"
          error: "<Generic Error Handler state>"
     
    To get the error message details, one have to define _restErrorMessage of type string in their bot flow.
    
    Invoking REST Service 
    ----------------------
    
       To invoke a REST Service , one have to require this ibcsRestUtil.js in the custom component js code . Refer to the below sample on how to invoke the code:
    
       var restOptions = {
                                  url:'/fscmRestApi/resources/11.13.18.05/expenses',
                                  body:body,
                      successFunction:  responseFunc,
                                  errorFunction:null,
                      conversation:conversation,
                      done:done ,   
                                  method:'POST'                     
                                }
    
       restUtil.invokeREST(restOptions);
    
    
      url - URL to invoke barring the host and port
      body - body of the REST Call
      successFunction - Method to be called on success
      errorFunction - either null , which case library handles the error or a custom error handler function
      conversation - conversation object
      done - done object
      method - HTTPMethod
    
    **/


    invokeREST: function (params) {
        logger.level = "debug";
        logger.info("inside invokeREST");
        const approvalsLogger = params.conversation.logger();

        //default error handler. This navigates to the correct states corresponding to the error which occured. Its bot metadev's responsibility to handle those errors in a translatable way.

        var defaultErrorHandler = function (err) {
            logger.info("inside error handler");
            var statusCode = err.statusCode;
            logger.error("statusCode in default handler :::" + statusCode);
            logger.error("Error is :: " + err);
            var transfer = 'serverError';
            if (statusCode == 401) transfer = 'authFail';
            if (statusCode == 403) transfer = 'permissionError';
            if (statusCode == 400) transfer = 'clientError';
            approvalsLogger.log("Error message :"+err.message);

            params.conversation.variable('_restErrorMessage', err.message);
            params.conversation.keepTurn(true);
            params.conversation.transition(transfer);
            params.done();
        }

        if (params.errorFunction == 'undefined' || params.errorFunction == null) params.errorFunction = defaultErrorHandler;


        /* function to make sure we include response headers  */

        var _include_headers = function (body, response, resolveWithFullResponse) {
            return {
                'headers': response.headers,
                'data': body
            };
        };

        var FARestEndPoint = '';
        try {
            FARestEndPoint = params.conversation.variable(SYSTEM_SETTINGS_CONSTANTS._SYSTEM_CONFIG_DA_FA_REST_END_POINT);
            if (FARestEndPoint == null || FARestEndPoint == undefined) {
                FARestEndPoint = params.conversation.variable(SYSTEM_SETTINGS_CONSTANTS._SYSTEM_CONFIG_DA_FA_IBCS_CONFIG_HOST) + ':' +
                    params.conversation.variable(SYSTEM_SETTINGS_CONSTANTS._SYSTEM_CONFIG_DA_FA_IBCS_CONFIG_PORT);
            }
        }
        catch (e) {
            FARestEndPoint = params.conversation.variable(SYSTEM_SETTINGS_CONSTANTS._SYSTEM_CONFIG_DA_FA_IBCS_CONFIG_HOST) + ':' +
                params.conversation.variable(SYSTEM_SETTINGS_CONSTANTS._SYSTEM_CONFIG_DA_FA_IBCS_CONFIG_PORT);
        }
        
        var restUrl = params.url;
        approvalsLogger.log("FA Rest End Point :"+FARestEndPoint+" , end point url is "+restUrl);


        if (!restUrl.startsWith("http")) {
            restUrl = FARestEndPoint + restUrl;
        }
        approvalsLogger.log("Final end point url is "+restUrl);

        logger.info(restUrl);


        var tokenFlag = params.conversation.variable('user.authFromToken');
        var authCredentials = params.conversation.variable(SYSTEM_SETTINGS_CONSTANTS._SYSTEM_CONFIG_DA_AUTH_CREDENTIALS);
        var authToken = '';
    logger.info('authFromToken ::'+tokenFlag);
        approvalsLogger.log("authFromToken :"+tokenFlag);
        if (tokenFlag != undefined && tokenFlag != null && tokenFlag == "true") {
            var token = params.conversation.variable('user.oAuthToken');
            approvalsLogger.log("auth token :"+token);
            if (token != undefined && token != null) {
                // logger.info(" component : ibcsRestUtil >>  auth from oAUTH Token ",conversation);                 
                authToken = 'Bearer ' + token;
            }
        }
        else if(authCredentials != undefined && authCredentials != null){
                authToken = authCredentials;
        }else{
                authToken = params.auth;
        }
    logger.info('jwt authToken  ::'+params.conversation.variable('user.oAuthToken'));
    logger.info('authToken ::'+authToken);
        approvalsLogger.log("final auth token :"+authToken);
        //authToken = params.auth;

        var getHeaders = {
            'Content-Type': 'application/json',
            'Authorization': authToken,
            'REST-Framework-Version': '3'
        };

        // construct Header
        var postHeaders = {
            'Content-Type': 'application/json',
            'Authorization': authToken,
            'REST-Framework-Version': '3'
        };


        if (params['Content-Type']) {
            postHeaders['Content-Type'] = params['Content-Type'];
            getHeaders['Content-Type'] = params['Content-Type'];
        }


        var getOptions = {
            url: restUrl, // custom properties file.
            method: params.method,
            headers: postHeaders,
            json: true,
            transform: _include_headers
        };


        var postOptions = {
            url: restUrl, // custom properties file.
            method: params.method,
            headers: postHeaders,
            //  json: true,
            data: params.body,
            gzip: true,
            transform: _include_headers
        };

        var restOptions;
        if (params.method === 'PUT' || params.method === 'POST') {
            postOptions.headers = postHeaders;
            restOptions = postOptions;
            if (postHeaders['Content-Type'] === 'application/json') {
                restOptions['json'] = true;
            }
        } else {
            getOptions.headers = getHeaders;
            restOptions = getOptions;
        }

        approvalsLogger.log("restOptions:::" + JSON.stringify(restOptions));
        
        axios(restOptions)
        .then(params.successFunction)
        .catch(params.errorFunction)
    }
}