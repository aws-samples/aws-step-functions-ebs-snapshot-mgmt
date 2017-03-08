/*
    Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/asl/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
// Sample Lambda function to copy an EBS snapshot to a different region
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2();

exports.handler = (event, context, callback) => {

    //pull the destination region from the environment variables
    var destinationRegion = process.env.destRegion;

    //pull the source region from the source volume-id ->  "arn:aws:ec2::region:volume/volume-id"
    var sourceRegion = event.detail.source.substring(event.detail.source.indexOf('::') + 2);
    sourceRegion = sourceRegion.substring(0,sourceRegion.indexOf(":"));
    console.log("source region: " + sourceRegion);

    // Get the EBS snapshot ID and volume ID from the CloudWatch event details
    var snapshotId = event.detail.snapshot_id.substring(
      event.detail.snapshot_id.indexOf('/') + 1);
    var volumeId = event.detail.source.substring(
      event.detail.source.indexOf('/') + 1)

    //Add information regarding the original volume to the description
    //  so have access to it in DR region
    const description = `${snapshotId}**${volumeId}**${sourceRegion}`;
    console.log ("snapshotId:", snapshotId);

    // Load EC2 class and update the configuration to use destination region
    //  to initiate the snapshot.
    // **Note copySnapshot commands are performed against the destination region
    AWS.config.update({region: destinationRegion});
    var ec2 = new AWS.EC2();

    // Prepare variables for ec2.modifySnapshotAttribute call
    const copySnapshotParams = {
        Description: description,
        DestinationRegion: destinationRegion,
        SourceRegion: sourceRegion,
        SourceSnapshotId: snapshotId
    };

    // Execute the copy snapshot and log any errors
    ec2.copySnapshot(copySnapshotParams, (err, data) => {
        if (err) {
            const errorMessage = `Error copying snapshot ${snapshotId} to region ${destinationRegion}.`;
            console.log(errorMessage);
            console.log(err);
            callback(errorMessage);
        } else {
            const successMessage = `Successfully started copy of snapshot ${snapshotId} to region ${destinationRegion}.`;
            console.log(successMessage);
            console.log(data);
            callback(null, successMessage);
        }
    });
};
