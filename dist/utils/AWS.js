"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3 = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const AWS_ID = 'AKIAJMCZWVAVPNXT352Q';
const AWS_SECRET = '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';
const AWS_BUCKET_NAME = 'justresume';
const aws_connection_params = {
    Bucket: AWS_BUCKET_NAME,
    CreateBucketConfiguration: {
        LocationConstraint: "us-west-2",
    }
};
exports.s3 = new aws_sdk_1.default.S3({
    accessKeyId: AWS_ID,
    secretAccessKey: AWS_SECRET
});
//# sourceMappingURL=AWS.js.map