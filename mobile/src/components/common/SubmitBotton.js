import { View, Text } from 'react-native'
import React from 'react'

const SubmitBotton = () => {
  return (
    <View>
        <TouchableOpacity
                   onPress={() => navigation.navigate('Register')}
                   className="w-2/3 rounded-full items-center mb-4"
                   style={{ backgroundColor: '#0686f6ff', paddingVertical: 20 }}
                   activeOpacity={0.85}
       ></TouchableOpacity>
    </View>
  )
}

export default SubmitBotton