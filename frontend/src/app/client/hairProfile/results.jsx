import {Text, View, Pressable} from "react-native";
import {router} from "expo-router";
import CenterScreen from "../../../components/centerScreen";


export default function results(){
return (
    <CenterScreen>
        <View>
            <Text>Results</Text>
            
        </View>
        <View>
            {/* display your infomraiotn with Label and ttext, with checkmaor or edit button */}

        </View>
        <View>
            <Pressable onPress={()=>router.push("/client/hairProfile/nextStep")} className="mt-6 rounded-xl">
            
                <Text>Finalize results and save</Text>
            </Pressable>
        </View>
    </CenterScreen>
)
}
