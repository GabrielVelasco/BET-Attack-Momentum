/*
    1. get live matches from sofascore
    2. for each live match, create a div that contains the graph pressure and the live result of the match
    3. update the live result of the match every 10 seconds
    4. add a button to remove the div of the match

    WORKING ON: 

    TODO:
    add League selector (show only La Liga/Premier League... matches)
    improve and add page styles
*/

const mainCont = document.querySelector(".mainContainer");
let draggedElement = null;

let liveMatches = [];

function _equal(a, b){
    return a === b;
}

function matchContainerClicked(target){
    return target.classList.contains("matchContainer");
}

function btnDivClicked(target){
    return target.classList.contains("btnDiv");
}

function closeBtnClicked(target){
    return target.classList.contains("closeBtn");
}

function expandBtnClicked(target){
    return target.classList.contains("dropdownBtn");
}

document.addEventListener("click", (evt) => {
    evt.preventDefault();

    let clikedElement = evt.target;
    if(matchContainerClicked(clikedElement)){
        clikedElement.classList.toggle("divSelected");

    }else if(btnDivClicked(clikedElement)){
        clikedElement.parentElement.classList.toggle("divSelected");

    }else if(closeBtnClicked(clikedElement)){
        clikedElement.parentElement.parentElement.remove(); // remove the specific matchContainer div
    
    }else if(expandBtnClicked(clikedElement)){
        clikedElement.classList.toggle('active');
        clikedElement.nextSibling.classList.toggle('show');
    }
});

async function getLiveMatches(){
    /*
        At each call to this function it will do a get req and update liveMatches array.
    */

    const url = "https://www.sofascore.com/api/v1/sport/football/events/live";
    
    const dataFromSofaScore = await axios.get(url);
    liveMatches = dataFromSofaScore.data.events;
    
    if(liveMatches.length === 0)
        throw "No live matches at the momment!";
    
    return "array of matches created";
}

async function getMatchStats(matchID){
    // GET https://www.sofascore.com/api/v1/event/matchID/statistics

    const url = `https://www.sofascore.com/api/v1/event/${matchID}/statistics`;
    
    const dataFromSofaScore = await axios.get(url);
    let matchSats = dataFromSofaScore.data.statistics[0].groups[0].statisticsItems;

    if(matchSats.length === 0)
        throw "No stats for this match!";

    return matchSats;
}

function createIframeElementFor(matchID){
    /*
        Creates the <iframe> for a 'matchID' and set it's attributes 
    */

    const iframeElement = document.createElement('iframe');
    const srcAtt = `https://widgets.sofascore.com/embed/attackMomentum?id=${matchID}&widgetBackground=Gray&v=2`; // url that SofaScore provides...
    iframeElement.setAttribute("src", srcAtt);
    iframeElement.setAttribute("frameborder", "0");
    iframeElement.setAttribute("scrolling", "no");

    return iframeElement;
}

function getLiveScoreboard(matchIdTarget){
    /*
        Given an matchID, search for this match at 'liveMatches', get home/away scores
        returns a string with the live score of the match.
        If match not found at 'liveMatches', returns "ENDED".

        args:
            matchID = ID of a live match
        returns:
            a String containing the live result of the match. Ex: "Home 2 - 1 Away" or "ENDED" (match not in 'liveMatches')
    */

    let homeScore = 0, awayScore = 0, homeTeamName = "", awayTeamName = "";
    for(let match of liveMatches){
        if(match.id === matchIdTarget){
            // match found, get home/away scores

            homeTeamName = match.homeTeam.shortName;
            awayTeamName = match.awayTeam.shortName;
            homeScore = match.homeScore.current;
            awayScore = match.awayScore.current;
            const liveResult = `${homeTeamName}⠀[${homeScore}]⠀-⠀[${awayScore}]⠀${awayTeamName}`;

            return liveResult;
        }
    }

    return 'ENDED';
}

