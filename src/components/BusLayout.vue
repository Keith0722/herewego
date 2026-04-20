<template>
  <div class="bus-container">
    <h2>Select Your Seats</h2>
    
    <div class="bus-body">
      <div class="row-front">
        <div class="seat driver disabled">Driver</div>
        <div class="seat guide" :class="{ selected: isSelected('guide') }" @click="toggleSeat('guide')">Guide</div>
      </div>

      <div class="cabin">
        <div v-for="row in standardRows" :key="row" class="row-standard">
          <div class="seat" :class="{ selected: isSelected(`${row}A`) }" @click="toggleSeat(`${row}A`)">{{ row }}A</div>
          <div class="seat" :class="{ selected: isSelected(`${row}B`) }" @click="toggleSeat(`${row}B`)">{{ row }}B</div>
          
          <div class="aisle"></div> <div class="seat" :class="{ selected: isSelected(`${row}C`) }" @click="toggleSeat(`${row}C`)">{{ row }}C</div>
          <div class="seat" :class="{ selected: isSelected(`${row}D`) }" @click="toggleSeat(`${row}D`)">{{ row }}D</div>
        </div>
      </div>

      <div class="row-back">
        <div v-for="seatNum in 5" :key="`back-${seatNum}`" 
             class="seat" 
             :class="{ selected: isSelected(`Back-${seatNum}`) }" 
             @click="toggleSeat(`Back-${seatNum}`)">
          B{{ seatNum }}
        </div>
      </div>
    </div>

    <div class="summary">
      <p>Selected Seats: {{ selectedSeats.length }}</p>
      <p v-if="selectedSeats.length > 0">{{ selectedSeats.join(', ') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Generate 8 standard rows (adjust based on bus class later)
const standardRows = Array.from({ length: 8 }, (_, i) => i + 1);

// State to track which seats the user clicked
const selectedSeats = ref([]);

// Function to handle clicking a seat
const toggleSeat = (seatId) => {
  const index = selectedSeats.value.indexOf(seatId);
  if (index === -1) {
    selectedSeats.value.push(seatId); // Select it
  } else {
    selectedSeats.value.splice(index, 1); // Deselect it
  }
};

// Helper to check if a seat is currently selected
const isSelected = (seatId) => {
  return selectedSeats.value.includes(seatId);
};
</script>

<style scoped>
.bus-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: Arial, sans-serif;
  margin-top: 20px;
}

.bus-body {
  background-color: #f0f0f0;
  border: 4px solid #333;
  border-radius: 20px 20px 10px 10px; /* Curves the front of the bus */
  padding: 30px 20px;
  width: 350px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

/* Base Seat Styling */
.seat {
  width: 45px;
  height: 45px;
  background-color: #ddd;
  border: 2px solid #aaa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.seat:hover:not(.disabled) {
  background-color: #c0d8f0;
  border-color: #4a90e2;
}

.seat.selected {
  background-color: #4a90e2;
  color: white;
  border-color: #357abd;
}

.seat.disabled {
  background-color: #ffcccc;
  border-color: #cc0000;
  color: #cc0000;
  cursor: not-allowed;
}

/* 1. Cockpit */
.row-front {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px; /* Space before standard rows */
}

/* 2. Cabin */
.cabin {
  display: flex;
  flex-direction: column;
  gap: 15px; /* Space between rows */
  margin-bottom: 15px;
}

.row-standard {
  display: flex;
  justify-content: space-between;
}

.aisle {
  width: 40px; /* Width of the walking space */
}

/* 3. Lounge */
.row-back {
  display: flex;
  justify-content: space-between;
  margin-top: 20px; /* Extra space before the back row */
}

.summary {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
  width: 350px;
}
</style>