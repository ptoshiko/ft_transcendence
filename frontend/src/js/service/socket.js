import {BACKEND_PORT, HOSTNAME} from "../constants.js";

let socket;
let selfClose = false;

export function initSocket() {
    getSocket();
}

function getSocket() {
    if (!socket || (socket && socket.readyState === 3)) {
        const accessToken = localStorage.getItem('access-token')
        if (!accessToken) {
            return;
        }

        socket = new WebSocket(`wss://${HOSTNAME}:${BACKEND_PORT}/wss/chat/?token=${accessToken}`);

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            const chatComponent = document.querySelector("#app").querySelector("tr-chat");
            const duelGameComponent = document.querySelector("#app").querySelector("tr-duel-game");
            switch (data.event_type) {
                case "chat_message":
                    if (chatComponent) {
                        chatComponent.dispatchEvent(new CustomEvent("chat-message", {
                            detail: data.data
                        }));
                    }
                    break;
                case "game_link":
                    if (chatComponent) {
                        chatComponent.dispatchEvent(new CustomEvent("game-link", {
                            detail: data.data
                        }));
                    }
                    break;
                case "tournament_link":
                    if (chatComponent) {
                        chatComponent.dispatchEvent(new CustomEvent("tournament-link", {
                            detail: data.data
                        }))
                    }
                    break;
                case "join_game":
                    if (duelGameComponent) {
                        duelGameComponent.dispatchEvent(new CustomEvent("join_game", {
                            detail: data.data
                        }))
                    }
                    break;
                case "game_tick":
                    if (duelGameComponent) {
                        duelGameComponent.dispatchEvent(new CustomEvent("game_tick", {
                            detail: data.data
                        }));
                    }
                    break;
                case "game_state":
                    if (duelGameComponent) {
                        duelGameComponent.dispatchEvent(new CustomEvent("game_state", {
                            detail: data.data
                        }));
                    }
                    break;
                case "block_notification":
                    if (chatComponent) {
                        chatComponent.dispatchEvent(new CustomEvent("block-notification", {
                            detail: data.data
                        }));
                    }
                    break;
            }
        };

        socket.onclose = (e) => {
            console.log("some socket close: ", e)
            if (!selfClose) {
                getSocket();
            }

            selfClose = false;
        }

        socket.onerror = (e) => {
            console.log("some socket error: ", e)
            getSocket();
        }
    }

    return socket
}

export function closeSocket() {
    if (socket) {
        selfClose = true;
        socket.close();
    }
}

export function sendMessage(toDisplayName, msg) {
    let socket = getSocket();
    // while (socket.readyState !== 1) {
    //     socket = getSocket();
    // }

    const data = {
        event_type: 'chat_message',
        data: {
            to: toDisplayName,
            content: msg,
        }
    }

    socket.send(JSON.stringify(data));
}

export function joinGame(gameID) {
    let socket = getSocket();
    // while (socket.readyState !== 1) {
    //     socket = getSocket();
    // }

    const data = {
        event_type: 'join_game',
        data: {
            game_id: gameID,
        }
    }

    socket.send(JSON.stringify(data));
}

export function duelUpKey() {
    let socket = getSocket();
    // while (socket.readyState !== 1) {
    //     socket = getSocket();
    // }

    const data = {
        event_type: 'up_key',
    }

    socket.send(JSON.stringify(data));
}

export function duelDownKey() {
    let socket = getSocket();
    // while (socket.readyState !== 1) {
    //     socket = getSocket();
    // }

    const data = {
        event_type: 'down_key',
    }

    socket.send(JSON.stringify(data));
}