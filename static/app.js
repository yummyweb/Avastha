let connected = false;
const button = document.getElementById("join_leave");
const container = document.getElementById("container");
const timer = document.getElementById("timer");
let room;

function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then((track) => {
        let video = document.getElementById("local").firstChild;
        video.appendChild(track.attach());
        document.getElementsByTagName('video')[0].style.display = "none"
    });
}

function connectButtonHandler(event) {
    event.preventDefault();
    if (!connected) {
        button.disabled = true;
        button.innerHTML = "Connecting...";
        fetch("/join_room", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                room_code: document.getElementById("roomCode").innerHTML.split(": ")[1],
                username: document.getElementById("userName").value,
            }),
        }).then((res) => {
            res.json().then((_res) => {
                console.log("My user ID: " + _res.user_id);
                document.getElementById("userID").value = _res.user_id;
            });
        });
        connect()
            .then(() => {
                button.disabled = false;
                button.innerHTML = "Leave call";
                console.log("Joined room")
            })
            .catch(() => {
                alert("Connection failed. Is the backend running?");
                button.disabled = false;
            });
    } else {
        disconnect();
        button.innerHTML = "Join call";
        connected = false;
    }
}

function connect(username) {
    let promise = new Promise((resolve, reject) => {
        // get a token from the back end
        fetch("/login", {
            method: "POST",
            body: JSON.stringify({
                username: document.getElementById("userName").value,
                room: document.getElementById("roomName").value,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                // join video call
                return Twilio.Video.connect(data.token);
            })
            .then((_room) => {
                room = _room;
                room.participants.forEach(participantConnected);
                room.on("participantConnected", participantConnected);
                room.on("participantDisconnected", participantDisconnected);
                connected = true;
                updateParticipantCount();
                startTimer()
                resolve();
            })
            .catch(() => {
                reject();
            });
    });
    return promise;
}

function updateParticipantCount() {
    if (!connected)
        Toastify({
            text: "Participant disconnected",
            duration: 3000,
            close: true,
            gravity: "bottom", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
            stopOnFocus: true, // Prevents dismissing of toast on hover
            onClick: function () {}, // Callback after click
        }).showToast();
    else
        Toastify({
            text: "Participant connected",
            duration: 3000,
            close: true,
            gravity: "bottom", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
            stopOnFocus: true, // Prevents dismissing of toast on hover
            onClick: function () {}, // Callback after click
        }).showToast();
}

function participantConnected(participant) {
    let participantDiv = document.createElement("div");
    participantDiv.setAttribute("id", participant.sid);
    participantDiv.setAttribute("class", "participant");

    let tracksDiv = document.createElement("div");
    participantDiv.appendChild(tracksDiv);

    let labelDiv = document.createElement("div");
    let pointsDiv = document.createElement("div");
    pointsDiv.setAttribute("class", "points")

    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv);
    participantDiv.appendChild(pointsDiv);

    container.appendChild(participantDiv);

    participant.tracks.forEach((publication) => {
        if (publication.isSubscribed)
            trackSubscribed(tracksDiv, publication.track);
    });
    participant.on("trackSubscribed", (track) =>
        trackSubscribed(tracksDiv, track)
    );
    participant.on("trackUnsubscribed", trackUnsubscribed);

    updateParticipantCount();
}

function participantDisconnected(participant) {
    document.getElementById(participant.sid).remove();
    updateParticipantCount();
}

function trackSubscribed(div, track) {
    div.appendChild(track.attach());
}

function trackUnsubscribed(track) {
    track.detach().forEach((element) => element.remove());
}

function disconnect() {
    room.disconnect();
    while (container.lastChild.id != "local")
        container.removeChild(container.lastChild);
    button.innerHTML = "Join call";
    connected = false;
    updateParticipantCount();
}

function startTimer() {
    timeLeft = parseInt(document.getElementById("roomTime").value) * 60;
    let intervalTimer = setInterval(function(){
        if(timeLeft <= 0){
            clearInterval(intervalTimer);
        }
        timer.innerText = timeLeft;
        timeLeft -= 1;
    }, 1000);
}

addLocalVideo();
window.addEventListener("DOMContentLoaded", connectButtonHandler)
button.addEventListener("click", connectButtonHandler);
