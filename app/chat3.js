import { FontAwesome6 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { autoScroll, FlashList } from "@shopify/flash-list";
import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, SplashScreen, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import WebSocketService from "./websocket";
import * as Animatable from 'react-native-animatable';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger, renderers } from "react-native-popup-menu";
import * as NavigationBar from "expo-navigation-bar";

SplashScreen.preventAutoHideAsync();

export default function chat() {

    const [getChatArray, setChatArray] = useState([]);
    const [getOtherUserStatus, setOtherUserStatus] = useState("");
    const [getChatText, setChatText] = useState("");
    const [getReactsList, setReactsList] = useState([]);

    const [getIsScroll, setIsScroll] = useState(false);

    const flashListRef = useRef(null);
    const ws = useRef(null);

    const animatableView = useRef(null);

    const [getTheme, setTheme] = useState("");

    NavigationBar.setBackgroundColorAsync(getTheme == "Light" ? "#C3E0FD" : "black");

    // first chat animation
    function animateView() {

        if (animatableView.current) {
            animatableView.current.animate({
                0: {
                    opacity: 1,
                    transform: [{ scale: 1 }, { translateX: 0 }, { translateY: 0 }],
                },
                0.5: {
                    opacity: 0.5,
                    transform: [{ scale: 0.75 }, { translateX: 112 }, { translateY: -185 }],
                },
                1: {
                    opacity: 0,
                    transform: [{ scale: 0.5 }, { translateX: 225 }, { translateY: -370 }],
                }
            }, 700);
        }
    };

    //get parameters
    const params = useLocalSearchParams();
    const item = JSON.parse(params.item);
    const user_id = params.userId; //get from home

    const [loaded, error] = useFonts(
        {
            'Fredoka-Regular': require("../assets/fonts/Fredoka-Regular.ttf"),
            'Fredoka-Light': require("../assets/fonts/Fredoka-Light.ttf"),
            'Fredoka-SemiBold': require("../assets/fonts/Fredoka-Medium.ttf"),
        }
    );

    useEffect(
        () => {
            if (loaded || error) {
                SplashScreen.hideAsync();
            }
        }, [loaded, error]
    );

    // scroll flashlist to bottom
    useEffect(() => {
        if (getIsScroll) {
            setTimeout(() => {
                flashListRef.current?.scrollToEnd();
            }, 500);
        }
    }, [getChatArray, getIsScroll]);

    function handleMessage(message) {
        console.log("Message from WebSocket:", message);
        if (message === "Refresh") {
            setIsScroll(true);
            fetchChatArray();
        } else {
            setIsScroll(false);
            fetchChatArray();
        }
    }

    //fetch chat array from server
    async function fetchChatArray() {

        let response = await fetch(process.env.EXPO_PUBLIC_URL + "/LoadChat?logged_user_id=" + user_id + "&other_user_id=" + item.other_user_id);
        if (response.ok) {
            let json = await response.json();
            setChatArray(json.chatArray);
            setOtherUserStatus(json.other_user_status);
            setReactsList(json.reactList);
        }
    }

    useEffect(
        () => {
            async function setupTheme() {
                setTheme(await AsyncStorage.getItem("theme"));
            }
            setupTheme();

            fetchChatArray();
            setIsScroll(true);
        }, []
    );

    //use Web Soket
    const { sendMessage, openWebSocket } = WebSocketService(user_id, handleMessage);

    useEffect(
        () => {
            if (user_id) {

                openWebSocket();

            }
        }, [user_id]
    );

    if (!loaded && !error) {
        return null;
    }

    //react fetch function
    async function fetchReact(chatId, reactId) {

        let response = await fetch(process.env.EXPO_PUBLIC_URL + "/ReactOnChat?chatId=" + chatId + "&reactId=" + reactId + "&userId=" + user_id);
        if (response.ok) {

            let json = await response.json();

            if (json.success) {
                console.log("React saved");

                setTimeout(() => {
                    sendMessage(
                        {
                            logged_user_id: user_id,
                            other_user_id: item.other_user_id,
                            message: "Reacted",
                        }
                    );
                }, 500);

            }
        }
    }

    return (
        <MenuProvider>
            <LinearGradient colors={getTheme == "Light" ? ['#B9FDD5', '#D5EFF4', '#C3E0FD'] : ['#0a131a', '#1e1e1e', "black"]} style={stylesheet.view1}>

                <StatusBar backgroundColor={getTheme == "Light" ? "#c7edda" : "#101f2b"} style={getTheme == "Light" ? null : "light"} />

                <View style={[stylesheet.view2, getTheme == "Light" ? null : { backgroundColor: "#101f2b", shadowColor: "lightblue", elevation: 80 }]}>

                    <FontAwesome6 name={"arrow-left-long"} size={25} color={getTheme == "Light" ? "black" : "white"} onPress={
                        () => {
                            router.back();
                        }
                    } />

                    <LinearGradient colors={['#274B74', '#8233C5', '#E963FD']} style={stylesheet.view3}>
                        {item.avatar_image_found ? //or avatar_image_found = "true"
                            <Image style={stylesheet.image1} source={process.env.EXPO_PUBLIC_URL + "/AvatarImages/" + item.other_user_mobile + ".png"} />
                            :
                            <Text style={stylesheet.text1}>{item.other_user_avatar_letters}</Text>
                        }
                    </LinearGradient>
                    <View style={stylesheet.view4}>
                        <Text style={[stylesheet.text2, getTheme == "Light" ? null : { color: "#cfcccc" }]}>{item.other_user_name}</Text>
                        <Text style={getOtherUserStatus == 1 ? stylesheet.text3_1 : stylesheet.text3_2}>{getOtherUserStatus == 1 ? "Online" : "Offline"}</Text>
                    </View>
                </View>

                <View style={stylesheet.center_view}>

                    {/* {getChatArray.length == 0 ?
                    <View style={stylesheet.noChatView}>
                        <Text style={stylesheet.noChatText}>Let's Start new conversation...</Text>
                        <Text style={stylesheet.noChatText}>✨ Tap to say "Hi..! 👋"</Text>
                    </View>
                    :
                    null
                } */}

                    <FlashList
                        ref={getChatArray.length != 0 ? flashListRef : null}
                        data={getChatArray.length != 0 ? getChatArray : [item.other_user_id]}
                        renderItem={
                            ({ item }) =>

                                getChatArray.length == 0 ?
                                    <Animatable.View ref={animatableView} style={[stylesheet.noChatView_1, getTheme == "Light" ? null : { backgroundColor: "#1f2c40" }]}>
                                        <Pressable style={stylesheet.noChatView_2} onPress={
                                            async () => {

                                                animateView();

                                                let response = await fetch(process.env.EXPO_PUBLIC_URL + "/SendChat?logged_user_id=" + user_id + "&other_user_id=" + item + "&message=Hi..! 👋");
                                                if (response.ok) {
                                                    let json = await response.json();

                                                    if (json.success) {
                                                        console.log("Messsage Sent");

                                                        setTimeout(() => {
                                                            sendMessage(
                                                                {
                                                                    logged_user_id: user_id,
                                                                    other_user_id: item,
                                                                    message: "Sent",
                                                                }
                                                            );
                                                        }, 500);

                                                    }
                                                }
                                            }
                                        }>
                                            <Text style={[stylesheet.noChatText, getTheme == "Light" ? null : { color: "white" }]}>Let's Start new conversation...</Text>
                                            <Text style={[stylesheet.noChatText, getTheme == "Light" ? null : { color: "white" }]}>Tap to say "Hi..! 👋"</Text>
                                        </Pressable>
                                    </Animatable.View>
                                    :

                                    <View style={item.side == "right" ? stylesheet.view5_3 : stylesheet.view5_4}>

                                        {/* Menu styles = renderer={renderers.Popover} rendererProps={{ placement: 'bottom' }} */}
                                        <Menu>
                                            <MenuTrigger triggerOnLongPress={true}>
                                                <View style={item.side == "right" ?
                                                    [stylesheet.view5_1, getTheme == "Light" ? null : { backgroundColor: "#1f2c40" }]
                                                    :
                                                    [stylesheet.view5_2, getTheme == "Light" ? null : { backgroundColor: "#2f3d52" }]}
                                                >
                                                    <Text style={[stylesheet.text4, getTheme == "Light" ? null : { color: "white" }]}>{item.message}</Text>
                                                    <View style={stylesheet.view6}>
                                                        <Text style={stylesheet.text3_2}>{item.datetime}</Text>
                                                        {item.side == "right" ?
                                                            <FontAwesome6 name={item.status == 1 ? "check-double" : "check"} color={item.status == 1 ? "green" : "gray"} size={15} />
                                                            :
                                                            null
                                                        }

                                                    </View>
                                                </View>
                                            </MenuTrigger>
                                            <MenuOptions optionsContainerStyle={[stylesheet.holdMenuView, getTheme == "Light" ? null : { backgroundColor: "#1e2b33", borderColor: "#1e2b33" }]}>
                                                <View style={{ flexDirection: "row", columnGap: 5 }}>

                                                    {getReactsList.map((reactItem, index) => (
                                                        <MenuOption key={index} style={{ alignItems: "center", justifyContent: "center" }} onSelect={
                                                            () => {
                                                                setIsScroll(false);
                                                                fetchReact(item.id, reactItem.id);
                                                            }
                                                        }>
                                                            <View>
                                                                <Text style={{ fontSize: 25 }}>{reactItem.name}</Text>
                                                            </View>
                                                        </MenuOption>
                                                    ))}

                                                    <MenuOption style={{ alignItems: "center", justifyContent: "center" }} onSelect={
                                                        () => {
                                                            setIsScroll(false);
                                                            fetchReact(item.id, 1);
                                                        }
                                                    }>
                                                        <View>
                                                            <FontAwesome6 name={"ban"} size={27} color={"grey"} />
                                                        </View>
                                                    </MenuOption>

                                                </View>
                                            </MenuOptions>
                                        </Menu>

                                        {item.reaction1 != "No" | item.reaction2 != "No" ?
                                            <View style={item.side == "right" ?
                                                [stylesheet.react1, getTheme == "Light" ? null : { backgroundColor: "#1e2b33", borderColor: "black" }]
                                                :
                                                [stylesheet.react2, getTheme == "Light" ? null : { backgroundColor: "#1e2b33", borderColor: "black" }]}
                                            >
                                                {item.reaction1 != "No" ?
                                                    <Text style={stylesheet.text4}>{item.reaction1}</Text>
                                                    :
                                                    null
                                                }
                                                {item.reaction2 != "No" ?
                                                    <Text style={stylesheet.text4}>{item.reaction2}</Text>
                                                    :
                                                    null
                                                }
                                            </View>
                                            :
                                            null
                                        }

                                    </View>


                        }
                        estimatedItemSize={200}
                    />

                </View>

                <View style={stylesheet.view7}>
                    <TextInput style={[stylesheet.input1, getTheme == "Light" ? null : { backgroundColor: "#1e2b33", color: "white" }]} placeholderTextColor={getTheme == "Light" ? null : "#939494"} cursorColor={getTheme == "Light" ? "black" : "#939494"} multiline={true} placeholder="Message here..." value={getChatText} onChangeText={
                        (text) => {
                            setChatText(text)
                        }
                    } />
                    <Pressable style={[stylesheet.pressable1, getTheme == "Light" ? null : { backgroundColor: "#405580" }]} onPress={
                        async () => {

                            if (getChatText == "") {
                                Alert.alert("Error", "Message is emply");
                            } else {

                                // fetchChatArray();

                                // setChatText("");

                                let response = await fetch(process.env.EXPO_PUBLIC_URL + "/SendChat?logged_user_id=" + user_id + "&other_user_id=" + item.other_user_id + "&message=" + getChatText);
                                if (response.ok) {
                                    let json = await response.json();

                                    if (json.success) {
                                        console.log("Messsage Sent");
                                        setChatText("");
                                        setIsScroll(true);
                                        sendMessage(
                                            {
                                                logged_user_id: user_id,
                                                other_user_id: item.other_user_id,
                                                message: "Sent",
                                            }
                                        );

                                    }
                                }
                            }

                        }
                    }>
                        <FontAwesome6 name={"share"} color={getTheme == "Light" ? "white" : "black"} size={20} />
                    </Pressable>
                </View>

            </LinearGradient>
        </MenuProvider>
    );
}

