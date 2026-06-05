import {Tabs} from "expo-router";

export default function BarberTabLayout() {

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="calender" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="chatbot" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}