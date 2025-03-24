import { PrinterSettings } from '../types';

export interface PrintOptions {
  type: 'cash' | 'credit';
  copies: number;
  printer?: string;
}

export class PrintService {
  private static instance: PrintService;
  private availablePrinters: string[] = [];
  private defaultPrinter: string | null = null;

  private constructor() {
    this.detectPrinters();
  }

  static getInstance(): PrintService {
    if (!PrintService.instance) {
      PrintService.instance = new PrintService();
    }
    return PrintService.instance;
  }

  private async detectPrinters() {
    try {
      if ('printer' in navigator && 'getPrinters' in navigator.printer) {
        const printers = await (navigator.printer as any).getPrinters();
        this.availablePrinters = printers.map((p: any) => p.name);
        this.defaultPrinter = printers.find((p: any) => p.isDefault)?.name || null;
      } else {
        console.log('Web Print API not supported, falling back to browser print');
      }
    } catch (error) {
      console.error('Error detecting printers:', error);
    }
  }

  getAvailablePrinters(): string[] {
    return this.availablePrinters;
  }

  getDefaultPrinter(): string | null {
    return this.defaultPrinter;
  }

  async print(content: string, options: PrintOptions): Promise<boolean> {
    try {
      // Get print settings from localStorage
      const settings: PrinterSettings = JSON.parse(
        localStorage.getItem('printerSettings') || '{}'
      );
      const typeSettings = options.type === 'cash' ? settings.cash : settings.credit;

      // Create print content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }

      // Apply print settings
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Document</title>
          <style>
            @page {
              size: ${typeSettings?.paperSize || 'A4'};
              margin: 1cm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .logo {
              max-width: 150px;
              margin-bottom: 10px;
            }
            .company-info {
              margin-bottom: 20px;
            }
            .bill-details {
              margin-bottom: 20px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .total-section {
              margin-top: 20px;
              text-align: right;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
        </html>
      `);

      return true;
    } catch (error) {
      console.error('Error printing:', error);
      return false;
    }
  }

  formatBillContent(bill: any, business: any, settings: PrinterSettings): string {
    const typeSettings = bill.paymentType === 'cash' ? settings.cash : settings.credit;
    
    return `
      <div class="header">
        ${typeSettings.showLogo ? `<img src="${business.logo}" class="logo" alt="Business Logo">` : ''}
        <h1>${typeSettings.headerText || business.name}</h1>
        ${typeSettings.showAddress ? `<p>${business.address}</p>` : ''}
        ${typeSettings.showPhone ? `<p>Phone: ${business.phone}</p>` : ''}
        ${typeSettings.showEmail ? `<p>Email: ${business.email}</p>` : ''}
      </div>

      <div class="bill-details">
        <p><strong>Invoice No:</strong> ${bill.invoiceNo}</p>
        <p><strong>Date:</strong> ${new Date(bill.date).toLocaleDateString()}</p>
        <p><strong>Customer:</strong> ${bill.custName}</p>
        <p><strong>Payment Type:</strong> ${bill.paymentType}</p>
      </div>

      ${typeSettings.showItemDetails ? `
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map((item: any) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>₹${item.rate}</td>
                <td>₹${item.amount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <div class="total-section">
        <h3>Total: ₹${bill.total}</h3>
        ${typeSettings.showTotalInWords ? `
          <p>Amount in words: ${this.numberToWords(bill.total)} Rupees Only</p>
        ` : ''}
      </div>

      ${typeSettings.showTermsAndConditions && bill.paymentType === 'credit' ? `
        <div class="terms">
          <h4>Terms & Conditions:</h4>
          <p>${typeSettings.termsAndConditions}</p>
        </div>
      ` : ''}

      <div class="footer">
        <p>${typeSettings.footerText || 'Thank you for your business!'}</p>
      </div>
    `;
  }

  private numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return '';
      
      let words = '';
      
      if (n >= 100) {
        words += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      
      if (n >= 20) {
        words += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        words += teens[n - 10] + ' ';
        return words;
      }
      
      if (n > 0) {
        words += ones[n] + ' ';
      }
      
      return words;
    };

    if (num === 0) return 'Zero';

    let words = '';
    
    if (num >= 100000) {
      words += convertLessThanThousand(Math.floor(num / 100000)) + 'Lakh ';
      num %= 100000;
    }
    
    if (num >= 1000) {
      words += convertLessThanThousand(Math.floor(num / 1000)) + 'Thousand ';
      num %= 1000;
    }
    
    words += convertLessThanThousand(num);
    
    return words.trim();
  }
}