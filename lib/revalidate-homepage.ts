import { revalidatePath, revalidateTag } from "next/cache";

/** Tags used by unstable_cache for homepage public data */
export const HOMEPAGE_SETTINGS_TAG = "homepage-settings";
export const HOMEPAGE_CONTENT_TAG = "homepage-content";

/** Invalidate cached homepage settings/content after admin mutations. */
export function revalidateHomepageCaches() {
  revalidateTag(HOMEPAGE_SETTINGS_TAG, { expire: 0 });
  revalidateTag(HOMEPAGE_CONTENT_TAG, { expire: 0 });
  revalidatePath("/");
}
