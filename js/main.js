var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// GLOBAL OPTIONS-----------------------------------
// Let's set up some options.  Most will be manipulatable with the UI.
var _quarterOn = false; // Is the quarter note turned on?
var _eighthOn = false; // Eighth notes?
var _sixteenthOn = false; // Sixteenth notes?
var _tripletOn = false; // Triplets?
var _startTempo = 120; // Tempo to start?
var _eighthSwing = 0; // Where the second eighth note in each beat is placed 0 is precisely two eight notes, 1 is dotted eight sixteenth. 67 is an exact triplet swing
var _sixteenthSwing = 0; // Where the sixteenth notes in each beat is placed.  Analogous to eighthSwing 
var _randMute = 0; // The percentage chance that the metronome will "drop" a beat and be silent (this helps with test you to see if you are keeping time or relying on the metronome
var _numBeats = 4; // Number beats per measure
var _volume = 50; // Volume of clicks (%)
var _volumeMult = 10; //This will multiply the gain because PJ wanted it louder.
var _claveLowBuffer,
    _claveHighBuffer,
    _claveMedBuffer;
var metroLoop,
    _metroLooper;
// AUDIO CONTEXT-----------------------------------
// Web Audio needs an audio "context" object.  This is where ALL the audio magic happens.
var _context;
try {
    // There are a few prefixes we might need to use, let's find the right one
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    // Make the context
    _context = new AudioContext();
} catch (e) {
    // If it doesn't work, alert error
    alert('No Webkit Audio API!');
}
var infoAuth = 'Made By Dev Ahmad Hassan';
var sounds = [
    [
        'كاخون',
        [
            'list/khon/1-Dom.ogg',
            'list/khon/2-tak.ogg',
            'list/khon/3-Clav.ogg'
        ]
    ],
    [
        'طبله',
        [
            'list/tom/1-Dom.ogg',
            'list/tom/2-Tak.ogg',
            'list/tom/3-Tak2.ogg'
        ]
    ],
    [
        'درم 1',
        [
            'list/Drum1/1-kick.ogg',
            'list/Drum1/2-Snare.ogg',
            'list/Drum1/3-stick.ogg'
        ]
    ],
    [
        'درم 2',
        [
            'list/Drum2/1-kick.ogg',
            'list/Drum2/2-cawbell.ogg',
            'list/Drum2/3-Hat.ogg'
        ]
    ],
    [
        'درم 3',
        [
            'list/Drum3/1-808kick.ogg',
            'list/Drum3/2-SnareClap.ogg',
            'list/Drum3/3-Hat.ogg'
        ]
    ],
    [
        'رقص',
        [
            'list/dance/1-kick.ogg',
            'list/dance/2-clap.ogg',
            'list/dance/3-Hat.ogg'
        ]
    ],
    [
        'بندير',
        [
            'list/pander/1-kick.ogg',
            'list/pander/2-Tak.ogg',
            'list/pander/3-cabasa.ogg'
        ]
    ],
    [
        'زجاج',
        [
            'list/Glass/1-Glass.ogg',
            'list/Glass/2-Glass.ogg',
            'list/Glass/3-Glass.ogg'
        ]
    ],
    [
        'دف',
        [
            'list/duf/1-Dom.ogg',
            'list/duf/2-Tak.ogg',
            'list/duf/3-Conga.ogg'
        ]
    ],
    [
        'رق',
        [
            'list/req/1-Dom.ogg',
            'list/req/2-Tak.ogg',
            'list/req/3-Clav.ogg'
        ]
    ]
]
$('.outerSlideDown').html('');
sounds.forEach(function (data) {
    data[1].forEach(function (arr) {
        $('.outerSlideDown').append('<li>' + arr + '</li>');
    });
});
$('.outerSlideDown li').on('click', function () {
    setURL({
        ctx: _context,
        info: $('#soundCTR .outerInput span').text(),
        urls: [$(this).text()],
        run: function (buffer) {
            switch (checkTarget) {
                case 'low':
                    _claveLowBuffer = buffer[0];
                    break;

                case 'med':
                    _claveMedBuffer = buffer[0];
                    break;

                case 'hig':
                    _claveHighBuffer = buffer[0];
                    break;

                default:
                    break;
            }
            _metroLooper.restart();
        }
    });
    $('.outerSlideDown').fadeOut();
});
var infoAuth = 'Made By Dev Ahmad Hassan';
// LOAD SOUNDS (BUFFERS)-----------------------------------
var bufferLoader = function (context, urls, onload) {
    this.context = context;
    this.urls = urls;
    this.onload = onload;
    this.buffers = new Array();
    this.nLoaded = 0;
}

