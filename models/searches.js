const fs = require('fs');
const axios = require('axios');

class Searches {
  history = [];
  dbPath = './db/database.json';

  constructor() {
    this.readDB();
  }

  get historyCapitalized() {
    return this.history.map((place) => {
      let words = place.split(' ');
      words = words.map((p) => p[0].toUpperCase() + p.substring(1));

      return words.join(' ');
    });
  }

  get paramsMapbox() {
    return {
      access_token: process.env.MAPBOX_KEY,
      limit: 5,
      language: 'es',
    };
  }

  get paramsOpenWeather() {
    return {
      appid: process.env.OPENWEATHERMAP_KEY,
      units: 'metric',
      lang: 'es',
    };
  }

  async city(place = '') {
    try {
      const instance = axios.create({
        baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${place}.json`,
        params: this.paramsMapbox,
      });

      const resp = await instance.get();

      return resp.data.features.map((place) => ({
        id: place.id,
        name: place.place_name,
        lng: place.center[0],
        lat: place.center[1],
      }));
    } catch (error) {
      return [];
    }
  }

  async weatherByPlace(lat, lon) {
    try {
      const instance = axios.create({
        baseURL: 'https://api.openweathermap.org/data/2.5/weather',
        params: { ...this.paramsOpenWeather, lat, lon },
      });

      const resp = await instance.get();

      const { weather, main } = resp.data;

      return {
        desc: weather[0].description,
        min: main.temp_min,
        max: main.temp_max,
        temp: main.temp,
      };
    } catch (err) {
      console.log(err);
    }
  }

  addHistory(place = '') {
    if (this.history.includes(place.toLocaleLowerCase())) {
      return;
    }

    this.history.unshift(place.toLocaleLowerCase());

    this.saveDB();
  }

  saveDB() {
    const payload = {
      history: this.history,
    };

    this.history = this.history.slice(0, 5);

    fs.writeFileSync(this.dbPath, JSON.stringify(payload));
  }

  readDB() {
    if (!fs.existsSync(this.dbPath)) return;

    const info = fs.readFileSync(this.dbPath, { encoding: 'utf-8' });
    const data = JSON.parse(info);

    this.history = data.history;
  }
}

module.exports = Searches;
