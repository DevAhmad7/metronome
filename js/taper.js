
var wave = $('.waveIn')
//
// Define fake Arduino millis() function
//

var millis = function () {
    var d = new Date();
    return d.getTime();
};

//
// Constants
//

var TOTAL_TAP_VALUES = 5;
var MS_UNTIL_CHAIN_RESET = 2000;
var SKIPPED_TAP_THRESHOLD_LOW = 1.75;
var SKIPPED_TAP_THRESHOLD_HIGH = 2.75;

//
// Variables
//

var buttonDown = false;
var buttonDownOld = false;
var sinceResetMS = 0;
var sinceResetMSOld = 0;
var beatMS = 500;
var BPM = 120;
var resetMS = millis();
var lastTapMS = 0;
var lastTapSkipped = false;
var beatProgress = 0;

// tapDurations will be used as though it's a fixed length C++ array, as that's where it'll end up
var tapDurations = [0, 0, 0, 0, 0];
var tapDurationIndex = 0;
var tapsInChain = 0;
var disTap = false;


var getAverageTapDuration = function () {
    var amount = tapsInChain - 1;
    if (amount > TOTAL_TAP_VALUES) {
        amount = TOTAL_TAP_VALUES;
    }

    var runningTotal = 0;
    for (var i = 0; i < amount; i++) {
        runningTotal += tapDurations[i];
    }

    return Math.floor(runningTotal / amount);
};

var tap = function (ms) {

    tapsInChain++;
    if (tapsInChain == 1) {
        lastTapMS = ms;
        return -1;
    }

    var duration = ms - lastTapMS;

    // detect if last duration was unreasonable
    if (tapsInChain > 1
        && !lastTapSkipped
        && duration > beatMS * SKIPPED_TAP_THRESHOLD_LOW
        && duration < beatMS * SKIPPED_TAP_THRESHOLD_HIGH) {
        duration = Math.floor(duration * 0.5);
        lastTapSkipped = true;
    } else {
        lastTapSkipped = false;
    }

    tapDurations[tapDurationIndex] = duration;
    tapDurationIndex++;
    if (tapDurationIndex == TOTAL_TAP_VALUES) {
        tapDurationIndex = 0;
    }

    var newBeatMS = getAverageTapDuration();

    lastTapMS = ms;

    return newBeatMS;
};

var resetTapChain = function (ms) {
    tapsInChain = 0;
    tapDurationIndex = 0;
    resetMS = ms;
    for (var i = 0; i < TOTAL_TAP_VALUES; i++) {
        tapDurations[i] = 0;
    }
};

var loopForTap = function () {
    var ms = millis();

    // if a tap has occured...
    if (buttonDown && !buttonDownOld) {

        // start a new tap chain if last tap was over an amount of beats ago
        if (lastTapMS + MS_UNTIL_CHAIN_RESET < ms) {
            resetTapChain(ms);
        }

        var newBeatMS = tap(ms);
        if (newBeatMS != -1) {
            beatMS = newBeatMS;
        }
    }

    beatprogress = (sinceResetMS / beatMS) % 1;

    var b = Math.floor(beatprogress * 20);
    var beatprog = "";
    for (var i = 0; i < 20; i++) {
        beatprog += i == b ? "|" : "-";
    }

    // update output
    BPM = Math.round(60000 / beatMS);
    _metroLooper.tempo = BPM;
    wave.css('transform', 'scale('+parseFloat(beatprogress).toFixed(2)+')');
    sinceResetMS = ms - resetMS;
    if (tapDurationIndex == 4) {
        resetTapChain(ms);
        disTap = true;
        setTimeout(function () {
            disTap = false;
            $('#tapIndex').text('اضغط');
        }, 2500);
        $('#tempoCTR input').val(BPM);
        $('#flat-slider-tempo').slider('value', BPM);
        _metroLooper.restart();
    }
    // set old vars
    buttonDownOld = buttonDown;
    sinceResetMSOld = sinceResetMS;
};

// begin loop


//
// event handlers for demo
//

// document.onmousedown = function() { 
//   buttonDown = true;
// };

// document.onmouseup = function() { 
//   buttonDown = false;
// };
var beatOn = false;
var setBeat = 0;
$('#tempoCTR .tapCTR').on('click', function () {
    beatOn = !beatOn;
    BPM = _metroLooper.tempo;
    beatMS = Math.round(60000 / BPM);
    $('#tapIndex').text('اضغط');
    if (beatOn) {
        window.clearInterval(setBeat);
        setBeat = setInterval(loopForTap, 27);
        $('.outerSlideDown').hide();
        $('.outerTaper').fadeIn();
        $(this).addClass('Active');
    }
    else {
        window.clearInterval(setBeat);
        $('.outerTaper').fadeOut();
        $(this).removeClass('Active');
    }
});

var set = 0;
function taper() {
    if (disTap) return;
    buttonDown = true;
    $('#tapIndex').text('');
    var elem = $('#taper');
    elem.addClass('Active');
    window.clearTimeout(set);
    set = setTimeout(function () {
        buttonDown = false;
        elem.removeClass('Active');
    }, 100);
}
$('#taper').on('click', function () {
    taper();
});

$(window).on('keydown', function (e) {
    if (e.keyCode === 32) taper();
});
