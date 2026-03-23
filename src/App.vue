<template>
  <div class="app-container">
    <h1>🚌 Bus Seating Manager</h1>
    
    <button @click="addSeat" class="add-btn">+ Add Seat</button>

    <div class="buses-wrapper">
      <div v-for="(bus, busIndex) in buses" :key="busIndex" class="bus-section">
        <div class="bus-header">
          <h2>Bus #{{ busIndex + 1 }}</h2>
          <div class="bus-meta">
            <span :style="{ color: bus.length === 16 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }">
              {{ bus.length }} / 16 Seats
            </span>
            <button @click="removeBus(busIndex)" class="delete-bus-btn" title="Delete Bus">×</button>
          </div>
        </div>

        <div class="bus-grid">
          <div v-for="seat in bus" :key="seat.id" class="seat-card">
            <div 
              :class="['seat-square', 'status-' + seat.status]" 
              @click="openModal(seat)"
            >
              {{ seat.number }}
            </div>
            <button class="delete-btn" @click="removeSeat(busIndex, seat.id)">×</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeSeat" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Seat #{{ activeSeat.number }} Details</h3>
        
        <div class="form-group">
          <label>Name</label>
          <input type="text" v-model="activeSeat.passengerName" placeholder="Enter name..." />
        </div>

        <div class="form-group">
          <label>Age</label>
          <input 
            type="number" 
            v-model="activeSeat.passengerAge" 
            min="0" 
            @input="activeSeat.passengerAge = activeSeat.passengerAge < 0 ? 0 : activeSeat.passengerAge"
            placeholder="Enter age..."/>
        </div>

        <div class="form-group">
          <label>Gender</label>
          <select v-model="activeSeat.passengerGender">
            <option value="" disabled>Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

       <div class="form-group">
          <label>Status</label>
          <select v-model="activeSeat.status">
            <option :value="0">Available</option>
            <option :value="2">Booked</option>
            <option :value="3">Unavailable</option>
          </select>
        </div>

        <button @click="closeModal" class="save-btn">Save & Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useBusBooking } from './useBusBooking';
import './style.css'; 

const { buses, addSeat, removeSeat, removeBus, activeSeat, openModal, closeModal } = useBusBooking();
</script>