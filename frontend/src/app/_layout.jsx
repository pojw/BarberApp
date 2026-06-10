
import "../../global.css";
import { Stack } from "expo-router";
import {AuthProvider} from "../context/AuthContext";
export default function RootLayout(){
  return(
    <AuthProvider>
<Stack screenOptions ={{headerShown:false}}>
      <Stack.Screen name="index"></Stack.Screen>
      <Stack.Screen name="(auth)"></Stack.Screen>
      <Stack.Screen name="onboarding"></Stack.Screen>
      <Stack.Screen name="client"></Stack.Screen>
      <Stack.Screen name="barber"></Stack.Screen>
    </Stack>
    </AuthProvider>
    
  )
}
