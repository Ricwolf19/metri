/**
 * A long body in pieces, cut before each `## ` heading, so a screen can mount
 * one section a frame instead of the whole document in one commit. Joined
 * back with the newline the cut consumed, the pieces are the body.
 */
export const docSections = (body: string): string[] =>
  body.split(/\n(?=## )/).filter((part) => part.trim().length > 0);
