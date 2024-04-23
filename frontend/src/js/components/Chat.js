import {getChatFriendsList, getChatMessages} from "../service/chat.js";
import {formatAvatar, getMyID, redirectTo} from "../helpers.js";
import {getUserByDisplayName} from "../service/users.js";
import {sendMessage} from "../service/socket.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const username = this.getAttribute('username');
        let user = null;
        if (username !== null) {
            user = await getUserByDisplayName(username);
            if (user === null) {
                redirectTo("/chat");
            }
        }

        this.render();

        if (user === null) {
            this.initFriendsList();
        } else {
            this.initPredefinedFriendsList(user);
        }


        document.title = "Chat";
    }

    render() {
        this.innerHTML = `
            <tr-nav></tr-nav>
            <div class="container" >
                <div class="row">
                    <div class="mt-3 d-flex w-100" style="height: calc(100vh - 72px);">
                        <!-- Friends List -->
                        <div id="chat-friends-list" class="list-group list-group-flush" style="flex-basis: 200px; flex-shrink: 0; overflow-y: scroll;"></div>
                        <!-- Messages Zone -->
                        <div class="p-4 flex-grow-1 bg-light d-flex flex-column-reverse" style="flex-shrink: 1;">
                            <!-- Input Part -->
                            <form class="p-1 position-static mt-2">
                                <div class="form-row">
                                    <div class="col-9">
                                        <input id="chat-msg-input" type="text" class="form-control" placeholder="Message">
                                    </div>
                                    <div class="col-3">
                                        <button id="chat-send-msg-btn" type="submit" class="btn btn-primary w-100">Send</button>
                                    </div>
                                </div>
                            </form>
                            <!-- Messages -->
                            <div id="chat-messages-list" style="overflow-y: scroll;" class="messages"></div>
                        </div>
                    </div>
             </div>
        </div>
        `;

        this.chatFriendsList = this.querySelector("#chat-friends-list");
        this.chatMessagesList = this.querySelector("#chat-messages-list");
        this.chatMessageInput = this.querySelector("#chat-msg-input");
        this.chatSendMsgBtn = this.querySelector("#chat-send-msg-btn");
    }

    async initFriendsList() {
        const chatFriends = await getChatFriendsList();

        if (chatFriends.length === 0) {
            this.chatSendMsgBtn.setAttribute('disabled',"");
            this.chatMessageInput.setAttribute('disabled',"");
        }

        // TODO: add input event listener and make button active only if there is at least one character

        this.chatMessageInput.addEventListener('click', (e) => {
           e.preventDefault();
           sendMessage();
        });

        for (const friend of chatFriends) {
            let friendComponent = document.createElement("tr-chat-friend")
            friendComponent.setAttribute("avatar", formatAvatar(friend.avatar));
            friendComponent.setAttribute("displayName", friend.display_name);

            friendComponent.addEventListener('click', async (e) => {
                e.preventDefault();
                const myID = getMyID();
                const displayName = e.target.getAttribute('displayName');
                const avatar = e.target.getAttribute('avatar');
                const messages = await getChatMessages(displayName);

                this.chatMessagesList.innerHTML = ``;
                for (const message of messages) {
                    let messageComponent;
                    if (message.sender === myID) {
                        messageComponent = document.createElement('tr-chat-my-msg');
                    } else {
                        messageComponent = document.createElement('tr-chat-msg-to-me');
                    }

                    messageComponent.setAttribute('displayName', displayName);
                    messageComponent.setAttribute('avatar', avatar);
                    messageComponent.setAttribute('msg', message.content);

                    this.chatMessagesList.appendChild(messageComponent);
                }
            })

            this.chatFriendsList.appendChild(friendComponent);
        }
    }

    async initPredefinedFriendsList(user) {
        const chatFriends = await getChatFriendsList();

        let chatFriendsWithIsActive = [];
        let found = false;
        for (const friend of chatFriends) {
            if (friend.display_name === user.display_name) {
                found = true;
                chatFriendsWithIsActive.push({
                    avatar: user.avatar,
                    display_name: user.display_name,
                    is_active: true,
                })
            } else {
                chatFriendsWithIsActive.push({
                    avatar: user.avatar,
                    display_name: user.display_name,
                    is_active: false,
                })
            }
        }

        if (!found) {
            chatFriendsWithIsActive.push({
                avatar: user.avatar,
                display_name: user.display_name,
                is_active: true,
            });
        }

        for (const friend of chatFriendsWithIsActive) {
            let friendComponent= document.createElement("tr-chat-friend")
            friendComponent.setAttribute("avatar", formatAvatar(friend.avatar));
            friendComponent.setAttribute("displayName", friend.display_name);
            this.chatFriendsList.appendChild(friendComponent);

            friendComponent.addEventListener('click', async (e) => {
                e.preventDefault();
                const myID = getMyID();
                const messages = await getChatMessages(friend.display_name);
                if (this.activeFriend && this.activeFriend !== friendComponent) {
                    this.activeFriend.classList.remove("active-chat-friend");
                }

                this.activeFriend = friendComponent;
                this.activeFriend.classList.add("active-chat-friend");

                this.chatMessagesList.innerHTML = ``;
                for (const message of messages) {
                    let messageComponent;
                    if (message.sender === myID) {
                        messageComponent = document.createElement('tr-chat-my-msg');
                    } else {
                        messageComponent = document.createElement('tr-chat-msg-to-me');
                    }

                    messageComponent.setAttribute('displayName', friend.display_name);
                    messageComponent.setAttribute('avatar', formatAvatar(friend.avatar));
                    messageComponent.setAttribute('msg', message.content);

                    this.chatMessagesList.appendChild(messageComponent);
                }

                this.chatFriendsList.addEventListener('chat_message', (e)=>{
                    console.log(e.detail.data);
                    let messageComponent;
                    if (e.detail.data.sender === myID) {
                        messageComponent = document.createElement('tr-chat-my-msg');
                    } else {
                        messageComponent = document.createElement('tr-chat-msg-to-me');
                    }

                    messageComponent.setAttribute('displayName', friend.display_name);
                    messageComponent.setAttribute('avatar', formatAvatar(friend.avatar));
                    messageComponent.setAttribute('msg', e.detail.data.content);

                    this.chatMessagesList.appendChild(messageComponent);
                })
            })
        }

        this.chatMessageInput.addEventListener('click', (e) => {
            e.preventDefault();
            sendMessage(this.activeFriend.getAttribute('displayName'), this.chatMessageInput.value);
        });


    }
}