/*
    Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/asl/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2();

exports.handler = (event, context, callback) => {

    //Pull the list of Snapshots from the event
    var snapshots = event.snapshotList.Snapshots;

    /*
    Need to ensure the list of snapshots are sorted by date in descending order

    return positive number is a is older than b
    return negative if a is more recent than b
    return 0 if equivalent
    */
    snapshots.sort(function(a, b) {
      var dateA = new Date(a.StartTime); //convert to date
      var dateB = new Date(b.StartTime); // convert to date
      if (dateA < dateB) {
        return 1;
      }
      if (dateA > dateB) {
        return -1;
      }

      // dates must be equal
      console.log("[WARN] - Snapshot dates are equal - may be issue with snapshot creation");
      return 0;
    });

    var numSnapshotsDeleted = 0;
    var retention = parseInt(process.env.retentionPeriod);
    var deletedSnapshots = [];

    if((retention - event.snapshotList.numSnapshots) < 0)
    {
        //Snapshots are sorted in descending order
        var snapshotsToDelete = snapshots.slice(retention - event.snapshotList.numSnapshots);
        console.log("Snapshots to Delete: " + JSON.stringify(snapshotsToDelete));

        //delete the snapshots
        snapshotsToDelete.forEach(function(snapshot) {
            var params = {
                SnapshotId: snapshot.SnapshotId
            };
            console.log("deleting snapshot:" + snapshot.SnapshotId);
            deletedSnapshots.push(ec2.deleteSnapshot(params).promise());
        });

        Promise.all(deletedSnapshots).then(values => {
          console.log("Number of deleted snapshots: " + values.length);
          callback(null, values.length);
        }, reason => {
          console.log("[ERROR] - Error Deleting snapshot");
          callback("[ERROR]-Error Deleting snapshot");
        });
    }
    else
    {
        //you shouldn't be here!
        var msg = "[ERROR] - You shouldn't be here, check that your retention " +
         "period defined in the environment variable matches the value for the retention defined in your state machine.";
        console.log(msg);
        callback(msg);
    }
};
