import {getMe, getUserByDisplayName} from "../service/users.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }
    
    async connectedCallback() {
        this.render();

        const username  = this.getAttribute("username");

        const user = await getUserByDisplayName(username);

        console.log(user);
        this.username.textContent = user.display_name;
        if (user.is_me > 0) {
            this.isMe.textContent = "This is you!";
        }



        document.title = "Profile";
    }

    render() {
        this.innerHTML = `
            <tr-nav></tr-nav>
            <section class="profile-container">
                <h1 class="username"></h1>
                <h1 class="is-me"></h1>
            </section>
        `;

        this.username = this.querySelector(".username");
        this.isMe = this.querySelector(".is-me");
    }
}