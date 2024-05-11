import {formatAvatar} from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const avatarURL = this.getAttribute('avatarUrl')
        this.render(formatAvatar(avatarURL));
    }

    render(avatarUrl) {
        this.innerHTML = `
           <div>
            <div class="added-container">
                <a id="remove-added-user" class="added-icon" href=""><i class="fa-solid fa-circle-minus text-danger"></i></a>
                <img class="invite-avatar" src="${avatarUrl}">
            </div>
           </div>
        `;
    }
}