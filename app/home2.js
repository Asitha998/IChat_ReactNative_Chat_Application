import { registerRootComponent } from "expo";
import { LinearGradient } from "expo-linear-gradient";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import { Link, router } from 'expo-router';
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import WebSocketService from "./websocket";
import { MenuProvider, Menu, MenuOptions, MenuOption, MenuTrigger, renderers } from 'react-native-popup-menu';

SplashScreen.preventAutoHideAsync();

export default function home() {

    const dpLogoPath = require("../assets/images/dpLogo.png");

    const [getUser, setUser] = useState([]);
    const [getUserAvatar, setUserAvatar] = useState([]);
    const [getChatArray, setChatArray] = useState([]);

    const [getTheme, setTheme] = useState("");

    const [getSeatchText, setSearchText] = useState("");

    NavigationBar.setBackgroundColorAsync(getTheme == "Light" ? "#C3E0FD" : "#1e1e1e");

    const [loaded, error] = useFonts(
        {
            'Fredoka-Regular': require("../assets/fonts/Fredoka-Regular.ttf"),
            'Fredoka-Light': require("../assets/fonts/Fredoka-Light.ttf"),
            'Fredoka-SemiBold': require("../assets/fonts/Fredoka-Medium.ttf"),
        }
    );

    function handleMessage(message) {
        // console.log("Message from WebSocket:", message);
        // if (message === "Refresh") {
        fetchChatList("");
        // }
    }

    async function fetchChatList(text) {

        let userJson = await AsyncStorage.getItem("user");
        let user = JSON.parse(userJson);

        setUser(user);

        let response = await fetch(process.env.EXPO_PUBLIC_URL + "/LoadHomeData?id=" + user.id + "&searchText=" + text);

        if (response.ok) {
            let json = await response.json();

            if (json.success) {

                let chatArray = json.jsonChatArray;
                setChatArray(chatArray);

                let userAvatar = json.userDetails;
                setUserAvatar(userAvatar);

            }
        }
    }

    useEffect(
        () => {
            async function setupTheme() {
                setTheme(await AsyncStorage.getItem("theme"));
            }
            setupTheme();
            console.log("theme setup");
        }, []
    );

    useEffect(
        () => {
            fetchChatList("");
        }, [getTheme]
    );

    const { sendMessage, openWebSocket, closeWebSocket } = WebSocketService(getUser.id, handleMessage);

    useEffect(
        () => {
            if (getUser.id) {

                openWebSocket(); // Open WebSocket connection

            }
        }, [getUser.id]
    );

    // useEffect(() => {
    //     if (getUser.id) {

    //         const { sendMessage } = WebSocketService(getUser.id, (message) => {
    //             if (message === "Refresh") {
    //                 fetchChatList();
    //             }
    //         });

    //     }
    // }, [getUser.id]);

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
        <MenuProvider>
            <LinearGradient colors={getTheme == "Light" ? ['#B9FDD5', '#D5EFF4', '#C3E0FD'] : ['#0a131a', '#1e1e1e']} style={stylesheet.view1}>

                <StatusBar backgroundColor={getTheme == "Light" ? "#c7edda" : "#101f2b"} style={getTheme == "Light" ? null : "light"} />

                <View style={[stylesheet.view2, getTheme == "Light" ? null : { backgroundColor: "#101f2b", shadowColor: "lightblue", elevation: 80 }]}>

                    <Text style={[stylesheet.headerText, getTheme == "Light" ? null : { color: "white" }]}>iChat</Text>

                    {/* <View style={stylesheet.view3}></View> */}

                    <View style={stylesheet.viewSearch}>
                        <TextInput style={[stylesheet.input1, getTheme == "Light" ? null : { color: "white", backgroundColor: "#1e2b33" }]} value={getSeatchText} cursorColor={getTheme == "Light" ? "black" : "white"} placeholder={"Search a friend..."} placeholderTextColor={getTheme == "Light" ? "#61746a" : "#8e9c94"} onChangeText={
                            (text) => {
                                setSearchText(text);
                                fetchChatList(text);
                            }
                        } />
                        {getSeatchText != "" ?
                            <FontAwesome6 name={"circle-xmark"} size={20} color={"grey"} style={{ position: "absolute", end: 10, marginTop: 9 }} onPress={
                                () => {
                                    setSearchText("");
                                    fetchChatList("");
                                }
                            } /> :
                            null
                        }
                    </View>

                    <Menu>
                        <MenuTrigger children={<FontAwesome6 name={"ellipsis-vertical"} size={25} color={getTheme == "Light" ? "black" : "white"} />}
                            style={{ alignSelf: "flex-end", width: 30, alignItems: "center" }}
                        />
                        <MenuOptions optionsContainerStyle={[stylesheet.headerMenuOptionsLight, getTheme == "Dark" ? { backgroundColor: "#1f2c40" } : null]}  >

                            <MenuOption style={stylesheet.menuOptionView} onSelect={
                                () => {
                                    router.push(
                                        {
                                            pathname: "/profile",
                                            params: { user: JSON.stringify(getUser), avatar: JSON.stringify(getUserAvatar) },
                                        }
                                    );
                                }
                            }>
                                <View style={{ alignItems: 'center', gap: 5, }}>

                                    <LinearGradient colors={['#8233C5', '#274B74']} style={stylesheet.avatar}>
                                        {getUserAvatar.avatar_image_found ?
                                            <Image source={process.env.EXPO_PUBLIC_URL + "/AvatarImages/" + getUser.mobile + ".png"} style={stylesheet.imageAvatar} contentFit={"contain"} />
                                            :
                                            <Text style={stylesheet.text7}>{getUserAvatar.user_avatar_letters}</Text>
                                        }
                                    </LinearGradient>

                                    <Text style={[stylesheet.menuName, getTheme == "Light" ? null : { color: "white" }]}>{getUser.first_name + " " + getUser.last_name}</Text>
                                </View>
                            </MenuOption>
                            <MenuOption style={stylesheet.menuOptionView} onSelect={
                                async () => {
                                    getTheme == "Light" ?
                                        [setTheme("Dark"),
                                        await AsyncStorage.setItem("theme", "Dark")]
                                        :
                                        [setTheme("Light"),
                                        await AsyncStorage.setItem("theme", "Light")]
                                }
                            }>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>

                                    <Text style={[{ fontSize: 15, color: "#535758", fontWeight: "bold" }, getTheme == "Light" ? null : { color: "white" }]}>  Change Theme To : </Text>
                                    {getTheme == "Light" ?
                                        <FontAwesome6 name={"moon"} size={16} color={"#535758"} /> :
                                        <FontAwesome6 name={"sun"} size={16} color={"white"} />
                                    }

                                </View>
                            </MenuOption>
                            <MenuOption onSelect={
                                async () => {
                                    await AsyncStorage.removeItem("user");

                                    closeWebSocket();
                                    router.replace("/");
                                }
                            }>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingRight: 10 }}>
                                    <Text style={{ fontSize: 15, color: "#a80000", fontWeight: "bold", marginEnd: 10 }}>Log Out</Text>
                                    <FontAwesome6 name={"right-from-bracket"} size={22} color={"#a80000"} />
                                </View>
                            </MenuOption>

                        </MenuOptions>
                    </Menu>

                </View>

                <FlashList
                    data={getChatArray}
                    renderItem={
                        ({ item }) =>
                            <Pressable style={stylesheet.view5} onPress={
                                () => {
                                    router.push(
                                        {
                                            pathname: "/chat3",
                                            params: { item: JSON.stringify(item), userId: getUser.id },
                                        }
                                    );

                                    // sendMessage(
                                    //     {
                                    //         logged_user_id: getUser.id,
                                    //         other_user_id: item.other_user_id,
                                    //         message: "Sent",
                                    //     }
                                    // );
                                }
                            }>

                                <LinearGradient colors={['#274B74', '#8233C5', '#E963FD']} style={stylesheet.view6}>

                                    {item.other_user_status == 1 ?
                                        <View style={[stylesheet.dot1, getTheme == "Light" ? null : { borderColor: "black" }]}></View>
                                        :
                                        null
                                    }

                                    {item.avatar_image_found ?
                                        <Image source={process.env.EXPO_PUBLIC_URL + "/AvatarImages/" + item.other_user_mobile + ".png"} style={stylesheet.image1} contentFit={"contain"} />
                                        :
                                        <Text style={stylesheet.text6}>{item.other_user_avatar_letters}</Text>
                                    }

                                </LinearGradient>

                                <View style={stylesheet.view4}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Text style={[stylesheet.text1, getTheme == "Light" ? null : { color: "#cfcccc" }]}>{item.other_user_name}</Text>

                                        {item.unseen_chat_count != 0 ?
                                            <View style={stylesheet.newMessages}>
                                                <Text style={{ fontWeight: "bold", fontSize: 15 }}>{item.unseen_chat_count}</Text>
                                            </View>
                                            :
                                            null
                                        }

                                    </View>
                                    <Text style={[stylesheet.text4, getTheme == "Light" ? null : { color: "#cfcccc" }]} numberOfLines={1}>{item.message}</Text>

                                    <View style={stylesheet.view7}>
                                        <Text style={[stylesheet.text5, getTheme == "Light" ? null : { color: "#808080" }]}>{item.dateTime}</Text>
                                        <FontAwesome6 name={item.chat_status_id == 1 ? "check-double" : "check"} color={item.chat_status_id == 1 ? "green" : "gray"} size={15} />
                                    </View>

                                </View>

                            </Pressable>
                    }
                    estimatedItemSize={200}
                />

            </LinearGradient>
        </MenuProvider>
    );
}

