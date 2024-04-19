import {navigateTo, redirectTo} from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        let avatar = this.getAttribute("avatar");
        const displayName = this.getAttribute("display-name");


        avatar = "https://localhost:8081"+avatar
        console.log(avatar)
        this.render(avatar, displayName);

        this.goToUserPage.addEventListener('click', e => {
            navigateTo(`/profiles/${displayName}`)
        })
    }

    render(avatar, displayName) {
        this.innerHTML = ` 
            <a id="redirect-to-user" href="" class="list-group-item list-group-item-action">
                <div class="container" style="min-width: 215px">
                    <div class="row align-items-center">
                        <div class="col-5">
                            <img class="rounded-circle" width="50" height="50" src="${avatar}">
                        </div>
                        <div class="col-2"></div>
                        <div class="col-5">
                            <h5 class="card-sub-title">${displayName}</h5>
                        </div>
                    </div>
                </div>
            </a> `;


        this.goToUserPage = document.querySelector("#redirect-to-user");
    }
}