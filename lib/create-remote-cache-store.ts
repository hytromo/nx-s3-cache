import { RemoteCache } from "@nrwl/workspace/src/tasks-runner/default-tasks-runner";
import { getFileNameFromHash } from "./get-file-name-from-hash";
import { SafeRemoteCacheImplementation } from "./types/safe-remote-cache-implementation";
import { spawn } from "child_process";
import path from "path";

const archiveFolder = async (
  cwd: string,
  folder: string,
  destinationFile: string
): Promise<string> => {
  await new Promise((res, rej) => {
    const args = ["-czf", destinationFile, folder];
    const spawnedProcess = spawn("/usr/bin/tar", args, { cwd });

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

  console.log("done remote cache store!");

  return destinationFile;
};

export const createRemoteCacheStore =
  (
    safeImplementation: Promise<SafeRemoteCacheImplementation | null>
  ): RemoteCache["store"] =>
  async (hash, cacheDirectory) => {
    const implementation = await safeImplementation;

    if (!implementation) {
      return false;
    }

    const file = getFileNameFromHash(hash);
    const { storeFile } = implementation;
    // print how much each step takes
    const beforeArchive = Date.now();
    await archiveFolder(cacheDirectory, hash, file);
    console.log("archive took", Date.now() - beforeArchive, "ms");

    const beforeStore = Date.now();
    await storeFile(path.join(cacheDirectory, file));
    console.log("store took", Date.now() - beforeStore, "ms");

    return true;
  };
