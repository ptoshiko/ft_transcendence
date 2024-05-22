import {navigateTo} from "../helpers.js";
import {approveTournamentInvite, declineTournamentInvite} from "../service/game.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const avatar = this.getAttribute('avatar');
        const displayName = this.getAttribute('displayName');
        const msg = this.getAttribute('msg')
        const msgType = this.getAttribute('msgType');
        const extraDetails = this.getAttribute('extraDetails');

        this.render(avatar, displayName, msg, msgType, extraDetails);
    }

    render(avatar, displayName, msg, msgType, extraDetails) {
        switch (msgType) {
            case "1":
                this.renderTextMsg(avatar, displayName, msg);
                return;
            case "2":
                this.renderGameLinkMsg(avatar, displayName, msg);
                return;
            case "3":
                this.renderTournamentInviteMsg(avatar, displayName, msg, extraDetails)
                return;
        }
    }

    renderTextMsg(avatar, displayName, msg) {
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
                    <div class="msg-text text-light">Let's play a duel<span style="font-size: 1.5rem;">🏓</span></div>
                    <a id="my-msg-play-btn" style="width: 120px" href="" class="btn btn-success">Play</a>
                </div>
            </div>
        `;

        this.querySelector("#my-msg-play-btn").addEventListener('click', this.getGameLinkHandler(gameID));
    }

    renderTournamentInviteMsg(avatar, displayName, ttID, extraDetails) {
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
                    <div class="msg-text text-light">Join My Ping-Pong Tournament<span style="font-size: 1.5rem;">🏓</span></div>
                </div>
            </div>
        `;
    }

    getGameLinkHandler(gameID) {
        return (e) => {
            e.preventDefault()
            navigateTo(`/games/${gameID}`)
        };
    }
}