import {BACKEND_PORT, HOSTNAME} from "../constants.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        let avatar = this.getAttribute("avatar");
        const displayName = this.getAttribute("display-name");
        const isOnline = this.getAttribute("is-online");


        avatar = `https://${HOSTNAME}:${BACKEND_PORT}`+avatar
        this.render(avatar, displayName);

        if (isOnline==="true") {
            this.userSmallOnOffStatus.classList.remove("bg-secondary");
            this.userSmallOnOffStatus.classList.add("bg-success");
        }
    }

    render(avatar, displayName) {
        this.innerHTML = ` 
            <a id="redirect-to-user" href="" class="list-group-item list-group-item-action">
                <div class="container" style="min-width: 215px">
                    <div class="row align-items-center">
                        <div class="col-4">
                            <img class="rounded-circle" width="50" height="50" src="${avatar}">
                        </div>
                        <div class="col-2"></div>
                        <div class="col-4">
                            <h5 class="mb-0">${displayName}</h5>
                        </div>
                        <div class="col-2">
                            <div id="user-small-on-off-status" style="width: 10px; height: 10px;" class="rounded-circle bg-secondary"></div>
                        </div>
                    </div>
                </div>
            </a> `;

        this.userSmallOnOffStatus = this.querySelector("#user-small-on-off-status");
    }
}