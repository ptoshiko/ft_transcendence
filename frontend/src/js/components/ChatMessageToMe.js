import {navigateTo} from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const avatar = this.getAttribute('avatar');
        const displayName = this.getAttribute('displayName');
        const msg = this.getAttribute('msg');
        const msgType = this.getAttribute('msgType');

        this.render(avatar, displayName, msg, msgType);
    }

    render(avatar, displayName, msg, msgType) {
        switch (msgType) {
            case "1":
                this.renderTextMsg(avatar, displayName, msg);
                return;
            case "2":
                this.renderGameLinkMsg(avatar, displayName, msg);
                return;
        }
    }

    renderTextMsg(avatar, displayName, msg) {
        this.innerHTML =  `
            <!-- Message To Me -->
            <div class="left d-flex mr-auto mt-1" style="max-width: 75%; column-gap: 10px;">
                <!-- Avatar -->
                <div id="chat-user-avatar">
                   <a id="msg-redirect-to-friend-btn" href=""> <img class="rounded-circle" width="50" height="50" src="${avatar}"> </a>
                </div>
                <!-- Text -->
                <div class="bg-primary rounded p-2">
                    <h5 class="mb-1">${displayName}</h5>
                    <div class="msg-text text-light">${msg}</div>
                </div>
            </div>
        `;

        this.querySelector("#msg-redirect-to-friend-btn").addEventListener('click', (e)=>{
            navigateTo(`/profiles/${displayName}`);
        });
    }

    renderGameLinkMsg(avatar, displayName, gameID) {
        this.innerHTML =  `
            <!-- Message To Me -->
            <div class="left d-flex mr-auto mt-1" style="max-width: 75%; column-gap: 10px;">
                <!-- Avatar -->
                <div id="chat-user-avatar">
                   <a id="msg-redirect-to-friend-btn" href=""> <img class="rounded-circle" width="50" height="50" src="${avatar}"> </a>
                </div>
                <!-- Text -->
                <div class="bg-primary rounded p-2">
                    <h5 class="mb-1">${displayName}</h5>
                    <a style="width: 120px"  id="to-me-msg-play-btn" href="" class="btn btn-danger">Play</a>
                </div>
            </div>
        `;

        this.querySelector("#msg-redirect-to-friend-btn").addEventListener('click', (e)=>{
            navigateTo(`/profiles/${displayName}`);
        });

        this.querySelector("#to-me-msg-play-btn").addEventListener('click', this.getGameLinkHandler(gameID))
    }

    getGameLinkHandler(gameID) {
        return (e) => {
            e.preventDefault();
            navigateTo(`/games/${gameID}`);
        };
    }
}