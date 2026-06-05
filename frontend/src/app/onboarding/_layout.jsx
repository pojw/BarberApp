

import {Stack} from "expo-router"


export default function onboardingLayout() {
    return (
        <Stack screenOptions={{headerShown:false}}>
       
            <Stack.Screen name="client"></Stack.Screen>
            <Stack.Screen name="barber"></Stack.Screen>
            <Stack.Screen name="index"></Stack.Screen>
        </Stack>
    );
    }