async function updateScores(){
    /*
        Once called it will iterates over the list of 'h2', for each 'h2', get the id, call getLiveResultFor(id)
        update 'h2' with new result if needed.
    */

    try{
        await getLiveMatches(); // update 'liveMatches'

        let liveScoreBoards = document.querySelectorAll('h2');
        for(let scoreH2 of liveScoreBoards){
            let matchID = Number(scoreH2.getAttribute("id"));
            let oldScore = scoreH2.innerText;

            let newScore = getLiveScoreboard(matchID);
            if(newScore === 'ENDED'){
                if(oldScore.search('ENDED') === -1)
                    scoreH2.innerText = oldScore + ' ' + '[ENDED]';

            }else if(!_equal(oldScore, newScore)){
                scoreH2.innerText = newScore;
            }
        }
    
        console.log("Live results updated!");

    }catch(e){
        console.log(e);
        alert('No live matches at the moment!');
    }
}

function updateStats() {
    /*
        For each stats card (in which it's div id is a match id), get stats (get request sofascore api) and update the respective 'span' elements.
        Each 'span' element has an id that matches the key of the stats object. 
        Example: there's a 'span' inside 'stats div > homeTeamsStats' with id 'ballPossession'. 
        Do it seperately for home and away teams.

        Example:
        stats[0].key -> ballPossession | stats[0].home -> home team ballposs | stats[0].away -> away team ballposs
    */

    let statsDivs = document.querySelectorAll('.statsDiv');
    for (let statsDiv of statsDivs) {
        const matchID = statsDiv.id;

        getMatchStats(matchID)
        .then((stats) => {
            const homeTeamStatsDiv = statsDiv.querySelector('.homeTeamsStatsDiv');
            const awayTeamStatsDiv = statsDiv.querySelector('.awayTeamsStatsDiv');
            
            for(let s of stats){
                const statName = s.key;
                const homeStatSpan = homeTeamStatsDiv.querySelector('#' + statName);
                const awayStatSpan = awayTeamStatsDiv.querySelector('#' + statName);

                if(homeStatSpan && awayStatSpan){
                    // if the stat exists, update the value
                    homeStatSpan.innerText = `${s.home}`;
                    awayStatSpan.innerText = `${s.away}`;
                }
            }
        })
        .catch((e) => {
            console.log(e);
        });
    }

    console.log("Stats updated!");
}

// Drag and Drop functions
function handleDragStart(event) {
    draggedElement = event.target;
    event.target.style.opacity = "0.5";
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.innerHTML);
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(event) {
    if (event.target.classList.contains('matchContainer')) {
        event.target.classList.add('over');
    }
}

function handleDragLeave(event) {
    if (event.target.classList.contains('matchContainer')) {
        event.target.classList.remove('over');
    }
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    if (draggedElement !== event.target && event.target.classList.contains('matchContainer')) {
        draggedElement.innerHTML = event.target.innerHTML;
        event.target.innerHTML = event.dataTransfer.getData('text/html');
        addDragAndDropHandlers(draggedElement); // Re-apply handlers to new elements
        addDragAndDropHandlers(event.target);
    }
    return false;
}

function handleDragEnd(event) {
    event.target.style.opacity = "1.0";
    document.querySelectorAll('.matchContainer').forEach(item => {
        item.classList.remove('over');
    });
}

function addDragAndDropHandlers(element) {
    element.addEventListener('dragstart', handleDragStart, false);
    element.addEventListener('dragenter', handleDragEnter, false);
    element.addEventListener('dragover', handleDragOver, false);
    element.addEventListener('dragleave', handleDragLeave, false);
    element.addEventListener('drop', handleDrop, false);
    element.addEventListener('dragend', handleDragEnd, false);
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.matchContainer').forEach(addDragAndDropHandlers);
});

///////////////////////////

