import { ref } from 'vue';

export function useBusBooking() {
  const MAX_PER_BUS = 16;
  
  
  const activeSeat = ref(null);

  const buses = ref([
    Array.from({ length: MAX_PER_BUS }, (_, i) => ({
      id: crypto.randomUUID(),
      number: i + 1,
      status: 0,
      passengerName: '',   
      passengerAge: '',    
      passengerGender: ''  
    }))
  ]);

  const addSeat = () => {
    const availableBus = buses.value.find(bus => bus.length < MAX_PER_BUS);

    if (availableBus) {
      availableBus.push({
        id: crypto.randomUUID(),
        number: availableBus.length + 1,
        status: 0,
        passengerName: '',
        passengerAge: '',
        passengerGender: ''
      });
    } else {
      buses.value.push([{
        id: crypto.randomUUID(),
        number: 1,
        status: 0,
        passengerName: '',
        passengerAge: '',
        passengerGender: ''
      }]);
    }
  };

  const removeSeat = (busIndex, seatId) => {
    buses.value[busIndex] = buses.value[busIndex].filter(s => s.id !== seatId);
    
    buses.value[busIndex].forEach((seat, index) => {
      seat.number = index + 1;
    });

    if (buses.value[busIndex].length === 0 && buses.value.length > 1) {
      buses.value.splice(busIndex, 1);
    }
  };

  const removeBus = (busIndex) => {
    buses.value.splice(busIndex, 1);
  };


  const openModal = (seat) => {
    activeSeat.value = seat;
  };

  const closeModal = () => {
    activeSeat.value = null;
  };


  return { buses, addSeat, removeSeat, removeBus, activeSeat, openModal, closeModal };
}