const { PythonShell } = require('python-shell');
const path = require('path');

function predictNPK({ temperature, humidity, ph, rainfall }) {
  return new Promise((resolve, reject) => {
    const args = [
      String(temperature),
      String(humidity),
      String(ph),
      String(rainfall)
    ];

    const options = {
      mode: 'text', // safer than 'json'
      pythonOptions: ['-u'],
      scriptPath: path.join(__dirname),
      args
    };

    PythonShell.run('predict.py', options, (err, results) => {
      if (err) {
        console.error('PythonShell error:', err);
        return reject({ error: 'Python execution failed', details: err });
      }

      try {
        const output = results.join(''); // single JSON output
        const prediction = JSON.parse(output);

        if (prediction.error) {
          console.warn("⚠️ Prediction returned error:", prediction.error);
          return reject(prediction);
        }

        resolve(prediction);
      } catch (parseErr) {
        console.error("⚠️ Failed to parse Python output:", results);
        reject({ error: 'Failed to parse prediction result', raw: results });
      }
    });
  });
}

module.exports = { predictNPK };
