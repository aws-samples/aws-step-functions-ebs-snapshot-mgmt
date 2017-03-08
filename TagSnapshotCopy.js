/*
    Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/asl/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2();

exports.handler = (event, context, callback) => {

    // pull snapshot id
    var snapshotId = event.detail.snapshot_id.substring(event.detail.snapshot_id.indexOf('/') + 1);
    var params = {
      SnapshotIds: [snapshotId]
    };

    console.log(params);
    ec2.describeSnapshots(params, function(err, data) {
      if (err)
      {
          console.log(err, err.stack); // an error occurred
          callback('[ERROR] - Error in Describing Snapshot: ' + snapshotId);
      }
      else
      {
          var snapshot = data.Snapshots[0];
          var description = snapshot.Description;
          var originRegionDataArray = description.split("**");


          /*
            If the description is not formatted: snapshot**volume**region
            then the snapshot did not originate from the Step Function state machine
            in the primary region, so we'll make the assumption it falls outside
            of this backup regimen and skip it
            Format defined in file: CopySnapshotToDR.js
          */
          if(originRegionDataArray.length !=3){
            callback(null, "VOLUME_NOT_TAGGED");
          }
          var originalVolumeId = originRegionDataArray[1];
          var originalRegion = originRegionDataArray[2];
          console.log(originalVolumeId);
          console.log(originalRegion);

         tagSnapshot(event,snapshotId,originalVolumeId, originalRegion, callback);
      }
    });
};

function tagSnapshot(event, snapshotId, originalVolumeId, originalRegion, callback)
{
    var name = originalVolumeId + '_' + event.detail.startTime;
    var tagParams = {
      Resources: [
         snapshotId
      ],
      Tags: [
         {
            Key: "AutomatedSnapName",
            Value: name
         },
         {
            Key: "OriginalVolumeId",
            Value: originalVolumeId
         },
         {
             Key: "OriginalRegion",
             Value: originalRegion
         }
      ]
    };
    console.log(tagParams);
    ec2.createTags(tagParams, function(err, data) {
      if (err)
      {
        console.log("[ERROR]" + err, err.stack); // an error occurred
        callback(err);
      }
      else
      {
        console.log(data);           // successful response
        callback(null, originalVolumeId);
      }
    });
};
