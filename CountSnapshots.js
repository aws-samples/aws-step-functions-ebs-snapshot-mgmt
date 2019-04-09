/*
    // Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    // SPDX-License-Identifier: MIT-0.
*/
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2();

exports.handler = (event, context, callback) => {

  console.log(JSON.stringify(event));

  //Pull the volume id from the request
  var volume_id = event.originalVolumeId;

  console.log("volumeId: " + volume_id);
  var params = {
    Filters: [
      {
        Name: 'tag:OriginalVolumeId',
        Values: [
          volume_id
        ]
      },
      {
        Name: "tag-key",
        Values: [
          "AutomatedSnapName"
        ]
      }
    ]
  };

  var numSnapshots;

  console.log("describeSnapshots parameters: " + params);
  ec2.describeSnapshots(params, function(err, data) {
    if (err)
    {
        console.log(err, err.stack); // an error occurred
        callback('Error in Finding Number of Snapshots');
    }
    else
    {
        numSnapshots = data.Snapshots.length;
        console.log("Number of snapshots found = " + numSnapshots);
        data.numSnapshots = numSnapshots;

        //return the list of snapshots and the number of snapshots
        callback(null, data);
    }
  });
};
