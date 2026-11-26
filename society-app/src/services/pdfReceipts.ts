import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface ReceiptData {
  receiptNo: string;
  plotNo: string;
  payerName: string;
  category: 'Maintenance' | 'Donation';
  purpose: string;
  amount: number;
  paymentMode: string;
  transactionRef?: string;
  createdAt?: string;
}

export const generateAndShareReceipt = async (receipt: ReceiptData) => {
  const dateStr = new Date(receipt.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const html = `
    <html>
      <body style="font-family: Helvetica, Arial, sans-serif; padding: 32px; color: #111;">
        <div style="border: 2px solid #1e3a8a; border-radius: 10px; padding: 24px;">
          <h1 style="margin: 0; color: #1e3a8a; text-align: center;">DC-KRISHNA RESIDENCY</h1>
          <p style="margin: 4px 0 20px; text-align: center; color: #4b5563;">Official ${receipt.category} Receipt</p>
          <hr style="border: 0; border-top: 1px solid #d1d5db; margin-bottom: 20px;" />
          
          <table style="width: 100%; font-size: 15px; line-height: 1.8;">
            <tr><td><strong>Receipt No:</strong></td><td style="text-align: right;">${receipt.receiptNo}</td></tr>
            <tr><td><strong>Date:</strong></td><td style="text-align: right;">${dateStr}</td></tr>
            <tr><td><strong>Plot / House No:</strong></td><td style="text-align: right;">${receipt.plotNo}</td></tr>
            <tr><td><strong>Received From:</strong></td><td style="text-align: right;">${receipt.payerName}</td></tr>
            <tr><td><strong>Purpose:</strong></td><td style="text-align: right;">${receipt.purpose}</td></tr>
            <tr><td><strong>Payment Mode:</strong></td><td style="text-align: right;">${receipt.paymentMode} ${receipt.transactionRef ? `(${receipt.transactionRef})` : ''}</td></tr>
          </table>

          <div style="margin-top: 24px; background: #eff6ff; padding: 14px; border-radius: 8px; text-align: right;">
            <span style="font-size: 18px; font-weight: bold; color: #1e3a8a;">Total Paid: ₹${receipt.amount.toLocaleString('en-IN')}</span>
          </div>

          <p style="margin-top: 32px; font-size: 12px; color: #6b7280; text-align: center;">
            Computer-generated society receipt. No physical signature required.
          </p>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};