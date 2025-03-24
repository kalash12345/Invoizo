import QRCode from 'qrcode';
import { PrintService } from './PrintService';

export class InvoiceService {
  private static instance: InvoiceService;
  
  private constructor() {}

  static getInstance(): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService();
    }
    return InvoiceService.instance;
  }

  async generateQRCode(billData: any): Promise<string> {
    try {
      // Generate QR code with bill details
      const qrData = {
        invoiceNo: billData.invoiceNo,
        date: billData.date,
        amount: billData.total,
        customer: billData.custName
      };
      
      return await QRCode.toDataURL(JSON.stringify(qrData));
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  async sendInvoice(billData: any, method: 'whatsapp' | 'email'): Promise<boolean> {
    try {
      const business = JSON.parse(localStorage.getItem('business') || '{}');
      const settings = JSON.parse(localStorage.getItem('printerSettings') || '{}');
      
      // Get formatted bill content
      const printService = PrintService.getInstance();
      const content = printService.formatBillContent(billData, business, settings);
      
      // Generate QR code
      const qrCode = await this.generateQRCode(billData);
      
      // Add QR code to content
      const contentWithQR = content.replace(
        '</div>',
        `<img src="${qrCode}" alt="Invoice QR Code" style="width: 150px; margin-top: 20px;"></div>`
      );

      if (method === 'whatsapp') {
        // Format WhatsApp message
        const message = this.formatWhatsAppMessage(billData, business);
        const phone = billData.custPhone?.replace(/\D/g, '');
        
        if (!phone) {
          throw new Error('Customer phone number not found');
        }

        // Open WhatsApp with pre-filled message
        window.open(
          `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
          '_blank'
        );
        
        return true;
      } else {
        // Format email content
        const emailContent = this.formatEmailContent(contentWithQR, billData, business);
        
        if (!billData.custEmail) {
          throw new Error('Customer email not found');
        }

        // Open default email client
        const mailtoLink = `mailto:${billData.custEmail}?subject=Invoice ${billData.invoiceNo}&body=${encodeURIComponent(emailContent)}`;
        window.location.href = mailtoLink;
        
        return true;
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      return false;
    }
  }

  private formatWhatsAppMessage(billData: any, business: any): string {
    return `Dear ${billData.custName},

Thank you for your business!

Invoice Details:
Invoice No: ${billData.invoiceNo}
Date: ${new Date(billData.date).toLocaleDateString()}
Amount: ₹${billData.total}

From:
${business.name}
${business.phone}

This is a digital copy of your invoice. For any queries, please contact us.

Best regards,
${business.name}`;
  }

  private formatEmailContent(htmlContent: string, billData: any, business: any): string {
    return `Dear ${billData.custName},

Please find attached your invoice ${billData.invoiceNo} dated ${new Date(billData.date).toLocaleDateString()}.

Amount: ₹${billData.total}

For any queries, please contact us:
${business.phone}
${business.email}

Best regards,
${business.name}`;
  }
}