import getMe from "../service/getMe.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        this.render();

        const user = getMe();

        this.username.textContent = user.displayName;
    }

    render() {
        this.innerHTML = `
            <tr-nav></tr-nav>
            <section class="profile-container">
                <h1 class="username"></h1>
            </section>
        `;

        this.username = this.querySelector(".username")
    }
}