export interface S3UploadParams {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface S3UploadResult {
  key: string;
  url: string;
}

export interface S3PresignedUploadParams {
  key: string;
  contentType?: string;
  expiresIn?: number;
}

export interface S3PresignedUploadResult {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
}
