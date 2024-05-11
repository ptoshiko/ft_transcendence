import {searchUsers} from "../service/users.js";
import {modalsToCloseList} from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.idsToInvite = new Set();
        this.searchInput.addEventListener('input', this.getSearchInputHandler())

        $('#creat-tournament-modal').on('hide.bs.modal', (e) => {
           this.searchInput.value = ``;
           this.searchResultsList.innerHTML = ``;
           this.toInviteList.innerHTML = ``;
           this.idsToInvite.clear();
        })

        modalsToCloseList.push("creat-tournament-modal")

        document.title = "Game";
    }

    render() {
        this.innerHTML = `
            <tr-nav current-active="game"></tr-nav>
            <div class="container">
            <!-- First Row -->
            <div class="row mt-3">
               <!-- Games History -->
                <div class="col-6">
                    <div class="card h-100">
                        <h5 class="card-header">Games History</h5>
                        <div class="card-body">
                            <h5 class="card-title text-success">Wins: 5</h5>
                            <h5 class="card-title text-danger">Loses: 6</h5>
                        </div>
                    </div>
                </div>
                <!-- Tournaments -->
                <div class="col-6">
                    <div class="card h-100">
                        <h5 class="card-header">Tournaments  <a data-toggle="modal" data-target="#creat-tournament-modal" href=""><i class="fa-solid fa-plus"></i></a></h5>
                        <div class="card-body"></div>  
                    </div>
                 </div>
            </div>
        </div>
        
        
        <!-- Create Tournament Modal -->
        <div class="modal fade" id="creat-tournament-modal" tabindex="-1" role="dialog" aria-labelledby="creat-tournament-modal" aria-hidden="true">
            <div style="height: 80vh;" class="modal-dialog modal-dialog-scrollable" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create Tournament</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <!-- List of Users -->
                        <div id="tournament-to-invite-list" class="tournament-invite-list"></div>
                        <!-- Search Box -->
                        <form class="form-inline my-2 my-lg-0">
                            <input id="tournament-search-input" autocomplete='off' class="form-control mr-sm-3" type="search" placeholder="Find Friends...">
                            <div id="tournament-search-results-list" class="list-group list-group-flush"></div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button id="save-invitations-btn" type="button" class="btn btn-success" disabled>Send Invitations</button>
                        <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        this.searchResultsList = this.querySelector("#tournament-search-results-list")
        this.searchInput = this.querySelector("#tournament-search-input")
        this.toInviteList = this.querySelector("#tournament-to-invite-list")
        this.sendInvitationsBtn = this.querySelector("#save-invitations-btn")
    }

    getSearchInputHandler() {
        return (e) => {
            this.searchResultsList.innerHTML = ``;

            searchUsers(this.searchInput.value).
                then(users => {
                    for (let i = 0; i < users.length && i < 3; i++) {
                        if (this.idsToInvite.has(users[i].id)) {
                            continue;
                        }

                        const userElement = document.createElement("tr-user-small-tournament");
                        userElement.setAttribute("avatar", users[i].avatar);
                        userElement.setAttribute("display-name", users[i].display_name);
                        userElement.setAttribute("is-online", users[i].is_online);
                        userElement.addEventListener('click', this.getAddHandler(users[i].avatar, users[i].id));
                        this.searchResultsList.appendChild(userElement);
                    }
            })
        };
    }

    getAddHandler(avatar, id) {
        return (e) => {
            e.preventDefault();
            this.idsToInvite.add(id);
            const addedUserComponent = document.createElement("tr-added-to-tournament");
            addedUserComponent.setAttribute("avatarUrl", avatar)
            this.toInviteList.appendChild(addedUserComponent)
            this.checkBtnDisability()
            this.searchInput.value = ``;
            this.searchResultsList.innerHTML = ``;
            addedUserComponent.
                querySelector("#remove-added-user").
                addEventListener('click', this.getRemoveHandler(addedUserComponent, id))
        };
    }

    getRemoveHandler(component, id) {
        return (e) => {
            e.preventDefault()
            this.idsToInvite.delete(id)
            this.toInviteList.removeChild(component);
            this.checkBtnDisability()
        }
    }

    checkBtnDisability() {
        if (this.idsToInvite.size > 0) {
            this.sendInvitationsBtn.removeAttribute('disabled')
        } else {
            this.sendInvitationsBtn.setAttribute('disabled', '')
        }
    }
}