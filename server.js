import express from "express";
import multer from "multer";
import fs from "fs-extra";
import path from "path";
import unzipper from "unzipper";
import archiver from "archiver";
import { convertProject } from "./converter.js";

const app = express();
app.use(express.static("public"));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('Uploaded file type:', file.mimetype);
    console.log('Uploaded file name:', file.originalname);
    
    const acceptedMimeTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-zip',
      'application/octet-stream'
    ];
    
    if (file.originalname.toLowerCase().endsWith('.zip')) {
      return cb(null, true);
    }
    
    if (acceptedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    
    cb(new Error(`Invalid file type. Got: ${file.mimetype}. File must be a ZIP archive.`));
  },
  limits: {
    fileSize: 50 * 1024 * 1024 
  }
}).single('projectZip');

const TEMP_DIR = path.join(process.cwd(), "temp");
fs.ensureDirSync(TEMP_DIR);

app.post("/upload", (req, res) => {
  upload(req, res, async (err) => {
    let uploadedZip = null;
    let extractDir = null;
    let outputZipPath = null;

    try {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        throw new Error(`Upload error: ${err.message}`);
      } else if (err) {
        console.error('Upload error:', err);
        throw new Error(`Invalid file: ${err.message}`);
      }

      if (!req.file) {
        throw new Error("No file uploaded");
      }

      uploadedZip = req.file.path;
      console.log(`Processing uploaded file: ${uploadedZip}`);

      const stats = await fs.stat(uploadedZip);
      if (stats.size === 0) {
        throw new Error("Uploaded file is empty");
      }

      extractDir = path.join(TEMP_DIR, `extract_${Date.now()}`);
      await fs.ensureDir(extractDir);
      console.log(`Extracting to: ${extractDir}`);

      await Promise.race([
        new Promise((resolve, reject) => {
          fs.createReadStream(uploadedZip)
            .pipe(unzipper.Extract({ path: extractDir }))
            .on('close', resolve)
            .on('error', reject);
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Extraction timeout')), 30000)
        )
      ]);

      const files = await fs.readdir(extractDir);
      if (files.length === 0) {
        throw new Error("Extracted zip file is empty");
      }

      let inputDir = path.join(extractDir, "src");
      if (!await fs.pathExists(inputDir)) {
        inputDir = extractDir;
      }
      console.log(`Using input directory: ${inputDir}`);

      const outputDir = path.join(extractDir, "native-src");
      await fs.ensureDir(outputDir);

      await convertProject(inputDir, outputDir);

      outputZipPath = path.join(TEMP_DIR, `native-app-${Date.now()}.zip`);
      console.log(`Creating output zip: ${outputZipPath}`);

      await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', resolve);
        archive.on('error', reject);
        archive.on('warning', (warn) => console.warn('Archive warning:', warn));

        archive.pipe(output);
        archive.directory(outputDir, false);
        archive.finalize();
      });

      res.download(outputZipPath, "native-app.zip", async (err) => {
        if (err) {
          console.error("Error sending file:", err);
        }
        cleanup(uploadedZip, extractDir, outputZipPath);
      });

    } catch (error) {
      console.error("Conversion error details:", {
        message: error.message,
        stack: error.stack,
        uploadedFile: req.file
      });
      await cleanup(uploadedZip, extractDir, outputZipPath);
      res.status(500).json({
        error: true,
        message: error.message || "An error occurred during conversion"
      });
    }
  });
});

async function cleanup(...paths) {
  for (const path of paths) {
    if (path) {
      try {
        await fs.remove(path);
        console.log(`Cleaned up: ${path}`);
      } catch (err) {
        console.error(`Cleanup error for ${path}:`, err);
      }
    }
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
