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

// list of 'h2', each 'h2' saves the match live result, attr 'id' is a reference to a matchID. To update the live result of the match, iterate over this list and call getLiveResultFor(id)
let liveScoreBoards = []; 
let liveMatches = [];
let my_index = 0; // reference to where I am at 'liveMatches' array, used to print 10 graphs at each iteration

function isEqual(a, b){
    return a === b;
}

function loadMoreBtnClicked(target){
    return target.id === "loadMore";
}

function matchContainerClicked(target){
    return target.classList.contains("matchContainer");
}

function btnDivClicked(target){
    return target.classList.contains("btnDiv");
}

function checkClieckEvent(evt){
    evt.preventDefault();

    let clikedElement = evt.target;
    if(matchContainerClicked(clikedElement)){
        clikedElement.classList.toggle("divSelected");

    }else if(btnDivClicked(clikedElement)){
        clikedElement.parentElement.classList.toggle("divSelected");

    }else if(loadMoreBtnClicked(clikedElement)){
        createLiveMatchesFrames(); // loads +10 live matches.
    }
}

document.addEventListener("click", checkClieckEvent);

async function getLiveMatches(){
    /*
        At each call to this function it will do a get req and update liveMatches array.
    */

    const url = "https://www.sofascore.com/api/v1/sport/football/events/live";
    
    const dataFromSofaScore = await axios.get(url);
    let oldSize = liveMatches.length;
    liveMatches = dataFromSofaScore.data.events;
    let newSize = liveMatches.length;
    
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

function isInLiveMatches(matchID){
    /*
        Given an matchID, checks if this match is in progress (if match exists at 'liveMatches', then it's in progress).
    */

    for(let match of liveMatches){
        if(isEqual(match.id, matchID))
            return true;
    }

    return false;
}

function getLiveResultFor(matchID){
    /*
        Given an matchID, search for this match at 'liveMatches', get home/away scores
        returns a string with the live score of the match.

        args:
            matchID = ID of a live match
        returns:
            a String containing the live result of the match. Ex: "Home 2 - 1 Away" or "not found" (match not found)
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

    return "not found";
}

async function updateScores(){
    /*
        Once called it will iterates over the list of 'h2', for each 'h2', get the id, call getLiveResultFor(id)
        update 'h2' with new result if needed.
    */

    try{
        await getLiveMatches(); // update 'liveMatches'

        for(let h2 of liveScoreBoards){
            let matchID = Number(h2.getAttribute("id"));
            let oldScore = h2.innerText;
            if(isInLiveMatches(matchID)){
                let newScore = getLiveResultFor(matchID);
    
                if(!isEqual(newScore, oldScore)){
                    // update to new score
                    h2.innerText = newScore;
                }
    
            }else{
                // match ended
                if(h2.innerText.search("ENDED") === -1) // add 'ENDED` to the h2 only once
                    h2.innerText = h2.innerText + " [ENDED]";
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
    const matchContainer = document.createElement('div');
    matchContainer.classList.add("matchContainer");
    matchContainer.setAttribute('draggable', 'true'); // Make it draggable

    const iframeElement = createIframeElementFor(matchID);

    const matchLiveResultH2 = document.createElement('h2');
    matchLiveResultH2.setAttribute("id", matchID);

    liveScoreBoards.push(matchLiveResultH2); // add to list of 'h2' (keep track of them, to update the live result)

    const button = document.createElement('button');
    button.innerText = "X";
    button.addEventListener("click", (evt) => {
        evt.preventDefault();
        matchContainer.remove();
    });

    matchContainer.appendChild(matchLiveResultH2);
    matchContainer.appendChild(iframeElement);

    const btnDiv = document.createElement('div');
    btnDiv.classList.add("btnDiv");
    btnDiv.appendChild(button);

    matchContainer.appendChild(btnDiv);
    
    mainCont.appendChild(matchContainer);
    
    addDragAndDropHandlers(matchContainer); // Apply handlers to the new element
}

function getMatchID(){
    // returns the current matchID
    return liveMatches[my_index].id;
}

function noMoreLiveMatches(){
    return my_index === liveMatches.length;
}

function createLiveMatchesFrames(){
    /*
        At each call to this function it will create +10 graph pressures
        Creating all graph pressures at once makes it kinda slow.
    */

    let numbOfGraphs = 10;
    while(numbOfGraphs--){
        if(noMoreLiveMatches()){
            alert('No more live matches!');
            break;
        }

        let matchID = getMatchID();
        my_index ++;
        createGraphPressureDivForMatch(matchID);
    }
}

async function main(){
    try{
        // do request, build array of matches, for each match extract match id and build iframe..
        await getLiveMatches();
        createLiveMatchesFrames();
        updateScores();
        setInterval(updateScores, 5000);
        
    }catch (e){
        console.log(e);
        alert('No live matches at the moment!');
    }
}

main();