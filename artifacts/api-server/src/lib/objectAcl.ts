import { File } from "@google-cloud/storage";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

export enum ObjectAccessGroupType {}

export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

export async function setObjectAclPolicy(objectFile: File, aclPolicy: ObjectAclPolicy): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) throw new Error("Object not found.");
  await objectFile.setMetadata({
    metadata: { [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy) },
  });
}

export async function getObjectAclPolicy(objectFile: File): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) return null;
  try {
    const parsed = JSON.parse(aclPolicy as string) as ObjectAclPolicy;
    return typeof parsed.owner === "string" && (parsed.visibility === "private" || parsed.visibility === "public")
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const policy = await getObjectAclPolicy(objectFile);
  if (!policy) return false;
  if (policy.visibility === "public" && requestedPermission === ObjectPermission.READ) return true;
  if (!userId) return false;
  if (policy.owner === userId) return true;

  return false;
}
