import fs from "fs";
import { join as pathJoin } from "path";

import { glob } from "glob";

// https://github.com/node-modules/compressing
import { zip } from "compressing";

//----------------------------------------------------------------------------//

const INPUT_FILES_DIR = "input";
const OUTPUT_FILES_DIR = "output";
const OUTPUT_UNCOMPRESSED_FILES_DIR = pathJoin(
  OUTPUT_FILES_DIR,
  "uncompressed"
);

//----------------------------------------------------------------------------//

const exists = (path) => {
  try {
    fs.accessSync(path);
    return true;
  } catch (e) {
    return false;
  }
};

//---===---//

const mkdir = (targetDirPath) =>
  fs.mkdirSync(targetDirPath, { recursive: true });

const rmdir = (targetDirPath) => fs.rmSync(targetDirPath, { recursive: true });

//---===---//

/*
const ensureDir = (targetDirPath) => {
  const isPresent = exists(targetDirPath);

  if (!isPresent) {
    mkdir(targetDirPath);
  }
};
*/

const cleanupDir = (targetDirPath) => {
  const isPresent = exists(targetDirPath);

  if (isPresent) {
    rmdir(targetDirPath);
  }

  mkdir(targetDirPath);
};

//----------------------------------------------------------------------------//

const getFilesToCompress = async (inputDirPrefix = INPUT_FILES_DIR) =>
  await glob(pathJoin(inputDirPrefix, "**/*.*"));

//----------------------------------------------------------------------------//

export const compress = async (entries, outputFilePath) =>
  new Promise((resolve, reject) => {
    if (entries.length === 0) {
      reject(new Error("No entries defined"));
      return;
    }

    const zipStream = new zip.Stream();

    for (const [entry, relativePath] of entries) {
      zipStream.addEntry(entry, { relativePath });
    }

    zipStream.on("error", reject);

    zipStream
      .pipe(fs.createWriteStream(outputFilePath))
      .on("error", reject)
      .on("close", () => {
        resolve(true);
      });
  });

const uncompress = async (filePath, outputDir) =>
  await zip.uncompress(filePath, outputDir);

//----------------------------------------------------------------------------//

(async () => {
  cleanupDir(OUTPUT_FILES_DIR);

  let filesEntries = await getFilesToCompress();

  filesEntries = filesEntries.map((entry) => [
    entry,
    entry.replace(`${INPUT_FILES_DIR}/`, "") || undefined,
  ]);

  console.log("files entries: ", filesEntries);

  const zipFilePath = pathJoin(OUTPUT_FILES_DIR, "compressed.zip");

  await compress(filesEntries, zipFilePath);

  await uncompress(zipFilePath, OUTPUT_UNCOMPRESSED_FILES_DIR);
})();
