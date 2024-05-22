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
           <div class="d-flex justify-content-center align-items-center">
            <img style="height: 100vh;" src="/images/404.jpg" alt="not found">
           </div>
        `;
    }
}