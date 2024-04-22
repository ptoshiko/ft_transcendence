let socket;

export function initSocket() {
    getSocket();
}

function getSocket() {
    if (!socket || (socket && socket.readyState)) {
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

    socket.onclose = (e) => {
        getSocket();
    }

    socket.onerror = (e) => {
        getSocket();
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