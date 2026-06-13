import { Path } from 'react-native-svg';

import { IconBase, type IconProps } from './IconBase';

export const HomeIcon = (props: IconProps) => {
  return (
    <IconBase {...props}>
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Path d="M9 22V12h6v10" />
    </IconBase>
  );
};
