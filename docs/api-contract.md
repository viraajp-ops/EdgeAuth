# FaceGuard API Contract

## Local Auth Result

```json
{
  "id": "uuid",
  "userId": "DL-FIELD-1027",
  "matched": true,
  "score": 0.9981,
  "livenessScore": 0.921,
  "modelVersion": "faceguard-mobile-v1.0.0",
  "createdAt": "2026-05-28T14:00:00.000Z",
  "deviceId": "device-id",
  "durationMs": 750
}
```

## Sync Request

```http
POST /faceguard/sync
content-type: application/json
authorization: Bearer <jwt>
```

```json
{
  "records": [
    {
      "queueId": "local-queue-id",
      "userId": "DL-FIELD-1027",
      "score": 0.9981,
      "livenessScore": 0.921,
      "modelVersion": "faceguard-mobile-v1.0.0",
      "createdAt": "2026-05-28T14:00:00.000Z",
      "deviceId": "device-id",
      "durationMs": 750
    }
  ]
}
```

## Sync Response

```json
{
  "acknowledgedIds": ["local-queue-id"],
  "serverAckToken": "signed-ack-token"
}
```

The mobile app purges only records listed in `acknowledgedIds`.
