// Postly Social — https://github.com/postly-app/postly-social-mobile
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext.native';
import {
  getUserPosts,
  getUserReposts,
  getSavedPosts,
  getFollowerCount,
  getFollowingCount,
} from '../../services/apiService';
import { supabase } from '../../services/supabase.native';
import UserAvatar from '../../components/native/UserAvatar';
import RenderUserContent from '../../components/native/RenderUserContent';
import { VerifiedIcon, ThreeDotsVerticalIcon, ChevronDownIcon, PlusIcon, XIcon, TrashIcon, UserIcon } from '../../components/native/Icons';
import PostSkeleton from '../../components/native/PostSkeleton';
import type { Post, SavedAccount } from '../../types';
import { Modal, ScrollView, TouchableOpacity } from 'react-native';

const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const screenWidth = Dimensions.get('window').width;
const tileSize = (screenWidth - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type TabType = 'posts' | 'reposts' | 'saved';

// ─── Grid Tile ───────────────────────────────────

const GridTile: React.FC<{ post: Post; onPress: () => void }> = React.memo(({ post, onPress }) => {
  const isTextPost = post.media_type === 'text' || !post.media;

  return (
    <Pressable
      onPress={onPress}
      style={{ width: tileSize, height: tileSize, marginRight: GRID_GAP, marginBottom: GRID_GAP }}
    >
      {isTextPost ? (
        <View className="flex-1 p-2 justify-center bg-gray-800">
          <Text className="text-white text-xs" numberOfLines={6}>
            {post.content}
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri: post.media_preview_url || post.media }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
      )}
    </Pressable>
  );
});

// ─── Profile Screen ──────────────────────────────

