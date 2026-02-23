/**
 * Username Icon - Vector drawable converted to React Native
 * Original: ic_username_icon.xml
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface UsernameIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const UsernameIcon: React.FC<UsernameIconProps> = ({ 
  width = 21.3, 
  height = 25, 
  color = '#00dbff' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 21.3 25">
      <Path
        d="M16.6,5.9a6,6 0,1 1,-6 -5.9A5.9,5.9 0,0 1,16.6 5.9Z"
        fill={color}
      />
      <Path
        d="M19.1,17a12.4,12.4 0,0 0,-5.4 -2.5H7.6A12.4,12.4 0,0 0,2.2 17,5.8 5.8,0 0,0 0,21.6V25H21.3V21.6A5.8,5.8 0,0 0,19.1 17Z"
        fill={color}
      />
    </Svg>
  );
};

export default UsernameIcon;
