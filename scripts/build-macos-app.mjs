#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function parseCliArgs(argv) {
  let outDir = path.join(repoRoot, 'dist-desktop');
  let asJson = false;
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out' && argv[i + 1]) {
      outDir = path.resolve(argv[i + 1]);
      i += 1;
    } else if (arg === '--json') {
      asJson = true;
    }
  }
  return { outDir, asJson };
}

// IEEE 802.3 CRC32 for PNG chunk generation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function pointToSegmentDistance(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const lenSq = vx * vx + vy * vy;
  const t = lenSq > 0 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / lenSq)) : 0;
  const dx = px - (ax + t * vx);
  const dy = py - (ay + t * vy);
  return Math.hypot(dx, dy);
}

/**
 * Generates a clean 1024x1024 Aimake macOS squircle icon PNG with zero external assets.
 */
function renderAimakeMasterIconPng(size = 1024) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);

  const pad = size * 0.088;
  const half = size / 2;
  const boxHalf = half - pad;
  const cornerRadius = size * 0.225;

  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * stride;
    raw[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < size; x += 1) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Signed distance to rounded rectangle
      const qx = Math.abs(x + 0.5 - half) - (boxHalf - cornerRadius);
      const qy = Math.abs(y + 0.5 - half) - (boxHalf - cornerRadius);
      const outsideDist =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
        Math.min(Math.max(qx, qy), 0) -
        cornerRadius;

      if (outsideDist > 1.2) {
        raw[pxOffset] = 0;
        raw[pxOffset + 1] = 0;
        raw[pxOffset + 2] = 0;
        raw[pxOffset + 3] = 0;
        continue;
      }

      const edgeAlpha = outsideDist <= -0.8 ? 1 : Math.max(0, Math.min(1, (1.2 - outsideDist) / 2.0));
      const nx = x / size;
      const ny = y / size;

      // Press-cobalt gradient background (#2B6BE6 -> #15347A) with subtle inner rim
      const grad = Math.min(1, Math.max(0, nx * 0.35 + ny * 0.75));
      let r = Math.round(47 * (1 - grad) + 20 * grad);
      let g = Math.round(112 * (1 - grad) + 50 * grad);
      let b = Math.round(234 * (1 - grad) + 124 * grad);

      // Subtle inner border highlight
      if (outsideDist > -6.0 && outsideDist <= -0.8) {
        r = Math.min(255, r + 28);
        g = Math.min(255, g + 34);
        b = Math.min(255, b + 40);
      }

      // Geometric "A" monogram strokes (normalized coordinates)
      const strokeRadius = 0.044;
      const dLeft = pointToSegmentDistance(nx, ny, 0.5, 0.255, 0.295, 0.745);
      const dRight = pointToSegmentDistance(nx, ny, 0.5, 0.255, 0.705, 0.745);
      const dBar = pointToSegmentDistance(nx, ny, 0.365, 0.585, 0.635, 0.585);
      const dGlyph = Math.min(dLeft, dRight, dBar);

      if (dGlyph < strokeRadius + 0.004) {
        const glyphBlend =
          dGlyph <= strokeRadius - 0.002
            ? 1
            : Math.max(0, Math.min(1, (strokeRadius + 0.004 - dGlyph) / 0.006));
        r = Math.round(r * (1 - glyphBlend) + 244 * glyphBlend);
        g = Math.round(g * (1 - glyphBlend) + 246 * glyphBlend);
        b = Math.round(b * (1 - glyphBlend) + 250 * glyphBlend);
      }

      // Warm ochre press registration dot (#D98A2B) at bottom-right of monogram
      const dDot = Math.hypot(nx - 0.755, ny - 0.265);
      const dotRadius = 0.042;
      if (dDot < dotRadius + 0.004) {
        const dotBlend =
          dDot <= dotRadius - 0.002
            ? 1
            : Math.max(0, Math.min(1, (dotRadius + 0.004 - dDot) / 0.006));
        r = Math.round(r * (1 - dotBlend) + 217 * dotBlend);
        g = Math.round(g * (1 - dotBlend) + 138 * dotBlend);
        b = Math.round(b * (1 - dotBlend) + 43 * dotBlend);
      }

      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = Math.round(edgeAlpha * 255);
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Applies a macOS HIG squircle crop/inset mask (when corners are opaque) and
 * resizes a custom master icon PNG cleanly to 1024x1024 RGBA via AppKit/CoreGraphics.
 */
