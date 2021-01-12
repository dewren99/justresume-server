import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const AWS_ID = process.env.AWS_ID;
const AWS_SECRET = process.env.AWS_SECRET;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

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