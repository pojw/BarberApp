import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CenterScreen({ children }) {
       return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}