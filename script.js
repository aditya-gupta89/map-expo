'use strict';

class Workout {
  date = new Date();
  id = crypto.randomUUID();
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  self_description() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.description =
      `${this.type[0].toUpperCase()}${this.type.slice(1).toUpperCase()} on ${
        months[this.date.getMonth()]
      } ${this.date.getDate()}`;
      console.log(this)
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.self_description();
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.self_description();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


// console.log(form,form.addEventListener('submit',()=>{
//     console.log('running')
// }))

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this.getPosition();
    this.getLocalStorage();

    form.addEventListener('submit', this.newWorkout.bind(this));

    inputType.addEventListener("change", this.toggleElevationField);
    
    containerWorkouts.addEventListener("click", this.moveToPopup.bind(this));
  }
  getPosition() {
    navigator.geolocation.getCurrentPosition(
      this.loadMap.bind(this),
      (error) => {
        alert(error.message);
      }
    );
  }
  loadMap(position) {
    const { latitude, longitude } = position.coords;
    const cordinate = [latitude, longitude];
    // console.log(`http://maps.google.com/maps?q=${latitude},${longitude}`)
    this.#map = L.map("map").setView(cordinate, 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(cordinate)
      .addTo(this.#map)
      .bindPopup(
        "Your Live location Please add the marker for your running and cycling point"
      )
      .openPopup();

    this.#map.on("click", this.showForm.bind(this));
    this.#workouts.forEach((work) => {
      this.renderWorkoutMarker(work);
    });
  }
  showForm(event) {
    this.#mapEvent = event;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = 'grid'), 1000);

  }
  toggleElevationField(event) {
    if (event.target.value === "cycling") {
      document.getElementById("cadence").classList.add("form__row--hidden");
      document
        .getElementById("elevation")
        .classList.remove("form__row--hidden");
    } else {
      document.getElementById("cadence").classList.remove("form__row--hidden");
      document.getElementById("elevation").classList.add("form__row--hidden");
    }
  }
  newWorkout(e) {
    console.log("hello")
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);
  console.log("146")
    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;

      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this.renderWorkoutMarker(workout);

    // Render workout on list
    this.renderWorkout(workout);

    // Hide form + clear input fields
    this.hideForm();

    this.setLocalStorage();
  }
  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }
  renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === "running")
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === "cycling")
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML("afterend", html);
  }
  moveToPopup(e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workouts=data;
    this.#workouts.forEach(item=>this.renderWorkout(item));

  }
}

const app = new App();
