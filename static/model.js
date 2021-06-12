let video;
// Create a KNN classifier
const knnClassifier = ml5.KNNClassifier();
let poseNet;
let poses = [];
let canvas;
let width = 320
let height = 240;
let ctx;
let res_conf;
var twenty_frames = [];
var counts = {};
var pose_arr = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
let prev_sound = 'K';
counts['A'] = 0;
counts['B'] = 0;
counts['C'] = 0;
counts['D'] = 0;
counts['E'] = 0;
counts['F'] = 0;
counts['G'] = 0;
var p_name = null;

poses_name = ['Mountain', 'Palm Tree', 'Standing Forward Bend', 'Standing Half Forward Bend', 'Plank', 'Upward Facing Dog', 'Down Dog']

function setup() {
    let cnv = createCanvas(700, 500);
    cnv.position(330, 70);

    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, modelReady);
    knnClassifier.load('static/7_pose.json', classifierReady);
    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected
    poseNet.on('pose', function (results) {
        poses = results;
    });

    requestAnimationFrame(draw)
}

function classifierReady() {
    console.log("Classifier model is ready!");
}

function modelReady() {
    console.log("Model is ready!")
}

function draw() {
    image(video, 0, 0, width, height);
    // We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    drawSkeleton();
    if (p_name != null) {
        textSize(32);
        text(p_name, 10, 30);
    }
}

// Predict the current frame.
function classify() {
    // Get the total number of labels from knnClassifier
    const numLabels = knnClassifier.getNumLabels();
    if (numLabels <= 0) {
        console.error('There is no examples in any label');
        return;
    }
    if (poses.length > 0) {
        // Convert poses results to a 2d array [[score0, x0, y0],...,[score16, x16, y16]]
        const poseArray = poses[0].pose.keypoints.map(p => [p.score, p.position.x, p.position.y]);

        // Use knnClassifier to classify which label do these features belong to
        // You can pass in a callback function `gotResults` to knnClassifier.classify function
        knnClassifier.classify(poseArray, gotResults);
    }
}


function gotResults(err, result) {
    if (err) {
        console.error(err);
    }

    if (result.confidencesByLabel) {
        const confidences = result.confidencesByLabel;

        let c_a = confidences['A'] * 100;
        let c_b = confidences['B'] * 100;
        let c_c = confidences['C'] * 100;

        let c_d = confidences['D'] * 100;
        let c_e = confidences['E'] * 100;
        let c_f = confidences['F'] * 100;
        let c_g = confidences['G'] * 100;

        var conf = [];
        conf.push(c_a);
        conf.push(c_b);
        conf.push(c_c);
        conf.push(c_d);
        conf.push(c_e);
        conf.push(c_f);
        conf.push(c_g);

        let mx_indx = conf.indexOf(Math.max(...conf));

        twenty_frames.push(pose_arr[mx_indx]);
        counts[pose_arr[mx_indx]] += 1;

        if (twenty_frames.length > 20) {
            let maxi = 0;
            let res;

            for (var i = 0; i < twenty_frames.length; i++) {
                if (counts[twenty_frames[i]] > maxi) {
                    maxi = counts[twenty_frames[i]];
                    res = twenty_frames[i];
                }
            }
            last_frame = twenty_frames.shift();

            sound_no = pose_arr.indexOf(res) + 1;

            counts[last_frame] -= 1;

            if (prev_sound != res) {
                p_name = poses_name[sound_no - 1];
            }
        }
    }
}

function drawKeypoints() {
    if (poses.length > 0) {
        classify();
    }
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = poses[i].pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.1) {
                fill(255, 0, 0);
                noStroke();
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
            }
        }
    }
}

// A function to draw the skeletons
function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
        // For every skeleton, loop through all body connections
        for (let j = 0; j < poses[i].skeleton.length; j++) {
            let partA = poses[i].skeleton[j][0];
            let partB = poses[i].skeleton[j][1];
            stroke(255, 0, 0);
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
}