async function prepareSquircleMasterPng(srcPngPath, destPngPath, tmpWorkDir) {
  const swiftHelperPath = path.join(tmpWorkDir, 'squircle-mask.swift');
  const swiftCode = `import AppKit
import CoreGraphics
import Foundation

guard CommandLine.arguments.count >= 3 else {
    fputs("Usage: squircle-mask <src> <dst>\\n", stderr)
    exit(2)
}

let srcPath = CommandLine.arguments[1]
let dstPath = CommandLine.arguments[2]

guard let nsImage = NSImage(contentsOfFile: srcPath),
      let srcCG = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    fputs("Failed to load image at \\(srcPath)\\n", stderr)
    exit(1)
}

// Center-crop to square if needed
let srcW = srcCG.width
let srcH = srcCG.height
let side = min(srcW, srcH)
let cropRect = CGRect(x: (srcW - side) / 2, y: (srcH - side) / 2, width: side, height: side)
let squareCG = srcCG.cropping(to: cropRect) ?? srcCG

// Render cropped source into an RGBA probe buffer to detect whether corners are already transparent
let canvasSize = 1024
let colorSpace = CGColorSpaceCreateDeviceRGB()
guard let probeCtx = CGContext(
    data: nil,
    width: canvasSize,
    height: canvasSize,
    bitsPerComponent: 8,
    bytesPerRow: canvasSize * 4,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
) else {
    exit(1)
}
probeCtx.interpolationQuality = .high
probeCtx.draw(squareCG, in: CGRect(x: 0, y: 0, width: canvasSize, height: canvasSize))

var cornersOpaque = true
if let rawData = probeCtx.data {
    let bytes = rawData.bindMemory(to: UInt8.self, capacity: canvasSize * canvasSize * 4)
    let sampleCoords = [(4, 4), (canvasSize - 5, 4), (4, canvasSize - 5), (canvasSize - 5, canvasSize - 5)]
    var maxCornerAlpha: UInt8 = 0
    for (sx, sy) in sampleCoords {
        let offset = (sy * canvasSize + sx) * 4 + 3
        maxCornerAlpha = max(maxCornerAlpha, bytes[offset])
    }
    cornersOpaque = maxCornerAlpha >= 16
}

guard let outCtx = CGContext(
    data: nil,
    width: canvasSize,
    height: canvasSize,
    bitsPerComponent: 8,
    bytesPerRow: canvasSize * 4,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
) else {
    exit(1)
}
outCtx.interpolationQuality = .high

if cornersOpaque {
    // Apply Apple macOS HIG icon inset & squircle rounded-rectangle clip (8.8% inset, 22.5% corner radius)
    let inset: CGFloat = CGFloat(canvasSize) * 0.088
    let iconRect = CGRect(
        x: inset,
        y: inset,
        width: CGFloat(canvasSize) - inset * 2.0,
        height: CGFloat(canvasSize) - inset * 2.0
    )
    let radius: CGFloat = iconRect.width * 0.225
    let squirclePath = CGPath(roundedRect: iconRect, cornerWidth: radius, cornerHeight: radius, transform: nil)
    outCtx.saveGState()
    outCtx.addPath(squirclePath)
    outCtx.clip()
    outCtx.draw(squareCG, in: iconRect)
    outCtx.restoreGState()
} else {
    outCtx.draw(squareCG, in: CGRect(x: 0, y: 0, width: canvasSize, height: canvasSize))
}

guard let finalCG = outCtx.makeImage() else {
    exit(1)
}
let rep = NSBitmapImageRep(cgImage: finalCG)
guard let pngData = rep.representation(using: .png, properties: [:]) else {
    exit(1)
}
try pngData.write(to: URL(fileURLWithPath: dstPath), options: .atomic)
`;

  await fs.writeFile(swiftHelperPath, swiftCode, 'utf8');
  try {
    execFileSync('/usr/bin/swift', [swiftHelperPath, srcPngPath, destPngPath], {
      stdio: 'pipe',
    });
  } catch {
    // Graceful fallback to direct sips 1024x1024 PNG conversion
    execFileSync('/usr/bin/sips', ['-s', 'format', 'png', '-z', '1024', '1024', srcPngPath, '--out', destPngPath], {
      stdio: 'pipe',
    });
  }
}

