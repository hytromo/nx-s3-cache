# Yet another nx cache library

## Why?

All the popular nx cache libraries, including the Nx Cloud's one, seem to be using the npm tar package to tar/untar archives using Node.js. While this increases portability, I came to realize that this can be 12x slower than using system calls to GNU tar, and performance can be massively be improved by compressing using `pigz` - a multithreaded `gzip` alternative.

At the same time, most packages don't seem to be using the [best practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example_s3_Scenario_UsingLargeFiles_section.html) for fetching large files from S3 using the AWS SDK resulting in slower uploads and downloads.

## Requirements

This package requires GNU `tar` and `pigz` for creating tar.gz archives using multithreading. These tools are already pre-installed in Github Actions' Linux runners.

This limits where this nx cache runner can work, but it should massively improve performance; enabling people to cache things like `node_modules` if need be in CI.

## Credits

This package is just a combination of [nx-remotecache-custom](https://www.npmjs.com/package/nx-remotecache-custom) and [@pellegrims/nx-remotecache-s3](https://www.npmjs.com/package/@pellegrims/nx-remotecache-s3) with the following changes:

1. Utilize best practices for uploading and downloading large files to and from Amazon S3
2. Utilize GNU tar+pigz instead of [npm tar](https://www.npmjs.com/package/tar)
