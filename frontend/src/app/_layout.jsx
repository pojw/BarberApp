
import "../../global.css";
import { Stack } from "expo-router";

export default function RootLayout(){
  return(
    <Stack screenOptions ={{headerShown:false}}>
      <Stack.Screen name="index"></Stack.Screen>
      <Stack.Screen name="(auth)"></Stack.Screen>
      <Stack.Screen name="onboarding"></Stack.Screen>
      <Stack.Screen name="client"></Stack.Screen>
      <Stack.Screen name="barber"></Stack.Screen>
    </Stack>
  )
}
