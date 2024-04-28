import {navigateTo} from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const avatar = this.getAttribute('avatar');
        const displayName = this.getAttribute('displayName');
        const msg = this.getAttribute('msg')
        const msgType = this.getAttribute('msgType');

        this.render(avatar, displayName, msg, msgType);
    }

    render(avatar, displayName, msg, msgType) {
        console.log(msgType);
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
        console.log(msg);
        this.innerHTML =  `
            <!-- My Message -->
            <div class="right d-flex ml-auto flex-row-reverse mt-1" style="max-width: 75%; column-gap: 10px;">
                <!-- Avatar -->
                <div class="">
                    <img class="rounded-circle" width="50" height="50" src="${avatar}">
                </div>
                <!-- Text -->
                <div class="bg-primary rounded p-2">
                    <h5 class="mb-1">${displayName}</h5>
                    <div class="msg-text text-light">${msg}</div>
                </div>
            </div>
        `;
    }

    renderGameLinkMsg(avatar, displayName, gameID) {
        console.log(gameID);
        this.innerHTML =  `
            <!-- My Message -->
            <div class="right d-flex ml-auto flex-row-reverse mt-1" style="max-width: 75%; column-gap: 10px;">
                <!-- Avatar -->
                <div class="">
                    <img class="rounded-circle" width="50" height="50" src="${avatar}">
                </div>
                <!-- Text -->
                <div class="bg-primary rounded p-2">
                    <h5 class="mb-1">${displayName}</h5>
                    <a id="my-msg-play-btn" href="" class="btn btn-success">Play</a>
                </div>
            </div>
        `;

        this.querySelector("#my-msg-play-btn").addEventListener('click', this.getGameLinkHandler(gameID))
    }

    getGameLinkHandler(gameID) {
        return (e) => {
            navigateTo(`games/${gameID}`)
        };
    }
}