bufferLoader.prototype.loadBuffer = function (url, index) {
    // Load buffer asynchronously 
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;
    request.onload = function () {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function (buffer) { // On success
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.buffers[index] = buffer;
                if (++loader.nLoaded == loader.urls.length) { // If we've loaded them all
                    loader.onload(loader.buffers); // Call our onload function
                }
            },
            function (error) { // Decode error handling
                console.error('decodeAudioData error', error);
            }
        );
    }
    // Request error handling
    request.onerror = function () {
        alert('bufferLoader: XHR error');
    }
    // Drum roll...
    request.send();
}
// This is the method to call to load the sounds.  It calls the rest sequentially.
bufferLoader.prototype.load = function () {
    for (var i = 0; i < this.urls.length; ++i)
        this.loadBuffer(this.urls[i], i);
}



function setURL(data) {
    try {
        $('#soundCTR .outerInput span').text(data.info);
        var LoadBuffer = new bufferLoader(data.ctx, data.urls, data.run);
        LoadBuffer.load();
    } catch (e) {
        // If it didn't work, send an error message.
        alert('Error loading sounds.' + e);
    }
}

setURL({
    ctx: _context,
    info: sounds[0][0],
    urls: sounds[0][1],
    run: allSoundsLoaded
});

//////////////////////////
var arrowPLUC = 0;
$('#soundCTR span.fa-angle-left').on('click', function () {
    if (arrowPLUC <= 0) return;
    arrowPLUC -= 1;
    setURL({
        ctx: _context,
        info: sounds[arrowPLUC][0],
        urls: sounds[arrowPLUC][1],
        run: reloadSounds
    });
});

$('#soundCTR span.fa-angle-right').on('click', function () {
    if (arrowPLUC >= sounds.length - 1) return;
    arrowPLUC += 1;
    setURL({
        ctx: _context,
        info: sounds[arrowPLUC][0],
        urls: sounds[arrowPLUC][1],
        run: reloadSounds
    });
});
var checkTarget = '';
$('#quarter .fa-exchange-alt').on('click', function (e) {
    $('.outerSlideDown').fadeIn();
    $('.outerTaper').hide();
    checkTarget = 'low';
});
$('#eighth .fa-exchange-alt').on('click', function (e) {
    $('.outerSlideDown').fadeIn();
    $('.outerTaper').hide();
    checkTarget = 'med';
});
$('#sixteenth .fa-exchange-alt').on('click', function (e) {
    $('.outerSlideDown').fadeIn();
    $('.outerTaper').hide();
    checkTarget = 'hig';
});
//HANDLE SOUND PLAYING-----------------------------------
//  Function to play sounds
//    Parameters: 
//      buffer - audio buffer of desired sound
//      time - when to play
//      gain - volume to play sound 0 to 1
//      context - the audio context with the destination we'll use
//    Returns:
//      source - an audio source so we can reference this later
var source;
function playSound(buffer, time, gain, context) {
    // Set up audio source
    source = context.createBufferSource();
    source.buffer = buffer;
    // Create gain node
    var gainNode = context.createGain();
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(context.destination);
    // Set gain
    gainNode.gain.value = gain;
    // Play the sound
    source.start(time);
    return source
}

