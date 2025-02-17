import { Stack } from 'expo-router';
import { TransactionProvider } from './contexts/TransactionContext';
import { useState } from 'react';

export default function RootLayout() {
  return (
    <TransactionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="index"
        />
        <Stack.Screen
          name="components/Auth/login"
        />
        <Stack.Screen
          name="components/Auth/register"
        />
        <Stack.Screen
          name="components/Dashboard/dashboard"
        />
        <Stack.Screen
          name="components/Dashboard/chatbot" // Add Chatbot route
        />
      </Stack>
    </TransactionProvider>
  );
}