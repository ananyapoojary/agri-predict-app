const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { predictNPK } = require('./prediction');
const axios = require('axios');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchData(url, params, retries = 3, backoffFactor = 2000, timeout = 10000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(url, { params, timeout });
      if (response.status === 200) {
        return response.data;
      } else if (response.status === 429) {
        const waitTime = backoffFactor * Math.pow(2, attempt);
        console.warn(`⚠️ Rate limit hit. Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      } else {
        console.error(`❌ API error (${response.status}): ${response.statusText}`);
        break;
      }
    } catch (error) {
      console.error(`❌ Fetch error from ${url}: ${error.message}`);
      await sleep(backoffFactor * Math.pow(2, attempt));
    }
  }
  return null;
}

// ✅ Correct logic for SoilGrids 'properties' structure
function getMeanFromProperty(properties, name) {
  const prop = properties[name];
  if (!prop || !Array.isArray(prop.layers)) {
    console.warn(`❌ Property '${name}' not found or has no layers.`);
    return null;
  }

  const layer = prop.layers.find(l => l.depth === '0-5cm');
  if (!layer || typeof layer.values?.mean !== 'number') {
    console.warn(`⚠️ No valid mean in 0-5cm for '${name}'.`);
    return null;
  }

  return layer.values.mean;
}

app.post('/api/get-data', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    // API URLs and params
    const elevationUrl = "https://api.open-elevation.com/api/v1/lookup";
    const powerUrl = "https://power.larc.nasa.gov/api/temporal/daily/point";
    const soilUrl = "https://rest.isric.org/soilgrids/v2.0/properties/query";

    const elevationParams = { locations: `${latitude},${longitude}` };
    const powerParams = {
      parameters: "T2M,RH2M,PRECTOTCORR",
      community: "RE",
      longitude,
      latitude,
      format: "JSON",
      start: "20240101",
      end: "20240101"
    };
    const soilParams = {
      lon: longitude,
      lat: latitude,
      depths: "0-5cm",
      properties: "phh2o,soc,bdod,clay,sand,silt,cec,ocd,nitrogen,wv0010,wv0033,wv1500,cfvo,ocs"
    };

    // Fetch data
    const elevData = await fetchData(elevationUrl, elevationParams);
    const powerData = await fetchData(powerUrl, powerParams);
    const soilData = await fetchData(soilUrl, soilParams, 3, 2000, 30000);

    // Elevation
    if (!elevData?.results?.length) throw new Error('Elevation API returned invalid data.');
    const elevation = elevData.results[0].elevation;

    // NASA POWER
    const nasaData = powerData?.properties?.parameter;
    if (!nasaData) throw new Error('NASA POWER API returned invalid data.');
    const temperature = nasaData.T2M?.["20240101"] ?? null;
    const humidity = nasaData.RH2M?.["20240101"] ?? null;
    const rainfall = nasaData.PRECTOTCORR?.["20240101"] ?? null;

    // ✅ Correct SoilGrids structure: 'properties'
    const soilProperties = soilData?.properties;
    if (!soilProperties || typeof soilProperties !== 'object') {
      console.error('❌ SoilGrids API returned no properties.');
      throw new Error('SoilGrids API returned invalid data.');
    }

    console.log('🌱 Soil properties received:', Object.keys(soilProperties));

    const fetchedData = {
      latitude,
      longitude,
      elevation,
      temperature,
      humidity,
      rainfall,
      phh2o: getMeanFromProperty(soilProperties, 'phh2o'),
      soc: getMeanFromProperty(soilProperties, 'soc'),
      bdod: getMeanFromProperty(soilProperties, 'bdod'),
      clay: getMeanFromProperty(soilProperties, 'clay'),
      sand: getMeanFromProperty(soilProperties, 'sand'),
      silt: getMeanFromProperty(soilProperties, 'silt'),
      cec: getMeanFromProperty(soilProperties, 'cec'),
      ocd: getMeanFromProperty(soilProperties, 'ocd'),
      nitrogen_soil: getMeanFromProperty(soilProperties, 'nitrogen'),
      wv1500: getMeanFromProperty(soilProperties, 'wv1500'),
      cfvo: getMeanFromProperty(soilProperties, 'cfvo'),
      wv0033: getMeanFromProperty(soilProperties, 'wv0033'),
      wv0010: getMeanFromProperty(soilProperties, 'wv0010'),
      ocs: getMeanFromProperty(soilProperties, 'ocs')
    };

    const inputForML = {
      temperature,
      humidity,
      ph: fetchedData.phh2o,
      rainfall
    };

    if (
      inputForML.temperature === null ||
      inputForML.humidity === null ||
      inputForML.ph === null ||
      inputForML.rainfall === null
    ) {
      console.warn("❗ Missing inputs for prediction:", inputForML);
      return res.status(400).json({ error: 'Missing required inputs for prediction.', input: inputForML });
    }

    const prediction = await predictNPK(inputForML);
    res.json({ fetchedData, prediction });

  } catch (error) {
    console.error('❌ Error in /api/get-data:', error.message);
    res.status(500).json({ error: 'Error fetching data or predicting values.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
