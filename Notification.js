/*
    // Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    // SPDX-License-Identifier: MIT-0.
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
