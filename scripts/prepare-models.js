const fs = require('fs');
const path = require('path');

const models = [
  ['blazeface-int8.tflite', 'Replace with Apache-2.0 BlazeFace INT8 TFLite model.'],
  ['mobilefacenet-fp16.tflite', 'Replace with MIT MobileFaceNet FP16 TFLite model.'],
  ['antispoof-texture-int8.tflite', 'Replace with lightweight texture liveness INT8 TFLite model.']
];

const modelDir = path.join(process.cwd(), 'models');
fs.mkdirSync(modelDir, { recursive: true });

for (const [fileName, note] of models) {
  const target = path.join(modelDir, `${fileName}.placeholder.txt`);
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, `${note}\nKeep total binary model bundle under 20 MB.\n`);
  }
}

console.log('Model placeholders are ready in ./models');
