import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { createRequire } from "module";

// Create require for JSON imports.
const require = createRequire(import.meta.url);

/**
 * Configuration for the extension packing process.
 */
const BUILD_DIR = "build";
const EXTENSION_NAME = "darker-chrome";
const VERSION = require("../package.json").version;
const EXTENSION_FOLDER_NAME = `${EXTENSION_NAME}-v${VERSION}`;
const ZIP_NAME = `${EXTENSION_FOLDER_NAME}.zip`;

/**
 * Files and directories to include in the packed extension.
 */
const INCLUDE_FILES = [
  "manifest.json",
  "popup.html",
  "popup.css",
  "icons/",
  "README.md",
];

/**
 * Builds the TypeScript files directly to the target directory.
 */
const buildTypeScript = (targetDir: string): void => {
  console.log("🔨 Building TypeScript files...");

  const distPath = path.join(targetDir, "dist");

  try {
    execSync(`tsc --outDir "${distPath}"`, { stdio: "inherit" });
    console.log("✅ TypeScript build completed");
  } catch (error) {
    console.error("❌ TypeScript build failed");
    process.exit(1);
  }
};

/**
 * Copies a file or directory recursively.
 */
const copyFileOrDir = (src: string, dest: string): void => {
  const srcPath = path.resolve(src);
  const destPath = path.resolve(dest);

  if (!fs.existsSync(srcPath)) {
    console.log(`⚠️  Warning: ${src} not found, skipping...`);
    return;
  }

  const stats = fs.statSync(srcPath);

  if (stats.isDirectory()) {
    // Copy directory recursively.
    fs.mkdirSync(destPath, { recursive: true });
    const entries = fs.readdirSync(srcPath);

    for (const entry of entries) {
      const srcEntry = path.join(srcPath, entry);
      const destEntry = path.join(destPath, entry);
      const entryStats = fs.statSync(srcEntry);

      if (entryStats.isDirectory()) {
        copyFileOrDir(srcEntry, destEntry);
      } else {
        fs.copyFileSync(srcEntry, destEntry);
      }
    }
    console.log(`  ✅ Copied directory: ${src}`);
  } else {
    // Copy single file.
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✅ Copied file: ${src}`);
  }
};

/**
 * Lists directory contents recursively for display.
 */
const listDir = (dir: string, indent = ""): void => {
  const items = fs.readdirSync(dir).sort();
  items.forEach((item) => {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      console.log(`${indent}📁 ${item}/`);
      listDir(itemPath, indent + "  ");
    } else {
      const size = (stats.size / 1024).toFixed(1);
      console.log(`${indent}📄 ${item} (${size} KB)`);
    }
  });
};

/**
 * Main packing process.
 */
const packExtension = (): void => {
  // Clean and create build directory.
  console.log("🧹 Cleaning build directory...");
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  // Create extension folder inside build.
  const extensionPath = path.join(BUILD_DIR, EXTENSION_FOLDER_NAME);
  fs.mkdirSync(extensionPath, { recursive: true });

  // Build TypeScript directly to the target location.
  buildTypeScript(extensionPath);

  // Copy files to extension folder.
  console.log("📦 Copying extension files...");
  INCLUDE_FILES.forEach((file) => {
    const destPath = path.join(extensionPath, file);
    copyFileOrDir(file, destPath);
  });

  // Create package info.
  console.log("📝 Creating package info...");
  const packageInfo = {
    name: EXTENSION_NAME,
    version: VERSION,
    built: new Date().toISOString(),
    files: INCLUDE_FILES,
  };

  fs.writeFileSync(
    path.join(extensionPath, "package-info.json"),
    JSON.stringify(packageInfo, null, 2)
  );

  // Create zip file inside build directory.
  console.log("🗜️  Creating distribution zip...");
  const zipPath = path.join(BUILD_DIR, ZIP_NAME);

  try {
    // Create zip from the extension folder.
    execSync(`cd ${BUILD_DIR} && zip -r ${ZIP_NAME} ${EXTENSION_FOLDER_NAME}`, {
      stdio: "inherit",
    });
    console.log(`✅ Created distribution zip: ${BUILD_DIR}/${ZIP_NAME}`);
  } catch (error) {
    console.log(
      "⚠️  Zip command not available. You can manually zip the extension folder."
    );
  }

  console.log("\n🎉 Extension packed successfully!");
  console.log(`📁 Extension folder: ${BUILD_DIR}/${EXTENSION_FOLDER_NAME}/`);
  console.log(`📦 Distribution zip: ${BUILD_DIR}/${ZIP_NAME}`);
  console.log("\n📋 Next steps:");
  console.log(
    `  1. Test the extension by loading ${BUILD_DIR}/${EXTENSION_FOLDER_NAME}/ in Chrome`
  );
  console.log(`  2. For Chrome Web Store: Use ${BUILD_DIR}/${ZIP_NAME}`);
  console.log(`  3. For manual distribution: Share ${BUILD_DIR}/${ZIP_NAME}`);

  // Show build directory contents.
  console.log("\n📋 Build contents:");
  listDir(BUILD_DIR, "  ");
};

// Execute the packing process.
packExtension();
