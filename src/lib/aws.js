const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');

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

// Bedrock Runtime client (always uses real AWS region/credentials unless mocked)
const bedrockClient = new BedrockRuntimeClient({ region });

module.exports = {
  docClient,
  s3Client,
  bedrockClient,
  isLocal,
  region
};
