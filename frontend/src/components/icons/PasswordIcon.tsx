/**
 * Password Icon - Vector drawable converted to React Native
 * Original: ic_password_icon.xml
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PasswordIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const PasswordIcon: React.FC<PasswordIconProps> = ({ 
  width = 20.9, 
  height = 28.2, 
  color = '#00dbff' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 20.9 28.2">
      <Path
        d="M6.1,9.7v-3a4.3,4.3 0,0 1,4.3 -4.3,4.3 4.3,0 0,1 4.3,4.3v3h2.5v-3A6.8,6.8 0,0 0,10.4 0,6.7 6.7,0 0,0 3.7,6.7v3Z"
        fill={color}
      />
      <Path
        d="M18.3,12.2H2.5A2.6,2.6 0,0 0,0 14.8V25.6a2.6,2.6 0,0 0,2.5 2.6H18.3a2.6,2.6 0,0 0,2.6 -2.6V14.8A2.6,2.6 0,0 0,18.3 12.2ZM10.4,23.9a2.6,2.6 0,0 1,-2.6 -2.6,2.5 2.5,0 0,1 1,-2.1 2.8,2.8 0,0 1,-0.4 -1.3,2 2,0 0,1 2,-2.1 2.1,2.1 0,0 1,2.1 2.1,2.1 2.1,0 0,1 -0.5,1.3 2.4,2.4 0,0 1,1.1 2.1A2.7,2.7 0,0 1,10.4 23.9Z"
        fill={color}
      />
    </Svg>
  );
};

export default PasswordIcon;
