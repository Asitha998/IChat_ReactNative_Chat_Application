import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export default function WebSocketService(userId, onMessageCallback) {
    const ws = useRef(null);
    const appState = useRef(AppState.currentState);

    function openWebSocket() {

        if (ws.current !== null && ws.current.readyState === WebSocket.OPEN) {
            return;
        }

        ws.current = new WebSocket("ws://192.168.1.5:8080/IChat/RefreshChat?userId=" + userId);

        ws.current.onopen = function () {
            console.log("WebSocket Opened");
        };

        ws.current.onmessage = function (e) {
            console.log("Received message: ", e.data);
            onMessageCallback(e.data); // Call the callback function with the message received
        };

        ws.current.onerror = function (e) {
            console.log("WebSocket Error: ", e.message);
        };

        ws.current.onclose = function (e) {
            console.log("WebSocket Closed");
        };
    }

    function closeWebSocket() {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.close();
        }
    }

    // check the AppState and manage web socket
    // useEffect(() => {
    function checkAppState(nextAppState) {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {

            //app opened from background
            console.log("App opened, reopening WebSocket");
            openWebSocket();
            setTimeout(() => {
                sendMessage(
                    {
                        user_id: userId,
                        message: "ReOpen"
                    }
                );
            }, 1000);

            console.log("responseSent");


        } else if (nextAppState.match(/inactive|background/)) {

            // app closed or in the bkground
            console.log("App closed, closing WebSocket");
            closeWebSocket();

        }

        appState.current = nextAppState;
    }

    // Add AppState listener
    useEffect(() => {
        const appStateListener = AppState.addEventListener('change', checkAppState);

        // Cleanup function
        return () => {
            closeWebSocket();
            appStateListener.remove();
        };
    }, [userId]);

    //send msg to back end web socket
    function sendMessage(message) {

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
            // console.log("reOpen");
        }
    }

    return { sendMessage, openWebSocket, closeWebSocket };
}