//LOOPER OBJECT-----------------------------------
//  Function to schedule sounds to play for a dynamic loop (specified by a function).
//  Concept based heavily off of: https://www.html5rocks.com/en/tutorials/audio/scheduling/ (but I coded it way worse :P ).
//  The idea is to frequently fire scheduler functions to schedule audio events.  These schedulers have a window they are responsible for.  
//  The window is first cleared of all audio events previously scheduled (in case the loop has changed), then new audio events are scheduled. 
//  This allows the loop to change on the fly and protects the timing from any delays in computation.
//  My choices for the window are explained below under "Scheduler options"
//    Parameters: 
//      loopFunction - a function that returns a loop array [{buffer:,beat:,gain:},{buffer:,beat:,gain:},,...]
//      tempo - in bpm
//      numBeats - how many beats in a loop
//      context - the audio context
//    Methods:
//      start(), stop(), restart(), updateLoop(), clearScheduled(), scheduler()
function looper(loopFunction, tempo, numBeats, context) {
    // Grab parameters
    this.tempo = tempo;
    this.context = context
    this.numBeats = numBeats;
    this.loopFunction = loopFunction;

    // Scheduler options
    this.schedulerInterval = .05; // How often scheduler fires
    this.schedulerWindowStart = .1; // Beginning of scheduler's window (time from fire) -- any notes within this window will be scheduled/rescheduled
    // Why not have this be 0?  Good question.  We want a slight delay here because if it were 0, it is possible that this scheduler would be responsible 
    // for a sound that would need to be played BEFORE ITS CODE IS DONE.  So by the time the sound is scheduled, it is late.  Sources scheduled to play at 
    // a time before now fire now.  The result is a late note. Yuck.
    this.schedulerWindowEnd = 1.2; // End of scheduler's window (time from fire) -- any notes within this window will be scheduled/rescheduled
    // Why so goddman long a window?  If we are setting this up and clearing it every time, doesn't that suck?
    // Ya.  It does.  Window must be greater than 1s in order to have chrome continue to play metronome when tab out of focus (only 1/s setTimeout permitted).
    // There's probably a better way to do this -- perhaps change the window when out of focus?  Next update.

    // Declare some empty variables we'll need later
    this.startTime = null;
    this.schedulerTimeOut = null;
    this.scheduled = [];
    this.beatDur = null;
    this.loopDur = null;
    this.loop = [];

    // Grab onto our identity for in methods
    var self = this;

    // Start the loop
    this.start = function (startTime) {
        self.startTime = startTime || self.context.currentTime; // Default to right now, if not specified
        // Calculate loop and beat durations
        var infoAuth = 'Made By Dev Ahmad Hassan';
        self.beatDur = 60 / this.tempo; //the length of a beat at this tempo
        self.loopDur = this.numBeats * self.beatDur;
        // Update loop and start the scheduler madness
        self.updateLoop();
        self.scheduler();
    }

    // Stop the loop
    this.stop = function () {
        // Halt the scheduler madness
        if (self.schedulerTimeOut) {
            clearTimeout(self.schedulerTimeOut)
        }
        // Clear all scheduled notes
        self.clearScheduled();
    }

    // Restart the loop (this is necessary when changing tempo)
    this.restart = function () {
        self.stop();
        self.start();
    }

    // Stop all scheduled sounds (scheduled after time clearAfter) and clean up sources array
    this.clearScheduled = function (clearAfter) {
        if (self.scheduled) {
            var newScheduled = []; // This will house everything we want to keep
            var now = self.context.currentTime;
            var clearAfter = clearAfter || now; // Default to clearing everything

            // Loop through all scheduled (faster than for loop)
            i = 0; while (i < self.scheduled.length) {

                // Learn about this source's scheduling
                // var bufferDur = self.scheduled[i].source.buffer.duration; < might need this for next update
                var sourceStart = self.scheduled[i].time;

                // Stop sounds that start after clearAfter
                if (sourceStart > clearAfter) {
                    self.scheduled[i].source.stop();
                } else if (sourceStart > now) { // If they don't start after clearAfter (else) and have yet to start....
                    newScheduled.push(self.scheduled[i]); // ...add them to our newScheduled array (which will replace scheduled at the end)
                }
                i++;
            }
        }
        // The old switcheroo
        self.scheduled = newScheduled;
    }

    // Update the loop array with the loopFunction (this lets our loop behave dynamically)
    this.updateLoop = function () {
        self.loop = self.loopFunction();
    }

    // Schedule next sounds in loop to play
    this.scheduler = function () {
        // Immediately schedule the next scheduler
        self.schedulerTimeOut = window.setTimeout(self.scheduler, self.schedulerInterval * 1000);

        // Update the loop
        self.updateLoop();

        // When am I?
        var now = self.context.currentTime;
        var timeSinceStart = now - self.startTime;
        var currentLoopNum = Math.floor(timeSinceStart / self.loopDur);
        var currentLoopStart = self.startTime + (currentLoopNum * self.loopDur);
        var infoAuth = 'Made By Dev Ahmad Hassan';
        // Calculate the window we are responsible for scheduling within
        var windowStart = now + self.schedulerWindowStart;
        var windowEnd = now + self.schedulerWindowEnd;
        var windowDur = windowEnd - windowStart;

        // Erase any prior scheduling
        self.clearScheduled(windowStart);

        // Schedule the sounds that fall in this time interval
        j = 0; while (j <= Math.ceil(windowDur / self.loopDur)) { // We'll go through the loop as many times as it can fit in our window rounded up (+1 again for safety)
            i = 0; while (i < self.loop.length) { // Loop through all sounds in loop -- this is faster than for loop (probably splitting hairs here....)
                var soundTime = (self.loop[i].beat * self.beatDur) + (self.loopDur * j) + currentLoopStart; // When should this sound (in the current loop iteration) be played?
                if (soundTime > windowStart && soundTime <= windowEnd) { // If this event time is within the window of this scheduler
                    self.scheduled.push({
                        source: playSound(self.loop[i].buffer, soundTime, self.loop[i].gain, self.context),
                        time: soundTime
                    }); // Play sound and add source to sources array
                }
                i++;
            }
            j++;
        }

    }
}

