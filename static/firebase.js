let database =
    "https://masseyhacks2021-avastha-default-rtdb.firebaseio.com/.json";
let evtSource = new EventSource(database);

function room_event(data) {
    if (data.room_code === "placeholder") {
        // replace placeholder with a check to only do things if the room_code matches your current room_code
        console.log(data);
    }
}

evtSource.addEventListener(
    "put",
    function (e) {
        db_update = JSON.parse(e.data).data;
        if ("time" in db_update) {
            room_event(db_update); // runs this every time there is an event in a room and just shows specific room/event
        } else {
            for (let key in db_update) {
                room_event(db_update[key]); // runs this every time there is a new room or on page load
            }
        }
    },
    false
);
