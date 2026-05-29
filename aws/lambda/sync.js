const { DynamoDBClient, BatchWriteItemCommand } = require('@aws-sdk/client-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME;

exports.handler = async event => {
  const body = JSON.parse(event.body || '{}');
  const records = Array.isArray(body.records) ? body.records : [];

  if (records.length === 0) {
    return response(400, { message: 'No records supplied.' });
  }

  const acknowledgedIds = records.map(record => record.queueId).filter(Boolean);
  const requestItems = records.map(record => ({
    PutRequest: {
      Item: {
        userId: { S: record.userId },
        createdAt: { S: record.createdAt },
        queueId: { S: record.queueId },
        score: { N: String(record.score) },
        livenessScore: { N: String(record.livenessScore) },
        modelVersion: { S: record.modelVersion },
        deviceId: { S: record.deviceId },
        durationMs: { N: String(record.durationMs) }
      }
    }
  }));

  await client.send(
    new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: requestItems
      }
    })
  );

  return response(200, {
    acknowledgedIds,
    serverAckToken: crypto.createHash('sha256').update(acknowledgedIds.join(':')).digest('hex')
  });
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  };
}
