// Your Google Sheets ID
const sheetId = '1DJS2ScQ7WrPQhFTbnJI9ovyYnxHfSFG25X75gR9a2Wc';

// Sheet names for each table (Revenue Growth, EBITDA Margin)
const sheetNames = {
    revenueGrowth: 'Revenue Growth YoY',
    ebitdaMargin: 'EBITDA_MARGIN',
};

// Color dictionary for companies
const colorDict = {
    'abnb': '#ff5895',
    'almosafer': '#bb5387',
    'bkng': '#003480',
    'desp': '#755bd8',
    'expe': '#fbcc33',
    'easemytrip': '#00a0e2',
    'ixigo': '#e74c3c',
    'mmyt': '#e74c3c',
    'trip': '#00af87',
    'trvg': '#e74c3c',
    'wego': '#4e843d',
    'yatra': '#e74c3c',
    'tcom': '#2577e3',
    'edr': '#2577e3',
    'lmn': '#fc03b1',
    'webjet': '#e74c3c',
    'seera': '#750808',
    'pcln': '#003480',
    'orbitz': '#8edbfa',
    'travelocity': '#1d3e5c',
    'skyscanner': '#0770e3',
    'etraveli': '#b2e9ff',
    'kiwi': '#e5fdd4',
    'cleartrip': '#e74c3c',
    'traveloka': '#38a0e2',
    'flt': '#d2b6a8',
    'webjet ota': '#e74c3c',
};

// Logo dictionary for companies (ensure these paths are correct)
const logoDict = {
    "abnb": "logos/ABNB_logo.png",
    "bkng": "logos/BKNG_logo.png",
    "expe": "logos/EXPE_logo.png",
    "tcom": "logos/TCOM_logo.png",
    "trip": "logos/TRIP_logo.png",
    "trvg": "logos/TRVG_logo.png",
    "edr": "logos/EDR_logo.png",
    "desp": "logos/DESP_logo.png",
    "mmyt": "logos/MMYT_logo.png",
    "ixigo": "logos/IXIGO_logo.png",
    "seera": "logos/SEERA_logo.png",
    "webjet": "logos/WEB_logo.png",
    "lmn": "logos/LMN_logo.png",
    "yatra": "logos/YTRA_logo.png",
    "orbitz": "logos/OWW_logo.png",
    "travelocity": "logos/Travelocity_logo.png",
    "easemytrip": "logos/EASEMYTRIP_logo.png",
    "wego":  "logos/Wego_logo.png",
    "skyscanner":  "logos/Skyscanner_logo.png",
    "etraveli":  "logos/Etraveli_logo.png",
    "kiwi":  "logos/Kiwi_logo.png",
    "cleartrip": "logos/Cleartrip_logo.png",
    "traveloka": "logos/Traveloka_logo.png",
    "flt": "logos/FlightCentre_logo.png",
    "almosafer": "logos/Almosafer_logo.png",
    "webjet ota": "logos/OTA_logo.png",
};

