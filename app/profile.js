import { LinearGradient } from "expo-linear-gradient";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { Image } from "expo-image";
import * as ImagePicker from 'expo-image-picker';
import WebSocketService from "./websocket";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EnhancedImageViewing from "react-native-image-viewing";

SplashScreen.preventAutoHideAsync();

export default function home() {

    const [getUser, setUser] = useState([]);
    const [getUserAvatar, setUserAvatar] = useState([]);

    const [getImage, setImage] = useState(null);

    const [getFirstName, setFirstName] = useState("");
    const [getLastName, setLastName] = useState("");
    const [getPassword, setPassaword] = useState("");

    const [getShowPassword, setShowPassword] = useState(true);

    const [getIsVisible, setIsVisible] = useState(false);

    const [getInvalidText, setInvalidText] = useState("");

    const [getTheme, setTheme] = useState("");

    NavigationBar.setBackgroundColorAsync(getTheme == "Light" ? "#C3E0FD" : "#1e1e1e");

    //get parameters
    const params = useLocalSearchParams();
    const user = JSON.parse(params.user);
    const avatarArray = JSON.parse(params.avatar);

    const [loaded, error] = useFonts(
        {
            'Fredoka-Regular': require("../assets/fonts/Fredoka-Regular.ttf"),
            'Fredoka-Light': require("../assets/fonts/Fredoka-Light.ttf"),
            'Fredoka-SemiBold': require("../assets/fonts/Fredoka-Medium.ttf"),
        }
    );

    useEffect(
        () => {
            async function setupTheme() {
                setTheme(await AsyncStorage.getItem("theme"));
            }
            setupTheme();

            setUser(user);
        }, []
    );

    const { sendMessage, openWebSocket } = WebSocketService(getUser.id, () => { });

    useEffect(
        () => {
            setUserAvatar(avatarArray);

            setFirstName(user.first_name);
            setLastName(user.last_name);
            setPassaword(user.password);

            if (getUser.id) {
                openWebSocket();
            }
        }, [getUser]
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

    return (
        <LinearGradient colors={getTheme == "Light" ? ['#B9FDD5', '#D5EFF4', '#C3E0FD'] : ['#0a131a', '#1e1e1e']} style={stylesheet.view1}>

            <StatusBar backgroundColor={getTheme == "Light" ? "#c7edda" : "#101f2b"} style={getTheme == "Light" ? null : "light"} />

            <View style={[stylesheet.view2, getTheme == "Light" ? null : { backgroundColor: "#101f2b", shadowColor: "lightblue", elevation: 80 }]}>

                <FontAwesome6 name={"arrow-left-long"} size={25} color={getTheme == "Light" ? "black" : "white"} onPress={
                    () => {
                        router.back();
                    }
                } />

            </View>

            <Text style={[stylesheet.headerText, getTheme == "Light" ? null : { color: "white" }]}>Profile</Text>

            <ScrollView>
                <LinearGradient colors={['#8233C5', '#274B74']} style={stylesheet.avatar}>
                    <View>

                        <Pressable style={stylesheet.imageAvatar} onPress={
                            getImage != null | getUserAvatar.avatar_image_found ?
                                () => {
                                    setIsVisible(true);
                                }
                                :
                                null
                        }>
                            {getImage == null ?
                                getUserAvatar.avatar_image_found ?
                                    <Image source={process.env.EXPO_PUBLIC_URL + "/AvatarImages/" + getUser.mobile + ".png"} style={stylesheet.imageAvatar} contentFit={"contain"} />
                                    :
                                    <Text style={stylesheet.text7}>{getUserAvatar.user_avatar_letters}</Text>
                                :
                                <Image source={getImage} style={stylesheet.imageAvatar} contentFit={"contain"} />
                            }
                        </Pressable>

                        <EnhancedImageViewing
                            images={getImage != null ?
                                [{ uri: getImage }]
                                :
                                [{ uri: process.env.EXPO_PUBLIC_URL + "/AvatarImages/" + getUser.mobile + ".png" }]
                            }
                            imageIndex={0}
                            visible={getIsVisible}
                            onRequestClose={() => setIsVisible(false)}
                        />

                        <Pressable style={stylesheet.dot1} onPress={
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
                        }>
                            <FontAwesome6 name={"repeat"} color={"white"} size={20} />
                        </Pressable>

                    </View>

                </LinearGradient>

                <View style={stylesheet.view4}>

                    {getInvalidText != "" ? <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: "center", }}>
                        <FontAwesome name={"exclamation-triangle"} color={"red"} size={18} />
                        <Text style={{ fontSize: 18, color: "red", marginStart: 5 }}>{getInvalidText}</Text>
                    </View> : null}

                    <Text style={[stylesheet.text3, getTheme == "Light" ? null : { color: "white" }]}>Mobile</Text>
                    <TextInput style={[stylesheet.input1, getTheme == "Light" ? null : { color: "white", backgroundColor: "#1e2b33", shadowColor: "#2d2d2d" }]}
                        editable={false} selectTextOnFocus={false} value={user.mobile}
                    />

                    <Text style={[stylesheet.text3, getTheme == "Light" ? null : { color: "white" }]}>First Name</Text>
                    <TextInput style={[stylesheet.input1, getTheme == "Light" ? null : { color: "white", backgroundColor: "#1e2b33", shadowColor: "#2d2d2d" }]}
                        inputMode={"text"} value={getFirstName} placeholder={"Enter first name..."} placeholderTextColor={getTheme == "Light" ? null : "#939494"}
                        cursorColor={getTheme == "Light" ? "black" : "#939494"} onChangeText={
                            (text) => {
                                setFirstName(text);
                            }
                        }
                    />

                    <Text style={[stylesheet.text3, getTheme == "Light" ? null : { color: "white" }]}>Last Name</Text>
                    <TextInput style={[stylesheet.input1, getTheme == "Light" ? null : { color: "white", backgroundColor: "#1e2b33", shadowColor: "#2d2d2d" }]}
                        inputMode={"text"} value={getLastName} placeholder={"Enter last name..."} placeholderTextColor={getTheme == "Light" ? null : "#939494"}
                        cursorColor={getTheme == "Light" ? "black" : "#939494"} onChangeText={
                            (text) => {
                                setLastName(text);
                            }
                        }
                    />

                    <Text style={[stylesheet.text3, getTheme == "Light" ? null : { color: "white" }]}>Password</Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TextInput style={[stylesheet.input1, getTheme == "Light" ? null : { color: "white", backgroundColor: "#1e2b33", shadowColor: "#2d2d2d" }]}
                            inputMode={"text"} value={getPassword} placeholder={"Enter password..."} placeholderTextColor={getTheme == "Light" ? null : "#939494"}
                            maxLength={20} secureTextEntry={getShowPassword} cursorColor={getTheme == "Light" ? "black" : "#939494"} onChangeText={
                                (text) => {
                                    setPassaword(text);
                                }
                            }
                        />
                        <Pressable style={{ end: 15, position: "absolute" }} onPress={
                            () => {
                                {
                                    getShowPassword == true ?
                                    setShowPassword(false)
                                    :
                                    setShowPassword(true)
                                }
                            }
                        }>
                            <FontAwesome name={getShowPassword == true ? "eye" : "eye-slash"} color={getTheme == "Light" ? "black" : "#939494"} size={20} />
                        </Pressable>
                    </View>

                    <Pressable style={[stylesheet.pressable1, getTheme == "Light" ? null : { backgroundColor: "#384B70", shadowColor: "grey" }]} onPress={
                        async () => {

                            let formData = new FormData();
                            formData.append("userId", user.id);
                            formData.append("first_name", getFirstName);
                            formData.append("last_name", getLastName);
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
                                process.env.EXPO_PUBLIC_URL + "/UpdateProfile",
                                {
                                    method: "POST",
                                    body: formData
                                }
                            );

                            if (response.ok) {
                                let json = await response.json();

                                if (json.success) {
                                    //user registration complete
                                    Alert.alert("msg", "updated");

                                    let resUser = json.user;

                                    try {
                                        await AsyncStorage.setItem('user', JSON.stringify(resUser));

                                    } catch (e) {
                                        Alert.alert("Error", "Unable to process your access");
                                    }

                                    // setUser(resUser);
                                    setUserAvatar(json.userAvatar);

                                } else {
                                    //problem occured
                                    setInvalidText(json.message);
                                    // Alert.alert("Error", json.message);
                                }

                            }

                        }
                    }>
                        <Text style={stylesheet.text4}>Update</Text>
                    </Pressable>

                </View>

            </ScrollView>

        </LinearGradient>
    );
}

