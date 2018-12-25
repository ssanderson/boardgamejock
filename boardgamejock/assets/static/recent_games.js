'use strict';

const uncle_bill = 'frankthetank0330'
const base_url = 'https://www.boardgamegeek.com/xmlapi2';

function fetchXML(url) {
    return fetch(url).then(function(response) {
        return response.text();
    }).then(function(text) {
        return (new DOMParser()).parseFromString(text, 'application/xml');
    });
}

function fetchPlays(username) {
    let url = base_url + '/plays?username=' + username;
    return fetchXML(url).then(function(playsXML) {
        var plays = []
        var ids = []
        for (let node of playsXML.children[0].children) {
            let id = node.childNodes[1].getAttribute('objectid');

            // add the partial play to the output
            plays.push({
                'game_name': node.childNodes[1].getAttribute('name'),
                'game_id': id,
                'date': node.getAttribute('date'),
                'comment': node.textContent.trim(),
                'link': 'https://boardgamegeek.com/boardgame/' + id
            })

            // fill the ids array so we can do a vectorized lookup of game ids
            ids.push(id);
        }

        // look up all of the ids
        return fetchXML(base_url + '/thing?id=' + ids.join(',')).then(
            function(resp) {
                // fill the rest of play object with the results of the game object
                // lookup
                let ix = 0;
                for (let node of resp.children[0].children) {
                    plays[ix]['thumbnail'] = node.children[0].textContent;
                    plays[ix]['full_picture'] = node.children[1].textContent;
                    ++ix;
                }

                return plays;
            }
        )
    });
}

async function renderRecentGames(playsPromise) {
    let sidebar = document.getElementById('right-sidebar');
    sidebar.style.height = sidebar.scrollHeight + "px";

    let root = document.getElementById('recent-games');
    if (root === null) {
        console.log('missing recent games root div: "recent-games"');
        return;
    }

    // first, duplicate the loading game entry out a few times so that we can
    // see some placeholders
    let recentGamesLoading = root.children[0];
    let recentGamesLoadingEntry = recentGamesLoading.children[0];
    for (let ix = 0; ix < 9; ++ix) {
        recentGamesLoading.appendChild(recentGamesLoadingEntry.cloneNode(true));
    }

    let plays = await playsPromise;

    // fill a temp div so that we can swap all the placeholders with the real
    // thing in one shot
    let tempRoot = document.createElement('div');

    let ix = 0;
    for (let play of plays) {
        let entryRoot = document.createElement('div');
        tempRoot.appendChild(entryRoot);
        entryRoot.className = 'recent-games-entry';

        let title = document.createElement('a');
        entryRoot.appendChild(title);
        title.className = 'recent-games-entry-title';
        title.href = play.link;

        let titleName = document.createElement('div')
        title.appendChild(titleName);
        title.innerHTML = play.game_name;

        let date = document.createElement('div');
        entryRoot.appendChild(date);
        date.className = 'recent-games-entry-date';
        date.innerHTML = play.date;

        let thumbnailDiv = document.createElement('div');
        entryRoot.appendChild(thumbnailDiv);
        thumbnailDiv.className = 'recent-games-thumbnail';

        let thumbnailLink = document.createElement('a');
        thumbnailDiv.appendChild(thumbnailLink);
        thumbnailLink.href = play.link;

        let thumbnail = document.createElement('img');
        thumbnailLink.appendChild(thumbnail);
        thumbnail.src = play.thumbnail;

        let comment = document.createElement('div');
        entryRoot.appendChild(comment);
        comment.className = 'recent-games-comment';
        comment.innerHTML = play.comment;
    }

    // swap the loading placeholder with the actual plays
    root.removeChild(recentGamesLoading);
    root.appendChild(tempRoot);
}

function asyncYield() {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve();
        });
    });
}

async function waitForImages() {
    let waiting = {};
    for (let img of document.querySelectorAll('img')) {
        let dummyImg = new Image();
        dummyImg.onload = function() {
            delete waiting[dummyImg];
        };
        dummyImg.src = img.src;
        if (!dummyImg.complete) {
            waiting[dummyImg] = null;
        }
    }

    while (Object.keys(waiting).length) {
        await asyncYield();
    }
}


let plays = fetchPlays(uncle_bill);
document.addEventListener('DOMContentLoaded', async function(event) {
    await waitForImages().then(async function() {
        await renderRecentGames(plays)
    });
})