//LOOP -----------------------------------
metroLoop = function () {
    var loop = [];

    if (_quarterOn) {
        loop.push(
            { buffer: _claveLowBuffer, beat: 0, gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult }, //mute at random based on _randMute (this guy returns T or F read as 1 or 0)
            { buffer: _claveLowBuffer, beat: 1, gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult }, //also apply volume setting
            { buffer: _claveLowBuffer, beat: 2, gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveLowBuffer, beat: 3, gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult }
        )
    }
    if (_eighthOn) {
        loop.push(
            { buffer: _claveMedBuffer, beat: 0 + (1 / 2) + (_eighthSwing / 100 / 4), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult }, //note the equation for swing
            { buffer: _claveMedBuffer, beat: 1 + (1 / 2) + (_eighthSwing / 100 / 4), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveMedBuffer, beat: 2 + (1 / 2) + (_eighthSwing / 100 / 4), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveMedBuffer, beat: 3 + (1 / 2) + (_eighthSwing / 100 / 4), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult }
        )
    }
    if (_sixteenthOn) {
        loop.push(
            { buffer: _claveHighBuffer, beat: 0 + (1 / 4) + (_sixteenthSwing / 100 / 8), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveHighBuffer, beat: 0 + (3 / 4) + (_sixteenthSwing / 100 / 8), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveHighBuffer, beat: 1 + (1 / 4) + (_sixteenthSwing / 100 / 8), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveHighBuffer, beat: 1 + (3 / 4) + (_sixteenthSwing / 100 / 8), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveHighBuffer, beat: 2 + (1 / 4) + (_sixteenthSwing / 100 / 8), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveHighBuffer, beat: 2 + (3 / 4) + (_sixteenthSwing / 100 / 8), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveHighBuffer, beat: 3 + (1 / 4) + (_sixteenthSwing / 100 / 8), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveHighBuffer, beat: 3 + (3 / 4) + (_sixteenthSwing / 100 / 8), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult }
        )
    }
    if (_tripletOn) {
        loop.push(
            { buffer: _claveMedBuffer, beat: 0 + (1 / 3), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult }, //note the equation for swing
            { buffer: _claveMedBuffer, beat: 0 + (2 / 3), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveMedBuffer, beat: 1 + (1 / 3), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveMedBuffer, beat: 1 + (2 / 3), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveMedBuffer, beat: 2 + (1 / 3), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveMedBuffer, beat: 2 + (2 / 3), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveMedBuffer, beat: 3 + (1 / 3), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
            { buffer: _claveMedBuffer, beat: 3 + (2 / 3), gain: (Math.random() > _randMute / 100) * (_volume / 100) * _volumeMult },
        )
    }
    return loop;
}

function initUI() {

    // UI BUTTONS-----------------------------------

    // Quarter Note Button
    $('#quarter').on('click', function (e) {
        if ($(e.target).hasClass('fas')) return;
        playSound(_claveLowBuffer, 0, 0, _context); // Play muted sound
        _quarterOn = !_quarterOn;
        $(this).removeClass('on');
        $(this).addClass(_quarterOn ? 'on' : '');
    });

    // Eighth Note Button
    $('#eighth').on('click', function (e) {
        if ($(e.target).hasClass('fas')) return;
        playSound(_claveLowBuffer, 0, 0, _context); // Play muted sound -- this activates audio on iOS
        _eighthOn = !_eighthOn;
        $(this).removeClass('on');
        $(this).addClass(_eighthOn ? 'on' : '');
    });

    // Sixteenth Note Button
    $('#sixteenth').on('click', function (e) {
        if ($(e.target).hasClass('fas')) return;
        playSound(_claveLowBuffer, 0, 0, _context); // Play muted sound -- this activates audio on iOS
        _sixteenthOn = !_sixteenthOn;
        $(this).removeClass('on');
        $(this).addClass(_sixteenthOn ? 'on' : '');
    });
    $('#triplet').on('click', function (e) {
        if ($(e.target).hasClass('fas')) return;
        playSound(_claveLowBuffer, 0, 0, _context); // Play muted sound -- this activates audio on iOS
        _tripletOn = !_tripletOn;
        $(this).removeClass('on');
        $(this).addClass(_tripletOn ? 'on' : '');
    });

    $("[id*=flat-slider]")
        .slider().slider("pips", {
            first: "pip",
            last: "pip",
            step: "5",
        })
        .slider("float");
    $("#flat-slider-volume")
        .slider({
            max: 50,
            min: 0,
            range: "min",
            step: 1,
            value: 50,
            slide: userChangedASetting,
            change: userChangedASetting
        }).slider().slider("pips", {
            first: "pip",
            last: "pip",
            step: "1",
        })
        .slider("float");
    $("#flat-slider-tempo")
        .slider({
            max: 480,
            min: 10,
            range: "min",
            step: 1,
            value: 120,
            slide: userChangedASetting,
            change: userChangedASetting
        }).slider("pips", {
            first: "pip",
            last: "pip",
            step: "12"
        })
    //.slider("float");
    $("#flat-slider-eighthSwing")
        .slider({
            max: 100,
            min: 0,
            range: "min",
            step: 1,
            value: 0,
            slide: userChangedASetting,
            change: userChangedASetting
        });
    $("#flat-slider-sixteenthSwing")
        .slider({
            max: 100,
            min: 0,
            range: "min",
            step: 1,
            value: 0,
            slide: userChangedASetting,
            change: userChangedASetting
        });
    $("#flat-slider-randMute")
        .slider({
            max: 100,
            min: 0,
            range: "min",
            step: 1,
            value: 0,
            slide: userChangedASetting,
            change: userChangedASetting
        });
}

// When a user interacts with a UI element, change the setting where it matters
function userChangedASetting(event, ui) {

    if (event.originalEvent) { // This is important.  Without it, we go to infinite loop town as updateNota will trigger a change event and that will retrigger userChangedASetting and so on
        if ($(event.target).hasClass(myClass = 'tempo')) {
            $('#tempoCTR input').val(ui.value);
            _metroLooper.tempo = ui.value;
            BPM = ui.value;
            beatMS = Math.round(60000 / BPM);
            _metroLooper.restart();
        }
        else if ($(event.target).hasClass(myClass = 'eighthSwing')) { //Ditto for the next few....
            $('#eighthCTR input').val(ui.value);
            _eighthSwing = ui.value;
        }
        else if ($(event.target).hasClass(myClass = 'sixteenthSwing')) {
            $('#sixteenCTR input').val(ui.value);
            _sixteenthSwing = ui.value;
        }
        else if ($(event.target).hasClass(myClass = 'randMute')) {
            $('#randCTR input').val(ui.value);
            _randMute = ui.value;
        }
        else if ($(event.target).hasClass(myClass = 'volume')) {
            _volume = ui.value;
        }
        updateNota(); // Update the UI to reflect the change 
    }
}

function arm(data) {
    var arrowL = $(data.id + ' span.fa-angle-left');
    var arrowR = $(data.id + ' span.fa-angle-right');
    var input = $(data.id + ' input');
    //////////////////////////
    arrowL.on('click', function () {
        var val = parseInt(input.val()) - 1;
        input.val(val);
        data.run(val);
        updateNota();
    });

    arrowR.on('click', function () {
        var val = parseInt(input.val()) + 1;
        input.val(val);
        data.run(val);
        updateNota();
    });

    input.on('keyup', function (e) {
        var val = parseInt(input.val());
        data.run(val);
        updateNota();
    });
}
arm({
    id: '#tempoCTR',
    run: function (x) {
        $('#flat-slider-tempo').slider('value', x);
        BPM = x;
        beatMS = Math.round(60000 / BPM);
        _metroLooper.tempo = x;
        _metroLooper.restart();
    }
});

arm({
    id: '#eighthCTR',
    run: function (x) {
        $('#flat-slider-eighthSwing').slider('value', x);
        _eighthSwing = x;
    }
});

arm({
    id: '#sixteenCTR',
    run: function (x) {
        $('#flat-slider-sixteenthSwing').slider('value', x);
        _sixteenthSwing = x;
    }
});

arm({
    id: '#randCTR',
    run: function (x) {
        $('#flat-slider-randMute').slider('value', x);
        _randMute = x;
    }
});

// Update all UI elements to reflect the most up to date value of their respective settings

function updateNota() {
    // Update the swing-visualizer
    $('.notaDbl1').css('top', ((_sixteenthSwing / 100) * 12.5 + 25) + '%');
    $('.notaSin').css('top', ((_eighthSwing / 100) * 25 + 50) + '%');
    $('.notaDbl2').css('top', ((_sixteenthSwing / 100) * 12.5 + 75) + '%');
}

// The function triggered when BufferLoader has loaded all sounds.  (It passes us the buffers.)
function allSoundsLoaded(buffers) {
    _claveLowBuffer = buffers[0]; // Let's give these nice names and make them globally available.
    _claveMedBuffer = buffers[1];
    _claveHighBuffer = buffers[2];

    // Init the looper and start her going
    _metroLooper = new looper(metroLoop, _startTempo, _numBeats, _context); // Make and start our metronome loop!!
    _metroLooper.start();

    //Build
    initUI();

    // Add initial position to the nota
    updateNota();
}

function reloadSounds(buffers) {
    _claveLowBuffer = buffers[0];
    _claveMedBuffer = buffers[1];
    _claveHighBuffer = buffers[2];
    _metroLooper.restart();
}