export default function ProfileScreen() {
  const { userProfile, refreshAllData, addToast, followedUsernames, savedAccounts, switchAccount, removeSavedAccount, logout } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [reposts, setReposts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const [userPosts, userReposts, userSaved, followers, following] = await Promise.all([
        getUserPosts(userProfile.id),
        getUserReposts(userProfile.id),
        getSavedPosts(userProfile.id),
        getFollowerCount(userProfile.id),
        getFollowingCount(userProfile.id),
      ]);
      setPosts(userPosts);
      setReposts(userReposts);
      setSavedPosts(userSaved);
      setFollowerCount(followers);
      setFollowingCount(following);
    } catch (error) {
      console.error('Profile fetch error:', error);
      addToast('Failed to load profile data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    setFollowingCount(followedUsernames.size);
  }, [followedUsernames]);

  // Realtime: own posts
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel(`profile-posts-${userProfile.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${userProfile.id}` },
        () => { fetchAll(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id, fetchAll]);

  // Realtime: follow counts
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel(`profile-follows-${userProfile.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        async (payload) => {
          const f = payload.new as any;
          const o = payload.old as any;
          if (f?.follower_id === userProfile.id || f?.followed_id === userProfile.id ||
              o?.follower_id === userProfile.id || o?.followed_id === userProfile.id) {
            const [followers, following] = await Promise.all([
              getFollowerCount(userProfile.id),
              getFollowingCount(userProfile.id),
            ]);
            setFollowerCount(followers);
            setFollowingCount(following);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchAll(), refreshAllData()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAll, refreshAllData]);

  const currentData = activeTab === 'posts' ? posts : activeTab === 'reposts' ? reposts : savedPosts;

  const handlePostPress = useCallback((post: Post) => {
    router.push(`/post/${post.id}`);
  }, []);

  if (!userProfile) return null;

  // ─── Profile Header ────────────────────────────

  const ProfileHeader = () => (
    <View>
      <View className="px-4 py-3 border-b border-gray-800 flex-row justify-between items-center">
        <Pressable
          onPress={() => setShowAccountSwitcher(true)}
          className="flex-row items-center"
        >
          <Text className="text-white font-bold text-xl mr-1">@{userProfile.username}</Text>
          <ChevronDownIcon color="#fff" size={18} />
        </Pressable>
        <View className="flex-row items-center">
          <Pressable
            onPress={() => setShowAccountSwitcher(true)}
            className="p-2"
            hitSlop={8}
            accessibilityLabel="Switch Account"
          >
            <UserIcon color="#fff" size={22} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            className="p-2"
            hitSlop={8}
            accessibilityLabel="Settings"
          >
            <ThreeDotsVerticalIcon color="#fff" size={22} />
          </Pressable>
        </View>
      </View>

      <AccountSwitcherModal
        visible={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />

      <View className="p-4">
        <View className="flex-row items-center">
          <UserAvatar
            username={userProfile.username}
            avatarUrl={userProfile.profilePicture}
            size={80}
          />
          <View className="flex-1 flex-row justify-around ml-4">
            <View className="items-center">
              <Text className="text-white font-bold text-lg">{posts.length}</Text>
              <Text className="text-gray-500 text-sm">Posts</Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: '/user-list', params: { type: 'followers', userId: userProfile.id, title: 'Followers' } })}
              className="items-center"
            >
              <Text className="text-white font-bold text-lg">{followerCount}</Text>
              <Text className="text-gray-500 text-sm">Followers</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push({ pathname: '/user-list', params: { type: 'following', userId: userProfile.id, title: 'Following' } })}
              className="items-center"
            >
              <Text className="text-white font-bold text-lg">{followingCount}</Text>
              <Text className="text-gray-500 text-sm">Following</Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-4">
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <Text className="text-white text-xl font-bold">@{userProfile.username}</Text>
            {userProfile.isVerified && <VerifiedIcon color="#3b82f6" size={18} />}
          </View>
          <Text className="text-gray-400">{userProfile.name}</Text>
          {userProfile.bio ? (
            <View className="mt-2">
              <RenderUserContent content={userProfile.bio} className="text-white" />
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={() => router.push('/settings')}
          className="mt-4 bg-gray-800 py-2 rounded-full items-center"
        >
          <Text className="text-white font-semibold">Edit Profile</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-800">
        {(['posts', 'reposts', 'saved'] as TabType[]).map(tab => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 items-center ${activeTab === tab ? 'border-b-2 border-white' : ''}`}
          >
            <Text className={`font-semibold capitalize ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  // ─── Render ────────────────────────────────────

  const renderItem = useCallback(({ item }: { item: Post }) => (
    <GridTile post={item} onPress={() => handlePostPress(item)} />
  ), [handlePostPress]);

  const AccountSwitcherModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/60" onPress={onClose}>
        <View className="mt-auto bg-gray-900 rounded-t-3xl p-6" onStartShouldSetResponder={() => true}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-xl font-bold">Switch Account</Text>
            <Pressable onPress={onClose}>
              <XIcon color="#fff" size={24} />
            </Pressable>
          </View>

          <ScrollView className="max-h-96">
            {savedAccounts.map((account) => (
              <View key={account.id} className="flex-row items-center justify-between mb-4">
                <Pressable
                  className="flex-row items-center flex-1"
                  onPress={async () => {
                    if (account.id !== userProfile.id) {
                      await switchAccount(account.id);
                    }
                    onClose();
                  }}
                >
                  <UserAvatar
                    username={account.username}
                    avatarUrl={account.profilePicture}
                    size={50}
                  />
                  <View className="ml-3">
                    <Text className="text-white font-bold">{account.name}</Text>
                    <Text className="text-gray-500">@{account.username}</Text>
                  </View>
                  {account.id === userProfile.id && (
                    <View className="ml-auto bg-blue-500/20 px-2 py-1 rounded">
                      <Text className="text-blue-500 text-xs font-bold">Current</Text>
                    </View>
                  )}
                </Pressable>

                {account.id !== userProfile.id && (
                  <Pressable
                    className="ml-4 p-2"
                    onPress={() => removeSavedAccount(account.id)}
                  >
                    <TrashIcon color="#ef4444" size={20} />
                  </Pressable>
                )}
              </View>
            ))}

            {savedAccounts.length < 5 && (
              <Pressable
                className="flex-row items-center py-2 mb-4"
                onPress={async () => {
                  onClose();
                  await logout();
                  router.replace('/(auth)/login');
                }}
              >
                <View className="w-[50px] h-[50px] rounded-full bg-gray-800 items-center justify-center">
                  <PlusIcon color="#fff" size={24} />
                </View>
                <Text className="text-white font-bold ml-3">Add Account</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  const emptyMessage = activeTab === 'posts'
    ? 'No posts yet.'
    : activeTab === 'reposts'
    ? "You haven't reposted anything yet."
    : "You haven't saved any posts yet.";

  return (
    <SafeAreaView className="flex-1 bg-black">
      <FlatList
        data={currentData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={ProfileHeader}
        ListEmptyComponent={
          isLoading ? (
            <View className="py-4">
              <PostSkeleton />
              <PostSkeleton />
            </View>
          ) : (
            <View className="py-20 items-center">
              <Text className="text-gray-500 text-lg">{emptyMessage}</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}
