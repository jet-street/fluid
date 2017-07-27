var Wave = (function () {
    function Wave(x, speed, waveLength, maxHeight) {
        this.x = x;
        this.speed = speed;
        this.waveLength = waveLength;
        this.maxHeight = maxHeight;
    }
    Wave.prototype.accumulateWaveToHeightField = function (heightField) {
        var quarterWaveLength = 0.25 * this.waveLength;
        var start = Math.round((this.x - quarterWaveLength) * kBufferSize);
        var end = Math.round((this.x + quarterWaveLength) * kBufferSize);
        for (var i = start; i < end; i++) {
            var iNew = i;
            if (i < 0) {
                iNew = -i - 1;
            }
            else if (i >= kBufferSize) {
                iNew = 2 * kBufferSize - i - 1;
            }
            var distance = Math.abs((i + 0.5) / kBufferSize - this.x);
            var height = this.maxHeight * 0.5 * (Math.cos(Math.min(distance * Math.PI / quarterWaveLength, Math.PI)) + 1);
            heightField[iNew] += height;
        }
    };
    Wave.prototype.update = function (timeInterval) {
        this.x += timeInterval * this.speed;
        // Boundary reflection
        if (this.x > 1) {
            this.speed *= -1;
            this.x = 1 + timeInterval * this.speed;
        }
        else if (this.x < 0) {
            this.speed *= -1;
            this.x = timeInterval * this.speed;
        }
    };
    return Wave;
}());
function draw(heightField) {
    var buffer = new Array(kBufferSize).fill(' ', 0, kBufferSize);
    for (var i = 0; i < kBufferSize; ++i) {
        var height = heightField[i];
        var tableIndex = Math.min(Math.floor(kGrayScaleTableSize * height), kGrayScaleTableSize - 1);
        buffer[i] = kGrayScaleTable[tableIndex];
    }
    // Clear old prints
    clear();
    // Draw new buffer
    console.log(buffer.join(''));
}
var kBufferSize = 80;
var kGrayScaleTable = ' .:-=+*#%@';
var kGrayScaleTableSize = kGrayScaleTable.length;
var wave1 = new Wave(0, 1, 0.8, 0.5);
var wave2 = new Wave(1, -0.5, 1.2, 0.4);
var fps = 60;
var timeInterval = 1 / fps;
var heightField = new Array(kBufferSize).fill(0, 0, kBufferSize);
setInterval(function () {
    // March through time
    wave1.update(timeInterval);
    wave2.update(timeInterval);
    // Clear height field
    heightField.fill(0, 0, kBufferSize);
    // Accumulate waves for each center point
    wave1.accumulateWaveToHeightField(heightField);
    wave2.accumulateWaveToHeightField(heightField);
    // Draw height field
    draw(heightField);
}, 1000 / fps);
