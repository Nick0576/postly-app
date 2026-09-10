// Postly — https://github.com/postly-app/postly-social-mobile
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../store/AppContext.native';
import { supabase } from '../services/supabase.native';
import { SendIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon } from '../components/native/Icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const QUESTIONS = [
  "Do you believe in love at first sight?",
  "Is communication more important than physical attraction?",
  "Do you see a future with your current partner?",
  "Would you compromise your career for love?",
  "Is honesty always the best policy in a relationship?",
  "Do you believe in second chances?",
  "Is jealousy a sign of love?",
  "Can long-distance relationships work?",
  "Do you want children in the future?",
  "Is financial stability important for a marriage?",
  "Do you believe in soulmates?",
  "Should past relationships be discussed with a current partner?",
  "Is it possible to be 'just friends' with an ex?",
  "Do you value quality time over gifts?",
  "Is trust harder to build than to break?",
  "Do you believe opposites attract?",
  "Is a sense of humor vital in a partner?",
  "Would you move to another country for love?",
  "Do you believe love can last forever?",
  "Are you ready to commit fully right now?"
];

export default function LoveModeScreen() {
  const { gender, loveMode, updateLoveMode, userProfile, addToast, triggerHapticFeedback } = useApp();
  const router = useRouter();
  const { partnerId, partnerUsername } = useLocalSearchParams<{ partnerId: string, partnerUsername: string }>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>(loveMode.answers || {});
  const [isSaving, setIsSaving] = useState(false);
  const [partnerProgress, setPartnerProgress] = useState(0);
  const [partnerCompleted, setPartnerCompleted] = useState(false);
  const [partnerAnswers, setPartnerAnswers] = useState<Record<number, boolean>>({});

  const yesScale = useSharedValue(1);
  const noScale = useSharedValue(1);
  const questionOpacity = useSharedValue(1);

  const amICompleted = Object.keys(answers).length === QUESTIONS.length && loveMode.isCompleted;
  const showResults = amICompleted && partnerCompleted;
  const showWaiting = amICompleted && !partnerCompleted;

  useEffect(() => {
    if (partnerId && partnerId !== loveMode.partnerId) {
      updateLoveMode({ partnerId, answers: {}, isCompleted: false });
      setAnswers({});
    }

    const targetPartnerId = partnerId || loveMode.partnerId;
    if (!targetPartnerId) return;

    const channel = supabase
      .channel(`love_mode_${userProfile.id}_${targetPartnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'love_mode_results',
          filter: `user_id=eq.${targetPartnerId}`
        },
        (payload) => {
          const data = payload.new as any;
          if (data && data.partner_id === userProfile.id) {
            const ans = data.answers || {};
            const ansCount = Object.keys(ans).length;
            setPartnerProgress((ansCount / QUESTIONS.length) * 100);
            setPartnerCompleted(!!data.is_completed);
            setPartnerAnswers(ans);

            if (data.is_completed) {
              triggerHapticFeedback('medium');
              addToast(`${partnerUsername || 'Your partner'} finished their questions!`, 'success');
            }
          }
        }
      )
      .subscribe();

    const fetchPartnerData = async () => {
        const { data } = await supabase
            .from('love_mode_results')
            .select('answers, is_completed')
            .eq('user_id', targetPartnerId)
            .eq('partner_id', userProfile.id)
            .maybeSingle();

        if (data) {
            const ans = data.answers || {};
            const ansCount = Object.keys(ans).length;
            setPartnerProgress((ansCount / QUESTIONS.length) * 100);
            setPartnerCompleted(!!data.is_completed);
            setPartnerAnswers(ans);
        }
    };
    fetchPartnerData();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId, loveMode.partnerId]);

  const saveIncrementalProgress = async (newAnswers: Record<number, boolean>) => {
    try {
      const isDone = Object.keys(newAnswers).length === QUESTIONS.length;
      await supabase
        .from('love_mode_results')
        .upsert({
          user_id: userProfile.id,
          partner_id: partnerId || loveMode.partnerId,
          answers: newAnswers,
          is_completed: isDone,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, partner_id' });

      if (isDone) {
          updateLoveMode({ isCompleted: true, answers: newAnswers });
      }
    } catch (e) {
      console.error("Incremental save failed", e);
    }
  };

  const handleAnswer = (val: boolean) => {
    triggerHapticFeedback('light');

    if (val) {
        yesScale.value = withSequence(withSpring(1.2), withSpring(1));
    } else {
        noScale.value = withSequence(withSpring(1.2), withSpring(1));
    }

    const newAnswers = { ...answers, [currentIndex]: val };
    setAnswers(newAnswers);
    updateLoveMode({ answers: newAnswers });

    saveIncrementalProgress(newAnswers);

    if (currentIndex < QUESTIONS.length - 1) {
      questionOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );
      setTimeout(() => setCurrentIndex(currentIndex + 1), 100);
    }
  };

  const handleComplete = async () => {
    if (Object.keys(answers).length < QUESTIONS.length) {
      Alert.alert("Incomplete", "Please answer all 20 questions before submitting.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('love_mode_results')
        .upsert({
          user_id: userProfile.id,
          partner_id: partnerId || loveMode.partnerId,
          answers: answers,
          is_completed: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, partner_id' });

      if (error) throw error;

      await supabase.from('messages').insert({
          sender_id: userProfile.id,
          receiver_id: partnerId || loveMode.partnerId,
          text: "I've completed my Love Mode questions! See how we match.",
          type: 'love_update',
          love_mode_data: { completed: true }
      });

      updateLoveMode({ isCompleted: true });
      addToast("Love Mode answers submitted!", "success");
      // Don't router.back(), let them see the "Waiting" or "Results" screen
    } catch (error) {
      console.error("Error saving love mode results:", error);
      addToast("Failed to save results.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateMatch = () => {
    let matches = 0;
    Object.keys(answers).forEach((key: any) => {
        if (answers[key] === partnerAnswers[key]) {
            matches++;
        }
    });
    return Math.round((matches / QUESTIONS.length) * 100);
  };

  const themeColor = gender === 'girl' ? 'pink' : 'blue';
  const progress = (Object.keys(answers).length / QUESTIONS.length) * 100;

  const yesStyle = useAnimatedStyle(() => ({
    transform: [{ scale: yesScale.value }]
  }));

  const noStyle = useAnimatedStyle(() => ({
    transform: [{ scale: noScale.value }]
  }));

  const questionStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
    transform: [{ scale: questionOpacity.value * 0.1 + 0.9 }]
  }));

  if (showResults) {
      const matchPercent = calculateMatch();
      return (
        <SafeAreaView className={`flex-1 ${gender === 'girl' ? 'bg-pink-950' : 'bg-blue-950'}`}>
            <Stack.Screen options={{ title: 'Match Result', headerTransparent: true, headerTintColor: '#fff' }} />
            <ScrollView className="flex-1 px-6 pt-20">
                <View className="items-center mb-8">
                    <View className="w-48 h-48 rounded-full items-center justify-center border-8 border-white/20 bg-black/20">
                        <Text className="text-white text-6xl font-black">{matchPercent}%</Text>
                        <Text className="text-white/60 font-bold uppercase tracking-widest text-xs">Match Score</Text>
                    </View>
                    <Text className="text-white text-2xl font-bold mt-6 text-center">
                        {matchPercent > 80 ? "Perfect Harmony! 💖" : matchPercent > 50 ? "Great Connection! ✨" : "Different Perspectives! 🌈"}
                    </Text>
                </View>

                <View className="bg-black/30 rounded-3xl p-6 border border-white/10 mb-20">
                    <Text className="text-white/60 font-bold mb-4 uppercase text-xs tracking-widest">Answer Breakdown</Text>
                    {QUESTIONS.map((q, i) => (
                        <View key={i} className="flex-row items-center py-3 border-b border-white/5">
                            <View className={`w-2 h-2 rounded-full mr-3 ${answers[i] === partnerAnswers[i] ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-red-400'}`} />
                            <Text className="text-white/80 flex-1 text-sm" numberOfLines={1}>{q}</Text>
                            <Text className="text-white/40 text-xs font-bold ml-2">
                                {answers[i] ? 'YES' : 'NO'} / {partnerAnswers[i] ? 'YES' : 'NO'}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
      );
  }

  if (showWaiting) {
      return (
        <SafeAreaView className={`flex-1 ${gender === 'girl' ? 'bg-pink-950' : 'bg-blue-950'} items-center justify-center px-8`}>
            <Stack.Screen options={{ title: 'Waiting...', headerTransparent: true, headerTintColor: '#fff' }} />
            <HeartIcon color="#fff" size={64} style={{ opacity: 0.2 }} />
            <Text className="text-white text-3xl font-black text-center mt-6">Results Pending</Text>
            <Text className="text-white/60 text-center mt-4 text-lg">
                You've finished your questions! We're waiting for @{partnerUsername || 'your partner'} to complete theirs.
            </Text>
            <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
            <Pressable onPress={() => router.back()} className="mt-12 bg-white/10 px-8 py-4 rounded-full">
                <Text className="text-white font-bold">Go Back to Chat</Text>
            </Pressable>
        </SafeAreaView>
      );
  }

  return (
    <SafeAreaView className={`flex-1 ${gender === 'girl' ? 'bg-pink-950' : 'bg-blue-950'}`}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Love Mode',
        headerStyle: { backgroundColor: gender === 'girl' ? '#500724' : '#172554' },
        headerTintColor: '#fff'
      }} />

      <View className="px-6 py-4">
        {/* Your Progress Bar */}
        <View className="flex-row justify-between mb-1">
            <Text className="text-white/60 text-xs font-bold uppercase tracking-widest">Your Progress</Text>
            <Text className="text-white/60 text-xs font-bold">{Math.round(progress)}%</Text>
        </View>
        <View className="h-2 bg-black/20 rounded-full overflow-hidden mb-4">
          <View
            style={{ width: `${progress}%` }}
            className={`h-full ${gender === 'girl' ? 'bg-pink-500' : 'bg-blue-500'}`}
          />
        </View>

        {/* Partner Progress Bar */}
        <View className="flex-row justify-between mb-1">
            <Text className="text-white/40 text-xs font-bold uppercase tracking-widest">
                {partnerUsername ? `@${partnerUsername}` : 'Partner'}'s Progress
            </Text>
            <Text className="text-white/40 text-xs font-bold">{Math.round(partnerProgress)}%</Text>
        </View>
        <View className="h-1.5 bg-black/20 rounded-full overflow-hidden">
          <View
            style={{ width: `${partnerProgress}%` }}
            className="h-full bg-white/30"
          />
        </View>

        <Text className="text-white/60 text-center mt-4 font-medium">
          Question {currentIndex + 1} of {QUESTIONS.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-8">
        <Animated.View style={questionStyle} className="bg-black/30 p-8 rounded-3xl border border-white/10 shadow-2xl">
          <View className="items-center mb-4">
            <HeartIcon color={gender === 'girl' ? '#ec4899' : '#3b82f6'} size={32} />
          </View>
          <Text className="text-white text-3xl font-bold text-center leading-tight">
            {QUESTIONS[currentIndex]}
          </Text>
        </Animated.View>

        <View className="flex-row mt-12 space-x-6 justify-center">
          <Animated.View style={noStyle}>
            <Pressable
                onPress={() => handleAnswer(false)}
                className="w-32 h-32 rounded-full bg-blue-500 items-center justify-center border-4 border-blue-400 shadow-lg"
            >
                <Text className="text-white text-2xl font-black italic">NO</Text>
            </Pressable>
          </Animated.View>

          <Animated.View style={yesStyle}>
            <Pressable
                onPress={() => handleAnswer(true)}
                className="w-32 h-32 rounded-full bg-pink-500 items-center justify-center border-4 border-pink-400 shadow-lg"
            >
                <Text className="text-white text-2xl font-black italic">YES</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>

      <View className="px-6 py-8 flex-row justify-between items-center border-t border-white/5 bg-black/20">
        <Pressable
          onPress={() => {
            triggerHapticFeedback('light');
            setCurrentIndex(prev => Math.max(0, prev - 1));
          }}
          disabled={currentIndex === 0}
          className={`p-4 rounded-full ${currentIndex === 0 ? 'opacity-30' : 'bg-white/10'}`}
        >
          <ChevronLeftIcon color="#fff" size={24} />
        </Pressable>

        {Object.keys(answers).length === QUESTIONS.length ? (
          <Pressable
            onPress={handleComplete}
            disabled={isSaving}
            className={`px-8 py-4 rounded-full flex-row items-center shadow-lg ${gender === 'girl' ? 'bg-pink-600' : 'bg-blue-600'}`}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text className="text-white font-bold mr-2 uppercase tracking-widest">Submit Results</Text>
                <SendIcon color="#fff" size={18} />
              </>
            )}
          </Pressable>
        ) : (
          <View className="px-6 py-4 flex-row items-center">
             <Text className="text-white/40 font-bold uppercase tracking-tighter mr-2">Keep going</Text>
             <HeartIcon color="rgba(255,255,255,0.2)" size={16} />
          </View>
        )}

        <Pressable
          onPress={() => {
            triggerHapticFeedback('light');
            setCurrentIndex(prev => Math.min(QUESTIONS.length - 1, prev + 1));
          }}
          disabled={currentIndex === QUESTIONS.length - 1}
           className={`p-4 rounded-full ${currentIndex === QUESTIONS.length - 1 ? 'opacity-30' : 'bg-white/10'}`}
        >
          <ChevronRightIcon color="#fff" size={24} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
