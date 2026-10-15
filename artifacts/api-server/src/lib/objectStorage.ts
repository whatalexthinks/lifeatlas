import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { File, Storage } from "@google-cloud/storage";
import { canAccessObject, getObjectAclPolicy, setObjectAclPolicy, type ObjectAclPolicy, ObjectPermission } from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  getPublicObjectSearchPaths(): string[] {
    const paths = Array.from(new Set((process.env.PUBLIC_OBJECT_SEARCH_PATHS || "")
      .split(",").map((path) => path.trim()).filter(Boolean)));
    if (!paths.length) throw new Error("PUBLIC_OBJECT_SEARCH_PATHS is not configured.");
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) throw new Error("PRIVATE_OBJECT_DIR is not configured.");
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const [bucketName, ...objectParts] = `${searchPath}/${filePath}`.replace(/^\/+/, "").split("/");
      if (!bucketName || objectParts.length === 0) continue;
      const file = objectStorageClient.bucket(bucketName).file(objectParts.join("/"));
      const [exists] = await file.exists();
      if (exists) return file;
    }
    return null;
  }

  async downloadObject(file: File, cacheTtlSec = 3600): Promise<Response> {
    const [metadata] = await file.getMetadata();
    const aclPolicy = await getObjectAclPolicy(file);
    const nodeStream = file.createReadStream();
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    const headers: Record<string, string> = {
      "Content-Type": (metadata.contentType as string) || "application/octet-stream",
      "Cache-Control": `${aclPolicy?.visibility === "public" ? "public" : "private"}, max-age=${cacheTtlSec}`,
      "X-Content-Type-Options": "nosniff",
    };
    if (metadata.size) headers["Content-Length"] = String(metadata.size);
    return new Response(webStream, { headers });
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const [bucketName, ...objectParts] = `${this.getPrivateObjectDir()}/uploads/${objectId}`.replace(/^\/+/, "").split("/");
    if (!bucketName || objectParts.length === 0) throw new Error("Invalid private object directory.");
    const request = {
      bucket_name: bucketName,
      object_name: objectParts.join("/"),
      method: "PUT",
      expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    };
    const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Object upload URL could not be signed (${response.status}).`);
    const result = await response.json() as { signed_url?: string };
    if (!result.signed_url) throw new Error("Object storage returned no upload URL.");
    return result.signed_url;
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/") || objectPath.includes("..") || objectPath.includes("\\")) {
      throw new ObjectNotFoundError();
    }
    const entityPath = objectPath.slice("/objects/".length);
    if (!entityPath || entityPath.startsWith("/")) throw new ObjectNotFoundError();
    const [bucketName, ...objectParts] = `${this.getPrivateObjectDir()}/${entityPath}`.replace(/^\/+/, "").split("/");
    if (!bucketName || objectParts.length === 0) throw new ObjectNotFoundError();
    const file = objectStorageClient.bucket(bucketName).file(objectParts.join("/"));
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();
    return file;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    const parsed = new URL(rawPath);
    if (parsed.hostname !== "storage.googleapis.com") throw new Error("Invalid object upload URL.");
    const privateDir = this.getPrivateObjectDir().replace(/^\/+/, "").replace(/\/+$/, "");
    const objectPath = parsed.pathname.replace(/^\/+/, "");
    const prefix = `${privateDir}/`;
    if (!objectPath.startsWith(prefix)) throw new Error("Upload URL does not point to private storage.");
    return `/objects/${objectPath.slice(prefix.length)}`;
  }

  async trySetObjectEntityAclPolicy(rawPath: string, aclPolicy: ObjectAclPolicy): Promise<string> {
    const objectFile = await this.getObjectEntityFile(rawPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return rawPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission = ObjectPermission.READ,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({ userId, objectFile, requestedPermission });
  }
}