const stylesheet = StyleSheet.create(
    {
        holdMenuView: {
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#e1fffe",
            borderRadius: 50,
            width: "auto",
            minWidth: 250,
            paddingHorizontal: 5,
            // borderBottomLeftRadius: 20,
            // borderBottomRightRadius: 20,
            // borderTopLeftRadius: 20,
            // shadowColor: "black",
            // elevation: 8,
        },

        react1: {
            flexDirection: "row",
            columnGap: 1,
            width: "auto",
            minWidth: 30,
            height: 30,
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "flex-start",
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: "#d1d1d1",
            backgroundColor: "white",
            position: "relative",
            zIndex: 10,
            marginTop: -10,
            shadowColor: "grey",
            elevation: 5,
            paddingHorizontal: 4,
        },

        react2: {
            flexDirection: "row",
            columnGap: 1,
            width: "auto",
            minWidth: 30,
            height: 30,
            height: 30,
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "flex-end",
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: "#d1d1d1",
            backgroundColor: "white",
            position: "relative",
            zIndex: 10,
            marginTop: -10,
            shadowColor: "grey",
            elevation: 5,
            paddingHorizontal: 4,
        },

        noChatView_1: {
            // position: "absolute",
            alignSelf: "center",
            // alignItems: "center",
            // justifyContent: "center",
            width: 230,
            height: 125,
            backgroundColor: "#C8E6C9",
            shadowColor: "black",
            elevation: 35,
            borderRadius: 15,
            // gap: 10,
            marginVertical: 150,
        },

        noChatView_2: {
            // position: "absolute",
            // alignSelf: "center",
            alignItems: "center",
            justifyContent: "center",
            width: 230,
            height: 125,
            // backgroundColor: "#c3d7db",
            // shadowColor: "black",
            // elevation: 8,
            borderRadius: 15,
            gap: 10,
            // marginVertical: 150,
        },

        noChatText: {
            fontSize: 18,
            fontFamily: "Fredoka-Regular",
        },

        view1: {
            flex: 1,
        },

        view2: {
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 15,
            flexDirection: "row",
            columnGap: 20,
            alignItems: "center",
            marginBottom: 4,
            // borderBottomColor: "grey",
            // borderBottomWidth: 1,
            backgroundColor: "#c7edda",
            elevation: 10,
        },

        // view2: {
        //     marginTop: 20,
        //     marginBottom: 20,
        //     paddingHorizontal: 20,
        //     flexDirection: "row",
        //     columnGap: 15,
        //     justifyContent: "center",
        //     alignItems: "center"
        // },

        view3: {
            width: 65,
            height: 65,
            borderRadius: 40,
            justifyContent: "center",
            alignItems: "center",
        },

        view4: {
            flex: 1,
        },

        image1: {
            width: 65,
            height: 65,
            borderRadius: 40,
        },

        text1: {
            fontSize: 30,
            fontFamily: "Fredoka-Regular",
            alignSelf: "center",
            color: "white",
        },

        text2: {
            fontSize: 22,
            fontFamily: "Fredoka-SemiBold",
        },

        text3_1: {
            fontSize: 15,
            fontFamily: "Fredoka-SemiBold",
            color: "green",
        },

        text3_2: {
            fontSize: 15,
            fontFamily: "Fredoka-Regular",
            color: "gray",
        },

        view5_1: {
            backgroundColor: "#C8E6C9",
            borderRadius: 10,
            // marginHorizontal: 20,
            // marginVertical: 5,
            padding: 10,
            justifyContent: "center",
            // alignSelf: "flex-end",
            rowGap: 5,
            zIndex: 5,
        },

        view5_2: {
            backgroundColor: "#A5D6A7",
            borderRadius: 10,
            // marginHorizontal: 20,
            // marginVertical: 5,
            padding: 10,
            justifyContent: "center",
            // alignSelf: "flex-start",
            rowGap: 5,
            zIndex: 5,
        },

        view5_3: {
            // backgroundColor: "#C8E6C9",
            // borderRadius: 10,
            marginHorizontal: 10,
            marginVertical: 5,
            // padding: 10,
            justifyContent: "center",
            alignSelf: "flex-end",
            maxWidth: "85%",
            // rowGap: 5,
        },

        view5_4: {
            // backgroundColor: "#A5D6A7",
            // borderRadius: 10,
            marginHorizontal: 10,
            marginVertical: 5,
            // padding: 10,
            justifyContent: "center",
            alignSelf: "flex-start",
            maxWidth: "85%",
            // rowGap: 5,
        },

        view6: {
            flexDirection: "row",
            columnGap: 10,
            width: "auto",
        },

        text4: {
            fontSize: 16,
            fontFamily: "Fredoka-Regular",
        },

        view7: {
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            columnGap: 10,
            paddingHorizontal: 20,
            marginBottom: 10,
            paddingTop: 5,
        },

        input1: {
            backgroundColor: "#9bb2c6",
            height: 50,
            borderRadius: 30,
            // borderStyle: "solid",
            // borderColor:"#9d9d9d",
            // borderWidth: 2,
            fontFamily: "Fredoka-Regular",
            fontSize: 20,
            flex: 1,
            paddingHorizontal: 10,
            // elevation: 0.5,
        },

        pressable1: {
            backgroundColor: "#83a4d4",
            borderRadius: 30,
            padding: 12,
            justifyContent: "center",
            alignItems: "center",
        },

        center_view: {
            flex: 1,
            // marginTop:20,
            // marginVertical: 10,
            // marginBottom: 4
        }

    }
);