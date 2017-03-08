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

    var volumeId = event.detail.source.substring(event.detail.source.indexOf('/') + 1);
    var snapshotId = event.detail.snapshot_id.substring(event.detail.snapshot_id.indexOf('/') + 1);
    var name = volumeId + '_' + event.detail.startTime;

    console.log('volume Id: ' + volumeId);
    console.log('snapshot Id: ' + snapshotId);

    var params = {
        Resources: [
            snapshotId
        ],
        Tags: [{
                Key: "AutomatedSnapName",
                Value: name
            },
            {
                Key: "OriginalVolumeId",
                Value: volumeId
            }
        ]
    };

    determineValidTags(volumeId, callback, function() {
        ec2.createTags(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                callback(err);
            } else {
                console.log(data); // successful response
                callback(null, volumeId);
            }
        });
    });
};

function determineValidTags(volumeId, lambdaCallback, callback) {

    /*
      If a tagKey environment variable exists, then that indicates we should
      only perform the backup procedures on snapshots with that tagKey
    */
    var tagToInclude = process.env.tagKey;
    if (tagToInclude != null && tagToInclude != "none") {
        //Pull the description of the volume
        var params = {
            VolumeIds: [volumeId],
            Filters: [{
                Name: "tag-key",
                Values: [
                    tagToInclude
                ]
            }]
        };

        console.log("describeVolumes parameters: " + params);
        ec2.describeVolumes(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                lambdaCallback('Error in Finding Original Volume details for: ' + volumeId);
            } else {
                var numVolumes = data.Volumes.length;
                console.log("Number of volumes found = " + numVolumes);

                // This indicates that the tagKey environment variable was specified
                //  AND the current snapshot did NOT originate from a volume that contained
                //  that tag, so we will move on
                if (numVolumes == 0) {
                    console.log("The volume does not contain the specified tag: " + tagToInclude +
                        ".  Exiting the function.");
                    lambdaCallback(null, "VOLUME_NOT_TAGGED");
                }

                callback();
            }
        });
    }
    else {
      callback();
    }
};
