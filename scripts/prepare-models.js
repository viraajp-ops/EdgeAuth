const fs = require('fs');
const path = require('path');
const https = require('https');

const models = [
  {
    name: 'blazeface-int8.tflite',
    url: 'https://storage.googleapis.com/mediapipe-assets/face_detection_short_range.tflite'
  },
  {
    name: 'mobilefacenet-fp16.tflite',
    url: 'https://raw.githubusercontent.com/syaringan357/Android-MobileFaceNet-MTCNN-FaceAntiSpoofing/master/app/src/main/assets/MobileFaceNet.tflite'
  }
];

const modelDir = path.join(process.cwd(), 'models');
fs.mkdirSync(modelDir, { recursive: true });

async function downloadModel(name, url) {
  const target = path.join(modelDir, name);

  if (fs.existsSync(target)) {
    if (isValidTflite(target)) {
      console.log(`✅ ${name} already exists.`);
      return;
    }
    console.log(`⚠️  ${name} exists but is not a valid TFLite file. Re-downloading...`);
    fs.unlinkSync(target);
  }

  console.log(`⏳ Downloading ${name}...`);

  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(target);
    const request = https.get(url, response => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlink(target, () => {});
        downloadModel(name, response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.destroy();
        fs.unlink(target, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    });
    request.on('error', err => {
      file.close();
      fs.unlink(target, () => {});
      reject(err);
    });
  });

  if (!isValidTflite(target)) {
    fs.unlinkSync(target);
    throw new Error(`${name} did not pass TFLite validation.`);
  }
}

function isValidTflite(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const stat = fs.statSync(filePath);
  if (stat.size < 1024) {
    return false;
  }
  const bytes = fs.readFileSync(filePath);
  return bytes.includes(Buffer.from('TFL3'));
}

async function run() {
  console.log('Fetching TFLite binaries for BlazeFace + MobileFaceNet...');
  let failed = false;
  for (const model of models) {
    try {
      await downloadModel(model.name, model.url);
    } catch (error) {
      failed = true;
      console.error(`❌ Failed to download ${model.name}:`, error.message);
    }
  }

  if (failed) {
    console.log('\nSome models failed. The app will fall back to photo-based inference until models are present.');
    process.exit(1);
  }

  console.log('\n🎉 Models downloaded successfully. Rebuild the dev client (expo run:ios/android).');
}

run();
