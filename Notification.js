/*
    Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/asl/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
var AWS = require('aws-sdk');
var sns = new AWS.SNS();

/* Lambda "main": Execution begins here */
exports.handler = function(event, context, callback) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var messageInfo = buildErrorMessage(event.detail.source,event.errorMsg);
    sendSNSNotification(messageInfo.msg, messageInfo.sbj, callback);
}

/*
 * Send an email to an SNS Topic
 */
function buildErrorMessage(volumeid,errorMsg) {
    message = 'An error occurred when managing your snapshots for volumeid: ' +
      volumeid + '. ' +
      'Please check the StepFunctions logs for failures. \n Error message: ' +
      errorMsg.Cause;
    subject = 'Snapshot Management Error';
    return {
        msg: message,
        sbj: subject
    }
}

/*
 * Send an email to an SNS Topic
 */
function sendSNSNotification(message, subject, callback) {
    var params = {
        Message: message, /* required */
            /* anotherKey: ... */
        Subject: subject,
        TopicArn: process.env.notificationTopic
    };
    console.log('Message to publish to SNS:' + message);
    sns.publish(params, function(err, data) {
        if (err) callback(err); // an error occurred
        else     callback(null, data);           // successful response
    });
}