// Function to fetch data from a Google Sheet
function fetchSheetData(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok for sheet: ${sheetName}`);
            }
            return response.text();
        })
        .then(csvText => csvToObjects(csvText, sheetName))
        .catch(error => {
            console.error(`Error fetching sheet ${sheetName}:`, error);
            return [];
        });
}

// Function to parse CSV data into a usable array of objects
function csvToObjects(csvText, sheetName) {
    const lines = csvText.split("\n").filter(line => line.trim() !== "");
    if (lines.length === 0) {
        console.warn(`Sheet ${sheetName} is empty.`);
        return [];
    }
    const headers = lines[0].split(",").map(header => header.trim().replace(/['"]+/g, ''));
    const companies = headers.slice(1);
    const data = [];
    lines.slice(1).forEach(line => {
        const cleanedLine = line.replace(/(\d+),(\d+)/g, '$1$2'); // Remove commas in numbers
        const values = cleanedLine.split(",");
        const rawQuarter = values[0] ? values[0].trim() : null;
        if (!rawQuarter) return;
        const quarter = standardizeQuarterLabel(rawQuarter);
        values.slice(1).forEach((value, i) => {
            if (value && companies[i]) {
                const company = companies[i].trim().replace(/['"]+/g, '').toLowerCase();
                if (company === 'almosafer' || (quarter !== '2024 Q2' && quarter !== '2024 Q3')) return;
                const cleanedValue = value.trim().replace(/['"$%]+/g, '');
                const parsedValue = parseFloat(cleanedValue);
                if (isNaN(parsedValue)) return;
                data.push({
                    sheetName,
                    company: company,
                    quarter: quarter.toLowerCase(),
                    value: parsedValue
                });
            }
        });
    });
    return data;
}

// Function to standardize quarter labels
function standardizeQuarterLabel(quarter) {
    quarter = quarter.trim().replace(/['"]+/g, '');
    let match = quarter.match(/(\d{4})[' ]?Q([1-4])/i);
    if (match) {
        return `${match[1]} Q${match[2]}`;
    }
    match = quarter.match(/Q([1-4])[' ]?(\d{4})/i);
    if (match) {
        return `${match[2]} Q${match[1]}`;
    }
    match = quarter.match(/(\d{4})'Q([1-4])/i); // Handle formats like 2024'Q2
    if (match) {
        return `${match[1]} Q${match[2]}`;
    }
    return quarter;
}

// Function to merge data from the two sheets
function mergeData(revenueGrowth, ebitdaMargin) {
    const merged = [];
    revenueGrowth.forEach(growth => {
        const company = growth.company;
        const quarter = growth.quarter;
        const ebitda = ebitdaMargin.find(e => e.company === company && e.quarter === quarter);
        if (ebitda) {
            merged.push({
                company: growth.company.toUpperCase(), // Convert back to uppercase for display
                quarter: growth.quarter.toUpperCase(),
                revenueGrowth: growth.value / 100, // Convert percentages to decimals
                ebitdaMargin: ebitda.value / 100,  // Convert percentages to decimals
            });
        }
    });
    return merged;
}

// Now fetch data and proceed with D3.js visualization
Promise.all([
    fetchSheetData(sheetNames.revenueGrowth),
    fetchSheetData(sheetNames.ebitdaMargin),
]).then(([revenueGrowthData, ebitdaMarginData]) => {
    console.log('Revenue Growth Data:', revenueGrowthData);
    console.log('EBITDA Margin Data:', ebitdaMarginData);

    let mergedData = mergeData(revenueGrowthData, ebitdaMarginData);
    console.log('Merged Data:', mergedData);

    // Identify companies that have both Q2 and Q3 data
    const companyQuarters = {};
    mergedData.forEach(d => {
        if (!companyQuarters[d.company]) {
            companyQuarters[d.company] = new Set();
        }
        companyQuarters[d.company].add(d.quarter);
    });

    // Add a flag to each data point indicating if the company has both quarters
    mergedData = mergedData.map(d => {
        const quarters = companyQuarters[d.company];
        return {
            ...d,
            hasBothQuarters: quarters.size > 1
        };
    });

    console.log('Merged Data with Flags:', mergedData);

    // Proceed with D3.js visualization using mergedData

    // D3.js Visualization Code
    const svg = d3.select('#chart').append('svg')
        .attr('width', 1200)
        .attr('height', 840);

    const margin = { top: 40, right: 20, bottom: 50, left: 60 };
    const width = 1200 - margin.left - margin.right;
    const height = 840 - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Compute min and max values for the scales
    const ebitdaMargins = mergedData.map(d => d.ebitdaMargin);
    const revenueGrowths = mergedData.map(d => d.revenueGrowth);

    if (ebitdaMargins.length === 0 || revenueGrowths.length === 0) {
        console.error('No valid data available for visualization.');
        return;
    }

    const xMin = d3.min(ebitdaMargins);
    const xMax = d3.max(ebitdaMargins);
    const yMin = d3.min(revenueGrowths);
    const yMax = d3.max(revenueGrowths);

    // Add padding to the domains
    const xPadding = (xMax - xMin) * 0.1 || 0.1; // Default padding if range is 0
    const yPadding = (yMax - yMin) * 0.1 || 0.1;

    // Adjust the domains to include 0% for x and y axes
    const xDomain = [
        Math.min(xMin - xPadding, 0),
        Math.max(xMax + xPadding, 0)
    ];

    const yDomain = [
        Math.min(yMin - yPadding, 0),
        Math.max(yMax + yPadding, 0)
    ];

    const xScale = d3.scaleLinear()
        .domain(xDomain)
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(yDomain)
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format(".0%"));

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.format(".0%"));

    // Draw x-axis
    g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll(".tick text")
        .style("font-family", "Nunito");

    // Draw y-axis
    g.append("g")
        .call(yAxis)
        .selectAll(".tick text")
        .style("font-family", "Nunito");

    // Add x-axis label
    g.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .text("EBITDA Margin")
        .style("font-family", "Nunito");

    // Add y-axis label
    g.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90)`)
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .text("Revenue Growth YoY")
        .style("font-family", "Nunito");

    // Add zero lines for x and y axes at 0%
    // Horizontal line at y = 0%
    if (yScale(0) >= 0 && yScale(0) <= height) {
        g.append("line")
            .attr("class", "zero-line")
            .attr("x1", 0)
            .attr("y1", yScale(0))
            .attr("x2", width)
            .attr("y2", yScale(0))
            .attr("stroke", "green")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4,2");
    }

    // Vertical line at x = 0%
    if (xScale(0) >= 0 && xScale(0) <= width) {
        g.append("line")
            .attr("class", "zero-line")
            .attr("x1", xScale(0))
            .attr("y1", 0)
            .attr("x2", xScale(0))
            .attr("y2", height)
            .attr("stroke", "green")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4,2");
    }

    // Define the div for the tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid black")
        .style("padding", "5px")
        .style("font-family", "Nunito");

    // Plot data points (dots)
    g.selectAll(".dot")
        .data(mergedData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.ebitdaMargin))
        .attr("cy", d => yScale(d.revenueGrowth))
        .attr("r", 5)
        .attr("fill", d => colorDict[d.company.toLowerCase()] || '#000000')
        .on("mouseover", function(event, d) {
            // Show tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);

            const percentFormat = d3.format(".2%");

            tooltip.html(`
                <strong>${d.company}</strong><br/>
                <strong>${d.quarter}</strong><br/>
                EBITDA Margin: ${percentFormat(d.ebitdaMargin)}<br/>
                Revenue Growth: ${percentFormat(d.revenueGrowth)}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");

            d3.select(this)
                .attr("r", 8);
        })
        .on("mouseout", function(event, d) {
            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);

            d3.select(this)
                .attr("r", 5);
        });

    // Add quarter indicators beside the bubbles
    g.selectAll(".quarter-label")
        .data(mergedData)
        .enter()
        .append("text")
        .attr("class", "quarter-label")
        .attr("x", d => xScale(d.ebitdaMargin) + 8) // Adjust position as needed
        .attr("y", d => yScale(d.revenueGrowth) + 4) // Adjust position as needed
        .text(d => d.quarter.includes('Q2') ? 'Q2' : 'Q3')
        .style("font-size", "12px")
        .style("font-family", "Nunito")
        .style("fill", "black");

    // Filter data for adding logos
    const dataWithLogos = mergedData.filter(d => {
        // Add logo if:
        // - The data point is for Q3
        // - Or the company does not have both quarters
        if (d.quarter.includes('Q3')) {
            return true;
        }
        if (!d.hasBothQuarters) {
            return true;
        }
        return false;
    });

    // Add company logos above the data points
    g.selectAll(".logo")
        .data(dataWithLogos)
        .enter()
        .append("image")
        .attr("class", "logo")
        .attr("xlink:href", d => logoDict[d.company.toLowerCase()] || '')
        .attr("x", d => xScale(d.ebitdaMargin) - 40) // Center the logo horizontally
        .attr("y", d => yScale(d.revenueGrowth) - 62) // Position the logo above the dot
        .attr("width", 80)
        .attr("height",80);

});