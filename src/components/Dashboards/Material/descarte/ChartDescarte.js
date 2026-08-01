import React , {Component, useState, useEffect} from 'react';
import axios from 'axios';
import Chart from 'react-apexcharts'

const  App =()=> {
  const [lista, setLista] = useState([])
  const [data, setData] = useState([])

  // useEffect(() => {
  //     const Part = [];
  //     const Qty = [];

      // axios.get("http://105.103.39.102:8080/getDescarte").then(response =>{
      //     console.log("response", response)
      //     response.data.data.map(item => {
      //       console.log("item", item)
      //         Part.push(item.Part_Number);
      //         Qty.push(item.Qty_discard)
      //     })
          // setLista(Qty)
          // setData(Part)
          // setObject({
          //   chart: {
          //     id: 'apexchart-example'
          //   },
          //   xaxis: {
          //     categories: salary
          //   }
          // })
          // setSeries([{
          //   name: 'series-1',
          //   data: age
          // }])
  //         console.log("Part", Part, Qty)
  //     }).catch(e => {
  //         alert(e);
  //     })
  // }, [])
  
    return (
      <Chart options={{
        chart: {
          id: 'apexchart-example'
        },
        xaxis: {
          categories: lista
        }
      }} 
      series={[{
        name: 'series-1',
        data: data
      }]} type="line" width={800} height={500} />
    )
}

export default App