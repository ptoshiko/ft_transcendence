import {getChatFriendsList, getChatMessages} from "../service/chat.js";
import {formatAvatar, redirectTo} from "../helpers.js";
import {getMe, getUserByDisplayName} from "../service/users.js";
import {sendMessage} from "../service/socket.js";
import {createGame} from "../service/game.js";

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

        await this.initFriendsAndChat(user);

        this.addEventListener("chat-message", this.getChatMessageHandler());
        this.addEventListener("game-link", this.getChatMessageHandler());

        this.chatMessageInput.addEventListener('input', this.getMessageInputHandler());

        this.chatSendMsgBtn.addEventListener('click', this.getSendMessageBtnClickHandler());
        this.chatGameLinkBtn.addEventListener('click', this.getGameLinkBtnHandler());

        document.title = "Chat";
    }

    render() {
        this.innerHTML = `
            <tr-nav></tr-nav>
            <div id="chat-error-alert" style="position: absolute; z-index: 15; left: 0; right: 0; margin-left: auto; margin-right: auto; max-width: 500px" class="alert alert-danger collapse m-auto" role="alert"></div>
            <div class="container" >
                <div class="row">
                    <div class="mt-3 d-flex w-100" style="height: calc(100vh - 72px);">
                        <!-- Friends List -->
                        <div id="chat-friends-list" class="list-group list-group-flush" style="flex-basis: 300px; flex-shrink: 0; overflow-y: scroll;"></div>
                        <!-- Messages Zone -->
                        <div class="p-4 flex-grow-1 bg-light d-flex flex-column-reverse" style="flex-shrink: 1;">
                            <!-- Input Part -->
                            <form class="p-1 position-static mt-2">
                                <div class="form-row">
                                    <div class="col-1"><a id="chat-game-link-btn" href="" class="btn btn-danger disabled"><i class="fa-solid fa-table-tennis-paddle-ball"></i></a></div>
                                    <div class="col-8">
                                        <input disabled id="chat-msg-input" type="text" class="form-control" placeholder="Message">
                                    </div>
                                    <div class="col-3">
                                        <button id="chat-send-msg-btn" type="submit" class="btn btn-primary w-100" disabled>Send</button>
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
        this.chatErrorAlert = this.querySelector("#chat-error-alert")
        this.chatGameLinkBtn = this.querySelector("#chat-game-link-btn");
    }

    async initFriendsAndChat(predefinedExistingUser) {
        let chatFriends = await getChatFriendsList();

        chatFriends = this.appendPredefinedExistingUserIfNeeded(predefinedExistingUser, chatFriends);

        this.chatFriendsList.innerHTML = ``;
        for (const friend of chatFriends) {
            const friendComponent= document.createElement("tr-chat-friend");
            friendComponent.setAttribute("avatar", formatAvatar(friend.avatar));
            friendComponent.setAttribute("displayName", friend.display_name);
            friendComponent.setAttribute("is-online", friend.is_online);
            if (predefinedExistingUser && (friend.id === predefinedExistingUser.id)) {
                this.currentActiveSpeaker = friend;
                this.chatMessageInput.removeAttribute('disabled');
                this.chatGameLinkBtn.removeAttribute('disabled');
                this.chatMessageInput.value = ``;
                this.currentActiveFriendComponent = friendComponent;
            }

            friendComponent.addEventListener('click', this.getFriendComponentClickHandler({
                    friend: friend,
                    friendComponent: friendComponent,
                }),
            )

            this.chatFriendsList.appendChild(friendComponent);
        }

        if (this.currentActiveFriendComponent) {
            // TODO: we should also scroll to the active, because it might me beneath a lot of other friends
            this.currentActiveFriendComponent.setAttribute("is_active", "true");
            const messages = await getChatMessages(this.currentActiveSpeaker.display_name);
            this.currentMe = await getMe();
            this.drawMessages(messages, this.currentMe, this.currentActiveSpeaker);
        }

    }

    getFriendComponentClickHandler(props) {
        return async (e) => {
            e.preventDefault();

            history.replaceState(null, null, `/chat/${props.friend.display_name}`)
            if (this.currentActiveFriendComponent) {
                this.currentActiveFriendComponent.setAttribute("is_active", "false");
                const upToDateList = await getChatFriendsList()
                if (!upToDateList.find((f) => f.id === this.currentActiveSpeaker.id)) {
                    this.chatFriendsList.removeChild(this.currentActiveFriendComponent);
                }
            }
            this.currentActiveSpeaker = props.friend;
            this.chatMessageInput.removeAttribute('disabled');
            this.chatGameLinkBtn.removeAttribute('disabled');
            this.chatMessageInput.value = ``;
            this.currentActiveFriendComponent = props.friendComponent;
            this.currentActiveFriendComponent.setAttribute("is_active", "true");
            const messages = await getChatMessages(props.friend.display_name);
            this.currentMe = await getMe();
            this.drawMessages(messages, this.currentMe, props.friend);
        };
    }

    getChatMessageHandler() {
        return (e) => {
            if (e.detail.error) {
                this.chatErrorAlert.innerHTML = e.detail.error;

                $("#chat-error-alert").show();
                setTimeout(()=>{
                    $("#chat-error-alert").hide();
                    this.chatErrorAlert.innerHTML = ``;
                }, 5000);


                return;
            }

            if (e.detail.sender === this.currentActiveSpeaker.id || e.detail.receiver === this.currentActiveSpeaker.id) {
                this.drawMessage(e.detail, this.currentMe, this.currentActiveSpeaker);
            }


            this.initFriendsAndChat(this.currentActiveSpeaker);
        };
    }

    getSendMessageBtnClickHandler() {
        return (e) => {
            e.preventDefault();
            sendMessage(this.currentActiveSpeaker.display_name, this.chatMessageInput.value);
            this.chatMessageInput.value = ``;
        };
    }

    getMessageInputHandler() {
        return (e) => {
            if (e.target.value.length > 0 && this.currentActiveSpeaker) {
                this.chatSendMsgBtn.removeAttribute('disabled');
            } else {
                this.chatSendMsgBtn.setAttribute('disabled', '');
            }
        };
    }

    getGameLinkBtnHandler() {
        return (e) => {
            e.preventDefault();
            if (this.currentActiveSpeaker) {
                createGame(this.currentActiveSpeaker.id);
            }
        };
    }

    drawMessages(messages, me, friend) {
        this.chatMessagesList.innerHTML = ``;

        for (const message of messages) {
            this.drawMessage(message, me, friend);
        }
    }

    drawMessage(message, me, friend) {
        let messageComponent;
        if (message.sender === me.id) {
            messageComponent = document.createElement('tr-chat-my-msg');
            messageComponent.setAttribute('displayName', me.display_name);
            messageComponent.setAttribute('avatar', formatAvatar(me.avatar));
        } else {
            messageComponent = document.createElement('tr-chat-msg-to-me');
            messageComponent.setAttribute('displayName', friend.display_name);
            messageComponent.setAttribute('avatar', formatAvatar(friend.avatar));
        }

        messageComponent.setAttribute('msg', message.content);
        messageComponent.setAttribute('msgType', message.type);

        this.chatMessagesList.appendChild(messageComponent);
    }

    appendPredefinedExistingUserIfNeeded(predefinedExistingUser, chatFriends) {
        if (!predefinedExistingUser) {
            return chatFriends
        }

        let found = false;
        for (const chatFriend of chatFriends) {
            if (chatFriend.id === predefinedExistingUser.id) {
                return chatFriends;
            }
        }

        chatFriends.unshift(predefinedExistingUser);

        return chatFriends;
    }


}