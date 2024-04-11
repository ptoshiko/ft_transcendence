import { redirectTo } from "../helpers.js";
import { withJSONContent } from "../middleware.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.signInBtn.addEventListener("click", (e)=>{
            e.preventDefault();
            this.onSignInClicked(e)
        })

        document.title = "Login";
    }

    render() {
        this.innerHTML = 
        `<section class="login-container">
            <form class="login-form"> 
                <h1 class="login-err"></h1>
                <h1>Login</h1>
                <input type="email" id="email-form" placeholder="Email Address" >
                <input type="password" id="password-form" placeholder="Password"> 
                <button>Sign In</button>
            </form>
        </section>`;

        this.greeting = this.querySelector(".greeting")
        this.email = this.querySelector("#email-form")
        this.password = this.querySelector("#password-form")
        this.signInBtn = this.querySelector("button")
        this.err = this.querySelector(".login-err")
    }

    async onSignInClicked(e) {
        let req = JSON.stringify({
            email: this.email.value,
            password: this.password.value,
        })

        try {
            let resp = await fetch("https://localhost:8081/api/token/", {
                method: 'POST',
                headers: withJSONContent(),
                body: req,
            })
        
            if (!resp.ok) {
                if (resp.status == 401) {
                    this.err.textContent = "Wrong password or email";
                } else {
                    this.err.textContent = "There is some server error";
                }
                return;
            }

            this.err.textContent = "";

            const tokens = await resp.json();

            localStorage.setItem('access-token', tokens.access);
            localStorage.setItem('refresh-token', tokens.refresh);
            redirectTo("/profile");
        } catch(e) {
            this.err.textContent = "There is some server error";
        }
    }
}