import { RemoteCache } from "@nx/workspace/src/tasks-runner/default-tasks-runner";
import { getFileNameFromHash } from "./get-file-name-from-hash";
import { SafeRemoteCacheImplementation } from "./types/safe-remote-cache-implementation";
import { spawn } from "child_process";

const archiveFolder = async (
  cwd: string,
  folder: string,
  destinationFile: string
): Promise<string> => {
  await new Promise((res, rej) => {
    const args = ["-C", cwd, "-czvf", destinationFile, folder];
    console.log("command is", "/usr/bin/tar", args);
    const spawnedProcess = spawn("/usr/bin/tar", args);

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
    archiveFolder(cacheDirectory, hash, file);

    await storeFile(file);

    return true;
  };
