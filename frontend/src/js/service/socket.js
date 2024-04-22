let socket;

export function initSocket() {
    getSocket();
}

function getSocket() {
    if (!socket) {
        const accessToken = localStorage.getItem('access-token');
        socket = new WebSocket("wss://localhost:8080/wss/?token="+accessToken);
        socket.onmessage = (e) => {
            document.dispatchEvent(new CustomEvent("msgReceived",
                {
                    detail: {data: e}
                },
            ));
        };
    }

    return socket
}

export function sendMessage(to, msg) {
    const socket = getSocket();

    const data = {
        event_type: 'chat_message',
        data: {
            to: to,
            message: msg,
        }
    }

    socket.send(JSON.stringify(data));
}