import { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { CATEGORY_COLORS } from '../../constants/categories';

const CategoryPieChart = ({ categories }) => {
  const chartData = useMemo(() => {
    if (!categories || categories.length === 0) {
      return [];
    }

    // Calculate article count per category from the articles relationship
    const categoriesWithCounts = categories.map(cat => ({
      ...cat,
      article_count: cat.articles_count || cat.article_count || 0
    })).filter(cat => cat.article_count > 0);

    if (categoriesWithCounts.length === 0) {
      return [];
    }

    const total = categoriesWithCounts.reduce((sum, cat) => sum + cat.article_count, 0);
    
    if (total === 0) {
      return [];
    }

    let currentAngle = -90; // Start from top

    return categoriesWithCounts
      .sort((a, b) => b.article_count - a.article_count) // Sort by count descending
      .map((cat, index) => {
        const percentage = (cat.article_count / total) * 100;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        currentAngle = endAngle;

        return {
          name: cat.name,
          count: cat.article_count,
          percentage: percentage.toFixed(1),
          startAngle,
          endAngle,
          color: CATEGORY_COLORS[cat.name] || '#6b7280',
        };
      });
  }, [categories]);

  const size = 220;
  const center = size / 2;
  const radius = 80;
  const innerRadius = 50;

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x, y, radius, innerRadius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const innerStart = polarToCartesian(x, y, innerRadius, endAngle);
    const innerEnd = polarToCartesian(x, y, innerRadius, startAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'L', innerEnd.x, innerEnd.y,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      'Z'
    ].join(' ');
  };

  const formatNumber = (num) => num.toLocaleString();

  if (chartData.length === 0) {
    return (
      <View className="items-center justify-center py-10">
        <Text className="text-gray-400 text-sm font-medium">No category data available</Text>
        <Text className="text-gray-400 text-xs mt-1">Publish articles to see distribution</Text>
      </View>
    );
  }

  const totalArticles = chartData.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        <G>
          {chartData.map((slice, index) => (
            <Path
              key={`slice-${index}`}
              d={describeArc(center, center, radius, innerRadius, slice.startAngle, slice.endAngle)}
              fill={slice.color}
              opacity={0.9}
            />
          ))}
          
          {/* Center white circle for donut effect */}
          <Circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="white"
          />
          
          {/* Center text */}
          <SvgText
            x={center}
            y={center - 8}
            fontSize="24"
            fontWeight="bold"
            fill="#1f2937"
            textAnchor="middle"
          >
            {formatNumber(totalArticles)}
          </SvgText>
          <SvgText
            x={center}
            y={center + 10}
            fontSize="11"
            fill="#6b7280"
            textAnchor="middle"
            fontWeight="600"
          >
            Total Articles
          </SvgText>
        </G>
      </Svg>

      {/* Legend */}
      <View className="mt-5 w-full px-2">
        <View className="flex-row items-center justify-between mb-3 px-2">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide">Category</Text>
          <View className="flex-row gap-6">
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide w-12 text-right">Count</Text>
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide w-12 text-right">%</Text>
          </View>
        </View>
        
        {chartData.map((slice, index) => (
          <View 
            key={`legend-${index}`} 
            className="flex-row items-center justify-between mb-2.5 px-2 py-2 bg-gray-50 rounded-lg"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View 
                className="w-3 h-3 rounded-full mr-2.5" 
                style={{ backgroundColor: slice.color }}
              />
              <Text className="text-xs text-gray-800 font-medium flex-1" numberOfLines={1}>
                {slice.name}
              </Text>
            </View>
            <View className="flex-row items-center gap-6">
              <Text className="text-xs font-bold text-gray-900 w-12 text-right">
                {formatNumber(slice.count)}
              </Text>
              <Text className="text-xs font-semibold text-[#2f7cf6] w-12 text-right">
                {slice.percentage}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};



export default CategoryPieChart;
