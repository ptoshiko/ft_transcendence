import {getMe, getUserByID, searchUsers} from "../service/users.js";
import {modalsToCloseList, redirectTo} from "../helpers.js";
import {getMyGames, getMyTournaments, getStatsByID, proposeTournament} from "../service/game.js";

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
        this.idsToInvite = new Set();
        this.searchInput.addEventListener('input', this.getSearchInputHandler())

        $('#creat-tournament-modal').on('hide.bs.modal', async (e) => {
           this.searchInput.value = ``;
           this.searchResultsList.innerHTML = ``;
           this.toInviteList.innerHTML = ``;
           this.idsToInvite.clear();
           console.log('check')
           await this.updatePageInfo()
        })


        modalsToCloseList.push("creat-tournament-modal")
        modalsToCloseList.push("view-all-matches-modal")
        modalsToCloseList.push("view-all-tournaments-modal")

        this.sendInvitationsBtn.addEventListener('click', this.getInvitationBtnHandler())

        this.updatePageInfo()

        this.viewAllMatchesBtn.addEventListener('click', this.getBigMatchesListHandler())
        this.viewAllTournamentsBtn.addEventListener('click', this.getBigTournamentsListHandler())

        document.title = "Game";
    }

    render() {
        this.innerHTML = `
            <tr-nav current-active="game"></tr-nav>
            <div class="container">
            <!-- First Row -->
            <div class="row mt-3">
            
                <!-- Stats -->
                <div class="col-6">
                    <div class="card h-100">
                        <h5 class="card-header">Stats</h5>
                        <div class="card-body">
                            <div class="progress" style="height: 100%;">
                                  <div id="win-bar" class="progress-bar bg-success" role="progressbar" style="width: 50%"></div>
                                  <div id="lose-bar" class="progress-bar bg-danger" role="progressbar" style="width: 50%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Matches -->
                <div class="col-6">
                    <div class="card h-100">
                        <h5 class="card-header">Matches History</h5>
                        <div id="small-matches-list" class="list-group list-group-flush"></div>  
                        <div class="card-body">
                            <h2 id="no-matches-title" style="display: none">No Matches Yet 😣</h2>
                            <a id="view-all-matches-btn" style="display: none" href="#" class="btn btn-primary" data-toggle="modal" data-target="#view-all-matches-modal">View All</a>
                        </div>  
                    </div>
                </div>
                 
            </div>
            <!-- Second Row -->
            <div class="row mt-3">
                <!-- Tournaments -->
                <div class="col-6">
                    <div class="card h-100">
                        <h5 class="card-header">Tournaments  <a data-toggle="modal" data-target="#creat-tournament-modal" href=""><i class="fa-solid fa-plus"></i></a></h5>
                        <div id="small-tournaments-list" class="list-group list-group-flush"></div>
                        <div class="card-body">
                            <h2 id="no-tournaments-title" style="display: none">No Tournaments Yet 🫠</h2>
                            <a id="view-all-tournaments-btn" style="display: none" href="#" class="btn btn-primary" data-toggle="modal" data-target="#view-all-tournaments-modal">View All</a>
                        </div>  
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
        
        <!-- View All Matches  -->
        <div class="modal fade" id="view-all-matches-modal" tabindex="-1" role="dialog" aria-labelledby="view-all-matches-modal" aria-hidden="true">
            <div class="modal-dialog modal-dialog-scrollable" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Matches History</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="big-matches-list" class="list-group list-group-flush"></div>  
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        
         <!-- View All Tournaments -->
        <div class="modal fade" id="view-all-tournaments-modal" tabindex="-1" role="dialog" aria-labelledby="view-all-tournaments-modal" aria-hidden="true">
            <div class="modal-dialog modal-dialog-scrollable" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Your Tournaments</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="big-tournaments-list" class="list-group list-group-flush"></div>  
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        // Stats
        this.winBar = this.querySelector("#win-bar");
        this.loseBar = this.querySelector("#lose-bar");

        // Matches History
        this.bigMatchesList = this.querySelector("#big-matches-list")
        this.smallMatchesList = this.querySelector("#small-matches-list")
        this.noMatchesTitle = this.querySelector("#no-matches-title")
        this.viewAllMatchesBtn = this.querySelector("#view-all-matches-btn")

        // Tournaments
        this.searchResultsList = this.querySelector("#tournament-search-results-list")
        this.searchInput = this.querySelector("#tournament-search-input")
        this.toInviteList = this.querySelector("#tournament-to-invite-list")
        this.sendInvitationsBtn = this.querySelector("#save-invitations-btn")
        this.smallTournamentsList = this.querySelector("#small-tournaments-list")
        this.bigTournamentsList = this.querySelector("#big-tournaments-list")
        this.noTournamentsTitle = this.querySelector("#no-tournaments-title")
        this.viewAllTournamentsBtn = this.querySelector("#view-all-tournaments-btn")
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

    getInvitationBtnHandler() {
        return async (e) => {
            await proposeTournament(Array.from(this.idsToInvite));
            await this.updatePageInfo();
            $(`#creat-tournament-modal`).modal('hide');
        };
    }

    checkBtnDisability() {
        if (this.idsToInvite.size > 0) {
            this.sendInvitationsBtn.removeAttribute('disabled')
        } else {
            this.sendInvitationsBtn.setAttribute('disabled', '')
        }
    }

    async updatePageInfo() {
        const tournaments = await getMyTournaments()
        const me = await getMe()
        this.me = me
        const stats = await getStatsByID(me.id)
        const matches = await getMyGames()

        const max = stats.wins + stats.losses
        const winPercent = stats.wins * 100 / max;
        const losePercent = stats.losses * 100 / max

        this.winBar.style.width = `${winPercent}%`
        this.winBar.innerHTML = `${stats.wins} Wins`
        this.loseBar.style.width = `${losePercent}%`
        this.loseBar.innerHTML = `${stats.losses} Losses`

        if (!matches || matches.length === 0) {
            this.smallMatchesList.innerHTML = ``;
            this.viewAllMatchesBtn.style.display = 'none';
            this.noMatchesTitle.style.display = 'block';
        } else {
            this.viewAllMatchesBtn.style.display = 'inline-block';
            this.smallMatchesList.innerHTML = ``
            for (let i = 0; i < matches.length && i < 3; i++) {
                const match = matches[i];
                const matchElement = document.createElement("tr-match-small");
                matchElement.setAttribute('game-id', match.game_id);

                if (match.won_id === me.id) {
                    matchElement.setAttribute('game-result', "Won!");
                } else {
                    matchElement.setAttribute('game-result', "Lost!");
                }

                let enemyID = match.player1
                if (enemyID === me.id) {
                    enemyID = match.player2
                }

                const user = await getUserByID(enemyID)

                matchElement.setAttribute('avatar', user.avatar);

                this.smallMatchesList.appendChild(matchElement)
            }
        }

        if (!tournaments || tournaments.length === 0) {
            this.smallTournamentsList.innerHTML = ``;
            this.viewAllTournamentsBtn.style.display = 'none';
            this.noTournamentsTitle.style.display = 'block';
        } else {
            this.noTournamentsTitle.style.display = 'none';
            this.smallTournamentsList.innerHTML = ``;
            this.viewAllTournamentsBtn.style.display = 'inline-block';
            console.log(this.smallTournamentsList.children.length)
            for (let i = 0; i < tournaments.length && this.smallTournamentsList.children.length < 3;  i++) {
                const tournament = tournaments[i];
                const ttComponent = document.createElement("tr-tournament-small")
                ttComponent.setAttribute("id", tournament.tournament_id);
                ttComponent.setAttribute("status", tournament.status);
                ttComponent.setAttribute("created-at", tournament.created_at);

                this.smallTournamentsList.appendChild(ttComponent);
            }
        }
    }

    getBigMatchesListHandler() {
        return async (e) => {
            e.preventDefault()

            this.bigMatchesList.innerHTML = ``;
            const matches = await getMyGames()

            if (!matches || matches.length === 0) {
                this.bigMatchesList.innerHTML = ``;
                this.viewAllMatchesBtn.style.display = 'none';
                this.noMatchesTitle.style.display = 'block';
            } else {
                this.viewAllMatchesBtn.style.display = 'inline-block';
                this.bigMatchesList.innerHTML = ``
                for (let i = 0; i < matches.length; i++) {
                    const match = matches[i];
                    const matchElement = document.createElement("tr-match-small");
                    matchElement.setAttribute('game-id', match.game_id);

                    if (match.won_id === this.me.id) {
                        matchElement.setAttribute('game-result', "Won!");
                    } else {
                        matchElement.setAttribute('game-result', "Lost!");
                    }

                    let enemyID = match.player1
                    if (enemyID === this.me.id) {
                        enemyID = match.player2
                    }

                    const user = await getUserByID(enemyID)

                    matchElement.setAttribute('avatar', user.avatar);

                    this.bigMatchesList.appendChild(matchElement)
                }
            }
        }
    }

    getBigTournamentsListHandler() {
        return async (e) => {
            e.preventDefault()

            const tournaments = await getMyTournaments()

            if (!tournaments || tournaments.length === 0) {
                this.bigTournamentsList.innerHTML = ``;
                this.viewAllTournamentsBtn.style.display = 'none';
                this.noTournamentsTitle.style.display = 'block';
            } else {
                this.viewAllTournamentsBtn.style.display = 'inline-block';
                this.bigTournamentsList.innerHTML = ``
                for (let i = 0; i < tournaments.length; i++) {
                    const tournament = tournaments[i];
                    const ttComponent = document.createElement("tr-tournament-small")
                    ttComponent.setAttribute("id", tournament.tournament_id);
                    ttComponent.setAttribute("status", tournament.status);
                    ttComponent.setAttribute("created-at", tournament.created_at);

                    this.bigTournamentsList.appendChild(ttComponent);
                }
            }
        }
    }
}