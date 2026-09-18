const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, isLocal } = require('../lib/aws');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET'
};

exports.handler = async (event) => {
  console.log('History Handler received event:', JSON.stringify(event));

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const userId = event.requestContext?.authorizer?.claims?.sub || 
                   (isLocal ? (queryParams.userId || 'demo-user') : null);

    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized: missing user identity' })
      };
    }

    const tableName = process.env.DOCUMENTS_TABLE || 'themis-documents';

    // Query DynamoDB: PK = USER#<sub/userId> AND SK begins_with DOC#
    // ScanIndexForward: false returns newest items first natively via ISO8601 prefix
    const result = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk and begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'DOC#'
      },
      ScanIndexForward: false
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        userId,
        count: result.Count || 0,
        documents: result.Items || []
      })
    };

  } catch (error) {
    console.error('Error in history handler:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to fetch document history',
        details: error.message
      })
    };
  }
};
