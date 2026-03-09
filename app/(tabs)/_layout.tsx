import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../lib/theme';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.warmWhite,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⌂" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="✦" label="Orders" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Craft',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="◆" label="Craft" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="◇" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 2,
    minWidth: 64,
  },
  tabIconFocused: {
    backgroundColor: `${Colors.rose}15`,
  },
  tabEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'DMSans',
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  tabLabelFocused: {
    color: Colors.rose,
    fontWeight: '600',
  },
});
