import Svg from 'react-native-svg';

/**
 * Shared props + wrapper for the app's custom stroke icons. Each icon file draws
 * its own `<Path>`/`<Circle>` children inside this 24×24 frame, so they stay
 * consistent and inherit the brand colors.
 */
export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export const IconBase = ({
  size = 24,
  color = '#aab2c4',
  strokeWidth = 2,
  children,
}: IconProps & { children: React.ReactNode }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
};
