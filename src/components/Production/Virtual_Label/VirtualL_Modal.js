import React, { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import './VirtualL_Modal.css';

const LabelModal = ({ labelData }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && labelData) {
      JsBarcode(barcodeRef.current, labelData.MAG, {
        format: "CODE128",
        displayValue: true,
        fontSize: 12,
      });
    }
  }, [labelData]);

  if (!labelData) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="label-container" style={{ transform: 'scale(1)', transformOrigin: 'center', height: '70vh'}}>
      <div className="label-content">
        <div className="label-header">
          <div className="label-barcode-qr-container" style={{fontSize:20, marginLeft:10, fontWeight:'bold'}}> NO:
            <svg ref={barcodeRef}></svg>
            <QRCodeSVG value={labelData.MAG} size={100} />
          </div>
          <div style={{fontSize:20, marginRight:15}}>
            {labelData.PLANT}
            <div style={{fontWeight: 'bold'}}>
              <p></p> NORM
            </div>
          </div>
        </div>                                                          

        <table className="label-table">
          <tbody>
            <tr>
              <th className="label-th">DESC.</th>
              <td className="label-td">{labelData.MODEL_CODE}</td>
              <td className="label-th">Qty.</td>
              <td className="label-td">{labelData.QTY}</td>
            </tr>
            <tr>
              <th className="label-th">MAIN SKU</th>
              <td className="label-td"><strong>{labelData['MAIN SKU']}</strong></td>
              <td className="label-th">Main P/O</td>
              <td className="label-td">{labelData['MAIN PO']}</td>
            </tr>
            <tr>
              <th className="label-th">Dpt Model</th>
              <td className="label-td"><strong>{labelData['MODEL CODE']}</strong></td>
              <td className="label-th">Art Model</td>
              <td className="label-td">{labelData['ARR MODEL']}</td>
            </tr>
            <tr>
              <th className="label-th">Dpt PO</th>
              <td className="label-td">{labelData['DPT PO']}</td>
              <td className="label-th">Air PO</td>
              <td className="label-td">{labelData['ARR PO']}</td>
            </tr>
            <tr>
              <th className="label-th">Dpt</th>
              <td className="label-td">{labelData.DPT}</td>
              <td className="label-th">Art</td>
              <td className="label-td">{labelData.ARR}</td>
            </tr>
            <tr>
              <th className="label-th">Dpt Time</th>
              <td className="label-td">{labelData['DPT TIME']}</td>
              <td className="label-th">Art Time</td>
              <td className="label-td">{labelData['ARR TIME']}</td>
            </tr>
            <tr>
              <th className="label-th">W/K Time</th>
              <td className="label-td">{labelData['W/K TIME']}</td>
              <td className="label-th">Plan Time</td>
              <td className="label-td">Plan Time</td>
            </tr>
            <tr>
              <th className="label-th">T/O</th>
              <td className="label-td">{labelData['T/O']}</td>
              <td className="label-th">ROM</td>
              <td className="label-td">{labelData.RMK}</td>
            </tr>
            <tr>
              <th className="label-th">Notice</th>
              <td colSpan="3" className="label-td">A001 - 0101 / XX4V034</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabelModal;