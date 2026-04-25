import { useWindowDimensions } from 'react-native';

/**
 * Responsive utilities for scaling across different screen sizes
 * Breakpoints: small (< 375), medium (375-414), large (> 414)
 */

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  
  const isSmallPhone = width < 380;
  const isMediumPhone = width >= 380 && width < 414;
  const isLargePhone = width >= 414;
  const isTablet = width >= 768;

  return {
    width,
    height,
    isSmallPhone,
    isMediumPhone,
    isLargePhone,
    isTablet,
  };
};

/**
 * Scale values based on screen width
 * @param {number} baseValue - Base value for medium phones (375px)
 * @param {number} width - Screen width
 * @returns {number} Scaled value
 */
export const scaleSize = (baseValue, width) => {
  const scale = width / 375;
  return Math.round(baseValue * scale);
};

/**
 * Get responsive font size
 */
export const getResponsiveFontSize = (baseSize, width) => {
  return scaleSize(baseSize, width);
};

/**
 * Get responsive spacing
 */
export const getResponsiveSpacing = (baseSpacing, width) => {
  return scaleSize(baseSpacing, width);
};

/**
 * Get responsive icon size
 */
export const getResponsiveIconSize = (baseSize, width) => {
  return scaleSize(baseSize, width);
};

/**
 * Get responsive dimensions
 */
export const getResponsiveDimensions = (baseWidth, baseHeight, width) => {
  const scale = width / 375;
  return {
    width: Math.round(baseWidth * scale),
    height: Math.round(baseHeight * scale),
  };
};
