import { Fragment, useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Svg, { Line, Path, Rect, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';

const EnhancedGrowthChart = ({ chart }) => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [timePeriod, setTimePeriod] = useState('monthly');
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Get real data from backend based on time period
  const chartData = useMemo(() => {
    if (!chart) {
      return { values: [], labels: [] };
    }

    if (timePeriod === 'yearly' && chart.yearly) {
      return {
        values: chart.yearly.data || [],
        labels: chart.yearly.labels || [],
      };
    }

    // Default to monthly
    return {
      values: chart.monthly?.data || [],
      labels: chart.monthly?.labels || [],
    };
  }, [chart, timePeriod]);

  const chartValues = useMemo(() => chartData.values.length > 0 ? chartData.values : [0], [chartData.values]);
  const chartLabels = useMemo(() => chartData.labels.length > 0 ? chartData.labels : ['No Data'], [chartData.labels]);

  const chartWidth = 300;
  const chartHeight = 240;
  const paddingLeft = 45;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 35;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const { minValue, maxValue, points, smoothPathData, fillPath } = useMemo(() => {
    const min = Math.min(...chartValues);
    const max = Math.max(...chartValues);
    const span = Math.max(max - min, 1);

    const pts = chartValues.map((value, index) => {
      const x = paddingLeft + (index / Math.max(chartValues.length - 1, 1)) * innerWidth;
      const y = paddingTop + innerHeight - ((value - min) / span) * innerHeight;
      return { x, y, value, label: chartLabels[index] || `${index + 1}` };
    });

    // Smooth bezier curve path
    let smoothPath = '';
    pts.forEach((point, index) => {
      if (index === 0) {
        smoothPath += `M ${point.x} ${point.y}`;
      } else {
        const prevPoint = pts[index - 1];
        const controlX1 = prevPoint.x + (point.x - prevPoint.x) / 3;
        const controlY1 = prevPoint.y;
        const controlX2 = prevPoint.x + (2 * (point.x - prevPoint.x)) / 3;
        const controlY2 = point.y;
        smoothPath += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${point.x} ${point.y}`;
      }
    });

    // Fill path (from line to bottom)
    const lastPoint = pts[pts.length - 1];
    const firstPoint = pts[0];
    const fill = `${smoothPath} L ${lastPoint.x} ${paddingTop + innerHeight} L ${firstPoint.x} ${paddingTop + innerHeight} Z`;

    return {
      minValue: min,
      maxValue: max,
      points: pts,
      smoothPathData: smoothPath,
      fillPath: fill,
    };
  }, [chartValues, chartLabels, innerWidth, innerHeight, paddingLeft, paddingTop]);

  // Animate line on mount or data change
  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [chartValues, timePeriod, animatedValue]);

  const yLabels = 5;
  const xLabelsCount = Math.min(chartValues.length, timePeriod === 'yearly' ? 4 : 6);

  const handlePointPress = (point, index) => {
    setSelectedPoint(selectedPoint?.index === index ? null : { ...point, index });
  };

  const timePeriods = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
  ];

  // Format number with commas
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <View className="mt-4">
      {/* Time Period Selector */}
      <View className="flex-row justify-center gap-2 mb-4 px-4">
        {timePeriods.map((period) => (
          <TouchableOpacity
            key={period.key}
            onPress={() => setTimePeriod(period.key)}
            className={`flex-1 py-2.5 rounded-lg ${
              timePeriod === period.key ? 'bg-[#2f7cf6]' : 'bg-gray-100'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-center text-sm font-bold ${
                timePeriod === period.key ? 'text-white' : 'text-gray-600'
              }`}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart Container */}
      <View className="rounded-xl bg-white p-4 shadow-sm" style={{ borderWidth: 1, borderColor: '#e5e7eb' }}>
        <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Defs>
            <SvgLinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#2f7cf6" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#2f7cf6" stopOpacity="0.02" />
            </SvgLinearGradient>
          </Defs>

          <Rect x="0" y="0" width={chartWidth} height={chartHeight} fill="#ffffff" />

          {/* Y-axis grid lines and labels */}
          {Array.from({ length: yLabels + 1 }).map((_, index) => {
            const y = paddingTop + (innerHeight / yLabels) * index;
            const labelValue = Math.round(maxValue - ((maxValue - minValue) / yLabels) * index);

            return (
              <Fragment key={`grid-y-${index}`}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <SvgText
                  x={paddingLeft - 10}
                  y={y + 4}
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="end"
                  fontWeight="600"
                >
                  {formatNumber(labelValue)}
                </SvgText>
              </Fragment>
            );
          })}

          {/* X-axis labels */}
          {Array.from({ length: xLabelsCount }).map((_, index) => {
            const x = paddingLeft + (index / Math.max(xLabelsCount - 1, 1)) * innerWidth;
            const valueIndex = Math.round(
              (index / Math.max(xLabelsCount - 1, 1)) * (chartValues.length - 1)
            );
            const label = chartLabels[valueIndex] || `${valueIndex + 1}`;

            return (
              <SvgText
                key={`grid-x-${index}`}
                x={x}
                y={chartHeight - 12}
                fontSize="10"
                fill="#6b7280"
                textAnchor="middle"
                fontWeight="600"
              >
                {label}
              </SvgText>
            );
          })}

          {/* Gradient fill under the line */}
          <Path d={fillPath} fill="url(#chartGradient)" />

          {/* Smooth line path */}
          <Path
            d={smoothPathData}
            fill="none"
            stroke="#2f7cf6"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <Fragment key={`point-${index}`}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={selectedPoint?.index === index ? 6 : 4}
                fill="white"
                stroke="#2f7cf6"
                strokeWidth={selectedPoint?.index === index ? 3 : 2}
                onPress={() => handlePointPress(point, index)}
              />
            </Fragment>
          ))}

          {/* Tooltip for selected point */}
          {selectedPoint && (
            <Fragment>
              {/* Vertical line from point to bottom */}
              <Line
                x1={selectedPoint.x}
                y1={selectedPoint.y}
                x2={selectedPoint.x}
                y2={paddingTop + innerHeight}
                stroke="#2f7cf6"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity={0.5}
              />
              
              {/* Tooltip background */}
              <Rect
                x={selectedPoint.x - 35}
                y={selectedPoint.y - 50}
                width={70}
                height={38}
                rx={8}
                fill="#1f2937"
                opacity={0.95}
              />
              
              {/* Tooltip value */}
              <SvgText
                x={selectedPoint.x}
                y={selectedPoint.y - 32}
                fontSize="14"
                fill="white"
                textAnchor="middle"
                fontWeight="bold"
              >
                {formatNumber(selectedPoint.value)}
              </SvgText>
              
              {/* Tooltip label */}
              <SvgText
                x={selectedPoint.x}
                y={selectedPoint.y - 18}
                fontSize="10"
                fill="#d1d5db"
                textAnchor="middle"
              >
                {selectedPoint.label}
              </SvgText>
            </Fragment>
          )}
        </Svg>

        {/* Legend */}
        <View className="flex-row items-center justify-center mt-4 pt-3 border-t border-gray-100">
          <View className="w-6 h-1 bg-[#2f7cf6] rounded-full" />
          <Text className="ml-2 text-xs text-gray-600 font-semibold">
            Cumulative Readership Growth
          </Text>
        </View>
      </View>
    </View>
  );
};

export default EnhancedGrowthChart;
