import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, Button, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

export default function signup() {

  const dpLogoPath = require("../assets/images/dpLogo3.png");

  const [getImage, setImage] = useState(null);

  const [getMobile, setMobile] = useState("");
  const [getFirstName, setFirstName] = useState("");
  const [getLastName, setLastName] = useState("");
  const [getPassword, setPassaword] = useState("");

  const [getInvalidText, setInvalidText] = useState("");

  const [loaded, error] = useFonts(
    {
      'Fredoka-Regular': require("../assets/fonts/Fredoka-Regular.ttf"),
      'Fredoka-Light': require("../assets/fonts/Fredoka-Light.ttf"),
      'Fredoka-SemiBold': require("../assets/fonts/Fredoka-SemiBold.ttf"),
    }
  );

  useEffect(
    () => {
      if (loaded || error) {
        SplashScreen.hideAsync();
      }
    }, [loaded, error]
  );

  if (!loaded && !error) {
    return null;
  }

  const logoPath = require("../assets/images/ichat2.png");
  // const logoPath = require("./assets/images/logo.gif");

  return (

    <LinearGradient colors={['#C3E0FD', '#D5EFF4', '#B9FDD5']} style={stylesheet.view1}>

      <StatusBar backgroundColor={"#C3E0FD"} />

      <ScrollView>

        <View style={stylesheet.scrollview1}>

          <View style={{ flexDirection: "row", columnGap: 10, justifyContent: "center", alignItems: "center", }}>

            <Image source={logoPath} style={stylesheet.image1} contentFit={"contain"} />

            <View>
              <Text style={stylesheet.text1}>Create Account</Text>

              <Text style={stylesheet.text2}>Hello! Welcome to iChat</Text>
            </View>
          </View>

          <Pressable onPress={
            async () => {

              let result = await ImagePicker.launchImageLibraryAsync(
                {
                  mediaTypes: ImagePicker.MediaTypeOptions.All,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 1,
                }
              );

              if (!result.canceled) {
                setImage(result.assets[0].uri);
              }

            }
          } style={stylesheet.avatar1}>
            <Image source={getImage == null ? dpLogoPath : getImage} style={stylesheet.avatar1} contentFit={"contain"} />
          </Pressable>

          {getInvalidText != "" ? <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: "center", }}>
            <FontAwesome name={"exclamation-triangle"} color={"red"} size={18} />
            <Text style={{ fontSize: 18, color: "red", marginStart: 5 }}>{getInvalidText}</Text>
          </View> : null}

          <Text style={stylesheet.text3}>Mobile</Text>
          <TextInput style={stylesheet.input1} inputMode={"tel"} placeholder={"Enter mobile..."} cursorColor={"black"} maxLength={10} onChangeText={
            (text) => {
              setMobile(text);
            }
          } />

          <Text style={stylesheet.text3}>First Name</Text>
          <TextInput style={stylesheet.input1} inputMode={"text"} placeholder={"Enter first name..."} cursorColor={"black"} onChangeText={
            (text) => {
              setFirstName(text);
            }
          } />

          <Text style={stylesheet.text3}>Last Name</Text>
          <TextInput style={stylesheet.input1} inputMode={"text"} placeholder={"Enter last name..."} cursorColor={"black"} onChangeText={
            (text) => {
              setLastName(text);
            }
          } />

          <Text style={stylesheet.text3}>Password</Text>
          <TextInput style={stylesheet.input1} inputMode={"text"} placeholder={"Enter password..."} maxLength={20} secureTextEntry={true} cursorColor={"black"} onChangeText={
            (text) => {
              setPassaword(text);
            }
          } />

          <Pressable style={stylesheet.pressable1} onPress={
            async () => {

              let formData = new FormData();
              formData.append("mobile", getMobile);
              formData.append("firstName", getFirstName);
              formData.append("lastName", getLastName);
              formData.append("password", getPassword);

              if (getImage != null) {
                formData.append("avatarImage",
                  {
                    name: "avatar.png",
                    type: "image/png",
                    uri: getImage
                  }
                );
              }

              let response = await fetch(
                process.env.EXPO_PUBLIC_URL + "/SignUp",
                {
                  method: "POST",
                  body: formData
                }
              );

              if (response.ok) {
                let json = await response.json();

                if (json.success) {
                  //user registration complete
                  router.replace("/");

                } else {
                  //problem occured
                  setInvalidText(json.message);
                  // Alert.alert("Error", json.message);
                }

              }

            }
          }>
            <Text style={stylesheet.text4}>Sign Up</Text>
            <FontAwesome6 name={"right-to-bracket"} color={"white"} size={20} />
          </Pressable>

          <Pressable style={stylesheet.pressable2} onPress={
            () => {
              router.push("/");
            }
          }>
            <Text style={stylesheet.text5}>Already Registered? Go to Sign In</Text>
          </Pressable>

        </View>

      </ScrollView>

    </LinearGradient>
  );
}

const stylesheet = StyleSheet.create(
  {
    view1: {
      flex: 1,
      justifyContent: "center",
    },

    scrollview1: {
      paddingVertical: 50,
      paddingHorizontal: 20,
      rowGap: 10,
    },

    view2: {
      flexDirection: "row",
      justifyContent: "center",
      columnGap: 20,
      marginTop: 15,
    },

    view3: {
      flex: 3,
      rowGap: 10
    },

    text1: {
      fontSize: 25,
      fontFamily: "Fredoka-SemiBold",
      color: "#535758",
      // alignSelf: "center",
    },

    text2: {
      fontSize: 18,
      fontFamily: "Fredoka-Light",
      // alignSelf: "center",
    },

    text3: {
      fontSize: 16,
      fontFamily: "Fredoka-SemiBold",
      color: "#535758",
    },

    text4: {
      fontSize: 22,
      color: "white",
      fontFamily: "Fredoka-Regular",
    },

    text5: {
      fontSize: 17,
      fontFamily: "Fredoka-Light",
      color: "black",
    },

    image1: {
      width: 110,
      height: 110,
    },

    input1: {
      backgroundColor: "#a4bebc",
      // width: "100%",
      height: 50,
      // borderStyle: "solid",
      // borderWidth: 1,
      borderRadius: 15,
      paddingHorizontal: 10,
      flex: 1,
      fontSize: 18,
      fontFamily: "Fredoka-Regular",
      shadowColor: "black",
      elevation: 35,
      // borderColor: "#384B70",
    },

    pressable1: {
      height: 50,
      flexDirection: "row",
      columnGap: 10,
      backgroundColor: "red",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 15,
      marginTop: 15,
      backgroundColor: "#4c7877",
      shadowColor: "black",
      elevation: 10,
    },

    pressable2: {
      height: 25,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 15,
    },

    avatar1: {
      flex: 1,
      borderRadius: 200,
      height: 80,
      width: 80,
      alignSelf: "center",
      shadowColor:"black",
      elevation:40
    },
  }
);
