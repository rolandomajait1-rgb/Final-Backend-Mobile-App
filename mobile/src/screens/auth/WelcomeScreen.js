import {
  View, Text, ImageBackground, Image,
  TouchableOpacity, StatusBar, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const bg = require('../../../assets/bg.jpg');
const logo = require('../../../assets/logo.png');
const textlogo = require('../../../assets/la verdad herald.png');

export default function WelcomeScreen({ navigation }) {
  const { width } = useWindowDimensions();

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <ImageBackground source={bg} className="flex-1" resizeMode="cover" style={{ opacity: 0.9 }}>
        {/* Dark overlay */}
        <View className="absolute inset-0" style={{ backgroundColor: '#2C5F7F' }} />

        <SafeAreaView className="flex-1 items-center justify-between px-4 py-16">

          {/* Logo + title block */}
          <View className="flex-1 items-center justify-center">
            {/* Logo */}
            <View style={{ width: width < 375 ? 220 : 260, height: width < 375 ? 130 : 150, marginBottom: 14, alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={logo}
                style={{ width: width < 375 ? 220 : 260, height: width < 375 ? 130 : 150 }}
                resizeMode="contain"
              />
            </View>
            <Image
              source={textlogo}
              style={{ width: 360, height: 54 }}
              resizeMode="contain"
            />
            <Text className="text-gray-300 text-lg text-center px-2 mt-2">
              The Official Higher Education Student Publication of{'\n'}
              La Verdad Christian College, Inc.
            </Text>
          </View>

          {/* Action buttons */}
          <View className="w-full items-center gap-4 mb-8">
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              className="w-2/3 rounded-full items-center"
              style={{ backgroundColor: '#0686f6ff', paddingVertical: 20 }}
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold text-lg">Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              className="w-2/3 rounded-full items-center"
              style={{ backgroundColor: '#f8b200', paddingVertical: 20 }}
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold text-lg">Sign Up</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </ImageBackground>
        <View className="h-28 bg-sky-800" />
    </View>
  );
}