async function generateAppIconIcns(targetIcnsPath) {
  const tmpWorkDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-iconbuild-'));
  try {
    const masterPngPath = path.join(tmpWorkDir, 'master-1024.png');
    const iconsetDir = path.join(tmpWorkDir, 'AppIcon.iconset');
    await fs.mkdir(iconsetDir, { recursive: true });

    const officialBrandIcon = path.join(repoRoot, 'assets', 'brand', 'logos', 'app-icon-dark-1024.png');
    const customMasterPath = path.join(repoRoot, 'desktop', 'macos', 'AppIconMaster.png');
    let iconSource = 'procedural';
    if (await fileExists(officialBrandIcon)) {
      await prepareSquircleMasterPng(officialBrandIcon, masterPngPath, tmpWorkDir);
      iconSource = 'assets/brand/logos/app-icon-dark-1024.png';
    } else if (await fileExists(customMasterPath)) {
      await prepareSquircleMasterPng(customMasterPath, masterPngPath, tmpWorkDir);
      iconSource = 'desktop/macos/AppIconMaster.png';
    } else {
      await fs.writeFile(masterPngPath, renderAimakeMasterIconPng(1024));
    }

    const iconEntries = [
      ['icon_16x16.png', 16],
      ['icon_16x16@2x.png', 32],
      ['icon_32x32.png', 32],
      ['icon_32x32@2x.png', 64],
      ['icon_128x128.png', 128],
      ['icon_128x128@2x.png', 256],
      ['icon_256x256.png', 256],
      ['icon_256x256@2x.png', 512],
      ['icon_512x512.png', 512],
      ['icon_512x512@2x.png', 1024],
    ];

    for (const [fileName, px] of iconEntries) {
      const dest = path.join(iconsetDir, fileName);
      if (px === 1024) {
        await fs.copyFile(masterPngPath, dest);
      } else {
        execFileSync('/usr/bin/sips', ['-z', String(px), String(px), masterPngPath, '--out', dest], {
          stdio: 'pipe',
        });
      }
    }

    execFileSync('/usr/bin/iconutil', ['-c', 'icns', iconsetDir, '-o', targetIcnsPath], {
      stdio: 'pipe',
    });
    return iconSource;
  } finally {
    await fs.rm(tmpWorkDir, { recursive: true, force: true });
  }
}

function buildInfoPlistXml(version = '1.0.0') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleDisplayName</key>
  <string>Aimake</string>
  <key>CFBundleExecutable</key>
  <string>Aimake</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleIdentifier</key>
  <string>cc.aimake.desktop</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>Aimake</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${version}</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>14.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSPrincipalClass</key>
  <string>NSApplication</string>
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleTypeRole</key>
      <string>Editor</string>
      <key>CFBundleURLName</key>
      <string>cc.aimake.desktop.deeplink</string>
      <key>CFBundleURLSchemes</key>
      <array>
        <string>aimake</string>
      </array>
    </dict>
  </array>
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
      <key>127.0.0.1</key>
      <dict>
        <key>NSExceptionAllowsInsecureHTTPLoads</key>
        <true/>
        <key>NSIncludesSubdomains</key>
        <true/>
      </dict>
      <key>localhost</key>
      <dict>
        <key>NSExceptionAllowsInsecureHTTPLoads</key>
        <true/>
        <key>NSIncludesSubdomains</key>
        <true/>
      </dict>
    </dict>
  </dict>
