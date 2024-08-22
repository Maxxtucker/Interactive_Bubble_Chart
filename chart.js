d3.json("data.json").then(data => {
    const svg = d3.select('#chart').append('svg')
        .attr('width', 1200)
        .attr('height', 840);

    const margin = {top: 40, right: 20, bottom: 50, left:50};
    const width = 1200 - margin.left - margin.right;
    const height = 840 - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([-0.2, 0.5])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([-0.2, 1])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format(".0%"));

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.format(".0%"));

    // Primary x-axis (make ticks invisible)
    // Append primary x-axis at y=0 and make ticks invisible
// Append primary x-axis at y=0 and make ticks invisible
g.append("g")
    .attr("transform", `translate(0, ${yScale(0)})`)
    .call(xAxis)
    .style("stroke", "green")
    .style("stroke-dasharray", "2,2")
    .selectAll(".tick line, .tick text")
    .style("opacity", 0);

// Append primary y-axis at x=0 and make ticks invisible
g.append("g")
    .attr("transform", `translate(${xScale(0)}, 0)`)
    .call(yAxis)
    .style("stroke-dasharray", "2,2")
    .selectAll(".tick line, .tick text")
    .style("opacity", 0);

// Secondary x-axis at the bottom
g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)
    .selectAll("line, path")
    .style("stroke", "transparent");

// Secondary y-axis on the left
g.append("g")
    .call(yAxis)
    .selectAll("line, path")
    .style("stroke", "transparent");

// Add x-axis label centered and below ticks
g.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle") // Center the text
    .attr("x", width / 2)
    .attr("y", height + 40) // Position below the tick marks
    .text("EBIDTA Margin");

// Add y-axis label centered and to the side of ticks
g.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle") // Center the text
    .attr("transform", `rotate(-90)`)
    .attr("y", -55) // Position beside the tick marks
    .attr("x", -height / 2)
    .attr("dy", "1em") // Adjust alignment
    .text("Revenue Growth YoY");


    // Define the div for the tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid black")
        .style("padding", "5px");

    // Create Q2 circles and logos
    const circlesAndLogos = g.selectAll(".circle-q2")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "circle-q2-group");

    // Append smaller circles with specific colors
    circlesAndLogos.append("circle")
        .attr("class", "circle-q2")
        .attr("cx", d => xScale(d.Q2.EBITDAMargin))
        .attr("cy", d => yScale(d.Q2.RevenueGrowth))
        .attr("r", 5)  // Smaller radius for the circle
        .attr("fill", d => {
            // Assign color based on a property from the data
            return d.color; // Assuming 'color' is a property in your data
        });

    // Append larger logos
    circlesAndLogos.append("image")
        .attr("class", "logo")
        .attr("xlink:href", d => d.logo)
        .attr("x", d => xScale(d.Q2.EBITDAMargin) - 35) // Center the logo above the circle
        .attr("y", d => yScale(d.Q2.RevenueGrowth) - 60) // Position above the circle
        .attr("width", 70)
        .attr("height", 70);

    circlesAndLogos.on("mouseover", function(event, d) {
        d3.selectAll(".circle-q2-group").attr("opacity", 0.1);
        d3.select(this).attr("opacity", 1);

        // Draw Q1 circle
        const q1Circle = g.append("circle")
            .attr("cx", xScale(d.Q1.EBITDAMargin))
            .attr("cy", yScale(d.Q1.RevenueGrowth))
            .attr("r", 5)  // Set the desired radius for Q1 circle
            .attr("fill", d.color) // Use the same color as Q2
            .attr("class", "circle-q1");

        // Draw connecting line
        svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 5)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "grey");

    // Line with arrow
    const line = g.append("line")
        .attr("x1", xScale(d.Q1.EBITDAMargin))
        .attr("y1", yScale(d.Q1.RevenueGrowth))
        .attr("x2", xScale(d.Q2.EBITDAMargin))
        .attr("y2", yScale(d.Q2.RevenueGrowth))
        .attr("stroke", d.color)
        .attr("stroke-width", 1)
        .attr("marker-end", "url(#arrow)");

        const percentFormat = d3.format(".2%");


        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(`
            <strong>Q1 to Q2 Change</strong><br/>
            <strong>Q1:</strong><br/>
            EBITDA Margin: ${percentFormat(d.Q1.EBITDAMargin)}<br/>
            Revenue Growth: ${percentFormat(d.Q1.RevenueGrowth)}<br/>
            <strong>Q2:</strong><br/>
            EBITDA Margin: ${percentFormat(d.Q2.EBITDAMargin)}<br/>
            Revenue Growth: ${percentFormat(d.Q2.RevenueGrowth)}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
        d3.selectAll(".circle-q2-group").attr("opacity", 1);
        g.selectAll(".circle-q1").remove();
        g.selectAll("line").remove();
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    });
});