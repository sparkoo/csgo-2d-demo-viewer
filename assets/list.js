'use strict';

const faceitApiUrlBase = "https://open.faceit.com/data/v4";
const faceitApiKey = "edb4088b-cd60-42e3-96db-0119d8327105";
const sprPlayerId = "d0a85a88-0f69-4671-8f5e-d6dd10b98168";
const reqParamHeaders = {
    headers: {
        Authorization: `Bearer ${faceitApiKey}`
    }
}

function matchRow(key, TeamA, TeamB, ScoreA, ScoreB, time) {
    return <li className="w3-row w3-blue-gray" key={key}>
        <div className="w3-col l2">
            {time}
        </div>
        <div className="w3-col l3">
            de_dust2
        </div>
        <div className="w3-col l6">
            <span className={ScoreA > ScoreB ? "w3-green" : ""}>{TeamA}</span> {ScoreA} : {ScoreB} <span className={ScoreA < ScoreB ? "w3-green" : ""}>{TeamB}</span>
        </div>
    </li>;
}

fetch(`${faceitApiUrlBase}/players/${sprPlayerId}/history`, reqParamHeaders)
    .then(response => response.json())
    .then(content => handleMatches(content))
    .catch(reason => console.log("failed", reason))

function handleMatches(matchesResponse) {
    const matchesList = []
    matchesResponse.items.forEach(match => {
        const time = new Date(match.finished_at * 1000);
        matchesList.push(matchRow(match.match_id, match.teams.faction1.nickname, match.teams.faction2.nickname, match.results.score.faction1, match.results.score.faction2, time.toISOString()))
    })
    ReactDOM.render(
        matchesList,
        document.getElementById('matchList')
    );
}
