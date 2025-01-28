import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Ẩn header cho tất cả các màn hình
      }}
    >
      <Stack.Screen
        name="index" // Màn hình Home
      />
      <Stack.Screen
        name="components/Auth/login" // Màn hình Login
      />
      <Stack.Screen
        name="components/Auth/register" // Màn hình Register
      />
      <Stack.Screen
        name="components/Dashboard/dashboard" // Màn hình Dashboard
      />
    </Stack>
  );
}