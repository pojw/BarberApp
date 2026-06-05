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

export default function Signup() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleSignup() {
    router.replace("/onboarding")
    

    // Later this will create the Firebase user
    // For now, send them to home or onboarding
  }

  return (
    <CenterScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="w-full"
      >
        <View className="w-full px-6">
          {/* Brand */}
          <View className="mb-4 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-black">
              <Text className="text-3xl font-bold text-white">B</Text>
            </View>

            <Text className="text-3xl font-bold text-black">
              Create account
            </Text>
          </View>

          {/* Form Card */}
          <View className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <View className="mb-5">
              <Text className="text-2xl font-bold text-black">Sign up</Text>
              <Text className="mt-2 text-sm text-gray-500">
                Enter your information to get started.
              </Text>
            </View>

            {/* Full Name */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Full name
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
              />
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

            {/* Password */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
              />
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Confirm password
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
              />
            </View>

            {/* Button */}
            <Pressable
              onPress={handleSignup}
              className="rounded-2xl bg-black px-4 py-4 active:opacity-80"
            >
              <Text className="text-center text-base font-bold text-white">
                Create Account
              </Text>
            </Pressable>

          {/* Google */}

          <View>
            <Pressable className="mt-4 flex-row items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-4 active:opacity-80"> 
            <Text>Sign up with goole</Text>
            </Pressable>
          </View>
          {/*Apple  */}
          <Pressable className="mt-4 flex-row items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-4 active:opacity-80">
            <Text>Sign up with Apple</Text>
          </Pressable>
            {/* Login Link */}
            <View className="mt-6 flex-row justify-center">
              <Text className="text-gray-500">Already have an account? </Text>
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