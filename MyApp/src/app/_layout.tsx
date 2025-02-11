import { Stack } from 'expo-router';

export default function Layout() {
  return (
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
  );
}