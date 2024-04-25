let socket;
let selfClose = false;

export function initSocket() {
    console.log("init called");
    getSocket();
}

function getSocket() {
    if (!socket || (socket && socket.readyState === 3)) {
        socket = new WebSocket(`wss://localhost:8081/wss/chat/?token=${localStorage.getItem('access-token')}`);

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            switch (data.event_type) {
                case "chat_message":
                    const chatComponent = document.querySelector("#app").querySelector("tr-chat");
                    if (chatComponent) {
                        chatComponent.dispatchEvent(new CustomEvent("chat-message", {
                            detail: data.data,
                        }));
                    }
                    break;
            }
        };

        socket.onclose = (e) => {
            if (!selfClose) {
                getSocket();
            }
        }

        socket.onerror = (e) => {
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
    const socket = getSocket();

    const data = {
        event_type: 'chat_message',
        data: {
            to: toDisplayName,
            message: msg,
        }
    }

    socket.send(JSON.stringify(data));
}