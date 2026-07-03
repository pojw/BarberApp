import {Stack} from "expo-router";
export default function HairProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="results" />
      <Stack.Screen name="nextStep" />
      <Stack.Screen name="UploadHairProfile" />
    </Stack>
  );
}