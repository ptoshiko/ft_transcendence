import {getMe} from "../service/users.js";
import {redirectTo} from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

   async connectedCallback() {
        const me = await getMe()
        if (!me) {
            redirectTo("/login")
            return
        }

        this.render();
        document.title = "Not Found";
    }

    render() {
       this.innerHTML = `
            <section class="not-found-container">
                <div class="not-found-content">
                    <h1> Не Нашла </h1>
                    <div class="not-found-img">
                        <img src="/images/404.jpeg" alt="not found">
                    </div>
                </div>
            </section>
        `;
    }
}