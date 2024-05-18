import {navigateTo} from "../helpers.js";
import {approveTournamentInvite, declineTournamentInvite} from "../service/game.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const avatar = this.getAttribute('avatar');
        const displayName = this.getAttribute('displayName');
        const msg = this.getAttribute('msg');
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
                    <div class="msg-text text-light">Let's play a duel<span style="font-size: 1.5rem;">🏓</span></div>
                    <a style="width: 120px"  id="to-me-msg-play-btn" href="" class="btn btn-danger">Play</a>
                </div>
            </div>
        `;

        this.querySelector("#msg-redirect-to-friend-btn").addEventListener('click', (e)=>{
            navigateTo(`/profiles/${displayName}`);
        });

        this.querySelector("#to-me-msg-play-btn").addEventListener('click', this.getGameLinkHandler(gameID))
    }

    renderTournamentInviteMsg(avatar, displayName, ttID, extraDetails) {
        this.innerHTML =  `
            <!-- My Message -->
            <div class="left d-flex mr-auto mt-1" style="max-width: 75%; column-gap: 10px;">
                <!-- Avatar -->
                <div class="">
                    <img class="rounded-circle" width="50" height="50" src="${avatar}">
                </div>
                <!-- Text -->
                <div class="bg-primary rounded p-2">
                    <h5 class="mb-1">${displayName}</h5>
                    <div class="msg-text text-light">Join My Ping-Pong Tournament <span style="font-size: 1.5rem;">🏟</span></div>
                    <a id="to-me-msg-approve-tt" style="width: 120px;" href="" class="btn btn-success">Approve</a>
                    <a id="to-me-msg-approved-tt" style="width: 120px; display: none;" href="" class="btn btn-success disabled">Approved</a>
                    <a id="to-me-msg-decline-tt" style="width: 120px;" href="" class="btn btn-danger">Decline</a>
                    <a id="to-me-msg-canceled-tt" style="width: 120px; display: none;;" href="" class="btn btn-warning disabled">Tournament Is Canceled</a>
                </div>
            </div>
        `;

        this.approveTTBtn = this.querySelector("#to-me-msg-approve-tt")
        this.declineTTBtn = this.querySelector("#to-me-msg-decline-tt")

        this.approvedMsg = this.querySelector("#to-me-msg-approved-tt")
        this.canceledMsg = this.querySelector("#to-me-msg-canceled-tt")

        this.approveTTBtn.addEventListener('click', this.getApproveTTHandler(ttID))
        this.declineTTBtn.addEventListener('click', this.getDeclineTTHandler(ttID))

        switch (extraDetails) {
            case "TT_CANCELED":
                this.setCanceledTTState()
                break
            case "TT_APPROVED":
                this.setApprovedTTState()
                break;
        }
    }

    getGameLinkHandler(gameID) {
        return (e) => {
            e.preventDefault();
            navigateTo(`/games/${gameID}`);
        };
    }

    getApproveTTHandler(ttID) {
        return async (e) => {
            e.preventDefault()
            const resp = await approveTournamentInvite(ttID)
            if (resp.status === 3) {
                this.setCanceledTTState()
                return
            }

            this.setApprovedTTState()
        }
    }

    getDeclineTTHandler(ttID) {
        return async (e) => {
            e.preventDefault()
            await declineTournamentInvite(ttID)
            this.setCanceledTTState()
        }
    }

    setCanceledTTState() {
        this.approveTTBtn.style.display = 'none';
        this.declineTTBtn.style.display = 'none';
        this.canceledMsg.style.display = 'inline-block';
    }

    setApprovedTTState() {
        this.approveTTBtn.style.display = 'none';
        this.declineTTBtn.style.display = 'none';
        this.approvedMsg.style.display = 'inline-block';
    }
}