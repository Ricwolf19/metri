import { Text } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

import { markdownRules } from './MarkdownTable';
import { markdownStyles } from './markdownStyles';

/*
 * The library defaults these props INSIDE its signature, so every render
 * built a new parser and new arrays — and they are the deps of its own memo,
 * which then rebuilt the renderer and ran `StyleSheet.create` over ~90 styles
 * each time. Module constants keep that memo honest.
 */
const PARSER = MarkdownIt({ typographer: true });
// Read by the component but missing from its type definitions, hence the spread.
const UNTYPED_DEFAULTS = {
  topLevelMaxExceededItem: <Text key="dotdotdot">...</Text>,
  allowedImageHandlers: [
    'data:image/png;base64',
    'data:image/gif;base64',
    'data:image/jpeg;base64',
    'https://',
  ],
};

/**
 * Markdown as the app renders it everywhere (docs, legal, release notes): the
 * dark styles, tables as grids, soft breaks as spaces.
 */
export const DocMarkdown = ({
  children,
  onLinkPress,
}: {
  children: string;
  onLinkPress?: (url: string) => boolean;
}) => (
  <Markdown
    style={markdownStyles()}
    rules={markdownRules}
    markdownit={PARSER}
    {...UNTYPED_DEFAULTS}
    onLinkPress={onLinkPress}
  >
    {children}
  </Markdown>
);
