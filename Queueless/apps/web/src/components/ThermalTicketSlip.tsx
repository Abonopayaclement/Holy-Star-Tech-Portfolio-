import React from 'react';

export interface ThermalTicketProps {
  ticketNumber: string;
  serviceName: string;
  branchName: string;
  organizationName?: string;
  branchLocation?: string;
  position?: number;
  peopleAhead?: number;
  estimatedWaitMinutes?: number;
  joinedAt?: Date | string;
  formattedDate?: string;
  formattedTime?: string;
  counterNumber?: string | null;
  instruction?: string;
  reprintCount?: number;
  qrCodeUrl?: string;
}

export const ThermalTicketSlip: React.FC<ThermalTicketProps> = ({
  ticketNumber,
  serviceName,
  branchName,
  organizationName = 'QUEUELESS',
  branchLocation,
  position = 1,
  peopleAhead = 0,
  estimatedWaitMinutes = 15,
  joinedAt,
  formattedDate,
  formattedTime,
  counterNumber,
  instruction = 'Please wait for your number to be called.',
  reprintCount = 0,
  qrCodeUrl,
}) => {
  const displayDate =
    formattedDate ||
    (joinedAt
      ? new Date(joinedAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }));

  const displayTime =
    formattedTime ||
    (joinedAt
      ? new Date(joinedAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }));

  return (
    <div className="thermal-slip font-mono text-black bg-white p-5 max-w-[320px] mx-auto text-center border-2 border-dashed border-gray-400 print:border-none print:p-0 print:max-w-none">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .thermal-slip, .thermal-slip * {
            visibility: visible;
          }
          .thermal-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 4mm;
          }
        }
      `}</style>

      {/* Header (Part 10 format) */}
      <div className="border-b-2 border-black pb-2 mb-3">
        <h1 className="text-2xl font-black uppercase tracking-wider">{organizationName}</h1>
        <h2 className="text-sm font-bold uppercase text-gray-800">{branchName}</h2>
        {branchLocation && <p className="text-[11px] text-gray-600">{branchLocation}</p>}
        {reprintCount > 0 && (
          <p className="text-[10px] font-bold text-red-600 mt-1 uppercase">** DUPLICATE / REPRINT #{reprintCount} **</p>
        )}
      </div>

      {/* Service */}
      <div className="my-2">
        <span className="text-[11px] uppercase font-bold tracking-widest text-gray-700 block">SERVICE:</span>
        <h3 className="text-lg font-black uppercase tracking-tight">{serviceName}</h3>
      </div>

      {/* Giant Ticket Number */}
      <div className="border-2 border-black py-4 px-2 my-3 rounded-lg bg-gray-50">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-700 block">TICKET:</span>
        <div className="text-5xl font-black tracking-tight my-1 text-black">{ticketNumber}</div>
        {counterNumber && (
          <p className="text-xs font-bold uppercase text-blue-700 mt-1">Please proceed to {counterNumber}</p>
        )}
      </div>

      {/* Position & ETA */}
      <div className="space-y-1.5 text-xs border-b-2 border-black pb-3 mb-3 text-left">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700 uppercase">POSITION:</span>
          <span className="font-black text-sm">{position}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700 uppercase">CUSTOMERS AHEAD:</span>
          <span className="font-bold">{peopleAhead}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700 uppercase">ESTIMATED WAIT:</span>
          <span className="font-black text-sm">{estimatedWaitMinutes} MIN</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-gray-200">
          <span className="font-semibold text-gray-700 uppercase">ISSUED:</span>
          <span className="font-bold text-right text-[11px]">
            {displayDate}
            <br />
            {displayTime}
          </span>
        </div>
      </div>

      {/* Optional QR Code for live tracking */}
      {qrCodeUrl && (
        <div className="my-2 flex flex-col items-center">
          <img src={qrCodeUrl} alt="Queue QR" className="w-20 h-20 mx-auto" />
          <p className="text-[9px] text-gray-600 mt-0.5">Scan to track your queue status</p>
        </div>
      )}

      {/* Instruction & Powered By */}
      <div className="text-xs text-gray-900 mt-2 font-medium">
        <p>{instruction}</p>
        <p className="text-[10px] text-gray-600 mt-3 uppercase tracking-wider font-semibold">Powered by QueueLess</p>
      </div>
    </div>
  );
};

export default ThermalTicketSlip;
