import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";
import { initEnv } from "../init-env";
import { buildS3Client } from "./s3-client";
import { CustomRunnerOptions } from "../types/custom-runner-options";
import { RemoteCacheImplementation } from "../types/remote-cache-implementation";
import { buildCommonCommandInput, isReadOnly } from "./util";

export interface S3Options {
  bucket?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  prefix?: string;
  profile?: string;
  readOnly?: boolean;
  region?: string;
}

const ENV_BUCKET = "NXCACHE_S3_BUCKET";
const ENV_PREFIX = "NXCACHE_S3_PREFIX";
const ENV_READ_ONLY = "NXCACHE_S3_READ_ONLY";

export default async (options: CustomRunnerOptions<S3Options>) => {
  initEnv(options);

  const s3Storage = buildS3Client(options);

  const bucket = process.env.ENV_BUCKET ?? options.bucket;
  const prefix = process.env.ENV_PREFIX ?? options.prefix ?? "";
  const readOnly = isReadOnly(options, ENV_READ_ONLY);

  const config: RemoteCacheImplementation = {
    name: "S3",
    fileExists: async (filename: string) => {
      try {
        const result = await s3Storage.headObject(
          buildCommonCommandInput({ bucket, prefix, filename })
        );
        return !!result;
      } catch (error) {
        if (
          (error as Error).name === "403" ||
          (error as Error).name === "NotFound"
        ) {
          return false;
        } else {
          throw error;
        }
      }
    },
    retrieveFile: async (filename: string) => {
      const result = await s3Storage.getObject(
        buildCommonCommandInput({ bucket, prefix, filename })
      );
      if (!result.Body) {
        throw new Error("No body");
      }

      const bodyArrayBody = await result.Body.transformToByteArray();
      const tmpFile = path.join(
        fs.mkdtempSync("/tmp/nx-cache-"),
        path.basename(filename)
      );

      await new Promise<void>((res, rej) =>
        fs.writeFile(tmpFile, bodyArrayBody, (err) => (err ? rej(err) : res()))
      );

      return tmpFile;
    },
    storeFile: async (filename: string) => {
      if (readOnly) {
        throw new Error("ReadOnly storage, cannot store file");
      }

      const fileContent = await new Promise<Buffer>((res, rej) => {
        fs.readFile(filename, (err, data) => (err ? rej(err) : res(data)));
      });

      const upload = new Upload({
        client: s3Storage,
        params: {
          ...buildCommonCommandInput({ bucket, prefix, filename }),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Body: fileContent,
        },
      });

      return upload.done();
    },
  };

  return config;
};
