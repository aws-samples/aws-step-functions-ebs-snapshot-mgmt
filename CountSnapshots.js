/*
    Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/asl/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
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
