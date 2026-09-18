const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
const path = require('path');

// Automatically load .env if present
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
} catch (e) {}

// If not running in real AWS Lambda (where AWS_LAMBDA_FUNCTION_NAME is set), default to local
const isLocal = process.env.IS_LOCAL === 'true' || (!process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.IS_LOCAL !== 'false');
const region = process.env.AWS_REGION || 'ap-south-1';

// Determine LocalStack endpoint based on whether we are in Docker or on host
const endpoint = process.env.AWS_ENDPOINT_URL || (isLocal ? 'http://127.0.0.1:4566' : undefined);

const ddbClientConfig = { region };
const s3ClientConfig = { region };

if (isLocal && endpoint) {
  ddbClientConfig.endpoint = endpoint;
  ddbClientConfig.credentials = { accessKeyId: 'test', secretAccessKey: 'test' };
  
  s3ClientConfig.endpoint = endpoint;
  s3ClientConfig.credentials = { accessKeyId: 'test', secretAccessKey: 'test' };
  s3ClientConfig.forcePathStyle = true;
}

const rawDdb = new DynamoDBClient(ddbClientConfig);
const docClient = DynamoDBDocumentClient.from(rawDdb, {
  marshallOptions: { removeUndefinedValues: true }
});

const s3Client = new S3Client(s3ClientConfig);

// Bedrock Runtime client (uses real AWS credentials and us-east-1 where Claude 3.5 Sonnet is enabled)
const bedrockRegion = process.env.BEDROCK_REGION || 'us-east-1';
const bedrockConfig = { region: bedrockRegion };

const realKey = process.env.REAL_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const realSecret = process.env.REAL_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

if (realKey && realSecret && !realKey.startsWith('test')) {
  bedrockConfig.credentials = {
    accessKeyId: realKey,
    secretAccessKey: realSecret
  };
}

const bedrockClient = new BedrockRuntimeClient(bedrockConfig);

module.exports = {
  docClient,
  s3Client,
  bedrockClient,
  isLocal,
  region
};
