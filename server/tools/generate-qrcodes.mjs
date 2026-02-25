import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import QRCode from 'qrcode';

const require = createRequire(import.meta.url);
const { TASK_CATALOG } = require('../config/taskCatalog.js');

const MEETING_QR_CATALOG = [
  {
    kind: 'meeting',
    key: 'emergency',
    label: 'Meeting Emergency',
    qrPayload: 'AMONGREALITY:MEETING:EMERGENCY:KEY:AR-MEETING-001',
  },
  {
    kind: 'meeting',
    key: 'checkin',
    label: 'Meeting Checkin',
    qrPayload: 'AMONGREALITY:MEETING:CHECKIN:KEY:AR-MEETING-CHECKIN-001',
  },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '..', 'qrcodes');

const QR_OPTIONS = {
  margin: 1,
  width: 512,
  errorCorrectionLevel: 'M',
};

async function main() {
  await mkdir(outputDir, { recursive: true });
  const existingFiles = await readdir(outputDir);
  await Promise.all(
    existingFiles
      .filter((fileName) => /\.(png|svg|json)$/i.test(fileName))
      .map((fileName) => unlink(path.join(outputDir, fileName))),
  );

  const manifest = [];
  for (const task of TASK_CATALOG) {
    const pngPath = path.join(outputDir, `${task.taskType}.png`);
    const svgPath = path.join(outputDir, `${task.taskType}.svg`);

    await QRCode.toFile(pngPath, task.qrPayload, QR_OPTIONS);
    const svgContent = await QRCode.toString(task.qrPayload, {
      ...QR_OPTIONS,
      type: 'svg',
    });
    await writeFile(svgPath, svgContent, 'utf8');

    manifest.push({
      kind: 'task',
      taskType: task.taskType,
      legacyTaskId: task.legacyTaskId,
      label: task.label,
      station: task.station,
      qrPayload: task.qrPayload,
      pngFile: path.basename(pngPath),
      svgFile: path.basename(svgPath),
    });
  }

  for (const meetingQr of MEETING_QR_CATALOG) {
    const baseName = `meeting_${meetingQr.key}`;
    const pngPath = path.join(outputDir, `${baseName}.png`);
    const svgPath = path.join(outputDir, `${baseName}.svg`);

    await QRCode.toFile(pngPath, meetingQr.qrPayload, QR_OPTIONS);
    const svgContent = await QRCode.toString(meetingQr.qrPayload, {
      ...QR_OPTIONS,
      type: 'svg',
    });
    await writeFile(svgPath, svgContent, 'utf8');

    manifest.push({
      kind: meetingQr.kind,
      key: meetingQr.key,
      label: meetingQr.label,
      qrPayload: meetingQr.qrPayload,
      pngFile: path.basename(pngPath),
      svgFile: path.basename(svgPath),
    });
  }

  const manifestPath = path.join(outputDir, 'manifest.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`QR codes gerados em ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