const stylesheet = StyleSheet.create(
    {
        menuName: {
            fontFamily: "Fredoka-SemiBold",
            fontSize: 20,
            color: "#535758",
            marginBottom: 2
        },

        menuOptionView: {
            borderBottomWidth: 1,
            borderBottomColor: "#535758",
        },

        newMessages: {
            width: 25,
            height: 25,
            borderRadius: 20,
            backgroundColor: "#09a639",
            zIndex: 100,
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            end: 1
        },

        dot1: {
            width: 20,
            height: 20,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: "white",
            backgroundColor: "#09a639",
            position: "absolute",
            zIndex: 100,
            start: -1,
            top: -1,
        },

        view1: {
            flex: 1,
            // paddingVertical: 10,
            // paddingHorizontal: 20,
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
            fontFamily: "Fredoka-SemiBold",
            fontSize: 30,
        },

        view3: {
            width: 80,
            height: 80,
            backgroundColor: "purple",
            borderRadius: 40,
        },

        view4: {
            flex: 1,
        },

        viewSearch: {
            flex: 1,
            flexDirection: "row",
        },

        input1: {
            height: 40,
            // borderStyle: "solid",
            // borderWidth: 1,
            width: "100%",
            borderRadius: 40,
            fontSize: 20,
            // color: "grey",
            paddingLeft: 15,
            paddingHorizontal: 15,
            // borderColor: "grey",
            elevation: 0.1,
        },

        menuView: {
            position: "absolute",
            alignSelf: "flex-end",
            marginTop: 15,
            width: "100%",
        },

        avatar: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#d8d8d8",
            justifyContent: "center",
            alignItems: "center",
        },

        imageAvatar: {
            width: 50,
            height: 50,
            justifyContent: "center",
            alignSelf: "center",
            borderRadius: 25,
        },

        headerMenuOptionsLight: {
            width: "auto",
            minWidth: 200,
            marginTop: 40,
            marginLeft: 15,
            backgroundColor: "#d9fceb",
            borderRadius: 10,
            shadowColor: "black",
            elevation: 50,
        },
        headerMenuOptionsDark: {
            width: 250,
            marginTop: 40,
            backgroundColor: "#1e1e1e",
            borderWidth: 1,
            borderColor: "#1e1e1e",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            borderTopLeftRadius: 20,
            shadowColor: "#2d2d2d",
            elevation: 8,
        },

        text1: {
            fontFamily: "Fredoka-SemiBold",
            fontSize: 22,
        },

        text2: {
            fontFamily: "Fredoka-Regular",
            fontSize: 18,
        },
        text3: {
            fontFamily: "Fredoka-Regular",
            fontSize: 14,
            alignSelf: "flex-end",
        },

        view5: {
            paddingHorizontal: 20,
            flexDirection: "row",
            alignContent: "center",
            columnGap: 20,
            marginVertical: 8,
        },

        // view5: {
        //     paddingBottom:10,
        //     flexDirection: "row",
        //     alignContent: "center",
        //     columnGap: 20,
        //     marginHorizontal:25,
        //     marginVertical: 5,
        //     borderBottomWidth:1,
        //     borderBottomColor:"#9dbbab"
        // },

        // view5: {
        //     padding: 10,
        //     flexDirection: "row",
        //     alignContent: "center",
        //     columnGap: 20,
        //     marginVertical: 8,
        //     marginHorizontal:20,
        //     borderRadius:20,
        //     elevation:15,
        //     backgroundColor:"#d5eff4",
        // },

        view6: {
            width: 70,
            height: 70,
            borderRadius: 40,
            // backgroundColor: "white",
            // borderWidth: 3,
            // borderColor: "#b1b1b1",
            justifyContent: "center",
            alignItems: "center",
        },

        text4: {
            fontFamily: "Fredoka-Regular",
            fontSize: 16,
        },

        text5: {
            fontFamily: "Fredoka-Regular",
            fontSize: 13,
            alignSelf: "flex-end",
        },

        view7: {
            flexDirection: "row",
            columnGap: 10,
            alignSelf: "flex-end",
            alignItems: "center",
        },

        image1: {
            width: 70,
            height: 70,
            justifyContent: "center",
            alignSelf: "center",
            borderRadius: 40,
        },

        text6: {
            fontFamily: "Fredoka-Regular",
            fontSize: 30,
            color: "white",
        },

        text7: {
            fontFamily: "Fredoka-Regular",
            fontSize: 20,
            color: "white",
        },

    }
);