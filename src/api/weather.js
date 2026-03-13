export const fetchCircuitWeather = async (latitude, longitude) => {
    try {
      if (!latitude || !longitude) return null;
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      if (!response.ok) throw new Error(`Open-Meteo Error: ${response.status}`);
      const data = await response.json();
      return data.current_weather;
    } catch (error) {
      console.error("Error fetching weather:", error);
      return null;
    }
  };
