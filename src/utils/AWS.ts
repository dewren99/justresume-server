import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
});

// s3.createBucket(aws_connection_params, (err, data) => {
//     if (err) console.log('AWS connection error:', err, err.stack);
//     else console.log('Bucket Created Successfully', data.Location);
// });