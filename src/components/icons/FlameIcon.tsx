import { Path } from 'react-native-svg';

import { IconBase, type IconProps } from './IconBase';

export const FlameIcon = (props: IconProps) => {
  return (
    <IconBase {...props}>
      <Path d="M12 2c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 9 9 6 12 2z" />
      <Path d="M8.5 14a3.5 3.5 0 0 0 7 0c0-2-2-3-2.5-4-.8 1.2-1.5 1.5-2.5 2-1 .5-2 1-2 2z" />
    </IconBase>
  );
};
