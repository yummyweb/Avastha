let connected = false;
const button = document.getElementById('join_leave');
const container = document.getElementById('container');
const timer = document.getElementById('timer')
let room;

function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then((track) => {
        let video = document.getElementById("local").firstChild;
        video.appendChild(track.attach());
    });
}

function connectButtonHandler(event) {
    event.preventDefault();
    if (!connected) {
        button.disabled = true;
        button.innerHTML = "Connecting...";
        connect()
            .then(() => {
                button.disabled = false;
                button.innerHTML = "Leave call";
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
    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv);

    container.appendChild(participantDiv);

    participant.tracks.forEach((publication) => {
        if (publication.isSubscribed)
            trackSubscribed(tracksDiv, publication.track);
    });
    participant.on("trackSubscribed", (track) =>
        trackSubscribed(tracksDiv, track)
    );
    participant.on("trackUnsubscribed", trackUnsubscribed);

    room.localParticipant.audioTracks.forEach((track) => {
        track.disable();
    });

    room.localParticipant.videoTracks.forEach((track) => {
        track.disable();
    });

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
    let timeLeft = document.getElementById("roomTime").value * 60;
    setInterval(function(){
        if(timeLeft <= 0){
            clearInterval(downloadTimer);
        }
        timer.innerText = timeLeft;
        timeLeft -= 1;
    }, 1000);
}

addLocalVideo();
button.addEventListener("click", connectButtonHandler);
