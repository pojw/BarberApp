

import {Text, View, Pressable} from "react-native";
import {useRouter} from "expo-router";
import CenterScreen from "../../../components/centerScreen";

export default function nextStep() {
    const router = useRouter();
    return (
        <CenterScreen>
            <View>
               {/* things to do next
               hair advice
               haircare advice
               hairstyle advice
               barber advce
               
               how to talk to your barber
               how to ask for a haircut
               how to say you don't like the current cut
               */}
               {/* buttons that prompt the chatbot once implemented, */}
            </View>
            <View>
                {/* ready to book? find babrer near  you  */}
                <Pressable onPress={()=>router.push("/client/search")} className="mt-6 rounded-xl">
                    <Text>Find a barber near you</Text>
                </Pressable>
            </View>
        </CenterScreen>
    );
}   