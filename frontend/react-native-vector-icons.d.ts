/**
 * Type declarations for react-native-vector-icons
 */

declare module 'react-native-vector-icons/MaterialIcons' {
  import React from 'react';
  import { TextProps, TextStyle } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle;
  }

  const Icon: React.FC<IconProps>;
  export default Icon;
}
