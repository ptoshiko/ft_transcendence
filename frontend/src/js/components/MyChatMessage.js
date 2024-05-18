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
        console.log(msgType);
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
                    <div class="msg-text text-light">Let's play a duel🏓</div>
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
                    <div class="msg-text text-light">Join My Ping-Pong Tournament🏟️</div>
                    <a id="my-msg-approve-tt" style="width: 120px;" href="" class="btn btn-success">Approve</a>
                    <a id="my-msg-approved-tt" style="width: 120px; display: none;" href="" class="btn btn-success disabled">Approved</a>
                    <a id="my-msg-decline-tt" style="width: 120px;" href="" class="btn btn-danger">Decline</a>
                    <a id="my-msg-declined-tt" style="width: 120px; display: none;" href="" class="btn btn-danger disabled">Declined</a>
                    <a id="my-msg-canceled-tt" style="width: 120px; display: none;;" href="" class="btn btn-warning disabled">Canceled</a>
                </div>
            </div>
        `;

        this.approveTTBtn = this.querySelector("#my-msg-approve-tt")


        this.declineTTBtn = this.querySelector("#my-msg-decline-tt")

        this.approvedMsg = this.querySelector("#my-msg-approved-tt")
        this.declinedMsg = this.querySelector("#my-msg-declined-tt")
        this.canceledMsg = this.querySelector("#my-msg-canceled-tt")

        this.approveTTBtn.addEventListener('click', this.getApproveTTHandler(ttID))
        this.declineTTBtn.addEventListener('click', this.getDeclineTTHandler(ttID))

        switch (extraDetails) {
            case "TT_CANCELED":
                this.approveTTBtn.style.display = 'none';
                this.declineTTBtn.style.display = 'none';
                this.canceledMsg.style.display = 'inline-block';
                break;
            case "TT_DECLINE":
                this.approveTTBtn.style.display = 'none';
                this.declineTTBtn.style.display = 'none';
                this.declinedMsg.style.display = 'inline-block';
                break;
            case "TT_APPROVED":
                this.approveTTBtn.style.display = 'none';
                this.declineTTBtn.style.display = 'none';
                this.approvedMsg.style.display = 'inline-block';
                break;
        }
    }

    getGameLinkHandler(gameID) {
        return (e) => {
            e.preventDefault()
            navigateTo(`/games/${gameID}`)
        };
    }

    getApproveTTHandler(ttID) {
        return async (e) => {
            e.preventDefault()
            await approveTournamentInvite(ttID)
            this.approveTTBtn.style.display = 'none';
            this.declineTTBtn.style.display = 'none';
            this.approvedMsg.style.display = 'inline-block';
        }
    }

    getDeclineTTHandler(ttID) {
        return async (e) => {
            e.preventDefault()
            await declineTournamentInvite(ttID)
            this.approveTTBtn.style.display = 'none';
            this.declineTTBtn.style.display = 'none';
            this.declinedMsg.style.display = 'inline-block';
        }
    }
}