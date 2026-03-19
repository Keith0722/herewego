import { ref } from 'vue';

export function useBusBooking() {
  const MAX_PER_BUS = 16;
  
  const buses = ref([
    Array.from({ length: MAX_PER_BUS }, (_, i) => ({
      id: Date.now() + i,
      number: i + 1,
      status: 0
    }))
  ]);

  const addSeat = () => {
    const lastBus = buses.value[buses.value.length - 1];

    if (lastBus.length < MAX_PER_BUS) {
      lastBus.push({
        id: Date.now(),
        number: lastBus.length + 1,
        status: 0
      });
    } else {
      buses.value.push([{
        id: Date.now(),
        number: 1,
        status: 0
      }]);
    }
  };

  const removeSeat = (busIndex, seatId) => {
    buses.value[busIndex] = buses.value[busIndex].filter(s => s.id !== seatId);
    
    // Auto Re-index the numbers for this specific bus
    buses.value[busIndex].forEach((seat, index) => {
      seat.number = index + 1;
    });

    if (buses.value[busIndex].length === 0 && buses.value.length > 1) {
      buses.value.splice(busIndex, 1);
    }
  };

  const toggleStatus = (seat) => {
    seat.status = (seat.status + 1) % 4;
  };

  return { buses, toggleStatus, addSeat, removeSeat };
}