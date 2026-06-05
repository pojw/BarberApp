import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import CenterScreen from "../../components/centerScreen";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleResetPassword() {
    if (!email) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }

    console.log("Reset password email sent to:", email);

    // Later this will call Firebase:
    // await sendPasswordResetEmail(auth, email);

    Alert.alert(
      "Check your email",
      "If an account exists with that email, you will receive a password reset link.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]
    );
  }

  return (
    <CenterScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="w-full"
      >
        <View className="w-full px-6">
          {/* Brand */}
          <View className="mb-10 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-black">
              <Text className="text-3xl font-bold text-white">B</Text>
            </View>

            <Text className="text-3xl font-bold text-black">
              Reset Password
            </Text>
            <Text className="mt-2 text-center text-base text-gray-500">
              Enter your email and we’ll send you a reset link.
            </Text>
          </View>

          {/* Form Card */}
          <View className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <View className="mb-4">
              <Text className="text-2xl font-bold text-black">
                Forgot password?
              </Text>
              <Text className="mt-2 text-sm text-gray-500">
                No worries. We’ll help you get back into your account.
              </Text>
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Email
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
              />
            </View>

            {/* Button */}
            <Pressable
              onPress={handleResetPassword}
              className="rounded-2xl bg-black px-4 py-4 active:opacity-80"
            >
              <Text className="text-center text-base font-bold text-white">
                Send Reset Link
              </Text>
            </Pressable>

            {/* Back to Login */}
            <View className="mt-4 flex-row justify-center">
              <Text className="text-gray-500">Remember your password? </Text>
              <Link href="/login" className="font-bold text-black">
                Log in
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </CenterScreen>
  );
}