import { Path } from 'react-native-svg';

import { IconBase, type IconProps } from './IconBase';

export const LogOutIcon = (props: IconProps) => {
  return (
    <IconBase {...props}>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Path d="M16 17l5-5-5-5" />
      <Path d="M21 12H9" />
    </IconBase>
  );
};
