import { addDragAndDropHandlers } from './dragAndDrop.js';

const mainCont = document.querySelector(".mainContainer");
const leagueSelector = document.querySelector("#leagueSelector");

let liveMatchesList = [];

function _equal(a, b){
    return a === b;
}

leagueSelector.addEventListener("change", (evt) => {
    const selectedLeague = evt.target.value;
    const matchContainers = document.querySelectorAll('.matchContainer');

    matchContainers.forEach((matchContainer) => {
        const league = matchContainer.getAttribute('league');

        if (_equal(selectedLeague, "All") || _equal(selectedLeague, league)) {
            matchContainer.style.display = "block";
            matchContainer.querySelector('iframe').src = matchContainer.querySelector('iframe').src; // refresh iframe

        } else {
            matchContainer.style.display = "none";
        }
    });
});

document.addEventListener("click", (evt) => {
    //evt.preventDefault();
    const clickedElement = evt.target;

    if (clickedElement.classList.contains("matchContainer")) {
        clickedElement.classList.toggle("divSelected");
    } else if (clickedElement.classList.contains("btnDiv")) {
        clickedElement.parentElement.classList.toggle("divSelected");
    } else if (clickedElement.classList.contains("closeBtn")) {
        clickedElement.closest(".matchContainer").style.display = "none";
    } else if (clickedElement.classList.contains("dropdownBtn")) {
        clickedElement.classList.toggle("active");
        clickedElement.nextElementSibling.classList.toggle("show");
    }
});

async function updateLiveMatchesList() {
    // Fetch live matches from sofascore, update the array 'liveMatches'

    try {
        const response = await axios.get("https://www.sofascore.com/api/v1/sport/football/events/live");
        liveMatchesList = response.data.events;

        if (liveMatchesList.length === 0) {
            throw new Error("At updateLiveMatchesList(). No live matches at the moment.");
        }

        console.log("Live matches array updated.");
        
        return liveMatchesList;

    } catch (error) {
        throw error;
    }
}

async function getMatchStats(matchID) {
    // returned array contains objects (stats objects)
    // each object contains: stat key (ballPossession, shots, corners, ...), home (home teams stat value), away (away teams stat value)
    // 
    // example of returned array structure: [ 
    //                                        {key: "ballPossession", home: "60%", away: "40%"}, 
    //                                        {key: "shots", home: "5", away: "3"}, ...
    //                                      ]

    try {
        const response = await axios.get(`https://www.sofascore.com/api/v1/event/${matchID}/statistics`);

        return response.data.statistics[0].groups[0].statisticsItems || [];

    } catch (error) {
        throw error;
    }
}

function createIframeElementFor(matchID) {
    const iframeElement = document.createElement('iframe');
    iframeElement.src = `https://widgets.sofascore.com/embed/attackMomentum?id=${matchID}&widgetBackground=Gray&v=2`;
    iframeElement.scrolling = "no";
    
    return iframeElement;
}

function getLiveScoreboard(matchIdTarget) {
    const match = liveMatchesList.find(match => match.id === matchIdTarget);

    if (match) {
        const { homeTeam, awayTeam, homeScore, awayScore } = match; // extract value of the respective keys from match object
        
        return `${homeTeam.shortName} [${homeScore.current}] - [${awayScore.current}] ${awayTeam.shortName}`;
    }

    return "ENDED"; // if match not in liveMatchesList, then it ended...
}

async function updateScores() {
    // Each 'h2.id' is a match ID, use it to get the live score of a match

    try {
        await updateLiveMatchesList();

        // iterates through all h2 elements, for each, get it's id, get the live score for that id and update the text of the h2 element
        document.querySelectorAll('h2').forEach(scoreH2 => {
            if(scoreH2.innerText.includes('ENDED')) return;

            const matchID = Number(scoreH2.id);
            const newScore = getLiveScoreboard(matchID);

            if(newScore === "ENDED") {
                scoreH2.innerText = `${scoreH2.innerText} [ENDED]`;

            }else if(newScore !== scoreH2.innerText) {
                scoreH2.innerText = newScore;
            }
        });

        console.log("Scoreboards updated. Next update in 10 seconds.");

    } catch (error) {
        console.error("Error when running updateScores(): ", error.message);

    } finally {
        setTimeout(updateScores, 10000); // call this function again after 10 seconds
    }
}

