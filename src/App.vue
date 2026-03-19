<template>
  <div class="app-container">
    <h1>🚌 Bus Seating Manager</h1>
    
    <button @click="addSeat" class="add-btn">+ Add Seat</button>

    <div v-for="(bus, busIndex) in buses" :key="busIndex" class="bus-section">
      <div class="bus-header">
        <h2>Bus #{{ busIndex + 1 }}</h2>
        <span>{{ bus.length }} / 16 Seats Filled</span>
      </div>

      <div class="bus-grid">
        <div v-for="seat in bus" :key="seat.id" class="seat-card">
          <div 
            :class="['seat-square', 'status-' + seat.status]"
            @click="toggleStatus(seat)"
          >
            {{ seat.number }}
          </div>
          <button @click="removeSeat(busIndex, seat.id)" class="delete-btn">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useBusBooking } from './useBusBooking';
import './style.css';

const { buses, toggleStatus, addSeat, removeSeat } = useBusBooking();
</script>