import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, abort, make_response
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant
import pyrebase
import uuid

load_dotenv()
twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
twilio_api_key_sid = os.environ.get('TWILIO_API_KEY_SID')
twilio_api_key_secret = os.environ.get('TWILIO_API_KEY_SECRET')

config = {
    "apiKey": "AIzaSyD11TZTHbNeKlrnQwjUEGEBmulWSpp6BC8",
    "authDomain": "masseyhacks2021-avastha.firebaseapp.com",
    "databaseURL": "https://masseyhacks2021-avastha-default-rtdb.firebaseio.com",
    "projectId": "masseyhacks2021-avastha",
    "storageBucket": "masseyhacks2021-avastha.appspot.com",
    "serviceAccount": "masseyhacks2021-avastha-firebase-adminsdk.json"
}

firebase = pyrebase.initialize_app(config)

app = Flask(__name__)

# Header for bypassing tunnel verification
@app.after_request
def add_tunnel_header(resp):
    resp.headers['Bypass-Tunnel-Reminder']='xxx'
    return resp

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/join')
def index():
    return render_template('join.html')

@app.route('/create')
def create():
    return render_template('create.html')

@app.route('/room')
def room():
    name = request.args.get("name")
    room_code = request.args.get("code")
    db = firebase.database()
    try:
        room_name = db.child(room_code).get().val()['room_name']
        room_time = db.child(room_code).get().val()['time']
        return render_template('room.html', name=name, code=room_code, room_name=room_name, room_time=room_time)
    except:
        return render_template('error.html')

@app.errorhandler(404)
def not_found(e):
    return render_template("404.html")

@app.route('/login', methods=['POST'])
def login():
    username = request.get_json(force=True).get('username')
    room = request.get_json(force=True).get('room')
    if not username:
        abort(401)

    token = AccessToken(twilio_account_sid, twilio_api_key_sid,
                        twilio_api_key_secret, identity=username)
    token.add_grant(VideoGrant(room=room))

    return {'token': token.to_jwt().decode()}

@app.route('/score', methods=['POST'])
def update_score():
    user_id = request.get_json(force=True).get('user_id')
    score = request.get_json(force=True).get('score')
    db = firebase.database()
    try:
        user_data = db.child(user_id).get().val()
        user_data['total_points'] = int(user_data['total_points']) + int(score)
        user_data['current_points'] = int(score)
        db.child(user_id).update(user_data)
        return {'total_points': (int(user_data['total_points']) + int(score))}
    except:
        abort(401) # user id doesn't exist

@app.route('/join_room', methods=['POST'])
def join_room():
    room_code = request.get_json(force=True).get('room_code')
    username = request.get_json(force=True).get('username')
    db = firebase.database()
    try:
        room_data = db.child(room_code).get().val()
        user_id = uuid.uuid4().hex
        room_data["users"].append(user_id)
        db.child(room_code).update(room_data)
        user_data = {
            "user_id": user_id,
            "username": username,
            "total_points": 0,
            "current_points": 0
        }
        db.child(user_id).set(user_data)
        return {"user_id": user_id}
    except:
        abort(401) # room code didn't work

@app.route('/db', methods=['POST'])
def db_push():
    room_name = request.get_json(force=True).get('room_name')
    time = request.get_json(force=True).get('time')
    room_music = request.get_json(force=True).get('room_music')
    if not room_name or not time or not room_music:
        abort(401)
    db = firebase.database()
    room_code = uuid.uuid4().hex[:10]
    data = {
        "room_name": room_name,
        "time": time,
        "room_music": room_music,
        "room_code": room_code,
        "users": []
    }
    db.child(room_code).set(data)
    return {'room_code': room_code}
    