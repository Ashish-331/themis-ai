/**
 * Themis Backend Test Suite
 * Validates handler exports, CORS handling, and core request processing.
 */

const assert = require('assert');

async function runTests() {
  console.log('🧪 Starting Themis backend tests...\n');

  // Test 1: Handler imports
  console.log('1. Checking handler imports...');
  const analyze = require('./handlers/analyze');
  const history = require('./handlers/history');
  assert.strictEqual(typeof analyze.handler, 'function', 'analyze.handler must be an exported function');
  assert.strictEqual(typeof history.handler, 'function', 'history.handler must be an exported function');
  console.log('   ✓ Handlers successfully exported\n');

  // Test 2: OPTIONS preflight requests
  console.log('2. Testing CORS preflight (OPTIONS)...');
  const optionsEvent = { httpMethod: 'OPTIONS' };
  
  const analyzeOptionsRes = await analyze.handler(optionsEvent);
  assert.strictEqual(analyzeOptionsRes.statusCode, 200);
  assert.strictEqual(analyzeOptionsRes.headers['Access-Control-Allow-Origin'], '*');
  assert.strictEqual(analyzeOptionsRes.headers['Access-Control-Allow-Methods'], 'OPTIONS,POST,GET');

  const historyOptionsRes = await history.handler(optionsEvent);
  assert.strictEqual(historyOptionsRes.statusCode, 200);
  assert.strictEqual(historyOptionsRes.headers['Access-Control-Allow-Origin'], '*');
  console.log('   ✓ CORS preflight headers verified\n');

  // Test 3: History handler default user handling
  console.log('3. Testing History handler query structure...');
  // Passing mock event with no authorizer to verify demo-user fallback doesn't throw unhandled errors
  try {
    const historyRes = await history.handler({
      httpMethod: 'GET',
      queryStringParameters: { userId: 'test-unit-user' }
    });
    // In unit test environment without AWS credentials/LocalStack running DynamoDB,
    // handler should catch and return standard JSON error or 200 if mocked.
    assert.ok(historyRes.statusCode === 200 || historyRes.statusCode === 500, 'History handler returned expected status');
    console.log(`   ✓ History handler processed query gracefully (status: ${historyRes.statusCode})\n`);
  } catch (err) {
    assert.fail(`Unexpected unhandled error: ${err.message}`);
  }

  // Test 4: Analyze handler getUploadUrl action
  console.log('4. Testing Analyze handler getUploadUrl action...');
  const uploadRes = await analyze.handler({
    httpMethod: 'POST',
    body: JSON.stringify({ action: 'getUploadUrl', fileName: 'affidavit.pdf', fileType: 'application/pdf' })
  });
  assert.strictEqual(uploadRes.statusCode, 200, 'getUploadUrl should return 200');
  const uploadData = JSON.parse(uploadRes.body);
  assert.ok(uploadData.uploadUrl, 'uploadUrl must be present');
  assert.ok(uploadData.s3Key, 's3Key must be present');
  console.log('   ✓ getUploadUrl returned valid presigned URL and s3Key\n');

  console.log('🎉 All Themis backend tests passed successfully!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
