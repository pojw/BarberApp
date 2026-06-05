import {Tabs} from "expo-router";

export default function TabLayout() {
    return (
       <Tabs screenOptions={{headerShown:false}}>
        <Tabs.Screen name="home"></Tabs.Screen>
        <Tabs.Screen name="search"></Tabs.Screen>
        <Tabs.Screen name="chatbot"></Tabs.Screen>
        <Tabs.Screen name="profile"></Tabs.Screen>
        <Tabs.Screen name="bookings"></Tabs.Screen>
        <Tabs.Screen name="messages"></Tabs.Screen>
       </Tabs>
    );
    }