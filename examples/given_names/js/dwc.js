(function() {

    var w = 800;
    var h = 600;

    var ctx = null;
    var words = [];
    var wordShapes = null;

    var time = 0;
    var timePointLabels = null;

    var currentX = w / 2;
    var currentY = h / 2;

    var minValue = Number.MAX_VALUE;
    var maxValue = Number.MIN_VALUE;

    var maxRotationRad = Math.PI / 4;
    var maxRotationDeg = 45;
    var resizeFactor = 0.5;
    var invisThresh = 6;
    var colorMin = "rgb(255, 0, 0)";
    var colorMax = "rgb(0, 255, 0)";
    var colorNeutral = "rgb(1, 1, 0)";

    // constructor
    function dwc() {

        if (!(this instanceof dwc)) {
            return new dwc();
        }
        return this;
    }

    // load a saved wordcloud
    dwc.prototype.load = function(wordSource) {
        console.log("loading wordclouds isn't currently supported!");
    }

    // create a new wordcloud based on a given source file in CSV format
    // wordSource: a CSV file with the word size data
    // _colorMin: the color for shrinking words
    // _colorMax: the color for growing words
    // _colorNeutral: the color for words not changing in size
    // _maxRotationDeg: the maximum rotation in degrees
    // _resizeFactor: The resize factor for converting the CSV values to SVG text size
    dwc.prototype.create = function(wordSource, _colorMin, _colorMax, _colorNeutral, _maxRotationDeg, _resizeFactor) {
        colorMin = _colorMin;
        colorMax = _colorMax;
        colorNeutral = _colorNeutral;
        maxRotationDeg = _maxRotationDeg;
        maxRotationRad = maxRotationDeg * Math.PI / 180;
        resizeFactor = resizeFactor;
        console.log("Attempting to create dynamic word cloud from data file: " + wordSource);
        this.readWordsCSV(wordSource);
    }

    // parse CSV file containing word and size information
    dwc.prototype.readWordsCSV = function(filename) {

        d3.csv(filename, function(error, data) {

            if (error) throw error;

            console.log("reading data:");
            console.log(data);

            timePointLabels = Object.keys(data[0]).slice(0, Object.keys(data[0]).length - 2);

            for (var i = 0; i < data.length; i++) {
                var timePoints = Object.values(data[i]).slice(0, Object.keys(data[0]).length - 2);
                var timePoints = timePoints.map(function(tp) {
                    tp = tp * resizeFactor;
                    if (tp < invisThresh) tp = invisThresh;
                    return tp;
                });

                minValue = Math.min(minValue, Math.min.apply(Math, timePoints));
                maxValue = Math.max(maxValue, Math.max.apply(Math, timePoints));
                var changes = []; // change from last point in time
                var x = []
                var y = [];
                var colors = [];
                for (var j = 0; j < timePoints.length; j++) {

                    x[j] = w / 2;
                    y[j] = h / 2;
                    if (j > 0) {

                        delta = timePoints[j] / timePoints[j - 1];

                        if (delta < 1) {
                            changes[j] = delta;
                        } else if (delta > 1) {
                            changes[j] = -Math.min(3.5, delta) / 3.5;
                        } else {
                            changes[j] = 0;
                        }

                        if (timePoints[j] <= 3) {
                            colors[j] = "rgb(255, 255, 255, 0.0)";
                        } else {
                            if (changes[j] > 0) {
                                colors[j] = d3.interpolate(colorNeutral, colorMin)(changes[j]);
                            } else if (changes[j] < 0) {
                                colors[j] = d3.interpolate(colorNeutral, colorMax)(-changes[j]);
                            } else {
                                colors[j] = colorNeutral;
                            }
                        }
                    } else {

                        changes[j] = 0;
                    }
                }
                words.push({
                    text: data[i].word,
                    font: data[i].font,
                    tp: timePoints,
                    c: changes,
                    currentC: 0,
                    x: x,
                    y: y,
                    color: colors
                });
            }
            console.log("minValue: " + minValue + ", maxValue: " + maxValue);
            console.log(words);
            dwc.init();
        });
    }

    // generate the word SVG representation using D3
    dwc.prototype.generateSVG = function() {

        var body = d3.select("body")
            .selectAll("div")
            .enter()
            .append("div");

        var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        wordShapes = svg.selectAll("text")
            .data(words)
            .enter()
            .append("text")
            .attr("id", "wordShapes")
            .text(function(d) {
                return d.text;
            })
            .attr("font-size", function(d) {
                return d.tp[0];
            })
            .attr("font-family", function(d) {
                return d.font;
            })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "rotate(" + d.c[0] * 30 + " " + d.x[0] + ", " + d.y[0] + ")";
            })
            .attr("x", function(d) {
                return d.x[0];
            })
            .attr("y", function(d) {
                return d.y[0];
            })
            .attr("fill", function(d) {
                return d.color[0];
            });

        return svg;
    }

    // set (and interpolate) current time point for word size/position/rotation/color, etc 
    dwc.prototype.setTime = function(newTime) {

        time = newTime;
        var indexFloor = Math.floor(newTime);
        var indexCeil = Math.ceil(newTime);
        var indexInterp = newTime - indexFloor;
        wordShapes
            .attr("font-size", function(d) {
                return d3.interpolate(d.tp[indexFloor], d.tp[indexCeil])(indexInterp);
            })
            .attr("x", function(d) {
                return d3.interpolate(d.x[indexFloor], d.x[indexCeil])(indexInterp);
            })
            .attr("y", function(d) {
                return d3.interpolate(d.y[indexFloor], d.y[indexCeil])(indexInterp);
            })
            .attr("fill", function(d) {
                return d3.interpolate(d.color[indexFloor], d.color[indexCeil])(indexInterp);
            })
            .attr("transform", function(d) {
                return "rotate(" + d3.interpolate(d.c[indexFloor], d.c[indexCeil])(indexInterp) * maxRotationDeg + " " + d3.interpolate(d.x[indexFloor], d.x[indexCeil])(indexInterp) + ", " + d3.interpolate(d.y[indexFloor], d.y[indexCeil])(indexInterp) + ")";
            });

        for (var i = 0; i < words.length; i++) { // set interpolated changes
            words[i].currentC = d3.interpolate(words[i].c[indexFloor], words[i].c[indexCeil])(indexInterp);
        }
    }

    dwc.prototype.getBBox = function(wordIndex) {
        return wordShapes.nodes()[wordIndex].getBoundingClientRect();
    }

    dwc.prototype.getBBoxMultiple = function(wordIndices) {

        var minLeft = Number.MAX_VALUE;
        var minTop = Number.MAX_VALUE;
        var maxBottom = Number.MIN_VALUE;
        var maxRight = Number.MIN_VALUE;

        for (var i = 0; i < wordIndices.length; i++) {
            var nextBbox = wordShapes.nodes()[wordIndices[i]].getBoundingClientRect();
            if (nextBbox.left < minLeft) minLeft = nextBbox.left;
            if (nextBbox.top < minTop) minTop = nextBbox.top;
            if (nextBbox.bottom > maxBottom) maxBottom = nextBbox.bottom;
            if (nextBbox.right > maxRight) maxRight = nextBbox.right;
        }

        var bBox = {
            x: minLeft,
            y: minTop,
            width: maxRight - minLeft,
            height: maxBottom - minTop
        }

        return bBox;
    }

    // initialize after words have been loaded
    dwc.prototype.init = function() {

        svg = this.generateSVG();
        dwc_ui.create(w, h, wordShapes, svg, time, words, timePointLabels, maxRotationDeg);
        this.setTime(timePointLabels.length - 1);

        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.style.display = "none";

        var body = document.body.appendChild(canvas);
        ctx = canvas.getContext("2d");

        console.log(wordShapes);

        var defaultOrder = [];
        for (var i = 0; i < words.length; i++) {
            defaultOrder.push(i);
        }

        var startTime = new Date();

        this.place(defaultOrder);
        //this.placeOptimizedOrder();

        var endTime = new Date();
        var duration = endTime - startTime; // milliseconds

        console.log("Done (" + words.length + " words, " + timePointLabels.length + " time points, " + (duration / 1000) + "s).");

        this.setTime(timePointLabels.length - 1);


        // // this is just code to download a json representation of the "words" object to use for pre-generated layouts
        // var wordsAsString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(words));
        // var anchor = document.getElementById('anchorElement');
        // anchor.setAttribute("href", wordsAsString);
        // anchor.setAttribute("download", "test.json");
        // anchor.click();
    }



    dwc.prototype.placeOptimizedOrder = function() {

        var bestPick = Number.MAX_VALUE;
        var bestIndex = 0;

        // pick most stable word as first word
        for (var i = 1; i < words.length; i++) {
            var prevSize = 0;
            var diff = 0;
            for (var t = 0; t < timePointLabels.length * 2; t++) {
                this.setTime(t);

                var bBox = this.getBBox(i);
                var size = Math.sqrt(bBox.width * bBox.width + bBox.height * bBox.height);

                if (i > 0) {
                    var tempDiff1 = size - prevSize;
                    var tempDiffTotal = Math.abs(tempDiff1);
                    diff = diff + tempDiffTotal;
                }
                var prevSize = size;
            }
            if (diff < bestPick) {
                bestPick = diff;
                bestIndex = i;
                console.log("Most stable word is: " + words[i].text + " with " + diff);
            }
        }

        var previous = [bestIndex];

        while (previous.length < words.length) { // for all words

            var minDiff = Number.MAX_VALUE;
            var minIndex = null;
            for (var i = 0; i < words.length; i++) {
                if (previous.indexOf(i) < 0) { // for all not already placed
                    var sizeDiff = this.sizeDiffs(previous, i);
                    if (sizeDiff < minDiff) {
                        minDiff = sizeDiff;
                        minIndex = i;
                    }
                }
            }

            console.log("Next word chosen: " + words[minIndex].text + " with index " + minIndex + " and sizeDiff " + minDiff + ".");
            this.findPosAllTime(previous, minIndex);
            previous.push(minIndex);
        }

        console.log("Chosen placement order is: " + previous);

        return previous;
    }

    dwc.prototype.sizeDiffs = function(previous, next) {

        var oldPrevSize = 0;
        var diff = 0;

        for (var t = 0; t < timePointLabels.length * 2; t++) {
            this.setTime(t);
            var prevBbox = this.getBBoxMultiple(previous);
            var nextBbox = this.getBBox(next);
            var prevSize = Math.sqrt(prevBbox.width * prevBbox.width + prevBbox.height * prevBbox.height);
            var nextSize = Math.sqrt(nextBbox.width * nextBbox.width + nextBbox.height * nextBbox.height);

            if (t > 0) {
                var tempDiffPrev = prevSize - oldPrevSize;
                var tempDiffNext = nextSize - oldNextSize;
                var tempDiffTotal = Math.abs(tempDiffPrev + tempDiffNext);

                diff = diff + tempDiffTotal;
            }

            var oldPrevSize = prevSize;
            var oldNextSize = nextSize;
        }

        return diff;
    }

    dwc.prototype.place = function(order) {

        var previous = [order[0]];
        var next;
        console.log(order);

        for (var i = 0; i < order.length; i++) {
            this.findPosAllTime(previous, order[i], 0);
            previous.push(order[i]);
        }
    }

    // find a valid position through all points in time
    dwc.prototype.findPosAllTime = function(previous, next, interpolation) {

        var timePositionsPrevious = [];
        var timePositionsNext = [];

        var timePositionsPreviousInterp = [];
        var timePositionsNextInterp = [];

        interpolation = 1;

        for (var i = 0; i < timePointLabels.length; i++) {

            this.setTime(i);
            var prevBmp = this.generateBMPMultiple(previous);
            var nextBmp = this.generateBMP(next, false);
            timePositionsPrevious.push(prevBmp);
            timePositionsNext.push(nextBmp);

            if (i < timePointLabels.length - 1) {

                for (var j = 1; j <= interpolation; j++) {

                    this.setTime(i + j * (1 / (interpolation + 1))); // TODO: Collisions currently only work with a single interpolation frame
                    var prevBmpInterp = this.generateBMPMultiple(previous);
                    var nextBmpInterp = this.generateBMP(next, false);

                    // this.drawBMP(prevBmpInterp, [0, 0, 0, 255]);
                    // this.drawBMP(nextBmpInterp, [0, 255, 0, 255]);
                    timePositionsPreviousInterp.push(prevBmpInterp);
                    timePositionsNextInterp.push(nextBmpInterp);
                }
            }
        }

        var posFound = false;
        currentX = w / 2;
        currentY = h / 2;

        while (!posFound) {

            for (var i = 0; i < timePointLabels.length; i++) {

                // collide at this point in time
                if (this.collideBMP(timePositionsPrevious[i], timePositionsNext[i])) {
                    break;
                }
                if (i < timePointLabels.length - 1) {

                    // check interpolation steps
                    for (var j = i * interpolation; j <= i * interpolation + (interpolation - 1); j++) {
                        if (this.collideBMP(timePositionsPreviousInterp[j], timePositionsNextInterp[j])) {
                            break;
                        }
                    }
                }
                if (i === timePointLabels.length - 1) {

                    posFound = true;
                    this.setTime(1);
                    console.log("found position at all points in time for word " + words[next].text);
                }
            }
            if (!posFound) {

                var movePos = this.moveSpiral(6);

                for (var i = 0; i < timePointLabels.length; i++) {

                    this.moveBMP(timePositionsNext[i], timePositionsNext[i].x + movePos[0], timePositionsNext[i].y + movePos[1]);

                    if (i < timePointLabels.length - 1) {

                        for (var j = i * interpolation; j <= i * interpolation + (interpolation - 1); j++) {

                            this.moveBMP(timePositionsNextInterp[j], timePositionsNextInterp[j].x + movePos[0], timePositionsNextInterp[j].y + movePos[1]);
                        }
                    }
                }
            }
        }

        // apply offset
        var offsetX = currentX - w / 2;
        var offsetY = currentY - h / 2;
        for (var i = 0; i < timePointLabels.length; i++) {
            words[next].x[i] += offsetX;
            words[next].y[i] += offsetY;
        }

        var movX = 0;
        var movY = 0;

        var speed = 3;
        var maxMov = w / 8;

        var dx = -offsetX;
        var dy = -offsetY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var dirX = dx / dist * speed;
        var dirY = dy / dist * speed;

        // move closer together. direction is negative offset
        for (var i = 0; i < timePointLabels.length; i++) {

            if (words[next].tp[i] > invisThresh) { // if too small, don't move towards center

                var origX = timePositionsNext[i].x;
                var origY = timePositionsNext[i].y;
                var interpCollide = false;
                while (!this.collideBMP(timePositionsPrevious[i], timePositionsNext[i]) && (Math.abs(offsetX + movX) > speed + 1) &&
                    movX < maxMov &&
                    movY < maxMov &&
                    !interpCollide) {

                    if (i < timePointLabels.length - 1) {

                        for (var j = i * interpolation; j <= i * interpolation + (interpolation - 1); j++) {

                            if (this.collideBMP(timePositionsPreviousInterp[j], timePositionsNextInterp[j])) {

                                interpCollide = true; // found collision in interpolated frame
                            } else {

                                this.moveBMP(timePositionsPreviousInterp[j], timePositionsPreviousInterp[j].x + dirX, timePositionsPreviousInterp[j].y + dirY);
                            }
                        }
                    }

                    this.moveBMP(timePositionsNext[i], timePositionsNext[i].x + dirX, timePositionsNext[i].y + dirY);
                    movX += dirX;
                    movY += dirY;
                }

                words[next].x[i] = timePositionsNext[i].x + timePositionsNext[i].cx - dirX;
                words[next].y[i] = timePositionsNext[i].y + timePositionsNext[i].cy - dirY;
                var movX = 0;
                var movY = 0;
            }
        }
    }

    // draw word from SVG text
    dwc.prototype.drawWord = function(wordIndex) {

        var word = wordShapes.filter(function(d, i) {
            if (i === wordIndex) {
                return true;
            } else {
                return false;
            }
        }).node();

        ctx.save();

        ctx.translate(word.getAttribute("x"), word.getAttribute("y"));
        ctx.rotate(words[wordIndex].currentC * maxRotationRad);
        ctx.translate(-word.getAttribute("x"), -word.getAttribute("y"));

        ctx.textAlign = "center";
        ctx.font = word.getAttribute("font-size") + "px " + word.getAttribute("font-family");
        ctx.fillText(word.textContent, word.getAttribute("x"), word.getAttribute("y"));

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(word.textContent, word.getAttribute("x"), word.getAttribute("y"));

        ctx.restore();
    }

    // generate a BMP32
    dwc.prototype.generateBMP = function(wordIndex, fullScreen) {

        ctx.clearRect(0, 0, w, h);

        this.drawWord(wordIndex);
        var bBox = this.getBBox(wordIndex);

        if (!fullScreen) {
            var BMPbBox = {
                x: Math.floor(bBox.x / 32) * 32,
                y: Math.floor(bBox.y),
                width: Math.ceil(bBox.width + (32 - bBox.width % 32) + 32),
                height: Math.ceil(bBox.height)
            };
        } else {
            var BMPbBox = {
                x: 0,
                y: 0,
                width: w,
                height: h
            };
        }

        var imgData = ctx.getImageData(BMPbBox.x, BMPbBox.y, BMPbBox.width, BMPbBox.height).data;

        var singleBits = [];

        for (var i = 0; i < imgData.length; i += 4) {
            var bit = 0;
            if (imgData[i + 3] > 128) { // use alpha value
                bit = 1;
            }
            singleBits.push(bit);
        }

        var bitData = [];
        for (var i = 0; i < (singleBits.length / 32); i++) {
            for (var j = 0; j < 32; bitData[i] |= singleBits[i * 32 + j] << j++);
        }

        return {
            data: bitData,
            x: BMPbBox.x,
            y: BMPbBox.y,
            width: BMPbBox.width,
            height: BMPbBox.height,
            cx: w / 2 - BMPbBox.x, // relative center x
            cy: h / 2 - BMPbBox.y // relative center y
        };
    }


    // generate a BMP32 from multiple words, always full screen
    dwc.prototype.generateBMPMultiple = function(wordIndices) {

        ctx.clearRect(0, 0, w, h);

        for (var i = 0; i < wordIndices.length; i++) {
            this.drawWord(wordIndices[i]);
        }

        var BMPbBox = {
            x: 0,
            y: 0,
            width: w,
            height: h
        };

        var imgData = ctx.getImageData(BMPbBox.x, BMPbBox.y, BMPbBox.width, BMPbBox.height).data;

        var singleBits = [];

        for (var i = 0; i < imgData.length; i += 4) {
            var bit = 0;
            if (imgData[i + 3] > 128) { // use alpha value
                bit = 1;
            }
            singleBits.push(bit);
        }

        var bitData = [];
        for (var i = 0; i < (singleBits.length / 32); i++) {
            for (var j = 0; j < 32; bitData[i] |= singleBits[i * 32 + j] << j++);
        }

        return {
            data: bitData,
            x: BMPbBox.x,
            y: BMPbBox.y,
            width: BMPbBox.width,
            height: BMPbBox.height,
            cx: w / 2 - BMPbBox.x, // relative center x
            cy: h / 2 - BMPbBox.y // relative center y
        };
    }

    // move a BMP32 to a different position 
    dwc.prototype.moveBMP = function(bmp, x, y) {

        x = Math.round(x);
        y = Math.round(y);
        bmp.y = y;

        if (bmp.x !== x) {
            var shift = x - bmp.x;

            // move x pos
            // if new x pos goes over bit32 block of original x,
            // shift into the other direction
            var originalXbmp32BorderLeft = Math.floor(bmp.x / 32) * 32;
            var originalXbmp32BorderRight = originalXbmp32BorderLeft + 32;
            if (x < originalXbmp32BorderLeft) {
                shift = 32 + (shift % 32);
            } else if (x >= originalXbmp32BorderRight) {
                shift = -32 + (shift % 32);
            }

            bmp.x = x;

            var i = 0;
            var numBit32InRow = bmp.width / 32;
            if (shift < 0) { // moving to the left
                for (var hi = 0; hi < bmp.height; hi++) {
                    for (var wi = 0; wi < numBit32InRow; wi++) {
                        i++;
                        if (wi < numBit32InRow) {
                            bmp.data[i] = bmp.data[i] >>> 32 - shift | bmp.data[i + 1] << shift;
                        }
                    }
                }
            } else { // moving to the right
                for (var hi = 0; hi < bmp.height; hi++) {
                    var temp;
                    var temp2;
                    for (var wi = 0; wi < numBit32InRow; wi++) {
                        i++;
                        temp2 = temp;
                        temp = bmp.data[i];
                        bmp.data[i] = bmp.data[i] << shift | temp2 >>> 32 - shift;
                    }
                }
            }
        }

        return bmp;
    }

    // collide background bmp (full screen) with new word bmp
    dwc.prototype.collideBMP = function(bgBmp, wordBmp) {

        var top = wordBmp.y * bgBmp.width / 32;
        var left = Math.floor(wordBmp.x / 32);
        var wordBmpWidth32 = wordBmp.width / 32;
        var right = bgBmp.width / 32 - left - wordBmp.width / 32;
        var start = top + left;

        for (var i = 0; i < wordBmp.data.length; i++) {

            if (i % wordBmpWidth32 === 0 && i > 0) {
                start = start + right + left; // wrap bgBmp index at edge of wordBmp
            }

            if (bgBmp.data[i + start] & wordBmp.data[i]) {
                //this.drawBitBlock(bgBmp, i + start, "#FF0000");
                return true; // collision found
            } else {
                //this.drawBitBlock(bgBmp, i + start, "#00FF00");
            }
        }

        return false; // no collision found!
    }

    // draws a bmp's 32bit block with this index, for debug
    dwc.prototype.drawBitBlock = function(bmp, i, color) {

        var leftBorder = Math.floor(bmp.x / 32) * 32;
        var row = i % (bmp.width / 32);
        var column = Math.floor(i / (bmp.width / 32));

        ctx.beginPath();
        ctx.moveTo(leftBorder + row * 32, bmp.y + column);
        ctx.lineTo(leftBorder + row * 32 + 32, bmp.y + column);
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    // draw from a BMP32 compressed bitmap
    dwc.prototype.drawBMP = function(bmp, rgba) {

        bitData = bmp.data;
        imgData = []
        for (var i = 0; i < bitData.length; i++) {
            for (var j = 0; j < 32; imgData.push(bitData[i] >>> j++ & 1));
        }

        var bmpImgData = ctx.getImageData(Math.floor(bmp.x / 32) * 32, bmp.y, bmp.width, bmp.height);

        for (var i = 0; i < imgData.length; i++) {
            if (imgData[i]) {
                bmpImgData.data[i * 4 + 0] = rgba[0];
                bmpImgData.data[i * 4 + 1] = rgba[1];
                bmpImgData.data[i * 4 + 2] = rgba[2];
                bmpImgData.data[i * 4 + 3] = rgba[3];
            }
            if (i % 32 === 0) {
                bmpImgData.data[i * 4 + 0] = 128;
                bmpImgData.data[i * 4 + 1] = 128;
                bmpImgData.data[i * 4 + 2] = 128;
                bmpImgData.data[i * 4 + 3] = 255;
            }
        }
        ctx.beginPath();
        ctx.putImageData(bmpImgData, Math.floor(bmp.x / 32) * 32, bmp.y);

        ctx.strokeStyle = 'red';
        ctx.strokeRect(bmp.x + bmp.cx - 1, bmp.y + bmp.cy - 1, 3, 3);
    }

    // gives the next position in a rectangular spiral with given center
    dwc.prototype.moveSpiral = function(precision) {

        var dx = currentX - w / 2;
        var dy = currentY - h / 2;
        var absDX = Math.abs(dx);
        var absDY = Math.abs(dy) * 1.5; // prefer horizontal movement

        var x = 0;
        var y = 0;

        //clock-wise move direction based on position in four quadrants
        if (absDX < absDY) {
            if (dy > 0) {
                currentX -= precision;
                x = -precision; // left
            } else {
                currentX += precision;
                x = precision; // right
            }
        } else {
            if (dx > 0) {
                currentY += precision;
                y = precision; // down
            } else {
                currentY -= precision;
                y = -precision; // up
            }
        }

        return [x, y];
    }


    dwc = new dwc;
    window.dwc = dwc;

})();
