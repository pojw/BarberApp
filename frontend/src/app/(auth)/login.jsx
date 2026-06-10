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

import {signInWithEmailAndPassword} from "firebase/auth";
import { auth } from "../../config/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const router = useRouter();

async function handleLogin() {
  if (!email.trim() || !password) {
    Alert.alert(
      "Missing information",
      "Please enter your email and password."
    );
    return;
  }

  try {
    setLoading(true);

    await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    // Let index.jsx route based on onboarded and role.
    router.replace("/");
  } catch (error) {
    console.log("Login error:", error);

    Alert.alert(
      "Login failed",
      "Please check your email and password."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <CenterScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="w-full"
      >
        <View className="w-full px-6">
          {/* Logo / Brand */}
          <View className="mb-10 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-black">
              <Text className="text-3xl font-bold text-white">Logo</Text>
            </View>

            <Text className="text-3xl font-bold text-black">BarberApp Name coming</Text>
     
          </View>

          {/* Form Card */}
          <View className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <View className="mb-4">
              <Text className="text-2xl font-bold text-black">
                Welcome back
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
                className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base"
              />
            </View>

            {/* Password */}
            <View className="mb-3">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Password
              </Text>

              {/* toggle view later */}
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-2xl border  border-gray-300 bg-gray-50 px-4 py-4 text-base text-green-500"
              />
            </View>

            {/* Forgot Password */}
            <View className="mb-6 items-end">
              <Pressable>
                <Text className="text-sm font-semibold text-black">
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            {/* Login Button */}
         <Pressable
  onPress={handleLogin}
  disabled={loading}
  className={`rounded-2xl px-4 py-4 active:opacity-80 ${
    loading ? "bg-gray-400" : "bg-black"
  }`}
>
  <Text className="text-center text-base font-bold text-white">
    {loading ? "Logging in..." : "Log In"}
  </Text>
</Pressable>

            {/* Sign up link */}
            <View className="mt-6 flex-row justify-center">
              <Text className="text-gray-500">Don't have an account? </Text>
              <Link href="/signup" className="font-bold text-black">
                Sign up
              </Link>
            </View>
            {/* Google */}

          <View>
            <Pressable className="mt-4 flex-row items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-4 active:opacity-80"> 
            <Text>Login in with goole</Text>
            </Pressable>
          </View>
          {/*Apple  */}
          <Pressable className="mt-4 flex-row items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-4 active:opacity-80">
            <Text>Login in with Apple</Text>
          </Pressable>
             {/* Guest */}
          <Pressable className="mt-4 flex-row items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-4 active:opacity-80">
            <Text>Continue as Guest</Text>
          </Pressable>
          <Link href="/forgotPassword" className="text-sm font-semibold text-black flex-row items-center justify-cente">
  Forgot password?
</Link>
          </View>
       
        </View>
      </KeyboardAvoidingView>
    </CenterScreen>
  );
}