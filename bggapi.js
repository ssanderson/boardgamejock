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

async function renderTable(divId, username) {
    let plays = await fetchPlays(username)

    let table = document.getElementById(divId);
    let ix = 0;
    for (let play of plays) {
        let row = table.insertRow(ix++);
        row.insertCell(0).innerHTML = play.date;
        row.insertCell(1).innerHTML = play.game_name;
        row.insertCell(2).innerHTML = play.comment;
    }
}

renderTable('recent-games', uncle_bill);
