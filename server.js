import express from "express";
import multer from "multer";
import fs from "fs-extra";
import path from "path";
import unzipper from "unzipper";
import archiver from "archiver";
import { convertProject } from "./converter.js";

const app = express();
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

const TEMP_DIR = path.join(process.cwd(), "temp");
fs.ensureDirSync(TEMP_DIR);

app.post("/upload", upload.single("projectZip"), async (req, res) => {
  try {
    const uploadedZip = req.file.path;
    const extractDir = path.join(
      TEMP_DIR,
      path.basename(uploadedZip, path.extname(uploadedZip))
    );
    fs.ensureDirSync(extractDir);

    await new Promise((resolve, reject) => {
      fs.createReadStream(uploadedZip)
        .pipe(unzipper.Extract({ path: extractDir }))
        .on("close", resolve)
        .on("error", reject);
    });

    const inputDir = path.join(extractDir, "src");
    if (!fs.existsSync(inputDir)) {
      throw new Error("'src' folder not found in the uploaded archive.");
    }

    const outputDir = path.join(extractDir, "native-src");
    fs.ensureDirSync(outputDir);

    convertProject(inputDir, outputDir);

    const outputZipPath = path.join(
      TEMP_DIR,
      `native-app-${Date.now()}.zip`
    );
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputZipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      output.on("close", resolve);
      archive.on("error", reject);
      archive.pipe(output);
      archive.directory(outputDir, false);
      archive.finalize();
    });

    res.download(outputZipPath, "native-app.zip", async (err) => {
      try {
        await fs.remove(uploadedZip);
        await fs.remove(extractDir);
        await fs.remove(outputZipPath);
      } catch (cleanupErr) {
        console.error("Error cleaning temporary files:", cleanupErr);
      }
    });
  } catch (error) {
    console.error("Error during conversion process:", error);
    res.status(500).send("An error occurred during the conversion process.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
