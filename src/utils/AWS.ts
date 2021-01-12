import AWS from 'aws-sdk';

const AWS_ID = 'AKIAJMCZWVAVPNXT352Q';
const AWS_SECRET = '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';
const AWS_BUCKET_NAME = 'justresume';

const aws_connection_params = {
    Bucket: AWS_BUCKET_NAME,
    CreateBucketConfiguration: {
        LocationConstraint: "us-west-2",
    }
};

export const s3 = new AWS.S3({
    accessKeyId: AWS_ID,
    secretAccessKey: AWS_SECRET
});

// s3.createBucket(aws_connection_params, (err, data) => {
//     if (err) console.log('AWS connection error:', err, err.stack);
//     else console.log('Bucket Created Successfully', data.Location);
// });