async function updateStats() {
    // Each 'statsDiv.id' is a match ID, use it to get the stats of a match (similar to 'updateScores' func)
    // Though to get the stats of a match, we need to make a separate request to the API

    const statsDivs = document.querySelectorAll('.statsDiv');

    statsDivs.forEach(async (statsDiv) => {
        const matchID = statsDiv.id;

        try{
            const statsReturned = await getMatchStats(matchID);

            statsReturned.forEach(({ key, home, away }) => {
                const homeStatSpan = statsDiv.querySelector(`.homeTeamsStatsDiv #${key}`);
                const awayStatSpan = statsDiv.querySelector(`.awayTeamsStatsDiv #${key}`);
                if (homeStatSpan) homeStatSpan.innerText = home;
                if (awayStatSpan) awayStatSpan.innerText = away;
            });

        } catch (error) {
            console.error(`Error at updateStats(). When requesting ${matchID} stats. Error: ${error.message}`);
        }

    });

    console.log("Stats updated. Next update in 30 seconds.");

    setTimeout(updateStats, 30000); // call this function again after 10 seconds
}

function createMatchCard(match) {
    const gameCard = document.createElement('div');
    gameCard.classList.add("matchContainer");
    gameCard.setAttribute('draggable', 'true');
    gameCard.setAttribute('league', match.tournament.name);

    const iframeElement = createIframeElementFor(match.id);

    const matchCardHeader = document.createElement('div');
    matchCardHeader.classList.add('matchCardHeader');

    const btnRemoveCard = document.createElement('button');
    btnRemoveCard.classList.add('closeBtn');
    btnRemoveCard.innerText = "X";
    matchCardHeader.appendChild(btnRemoveCard);

    const matchLiveResultH2 = document.createElement('h2');
    matchLiveResultH2.setAttribute("id", match.id);
    matchCardHeader.appendChild(matchLiveResultH2);

    gameCard.appendChild(matchCardHeader);
    gameCard.appendChild(iframeElement);

    const statsDiv = document.createElement('div');
    statsDiv.classList.add('statsDiv');
    statsDiv.setAttribute('id', match.id);

    const statConfigs = [
        { key: 'ballPossession', name: 'Ball Possession', icon: '⚽' },
        { key: 'expectedGoals', name: 'xP Goals', icon: '🥅' },
        { key: 'bigChanceCreated', name: 'Big Chances', icon: '🎯' },
        { key: 'totalShotsOnGoal', name: 'Total Shots', icon: '👟' },
        { key: 'cornerKicks', name: 'Corners', icon: '🚩' },
        { key: 'passes', name: 'Passes', icon: '🔄' }
    ];

    const divHomeTeamStats = document.createElement('div');
    divHomeTeamStats.classList.add('homeTeamsStatsDiv');

    const divAwayTeamStats = document.createElement('div');
    divAwayTeamStats.classList.add('awayTeamsStatsDiv');

    statConfigs.forEach(stat => {
        const homeStatDiv = document.createElement('div');
        const homeStatIcon = document.createElement('span');
        homeStatIcon.textContent = stat.icon;
        const homeStatName = document.createElement('p');
        homeStatName.textContent = stat.name;
        const homeStatValue = document.createElement('span');
        homeStatValue.id = stat.key;
        homeStatValue.textContent = '-';
        homeStatDiv.append(homeStatIcon, homeStatName, homeStatValue);
        divHomeTeamStats.appendChild(homeStatDiv);

        const awayStatDiv = document.createElement('div');
        const awayStatIcon = document.createElement('span');
        awayStatIcon.textContent = stat.icon;
        const awayStatName = document.createElement('p');
        awayStatName.textContent = stat.name;
        const awayStatValue = document.createElement('span');
        awayStatValue.id = stat.key;
        awayStatValue.textContent = '-';
        awayStatDiv.append(awayStatValue, awayStatName, awayStatIcon);
        divAwayTeamStats.appendChild(awayStatDiv);
    });

    statsDiv.appendChild(divHomeTeamStats);
    statsDiv.appendChild(divAwayTeamStats);

    gameCard.appendChild(statsDiv);
    
    mainCont.appendChild(gameCard);
    
    addDragAndDropHandlers(gameCard);
}

function hasPressureGraph(match){
    return match.hasEventPlayerHeatMap || match.hasEventPlayerStatistics;
}

async function checkLiveMatches(){
    /*
        Create divs for each live match, each div contains the graph pressure and the live result of the match
    */

    liveMatchesList.forEach(match => {
        if(hasPressureGraph(match)){

            // Populate the league selector
            if(!leagueSelector.innerHTML.includes(match.tournament.name)){
                leagueSelector.innerHTML += `<option value="${match.tournament.name}">${match.tournament.name}</option>`;
            }

            createMatchCard(match);
        }
    });
}

function showNewVersionModal() {
    const modal = document.getElementById('newVersionModal');
    const closeBtn = modal.querySelector('.close-modal');

    modal.style.display = 'block';

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

async function main(){
    try{
        // do request, build array of matches, for each match extract match id and build iframe..
        await updateLiveMatchesList();
        checkLiveMatches();
        updateScores();
        updateStats();
        
    }catch (e){
        console.error(e.message);
        alert(e.message);
    }
}

main();