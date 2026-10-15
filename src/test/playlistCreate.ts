export const MAX_PLAYLIST_NAME_LENGTH = 100;

export function validatePlaylistName(
name: string,
existingNames: string[] = []
): boolean {
// Reject empty names and names containing only spaces.
if (!name.trim()) {
return false;
}

// Reject names that exceed the maximum length.
if (name.length > MAX_PLAYLIST_NAME_LENGTH) {
return false;
}

// Reject duplicate names, ignoring capitalization.
for (const existingName of existingNames) {
if (name.toLowerCase() === existingName.toLowerCase()) {
return false;
}
}

// The name passes all validation checks.
return true;
}