export interface SafeRemoteCacheImplementation {
  storeFile: (filename: string) => Promise<unknown | null>;
  fileExists: (filename: string) => Promise<boolean | null>;
  retrieveFile: (filename: string) => Promise<string | null>;
  name: string;
}
