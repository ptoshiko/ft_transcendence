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
            this.displayNameContainer.style.display = "none";
            this.repeatPasswordContainer.style.display = "none";
            this.mainBtn.textContent = "Sign In";
            this.signInBtn.classList.add("active");
            this.signUpBtn.classList.remove("active");
            this.clearInputs();
        })

        this.signUpBtn.addEventListener("click", (e)=>{
            e.preventDefault();
            this.displayNameContainer.style.display = "block";
            this.repeatPasswordContainer.style.display = "block";
            this.mainBtn.textContent = "Sign Up";
            this.signInBtn.classList.remove("active");
            this.signUpBtn.classList.add("active");
            this.clearInputs();
        })

        document.title = "Login";
    }

    render() {
        this.innerHTML = `
        <div class="container-fluid">
            <!-- One Row with 100% height -->
            <div class="row justify-content-center align-items-center vh-100">
                <!-- One Col which is login block. Always half the page. The height depends on the content -->
                <div class="col-4 container p-5">
                    <!-- Title Row -->
                    <h1 class="row mb-3">Trancendance</h1>
                    <div style="display:none;" class="alert alert-danger" role="alert" id="login-err"></div>
                    <div style="display:none;" class="alert alert-success" role="alert" id="login-info"></div>
                    <!-- Header Row -->
                    <ul class="row nav nav-tabs mb-3">
                        <li class="nav-item">
                            <a class="nav-link active" id="login-sign-in">Sign In</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" id="login-sign-up">Sign Up</a>
                        </li>
                    </ul>
                    <!-- Content Row -->
                    <div class="row justify-content-center">
                        <form class="container">
                            <div style="display:none;"class="mb-3" id="display-name-container">
                                <label for="login-display-name" class="form-label">Display Name</label>
                                <input type="text" class="form-control" id="login-display-name">
                            </div>
                            <div class="mb-3">
                                <label for="login-email" class="form-label">Email address</label>
                                <input type="email" class="form-control" id="login-email">
                            </div>
                            <div class="mb-3">
                                <label for="login-password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="login-password">
                            </div>
                            <div style="display:none;" class="mb-3" id="password-repeat-container">
                                <label for="login-password-repeat" class="form-label">Repeat Password</label>
                                <input type="password" class="form-control" id="login-password-repeat">
                            </div>
                            <button type="submit" class="btn btn-primary" id="login-main-btn">Sign In</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        `;

        this.email = this.querySelector("#login-email");
        this.password = this.querySelector("#login-password");
        this.repeatPasswordContainer = this.querySelector("#password-repeat-container")
        this.displayNameInput = this.querySelector("#login-display-name");
        this.displayNameContainer = this.querySelector("#display-name-container");
        this.repeatPasswordInput = this.querySelector("#login-password-repeat");
        this.signInBtn = this.querySelector("#login-sign-in");
        this.signUpBtn = this.querySelector("#login-sign-up");
        this.mainBtn = this.querySelector("#login-main-btn");
        this.err = this.querySelector("#login-err");
        this.info = this.querySelector("#login-info");
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
            this.password.classList.add("is-invalid");
            this.repeatPasswordInput.classList.add("is-invalid");
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
            this.email.classList.add("is-invalid");
        }
        
        if (this.password.value === ``) {
            this.password.classList.add("is-invalid");
        }

        if (this.repeatPasswordInput.value === ``) {
            this.repeatPasswordInput.classList.add("is-invalid");
        }

        if (this.displayNameInput.value === ``) {
            this.displayNameInput.classList.add("is-invalid");
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
            this.displayNameContainer.style.display = "none";
            this.repeatPasswordContainer.style.display = "none";
            this.mainBtn.textContent = "Sign In";
            this.signInBtn.classList.add("active");
            this.signUpBtn.classList.remove("active");
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
        this.email.classList.remove("is-invalid");
        this.password.classList.remove("is-invalid");
        this.repeatPasswordInput.classList.remove("is-invalid");
        this.displayNameInput.classList.remove("is-invalid");
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