const stylesheet = StyleSheet.create(
    {
        dot1: {
            width: 30,
            height: 30,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 20,
            backgroundColor: "#219fdf",
            position: "absolute",
            zIndex: 100,
            end: 1,
            bottom: 1,
        },

        view1: {
            flex: 1,
            // alignItems:"center",
            // justifyContent:"center",
            // gap:10,
        },

        view2: {
            paddingHorizontal: 20,
            paddingVertical: 10,
            flexDirection: "row",
            columnGap: 20,
            alignItems: "center",
            marginBottom: 10,
            // borderBottomColor: "grey",
            // borderBottomWidth: 1,
            backgroundColor: "#c7edda",
            elevation: 10,
        },

        headerText: {
            position: "absolute",
            alignSelf: "center",
            fontFamily: "Fredoka-SemiBold",
            fontSize: 25,
            marginTop: 5,
        },

        // view2: {
        //     flexDirection: "row",
        //     justifyContent: "center",
        //     columnGap: 20,
        //     marginTop: 15,
        // },

        view3: {
            flex: 3,
            rowGap: 10
        },

        text3: {
            fontSize: 16,
            fontFamily: "Fredoka-SemiBold",
            color: "#384B70",
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
            marginBottom: 10,
            width: "100%",
            height: 70,
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

        // input1: {
        //     width: "100%",
        //     height: 50,
        //     borderStyle: "solid",
        //     borderWidth: 1,
        //     borderRadius: 15,
        //     paddingStart: 10,
        //     fontSize: 18,
        //     fontFamily: "Fredoka-Regular",
        //     borderColor: "#384B70",
        // },

        pressable1: {
            height: 50,
            flexDirection: "row",
            columnGap: 10,
            backgroundColor: "red",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 15,
            marginTop: 10,
            backgroundColor: "#4c7877",
            shadowColor: "black",
            elevation: 10,
            marginTop: 15,
            marginBottom: 30,
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
        },

        text7: {
            fontFamily: "Fredoka-Regular",
            fontSize: 40,
            color: "white",
            alignSelf: "center",
        },

        avatar: {
            marginVertical: 15,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "#d8d8d8",
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "center",
            marginTop: 50,
        },

        imageAvatar: {
            width: 100,
            height: 100,
            justifyContent: "center",
            alignSelf: "center",
            borderRadius: 50,
        },

        view4: {
            paddingVertical: 10,
            paddingHorizontal: 35,
            gap: 10,
        },

    }
);