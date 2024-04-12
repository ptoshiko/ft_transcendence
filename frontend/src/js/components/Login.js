import { redirectTo } from "../helpers.js";
import { withJSONContent } from "../middleware.js";
import { isLoggedIn } from "../service/auth.js";
import { getMe } from "../service/users.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        if (isLoggedIn()) {
            const user = await getMe();
            redirectTo(`/profiles/${user.display_name}`)
            return;
        }

        this.render();

        this.mainBtn.addEventListener("click", (e)=>{
            e.preventDefault();
            this.onMainBtnClicked(e);
        })

        this.signInBtn.addEventListener("click", (e)=>{
            e.preventDefault();
            this.displayNameInput.style.display = "none";
            this.repeatPasswordInput.style.display = "none";
            this.mainBtn.textContent = "Sign In";
            this.signUpBtn.classList.remove("login-disabled");
            this.signInBtn.classList.add("login-disabled");
            this.clearInputs();
        })

        this.signUpBtn.addEventListener("click", (e)=>{
            e.preventDefault();
            this.displayNameInput.style.display = "inline-block";
            this.repeatPasswordInput.style.display = "inline-block";
            this.mainBtn.textContent = "Sign Up";
            this.signUpBtn.classList.add("login-disabled");
            this.signInBtn.classList.remove("login-disabled");
            this.clearInputs();
        })

        document.title = "Login";
    }

    render() {
        this.innerHTML = 
        `<section class="login-container">
            <form class="login-form">
                <div class="login-btns-containers">
                    <button class="login-btn login-sign-in login-disabled">Sign In</button>
                    <button class="login-btn login-sign-up">Sign Up</button>
                </div>
                <h1 class="login-err"></h1>
                <h1 class="login-info"></h1>
                <input type="text" id="display-name-form" placeholder="Display Name">
                <input type="email" id="email-form" placeholder="Email Address" >
                <input type="password" id="password-form" placeholder="Password">
                <input type="password" id="password-repeat-form" placeholder="Repeat Password">
                <button class="login-btn login-main-button">Sign In</button>
            </form>
        </section>`;

        this.email = this.querySelector("#email-form");
        this.password = this.querySelector("#password-form");
        this.displayNameInput = this.querySelector("#display-name-form");
        this.repeatPasswordInput = this.querySelector("#password-repeat-form");
        this.signInBtn = this.querySelector(".login-sign-in");
        this.signUpBtn = this.querySelector(".login-sign-up");
        this.mainBtn = this.querySelector(".login-main-button");
        this.err = this.querySelector(".login-err");
        this.info = this.querySelector(".login-info");
    }

    async onMainBtnClicked(e) {
        if (this.mainBtn.textContent == "Sign In") {
            this.handleSignIn();
        } else {
            this.handleSignUp();
        }
    }

    async handleSignIn() {
        if (!this.checkSignInInputs()) {
            return;
        }

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
                    this.showErr("Wrong password or email");
                } else {
                    this.showErr("There is some server error");
                }
                return;
            }

            this.removeErr();

            const tokens = await resp.json();

            localStorage.setItem('access-token', tokens.access);
            localStorage.setItem('refresh-token', tokens.refresh);

            const user = await getMe();

            redirectTo(`/profiles/${user.display_name}`);
        } catch(e) {
            this.showErr("There is some server error");
        }
    }

    checkSignInInputs() {
        if (this.email.value !== `` && this.password.value !== ``) {
            this.clearInputErr();
            return true;
        }

        if (this.email.value === ``) {
            this.email.classList.add("login-err-input");
        }
        
        if (this.password.value === ``) {
            this.password.classList.add("login-err-input");
        }

        return false;
    }

    checkSignUpInputs() {
        if (this.password.value !== this.repeatPasswordInput.value) {
            this.showErr("Passwords don't match");
            return false;
        }

        if (this.email.value !== ``&&
            this.password.value !== `` &&
            this.displayNameInput !== `` &&
            this.repeatPasswordInput !== ``) {

            this.clearInputErr();
            return true;
        }

        if (this.email.value === ``) {
            this.email.classList.add("login-err-input");
        }
        
        if (this.password.value === ``) {
            this.password.classList.add("login-err-input");
        }

        if (this.repeatPasswordInput.value === ``) {
            this.repeatPasswordInput.classList.add("login-err-input");
        }

        if (this.displayNameInput.value === ``) {
            this.displayNameInput.classList.add("login-err-input");
        }

        return false;
    }

    async handleSignUp() {
        if (!this.checkSignUpInputs()) {
            return;
        }
        
        let req = JSON.stringify({
            display_name: this.displayNameInput.value,
            email: this.email.value,
            password: this.password.value,
        })

        try {
            let resp = await fetch("https://localhost:8081/api/register/", {
                method: 'POST',
                headers: withJSONContent(),
                body: req,
            })
        
            if (!resp.ok) {
                this.err.textContent = this.handleSignUpErr(resp);
                return;
            }

            this.removeErr();
            this.showInfo("Now Sign In!");
            this.displayNameInput.style.display = "none";
            this.repeatPasswordInput.style.display = "none";
            this.mainBtn.textContent = "Sign In";
            this.signUpBtn.classList.remove("login-disabled");
            this.signInBtn.classList.add("login-disabled");
        } catch(e) {
            console.log(e);
            this.err.textContent = "There is some server error";
        }
    }

    async handleSignUpErr(resp) {
        const errs = await resp.json();

        this.showErr(Object.values(errs)[0]);
    }


    clearInputs() {
        this.password.value=``;
        this.repeatPasswordInput.value=``;
        this.email.value=``;
        this.displayNameInput.value=``;
        this.clearInputErr();
    }

    clearInputErr() {
        this.removeErr();
        this.email.classList.remove("login-err-input");
        this.password.classList.remove("login-err-input");
        this.repeatPasswordInput.classList.remove("login-err-input");
        this.displayNameInput.classList.remove("login-err-input");
    }

    showInfo(text) {
        this.info.style.display = "block";
        this.info.textContent = text;
    }

    removeInfo() {
        this.info.style.display = "none";
    }

    showErr(text) {
        this.err.style.display = "block";
        this.err.textContent = text;
    }

    removeErr() {
        this.err.style.display = "none";
    }
}