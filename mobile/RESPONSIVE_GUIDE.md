# Responsive Design Guide for Mobile App

## Overview
All components should be responsive across different screen sizes:
- Small phones: < 375px (iPhone SE, iPhone 6/7/8)
- Medium phones: 375-414px (iPhone 12/13, Pixel 5)
- Large phones: > 414px (iPhone 14 Pro Max, Pixel 6 Pro)
- Tablets: >= 768px

## Using Responsive Utilities

### Import
```javascript
import { useResponsive, scaleSize } from '../../utils/responsiveUtils';
```

### In Component
```javascript
const { width, isSmallPhone, isMediumPhone, isLargePhone, isTablet } = useResponsive();
```

### Scale Values
```javascript
// Scale font sizes
const fontSize = scaleSize(16, width); // 16 is base for 375px

// Scale spacing
const padding = scaleSize(16, width);

// Scale dimensions
const { width: scaledWidth, height: scaledHeight } = getResponsiveDimensions(260, 150, width);
```

## NativeWind Classes for Responsive Design

### Font Sizes
- `text-xs` → 12px (small phones)
- `text-sm` → 14px
- `text-base` → 16px
- `text-lg` → 18px
- `text-xl` → 20px
- `text-2xl` → 24px

### Spacing
- `p-2` → 8px
- `p-3` → 12px
- `p-4` → 16px
- `p-5` → 20px
- `p-6` → 24px

### Width/Height
- Use `flex-1` for flexible sizing
- Use `w-full` for full width
- Use `w-2/3`, `w-1/2` for proportional sizing

## Common Patterns

### Responsive Text
```javascript
<Text className={`${isSmallPhone ? 'text-lg' : 'text-2xl'} font-bold`}>
  Title
</Text>
```

### Responsive Padding
```javascript
<View className={`${isSmallPhone ? 'p-2' : 'p-4'} bg-white`}>
  Content
</View>
```

### Responsive Icon Size
```javascript
<Ionicons 
  name="menu" 
  size={isSmallPhone ? 24 : 32} 
  color="white" 
/>
```

### Responsive Dimensions
```javascript
const { width: logoWidth, height: logoHeight } = getResponsiveDimensions(260, 150, width);
<View style={{ width: logoWidth, height: logoHeight }}>
  <Image source={logo} />
</View>
```

## Components to Update (Priority Order)

1. **ProfileScreen** - Avatar, header sizing
2. **ArticleMediumCard** - Image, text sizing
3. **ArticleLargeCard** - Image, spacing
4. **WelcomeScreen** - Logo, buttons
5. **HomeScreen** - Cards, spacing
6. **All Card Components** - Consistent sizing

## Testing
Test on:
- iPhone SE (375px)
- iPhone 12 (390px)
- iPhone 14 Pro Max (430px)
- iPad (768px+)

## Notes
- Always use `useResponsive()` hook for dynamic sizing
- Prefer NativeWind classes over inline styles
- Use `scaleSize()` for precise scaling
- Test on multiple devices before committing
