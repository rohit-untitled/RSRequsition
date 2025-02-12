var axios = require('axios');

exports.getPerson =  (instanceURL, userName, requestToken, conversation) => {
    
  var url = instanceURL +"/hcmRestApi/resources/latest/publicWorkers?q=UPPER(Username)='" + userName.toUpperCase() + "'&expand=assignments";
  conversation.logger().info('Get Person URL: ', url);
  let response = axios.get(url, {
    headers: {
      "REST-Framework-Version" : 3,
      Authorization: `Bearer ${requestToken}`
    }
  })
    .then(res => {
      conversation.logger().info('Get Person Success');
      return res.data;
      
    })
    .catch(err => conversation.logger().info('Get Person Error: ', err.response  ));
    
  return response;

};

