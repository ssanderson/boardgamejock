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

async function renderRecentGames(username) {
    let plays = await fetchPlays(username)

    let root = document.getElementById('recent-games');
    if (root === null) {
        console.log('missing recent games root div: "recent-games"');
        return;
    }

    let ix = 0;
    for (let play of plays) {
        let entryRoot = document.createElement('div');
        root.appendChild(entryRoot);
        entryRoot.className = 'recent-games-entry';

        let date = document.createElement('h3');
        entryRoot.appendChild(date);
        date.className = 'recent-games-entry-date';
        date.innerHTML = play.date;

        let title = document.createElement('a');
        entryRoot.appendChild(title);
        title.className = 'recent-games-entry-title';
        title.href = play.link;

        let titleName = document.createElement('h4')
        title.appendChild(titleName);
        title.innerHTML = play.game_name;

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
}

renderRecentGames(uncle_bill);
