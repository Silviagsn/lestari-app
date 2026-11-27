export const openListings = "deleted_at IS NULL AND status = 'published' AND (deadline IS NULL OR deadline >= (now() AT TIME ZONE 'Asia/Jakarta')::date)";
