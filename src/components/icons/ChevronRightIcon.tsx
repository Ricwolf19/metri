import { Path } from 'react-native-svg';

import { IconBase, type IconProps } from './IconBase';

export const ChevronRightIcon = (props: IconProps) => {
  return (
    <IconBase {...props}>
      <Path d="M9 18l6-6-6-6" />
    </IconBase>
  );
};
