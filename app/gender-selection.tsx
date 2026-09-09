// Postly — https://github.com/postly-app/postly-social-mobile
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../store/AppContext.native';
import { Gender } from '../types';

export default function GenderSelectionScreen() {
  const { setGender } = useApp();
  const router = useRouter();

  const handleSelect = (gender: Gender) => {
    setGender(gender);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-black px-6 justify-center">
      <View className="items-center mb-12">
        <Text className="text-white text-3xl font-bold text-center">
          Welcome to Postly
        </Text>
        <Text className="text-gray-400 text-center mt-4 text-lg">
          To personalize your experience, please select your gender.
        </Text>
      </View>

      <View className="space-y-4">
        <Pressable
          onPress={() => handleSelect('boy')}
          className="bg-blue-600 py-6 rounded-2xl items-center border-2 border-blue-400"
        >
          <Text className="text-white text-2xl font-bold">BOY</Text>
          <Text className="text-blue-100 mt-1">Light Blue Theme</Text>
        </Pressable>

        <Pressable
          onPress={() => handleSelect('girl')}
          className="bg-pink-600 py-6 rounded-2xl items-center border-2 border-pink-400 mt-6"
        >
          <Text className="text-white text-2xl font-bold">GIRL</Text>
          <Text className="text-pink-100 mt-1">Pink Theme</Text>
        </Pressable>
      </View>

      <Text className="text-gray-600 text-center mt-12 text-sm px-4">
        This choice will determine your profile's theme and special interactions like Love Mode.
      </Text>
    </SafeAreaView>
  );
}
