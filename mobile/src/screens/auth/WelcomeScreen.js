import {
  View, Text, ImageBackground, Image,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const bg = require('../../../assets/bg.jpg');
const logo = require('../../../assets/logo.png');
const textlogo = require('../../../assets/la verdad herald.png');

export default function WelcomeScreen({ navigation }) {
  return (
    <View className="flex-1">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground source={bg} className="flex-1" resizeMode="cover" blurRadius={4} style={{ opacity: 0.9 }}>
        {/* Dark overlay */}
        <View className="absolute inset-0" style={{ backgroundColor: '#2C5F7F' }} />

        <SafeAreaView className="flex-1 items-center justify-between px-4 py-20">

          {/* Logo + title block */}
          <View className="flex-1 items-center justify-center">
            <Image
              source={logo}
              style={{ width: 260, height: 150, marginBottom: 14 }}
              resizeMode="contain"
            />
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
          <View className="w-full items-center gap-4 -mb-4 mt-12">
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              className="w-2/3 rounded-full items-center mb-2"
              style={{ backgroundColor: '#0686f6ff', paddingVertical: 24 }}
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold text-lg">Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              className="w-2/3 rounded-full items-center mb-2"
              style={{ backgroundColor: '#f8b200', paddingVertical: 24 }}
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold text-lg">Sign Up</Text>
            </TouchableOpacity>

          
          </View>

        </SafeAreaView>
      </ImageBackground>

      {/* White view at the bottom */}
      <View className="h-20 bg-sky-900" />
    </View>
  );
}
