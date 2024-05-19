import {getGamesByTournament, getWinnerByTournament} from "../service/game.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.tournamentID = this.getAttribute("tournament_id")
        this.render();
        this.updateTableData()
        document.title = "Tournament";
    }

    render() {
        this.innerHTML = `
            <tr-nav></tr-nav>
            <h1 id="winner-title" class="text-center" style="display: none;"> <span id="winner" class="gradient-text">gene</span> IS A WINNER!🏆</h1>
            <table class="table table-borderless">
              <thead>
                <tr>
                  <th scope="col">Player 1</th>
                  <th scope="col">Player 2</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody id="tt-body">
              </tbody>
            </table>
        `;

        this.ttBody = this.querySelector("#tt-body")
        this.winnerTitle = this.querySelector("#winner-title")
        this.winner = this.querySelector("#winner")
    }

    async updateTableData() {
        const ttGames = await getGamesByTournament(this.tournamentID)

        this.ttBody.innerHTML = ``;
        for (let i = ttGames.length-1; i >= 0; i--) {
            this.ttBody.innerHTML += `
                 <tr>
                  <td>${ttGames[i].display_name_p1}</td>
                  <td>${ttGames[i].display_name_p2}</td>
                  <td>${ttGames[i].player1_score} - ${ttGames[i].player2_score}</td>
                </tr>
            `
        }

        const resp = await getWinnerByTournament(this.tournamentID)
        if (!resp) {
            return;
        }

        this.winner.innerHTML = resp.winner;
        this.winnerTitle.style.display = 'block';
    }
}