</dict>
</plist>
`;
}

async function main() {
  if (process.platform !== 'darwin') {
    throw new Error(`Aimake.app native build requires macOS (current platform: ${process.platform})`);
  }

  const { outDir, asJson } = parseCliArgs(process.argv);
  const pkgJsonPath = path.join(repoRoot, 'package.json');
  const pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));
  const appVersion = String(pkg.version || '1.0.0');

  const swiftSourcePath = path.join(repoRoot, 'desktop', 'macos', 'AimakeApp.swift');
  await fs.access(swiftSourcePath);

  const appBundlePath = path.join(outDir, 'Aimake.app');
  const contentsDir = path.join(appBundlePath, 'Contents');
  const macosDir = path.join(contentsDir, 'MacOS');
  const resourcesDir = path.join(contentsDir, 'Resources');
  const infoPlistPath = path.join(contentsDir, 'Info.plist');
  const iconIcnsPath = path.join(resourcesDir, 'AppIcon.icns');
  const executablePath = path.join(macosDir, 'Aimake');

  await fs.rm(appBundlePath, { recursive: true, force: true });
  await fs.mkdir(macosDir, { recursive: true });
  await fs.mkdir(resourcesDir, { recursive: true });

  // 1. Generate AppIcon.icns (from assets/brand/logos/app-icon-dark-1024.png)
  const iconSource = await generateAppIconIcns(iconIcnsPath);
  const iconStat = await fs.stat(iconIcnsPath);

  // 1b. Generate TrayIcon.png (18x18) and TrayIcon@2x.png (36x36) for NSStatusBar menu item
  const traySrc = path.join(repoRoot, 'assets', 'brand', 'logos', 'transparent-symbol-white-512.png');
  if (await fileExists(traySrc)) {
    execFileSync('/usr/bin/sips', ['-z', '18', '18', traySrc, '--out', path.join(resourcesDir, 'TrayIcon.png')], { stdio: 'pipe' });
    execFileSync('/usr/bin/sips', ['-z', '36', '36', traySrc, '--out', path.join(resourcesDir, 'TrayIcon@2x.png')], { stdio: 'pipe' });
  }
  const svgMarkSrc = path.join(repoRoot, 'assets', 'brand', 'logos', 'symbol-color.svg');
  if (await fileExists(svgMarkSrc)) {
    await fs.copyFile(svgMarkSrc, path.join(resourcesDir, 'aimake-logo-mark.svg'));
  }
  const appIcon1024Src = path.join(repoRoot, 'assets', 'brand', 'logos', 'app-icon-dark-1024.png');
  if (await fileExists(appIcon1024Src)) {
    await fs.copyFile(appIcon1024Src, path.join(resourcesDir, 'AppIcon-1024.png'));
  }

  // 1c. Bundle standalone assets into Contents/Resources for zero-dependency portability
  await fs.cp(path.join(repoRoot, 'dist'), path.join(resourcesDir, 'dist'), { recursive: true });
  await fs.cp(path.join(repoRoot, 'templates'), path.join(resourcesDir, 'templates'), { recursive: true });
  await fs.cp(path.join(repoRoot, 'skills'), path.join(resourcesDir, 'skills'), { recursive: true });
  await fs.cp(path.join(repoRoot, 'assets'), path.join(resourcesDir, 'assets'), { recursive: true });
  await fs.cp(path.join(repoRoot, 'examples'), path.join(resourcesDir, 'examples'), {
    recursive: true,
    filter: (src) => !src.includes('.aimake'),
  });
  await fs.copyFile(path.join(repoRoot, 'package.json'), path.join(resourcesDir, 'package.json'));

  // 2. Write & lint Contents/Info.plist
  await fs.writeFile(infoPlistPath, buildInfoPlistXml(appVersion), 'utf8');
  execFileSync('/usr/bin/plutil', ['-lint', infoPlistPath], { stdio: 'pipe' });

  // 3. Compile Swift 6 AppKit + WebKit shell binary
  execFileSync(
    '/usr/bin/swiftc',
    ['-O', '-framework', 'AppKit', '-framework', 'WebKit', swiftSourcePath, '-o', executablePath],
    { stdio: 'inherit' }
  );
  await fs.chmod(executablePath, 0o755);
  const binaryStat = await fs.stat(executablePath);

  // 4. Ad-hoc sign and strictly verify Aimake.app bundle
  execFileSync('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', appBundlePath], {
    stdio: 'pipe',
  });
  execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', appBundlePath], {
    stdio: 'pipe',
  });

  const result = {
    ok: true,
    bundleId: 'cc.aimake.desktop',
    version: appVersion,
    appBundlePath: path.relative(repoRoot, appBundlePath) || appBundlePath,
    executablePath: path.relative(repoRoot, executablePath) || executablePath,
    binaryBytes: binaryStat.size,
    iconBytes: iconStat.size,
    iconSource,
    codesignVerified: true,
  };

  if (asJson) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(
      [
        `Built Aimake macOS Native App (${result.bundleId} v${result.version})`,
        `  Bundle   : ${result.appBundlePath}`,
        `  Binary   : ${result.executablePath} (${(result.binaryBytes / 1024).toFixed(1)} KB)`,
        `  Icon     : Contents/Resources/AppIcon.icns (${(result.iconBytes / 1024).toFixed(1)} KB, source: ${result.iconSource})`,
        `  Plist    : plutil -lint OK`,
        `  Codesign : ad-hoc signed & verified (--deep --strict)`,
      ].join('\n') + '\n'
    );
  }
}

main().catch((err) => {
  process.stderr.write(`Build failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
