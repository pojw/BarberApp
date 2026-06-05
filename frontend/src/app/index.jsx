import { Redirect } from "expo-router";

export default function Index(){
  const user =null;

  //user chekcing
  if(user==null){
    return <Redirect href="../login"></Redirect>
  }
  else{
    return <Redirect href="../home"></Redirect>
  }
}