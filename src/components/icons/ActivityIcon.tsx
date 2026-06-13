import { Path } from 'react-native-svg';

import { IconBase, type IconProps } from './IconBase';

export const ActivityIcon = (props: IconProps) => {
  return (
    <IconBase {...props}>
      <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </IconBase>
  );
};
