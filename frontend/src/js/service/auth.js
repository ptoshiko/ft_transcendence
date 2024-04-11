import { API_ADDRESS } from "../constants.js"

const LOGIN_API = API_ADDRESS+"/login"

export function login(email, password) {
    return fetch(LOGIN_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            password: password,
        })
    }).
    then(res => res.json())
} 

export function isLoggedIn() {
    return !!localStorage.getItem("access-token");
}