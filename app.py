import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, abort
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant

load_dotenv()
twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
twilio_api_key_sid = os.environ.get('TWILIO_API_KEY_SID')
twilio_api_key_secret = os.environ.get('TWILIO_API_KEY_SECRET')

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/join')
def index():
    return render_template('join.html')

@app.route('/room')
def room():
    name = request.args.get("name")
    room_code = request.args.get("code")
    return render_template('room.html', name=name, code=room_code)

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