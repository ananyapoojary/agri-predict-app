const { predictNPK } = require('./prediction');

predictNPK({
  temperature: 24.5,
  humidity: 70.3,
  ph: 6.5,
  rainfall: 200
})
.then(result => {
  console.log("✅ Prediction result:");
  console.log(result);
})
.catch(error => {
  console.error("❌ Prediction error:");
  console.error(error);
});
