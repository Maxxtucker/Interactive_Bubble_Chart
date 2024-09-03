d3.json("data.json").then(data => {
    const svg = d3.select('#chart').append('svg')
        .attr('width', 1200)
        .attr('height', 840);

    const margin = {top: 40, right: 20, bottom: 50, left: 50};
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
    g.append("g")
        .attr("transform", `translate(0, ${yScale(0)})`)
        .call(xAxis)
        .style("stroke", "green")
        .style("stroke-dasharray", "2,2")
        .selectAll(".tick line, .tick text")
        .style("opacity", 0)
        .style("font-family", "Nunito");

    // Primary y-axis (make ticks invisible)
    g.append("g")
        .attr("transform", `translate(${xScale(0)}, 0)`)
        .call(yAxis)
        .style("stroke-dasharray", "2,2")
        .selectAll(".tick line, .tick text")
        .style("opacity", 0)
        .style("font-family", "Nunito");

    // Secondary x-axis at the bottom
    g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll("line, path")
        .style("stroke", "transparent")
        .selectAll(".tick text")
        .style("font-family", "Nunito");

    // Secondary y-axis on the left
    g.append("g")
        .call(yAxis)
        .selectAll("line, path")
        .style("stroke", "transparent")
        .selectAll(".tick text")
        .style("font-family", "Nunito");

    // Add x-axis label
    g.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .text("EBIDTA Margin")
        .style("font-family", "Nunito");

    // Add y-axis label
    g.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90)`)
        .attr("y", -55)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .text("Revenue Growth YoY")
        .style("font-family", "Nunito");

    // Define the div for the tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid black")
        .style("padding", "5px")
        .style("font-family", "Nunito");

    // Create Q2 circles and logos
    const circlesAndLogos = g.selectAll(".circle-q2")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "circle-q2-group");

    // Append smaller circles
    circlesAndLogos.append("circle")
        .attr("class", "circle-q2")
        .attr("cx", d => xScale(d.Q2.EBITDAMargin))
        .attr("cy", d => yScale(d.Q2.RevenueGrowth))
        .attr("r", 5)
        .attr("fill", d => d.color);

    // Append larger logos
    circlesAndLogos.append("image")
        .attr("class", "logo")
        .attr("xlink:href", d => d.logo)
        .attr("x", d => xScale(d.Q2.EBITDAMargin) - 35)
        .attr("y", d => yScale(d.Q2.RevenueGrowth) - 60)
        .attr("width", 70)
        .attr("height", 70);

    circlesAndLogos.on("mouseover", function(event, d) {
        d3.selectAll(".circle-q2-group").attr("opacity", 0.1);
        d3.select(this).attr("opacity", 1);

        // Draw Q1 circle
        g.append("circle")
            .attr("cx", xScale(d.Q1.EBITDAMargin))
            .attr("cy", yScale(d.Q1.RevenueGrowth))
            .attr("r", 5)
            .attr("fill", d.color)
            .attr("class", "circle-q1");

        // Remove existing marker definition to avoid duplication
        svg.selectAll("marker").remove();

        // Draw connecting line with a bigger arrow marker
        svg.append("defs").append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15) // Adjusted to move the arrow outside the dot
            .attr("refY", 0)
            .attr("markerWidth", 10) // Increased size for a larger arrow
            .attr("markerHeight", 10)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", d.color); // Set the fill color dynamically using d.color

        g.append("line")
            .attr("x1", xScale(d.Q1.EBITDAMargin))
            .attr("y1", yScale(d.Q1.RevenueGrowth))
            .attr("x2", xScale(d.Q2.EBITDAMargin))
            .attr("y2", yScale(d.Q2.RevenueGrowth))
            .attr("stroke", d.color)
            .attr("stroke-width", 1)
            .attr("marker-end", "url(#arrow)");

        const percentFormat = d3.format(".2%");

        // Calculate changes
        const ebitdaChange = d.Q2.EBITDAMargin - d.Q1.EBITDAMargin;
        const revenueGrowthChange = d.Q2.RevenueGrowth - d.Q1.RevenueGrowth;

        // Determine text color based on growth or fall
        const ebitdaChangeColor = ebitdaChange > 0 ? "green" : "red";
        const revenueGrowthChangeColor = revenueGrowthChange > 0 ? "green" : "red";

        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        
        tooltip.html(`
            <strong>Q1 to Q2 Change</strong><br/>
            <table>
                <tr>
                    <th></th>
                    <th>Q1</th>
                    <th>Q2</th>
                    <th>Change</th>
                </tr>
                <tr>
                    <td><strong>EBITDA Margin:</strong></td>
                    <td>${percentFormat(d.Q1.EBITDAMargin)}</td>
                    <td>${percentFormat(d.Q2.EBITDAMargin)}</td>
                    <td style="color:${ebitdaChangeColor};">${percentFormat(ebitdaChange)}</td>
                </tr>
                <tr>
                    <td><strong>Revenue Growth:</strong></td>
                    <td>${percentFormat(d.Q1.RevenueGrowth)}</td>
                    <td>${percentFormat(d.Q2.RevenueGrowth)}</td>
                    <td style="color:${revenueGrowthChangeColor};">${percentFormat(revenueGrowthChange)}</td>
                </tr>
            </table>
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

    // Add a "Show All" button
    d3.select("body").append("button")
        .text("Show All")
        .style("position", "absolute")
        .style("left", "20px")
        .style("top", "20px")
        .on("click", function() {
            // Reset all Q2 circles and logos
            d3.selectAll(".circle-q2-group").attr("opacity", 1);

            // Remove any existing Q1 circles and lines to avoid duplicates
            g.selectAll(".circle-q1").remove();
            g.selectAll("line[marker-end='url(#arrow)']").remove();

            // Show all Q1 data points and lines
            data.forEach(d => {
                // Append Q1 circles
                g.append("circle")
                    .attr("cx", xScale(d.Q1.EBITDAMargin))
                    .attr("cy", yScale(d.Q1.RevenueGrowth))
                    .attr("r", 5)
                    .attr("fill", d.color)
                    .attr("class", "circle-q1");

                // Draw connecting line with an arrow marker
                
                g.append("line")
                    .attr("x1", xScale(d.Q1.EBITDAMargin))
                    .attr("y1", yScale(d.Q1.RevenueGrowth))
                    .attr("x2", xScale(d.Q2.EBITDAMargin))
                    .attr("y2", yScale(d.Q2.RevenueGrowth))
                    .attr("stroke", d.color)
                    .attr("stroke-width", 1);
                
            });

            // Hide the tooltip
            tooltip.transition().duration(200).style("opacity", 0);
        });

    svg.append("text")
        .attr("x", 20) // X position near the left edge
        .attr("y", height + margin.top + margin.bottom - 10) // Y position near the bottom
        .attr("text-anchor", "start")
        .style("font-family", "Nunito")
        .style("font-size", "12px")
        .style("fill", "grey")
        .text("Data source: Company Financial Report (Q1'2024 to Q2'2024)");
});
