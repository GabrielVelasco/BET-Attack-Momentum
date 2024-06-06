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
    return target.innerText === "X";
}

function handleClickEvent(evt){
    evt.preventDefault();

    let clikedElement = evt.target;
    if(matchContainerClicked(clikedElement)){
        clikedElement.classList.toggle("divSelected");

    }else if(btnDivClicked(clikedElement)){
        clikedElement.parentElement.classList.toggle("divSelected");

    }else if(closeBtnClicked(clikedElement)){
        clikedElement.parentElement.parentElement.remove(); // remove the specific matchContainer div
    }
}

document.addEventListener("click", handleClickEvent);

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

function getLiveScoreboard(matchID){
    /*
        Given an matchID, search for this match at 'liveMatches', get home/away scores
        returns a string with the live score of the match.
        If match not found at 'liveMatches', returns "false".

        args:
            matchID = ID of a live match
        returns:
            a String containing the live result of the match. Ex: "Home 2 - 1 Away" or "ENDED" (match not in 'liveMatches')
    */

    let homeScore = 0, awayScore = 0, homeTeamName = "", awayTeamName = "";
    for(let match of liveMatches){
        if(match.id === matchID){
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

function createGraphPressureDivForMatch(matchID) {
    const gameCard = document.createElement('div');
    gameCard.classList.add("matchContainer");
    gameCard.setAttribute('draggable', 'true'); // Make it draggable

    const iframeElement = createIframeElementFor(matchID);

    const matchLiveResultH2 = document.createElement('h2');
    matchLiveResultH2.setAttribute("id", matchID);

    const button = document.createElement('button');
    button.innerText = "X";

    gameCard.appendChild(matchLiveResultH2);
    gameCard.appendChild(iframeElement);

    const btnDiv = document.createElement('div');
    btnDiv.classList.add("btnDiv");
    btnDiv.appendChild(button);

    gameCard.appendChild(btnDiv);
    
    mainCont.appendChild(gameCard);
    
    addDragAndDropHandlers(gameCard); // Apply drag,drog handlers to the new card
}

function hasPressureGraph(match){
    return match.hasEventPlayerHeatMap;
}

async function createGameCards(){
    /*
        Create divs for each live match, each div contains the graph pressure and the live result of the match
    */

    for(let match of liveMatches){
        if(hasPressureGraph(match))
            createGraphPressureDivForMatch(match.id);
    }
}

async function main(){
    try{
        // do request, build array of matches, for each match extract match id and build iframe..
        await getLiveMatches();
        await createGameCards();
        updateScores();
        setInterval(updateScores, 1000);
        
    }catch (e){
        console.log(e);
        alert('No live matches at the moment!');
    }
}

main();