/**
 * A stored path → the file's uri now. Rows keep the full uri they were written
 * with, but only its NAME is trusted: an app container can move (an iOS
 * reinstall or restore), and every file of ours is in the one folder.
 */
export const joinMediaUri = (folderUri: string, stored: string): string => {
  if (!stored) return '';
  const name = stored.slice(stored.lastIndexOf('/') + 1);
  return folderUri.endsWith('/') ? `${folderUri}${name}` : `${folderUri}/${name}`;
};
