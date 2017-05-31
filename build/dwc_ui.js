(function() {

    var animationTime = 0;
    var animationToggle = false;
    var animationTimer = null;

    var dragged = false;

    var xScale = null;
    var timeScale = null;

    var outSidePos = 0;

    var lastMouseX = 0;

    var w = 800;
    var h = 600;
    var pad = 30;
    var tickRange = 10;

    // constructor
    function dwc_ui() {

        if (!(this instanceof dwc_ui)) {
            return new dwc_ui();
        }
        return this;
    }

    // create user interface for dynamic word clouds
    dwc_ui.prototype.create = function(w, h, wordShapes, svg, time, words, timePointLabels, maxRotationDeg) {

        console.log("Attempting to create UI");

        this.w = w;
        this.h = h;

        tickRange = (w - 2 * pad) / (timePointLabels.length - 1);

        svg.append("svg:line")
            .attr("x1", pad)
            .attr("y1", h - pad)
            .attr("x2", w - pad)
            .attr("y2", h - pad)
            .style("stroke", "gray");

        var dragCircleData = [{
            x: pad + time * tickRange,
            y: h - pad,
            r: 7
        }]

        xScale = d3.scaleLinear()
            .domain([pad, w - pad])
            .range([pad, w - pad])
            .clamp(true);

        timeScale = d3.scaleLinear()
            .domain([pad, w - pad])
            .range([0, words[0].tp.length - 1]);

        var axisScale = d3.scaleLinear()
            .domain([timePointLabels[0], timePointLabels[timePointLabels.length - 1]])
            .range([0, (w - 2 * pad)])
            .clamp(true);

        axis = d3.axisBottom(axisScale)
            .tickValues(timePointLabels)
            .tickFormat(d3.format("d"));

        svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(" + pad + "," + (h - pad) + ")")
            .attr("ticks", timePointLabels)
            .call(axis);

        var dragCircle = svg.selectAll("circle")
            .data(dragCircleData)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return d.x;
            })
            .attr("cy", function(d) {
                return d.y;
            })
            .attr("r", function(d) {
                return d.r;
            })
            .style("fill", "black")
            .call(d3.drag()
                .on("start", this.dragStarted)
                .on("drag", this.dragged)
                .on("end", this.dragEnded));

        window.onkeyup = function(e) { // animation on space press
            var key = e.keyCode ? e.keyCode : e.which;

            if (key == 32) {
                console.log("Space pressed.");
                if (!animationToggle) {
                    animationTime = timeScale(d3.select("circle").attr("cx"));
                    var newPos = pad + Math.round(timeScale(d3.select("circle").attr("cx"))) * tickRange;
                    d3.select("circle").attr("cx", newPos);

                    //dwc.setTime(animationTime);
                }
                animationToggle = !animationToggle;
            }
        }

        if (animationTimer === null) {
            animationTimer = d3.timer(function() {
                if (animationToggle && !dragged) {
                    if (animationTime < timePointLabels.length - 1) {
                        dwc.setTime(animationTime);

                        d3.selectAll("circle")
                            .attr("cx", function(d) {
                                return 30 + animationTime / (timePointLabels.length - 1) * (w - pad * 2);
                            });

                        animationTime += 0.01;
                    }
                } else if (!animationToggle && !dragged) {
                    var newPos = pad + Math.round(timeScale(d3.select("circle").attr("cx"))) * tickRange;
                    d3.select("circle").attr("cx", newPos);
                    dwc.setTime(Math.round(timeScale(d3.select("circle").attr("cx"))));
                }
            });
        } else {
            console.log("Failed creating animation timer: There already is a timer!");
        }
    }

    dwc_ui.prototype.dragStarted = function(d) {

        console.log("drag start!");
        if (animationToggle) {
            dragged = false;
            animationToggle = false;
        } else {
            dragged = true;
            lastMouseX = d3.event.x;
            outSidePos = parseFloat(d3.select(this).attr("cx"));
            d3.select(this).raise().classed("active", true);
        }
    }

    dwc_ui.prototype.dragged = function(d) {

        var movement = d3.event.x - lastMouseX;
        lastMouseX = d3.event.x;

        outSidePos = outSidePos + movement;

        if (outSidePos > w - pad) {
            d3.select(this).attr("cx", d.x = w - pad);
        } else if (outSidePos < pad) {
            d3.select(this).attr("cx", d.x = pad);
        } else {
            d3.select(this).attr("cx", d.x = d.x + movement);
        }
        dwc.setTime(timeScale(d3.select(this).attr("cx")));
    }

    dwc_ui.prototype.dragEnded = function(d) {

        console.log("drag end!");
        d3.select(this).raise().classed("active", false);
        dragged = false;

        var newPos = pad + Math.round(timeScale(d3.select(this).attr("cx"))) * tickRange;
        d.x = newPos;
        d3.select(this).attr("cx", newPos);

        dwc.setTime(Math.round(timeScale(d3.select(this).attr("cx"))));
    }

    dwc_ui = new dwc_ui;
    window.dwc_ui = dwc_ui;

})();
