# Yet another nx cache library

## Why?

All the popular nx cache libraries, including the Nx Cloud's one, are using the npm tar package to tar/untar archives using Node.js.
With simple tests, I came to realize that this can be 12x slower than using system calls to GNU tar. This limits where this nx cache runner can work, but it should massively improve performance; enabling people to cache things like `node_modules` if need be in CI.

## Credits

This package is just a combination of [nx-remotecache-custom](https://www.npmjs.com/package/nx-remotecache-custom) and [@pellegrims/nx-remotecache-s3](https://www.npmjs.com/package/@pellegrims/nx-remotecache-s3) with the following changes:

1. Get rid of Node.js streams as much as possible.
2. Get rid of npm tar and use GNU tar.
