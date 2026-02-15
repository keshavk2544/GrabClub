import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Vendor Login" }} />
      <Stack.Screen name="dashboard" options={{ title: "Vendor Dashboard" }} />
    </Stack>
  );
}