function createMatchCard(matchID) {
    const gameCard = document.createElement('div');
    gameCard.classList.add("matchContainer");
    gameCard.setAttribute('draggable', 'true');

    const iframeElement = createIframeElementFor(matchID);

    const divForBtnAndScoreboard = document.createElement('div');
    divForBtnAndScoreboard.classList.add('matchCardHeader');

    const btnRemoveCard = document.createElement('button');
    btnRemoveCard.classList.add('closeBtn');
    btnRemoveCard.innerText = "X";
    divForBtnAndScoreboard.appendChild(btnRemoveCard);

    const matchLiveResultH2 = document.createElement('h2');
    matchLiveResultH2.setAttribute("id", matchID);
    divForBtnAndScoreboard.appendChild(matchLiveResultH2);

    gameCard.appendChild(divForBtnAndScoreboard);
    gameCard.appendChild(iframeElement);

    // add stats for text for home team\
    const divHomeTeamStats = document.createElement('div');
    divHomeTeamStats.classList.add('homeTeamsStatsDiv');

    const ballPossHome = document.createElement('div');
    const ballPossHomeP = document.createElement('p'); ballPossHomeP.innerText = "Ball Possession"; ballPossHome.appendChild(ballPossHomeP);
    const ballPossHomeSpan = document.createElement('span'); ballPossHomeSpan.setAttribute('id', 'ballPossession'); ballPossHome.appendChild(ballPossHomeSpan);
    divHomeTeamStats.appendChild(ballPossHome);

    const xpGoalsHome = document.createElement('div');
    const xpGoalsHomeP = document.createElement('p'); xpGoalsHomeP.innerText = "xP Goals"; xpGoalsHome.appendChild(xpGoalsHomeP);
    const xpGoalsHomeSpan = document.createElement('span'); xpGoalsHomeSpan.setAttribute('id', 'xPGoals'); xpGoalsHome.appendChild(xpGoalsHomeSpan);
    xpGoalsHomeSpan.innerText = "-";
    divHomeTeamStats.appendChild(xpGoalsHome);

    const bigChancesHome = document.createElement('div');
    const bigChancesHomeP = document.createElement('p'); bigChancesHomeP.innerText = "Big Chances"; bigChancesHome.appendChild(bigChancesHomeP);
    const bigChancesHomeSpan = document.createElement('span'); bigChancesHomeSpan.setAttribute('id', 'bigChanceCreated'); bigChancesHome.appendChild(bigChancesHomeSpan);
    bigChancesHomeSpan.innerText = "-";
    divHomeTeamStats.appendChild(bigChancesHome);

    const totalShotsHome = document.createElement('div');
    const totalShotsHomeP = document.createElement('p'); totalShotsHomeP.innerText = "Total Shots"; totalShotsHome.appendChild(totalShotsHomeP);
    const totalShotsHomeSpan = document.createElement('span'); totalShotsHomeSpan.setAttribute('id', 'totalShotsOnGoal'); totalShotsHome.appendChild(totalShotsHomeSpan);
    divHomeTeamStats.appendChild(totalShotsHome);

    const cornersHome = document.createElement('div');
    const cornersHomeP = document.createElement('p'); cornersHomeP.innerText = "Corners"; cornersHome.appendChild(cornersHomeP);
    const cornersHomeSpan = document.createElement('span'); cornersHomeSpan.setAttribute('id', 'cornerKicks'); cornersHome.appendChild(cornersHomeSpan);
    divHomeTeamStats.appendChild(cornersHome);

    const passesHome = document.createElement('div');
    const passesHomeP = document.createElement('p'); passesHomeP.innerText = "Passes"; passesHome.appendChild(passesHomeP);
    const passesHomeSpan = document.createElement('span'); passesHomeSpan.setAttribute('id', 'passes'); passesHome.appendChild(passesHomeSpan);
    divHomeTeamStats.appendChild(passesHome);

    // add stats for text for away team
    const awayHomeTeamStats = document.createElement('div');
    awayHomeTeamStats.classList.add('awayTeamsStatsDiv');

    const ballPossAway = document.createElement('div');
    const ballPossAwayP = document.createElement('p'); ballPossAwayP.innerText = "Ball Possession"; 
    const ballPossAwaySpan = document.createElement('span'); ballPossAwaySpan.setAttribute('id', 'ballPossession'); ballPossAway.appendChild(ballPossAwaySpan); ballPossAway.appendChild(ballPossAwayP);
    awayHomeTeamStats.appendChild(ballPossAway);

    const xpGoalsAway = document.createElement('div');
    const xpGoalsAwayP = document.createElement('p'); xpGoalsAwayP.innerText = "xP Goals"; 
    const xpGoalsAwaySpan = document.createElement('span'); xpGoalsAwaySpan.setAttribute('id', 'xPGoals'); xpGoalsAway.appendChild(xpGoalsAwaySpan); xpGoalsAway.appendChild(xpGoalsAwayP);
    xpGoalsAwaySpan.innerText = "-";
    awayHomeTeamStats.appendChild(xpGoalsAway);

    const bigChancesAway = document.createElement('div');
    const bigChancesAwayP = document.createElement('p'); bigChancesAwayP.innerText = "Big Chances"; 
    const bigChancesAwaySpan = document.createElement('span'); bigChancesAwaySpan.setAttribute('id', 'bigChanceCreated'); bigChancesAway.appendChild(bigChancesAwaySpan); bigChancesAway.appendChild(bigChancesAwayP);
    bigChancesAwaySpan.innerText = "-";
    awayHomeTeamStats.appendChild(bigChancesAway);

    const totalShotsAway = document.createElement('div');
    const totalShotsAwayP = document.createElement('p'); totalShotsAwayP.innerText = "Total Shots"; 
    const totalShotsAwaySpan = document.createElement('span'); totalShotsAwaySpan.setAttribute('id', 'totalShotsOnGoal'); totalShotsAway.appendChild(totalShotsAwaySpan); totalShotsAway.appendChild(totalShotsAwayP);
    awayHomeTeamStats.appendChild(totalShotsAway);

    const cornersAway = document.createElement('div');
    const cornersAwayP = document.createElement('p'); cornersAwayP.innerText = "Corners"; 
    const cornersAwaySpan = document.createElement('span'); cornersAwaySpan.setAttribute('id', 'cornerKicks'); cornersAway.appendChild(cornersAwaySpan); cornersAway.appendChild(cornersAwayP);
    awayHomeTeamStats.appendChild(cornersAway);

    const passesAway = document.createElement('div');
    const passesAwayP = document.createElement('p'); passesAwayP.innerText = "Passes"; 
    const passesAwaySpan = document.createElement('span'); passesAwaySpan.setAttribute('id', 'passes'); passesAway.appendChild(passesAwaySpan); passesAway.appendChild(passesAwayP);
    awayHomeTeamStats.appendChild(passesAway);

    const statsDiv = document.createElement('div');
    statsDiv.classList.add('statsDiv');
    statsDiv.setAttribute('id', matchID);

    statsDiv.appendChild(divHomeTeamStats);
    statsDiv.appendChild(awayHomeTeamStats);

    gameCard.appendChild(statsDiv);

    mainCont.appendChild(gameCard);
    
    addDragAndDropHandlers(gameCard);
}

function hasPressureGraph(match){
    return match.hasEventPlayerHeatMap || match.hasEventPlayerStatistics;
}

async function createGameCards(){
    /*
        Create divs for each live match, each div contains the graph pressure and the live result of the match
    */

    for(let match of liveMatches){
        if(hasPressureGraph(match))
            createMatchCard(match.id);
    }
}

async function main(){
    try{
        // do request, build array of matches, for each match extract match id and build iframe..
        await getLiveMatches();
        await createGameCards();
        updateScores();
        updateStats();
        setInterval(updateScores, 1000);
        setInterval(updateStats, 30000);
        
    }catch (e){
        console.log(e);
        alert('No live matches at the moment!');
    }
}

main();