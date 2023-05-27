import { RemoteCache } from "@nrwl/workspace/src/tasks-runner/default-tasks-runner";
import { spawn } from "child_process";
import fs from "fs";
import { join } from "path";
import { getFileNameFromHash } from "./get-file-name-from-hash";
import { SafeRemoteCacheImplementation } from "./types/safe-remote-cache-implementation";

const COMMIT_FILE_EXTENSION = ".commit";
const COMMIT_FILE_CONTENT = "true";

const extractFolder = async (zipFilePath: string, destination: string) => {
  await fs.mkdirSync(destination, { recursive: true });

  await new Promise((res, rej) => {
    const args = ["xf", zipFilePath, "--strip", "1"];
    const spawnedProcess = spawn("/usr/bin/tar", args, { cwd: destination });

    spawnedProcess.stdout.on("data", (data) => {
      process.stdout.write(data.toString());
    });

    spawnedProcess.stderr.on("data", (data) => {
      process.stderr.write(data.toString());
    });

    spawnedProcess.on("exit", (code) => {
      if (code !== 0) {
        rej(`Non zero exit code: ${code}`);
      } else {
        res({ code });
      }
    });
  });
};

const writeCommitFile = (destination: string) => {
  const commitFilePath = destination + COMMIT_FILE_EXTENSION;
  return fs.writeFileSync(commitFilePath, COMMIT_FILE_CONTENT);
};

export const createRemoteCacheRetrieve =
  (
    safeImplementation: Promise<SafeRemoteCacheImplementation | null>
  ): RemoteCache["retrieve"] =>
  async (hash, cacheDirectory) => {
    const implementation = await safeImplementation;

    if (!implementation) {
      return false;
    }

    const file = getFileNameFromHash(hash);
    const { fileExists, retrieveFile } = implementation;
    const isFileCached = await fileExists(file);

    if (!isFileCached) {
      return false;
    }

    const beforeRetrieve = Date.now();
    const path = await retrieveFile(file);
    console.log("retrieve took", Date.now() - beforeRetrieve, "ms");

    const destination = join(cacheDirectory, hash);

    if (!path) {
      return false;
    }

    const beforeArchive = Date.now();
    await extractFolder(path, destination);
    console.log("archive took", Date.now() - beforeArchive, "ms");

    await writeCommitFile(destination);

    return true;
  };
