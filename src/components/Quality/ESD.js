// // App.js
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { ApexChart } from 'react-apexcharts';
// 
// const App = () => {
//   const [chartData, setChartData] = useState({
//     series: [],
//     options: {
//       chart: { type: 'bar' },
//       xaxis: { categories: [] },
//     },
//   });
// 
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await axios.get('http://105.103.39.102/ESD');
//         const shifts = response.data.map((item) => item.Shift);
//         const quantities = response.data.map((item) => item.Quantity);
// 
//         setChartData({
//           series: [{ name: 'Quantity', data: quantities }],
//           options: {
//             chart: { type: 'bar' },
//             xaxis: { categories: shifts },
//             title: { text: 'Shift Workforce Distribution' },
//           },
//         });
//       } catch (err) {
//         console.error('Error fetching data:', err);
//       }
//     };
// 
//     fetchData();
//   }, []);
// 
//   return (
//     <div className="chart">
//       <ApexChart
//         type="bar"
//         height={350}
//         series={chartData.series}
//         options={chartData.options}
//       />
//     </div>
//   );
// };
// 
// export default App;
