/**
 * App icons — backed by Iconoir (matches the metri.info web barrel). Re-exported
 * under stable `<XIcon>` names so screens keep importing the same identifier and
 * pass `size` (px), `color`, and `strokeWidth`. Iconoir natively takes
 * width/height, so each icon is wrapped to accept our `size` prop and default to
 * `strokeWidth` 2. To add one, map another Iconoir icon here.
 */
import MetriMark from '@/assets/images/metri-mark.svg';
import { createElement, type ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

import {
  Home,
  Bell,
  Activity,
  Book,
  Settings,
  Camera,
  NavArrowRight,
  NavArrowLeft,
  NavArrowDown,
  FireFlame,
  LogOut,
  Gym,
  ShieldCheck,
  Plus,
  Minus,
  Check,
  Timer,
  Play,
  Xmark,
  StarSolid,
  Trash,
  Flask,
  Download,
  OpenNewWindow,
  Mail,
  Github,
  Compass,
  Apple,
  HelpCircle,
  InfoCircle,
  WarningTriangle,
  SmartphoneDevice,
  Menu,
  PlaySolid,
  Sparks,
  List,
  ViewGrid,
  Pause,
  Expand,
  Eye,
  EyeClosed,
} from 'iconoir-react-native';

/** Square size in px (maps to width + height). */
export type IconProps = SvgProps & {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type IconComponent = ComponentType<SvgProps>;

/**
 * The metri mark, tinted like any other icon. The asset paints with
 * `currentColor`, which react-native-svg resolves from the root `color` prop —
 * so the brand glyph takes the same `color`/`size` contract as the Iconoir set.
 * It is a solid glyph, so it ignores `strokeWidth` instead of pretending to
 * have a stroke.
 */
export const MetriIcon = ({ size = 24, color, strokeWidth: _stroke, ...props }: IconProps) =>
  createElement(MetriMark, { width: size, height: size, color, ...props });
MetriIcon.displayName = 'MetriIcon';

/** Wrap an Iconoir icon so it accepts our `size` (px) prop and the app's stroke weight. */
const sized = (Icon: IconComponent, name: string) => {
  const Wrapped = ({ size = 24, strokeWidth = 2, ...props }: IconProps) =>
    createElement(Icon, { width: size, height: size, strokeWidth, ...props });
  Wrapped.displayName = name;
  return Wrapped;
};

export const HomeIcon = sized(Home, 'HomeIcon');
export const BellIcon = sized(Bell, 'BellIcon');
export const ActivityIcon = sized(Activity, 'ActivityIcon');
export const BookIcon = sized(Book, 'BookIcon');
export const GearIcon = sized(Settings, 'GearIcon');
export const CameraIcon = sized(Camera, 'CameraIcon');
export const ChevronRightIcon = sized(NavArrowRight, 'ChevronRightIcon');
export const ChevronLeftIcon = sized(NavArrowLeft, 'ChevronLeftIcon');
export const ChevronDownIcon = sized(NavArrowDown, 'ChevronDownIcon');
export const FlameIcon = sized(FireFlame, 'FlameIcon');
export const LogOutIcon = sized(LogOut, 'LogOutIcon');
export const DumbbellIcon = sized(Gym, 'DumbbellIcon');
export const PlusIcon = sized(Plus, 'PlusIcon');
export const MinusIcon = sized(Minus, 'MinusIcon');
export const CheckIcon = sized(Check, 'CheckIcon');
export const TimerIcon = sized(Timer, 'TimerIcon');
export const PlayIcon = sized(Play, 'PlayIcon');
export const XIcon = sized(Xmark, 'XIcon');
export const StarIcon = sized(StarSolid, 'StarIcon');
export const TrashIcon = sized(Trash, 'TrashIcon');
export const FlaskIcon = sized(Flask, 'FlaskIcon');
export const DownloadIcon = sized(Download, 'DownloadIcon');
export const ExternalLinkIcon = sized(OpenNewWindow, 'ExternalLinkIcon');
export const MailIcon = sized(Mail, 'MailIcon');
export const GithubIcon = sized(Github, 'GithubIcon');
export const CompassIcon = sized(Compass, 'CompassIcon');
export const AppleIcon = sized(Apple, 'AppleIcon');
export const ShieldIcon = sized(ShieldCheck, 'ShieldIcon');
export const HelpIcon = sized(HelpCircle, 'HelpIcon');
export const InfoCircleIcon = sized(InfoCircle, 'InfoCircleIcon');
export const WarningIcon = sized(WarningTriangle, 'WarningIcon');
export const SmartphoneIcon = sized(SmartphoneDevice, 'SmartphoneIcon');
export const DragHandleIcon = sized(Menu, 'DragHandleIcon');
export const PlaySolidIcon = sized(PlaySolid, 'PlaySolidIcon');
export const SparksIcon = sized(Sparks, 'SparksIcon');
export const ListIcon = sized(List, 'ListIcon');
export const ViewGridIcon = sized(ViewGrid, 'ViewGridIcon');
export const PauseIcon = sized(Pause, 'PauseIcon');
export const ExpandIcon = sized(Expand, 'ExpandIcon');
export const EyeIcon = sized(Eye, 'EyeIcon');
export const EyeClosedIcon = sized(EyeClosed, 'EyeClosedIcon');
