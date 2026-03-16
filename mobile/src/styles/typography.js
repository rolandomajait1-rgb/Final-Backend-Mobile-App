import { Platform } from 'react-native';

const typography = {
  fontFamily: {
    serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    sans: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    display: 36,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export default typography;
