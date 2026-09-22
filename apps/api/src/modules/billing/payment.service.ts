import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import * as crypto from "crypto";
export type MidtransCharge = {
  orderId: string;
  grossAmount: number;
  customerName: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
};
export type MidtransChargeResult = {
  orderId: string;
  snapToken: string;
  redirectUrl: string;
};
@Injectable()
export class PaymentService {
  private readonly serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  private readonly isProd = process.env.MIDTRANS_PRODUCTION === "true";
  private get snapBaseUrl() {
    return this.isProd
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";
  }
  async createTransaction(
    charge: MidtransCharge,
  ): Promise<MidtransChargeResult> {
    if (!this.serverKey)
      throw new ServiceUnavailableException(
        "MIDTRANS_SERVER_KEY belum dikonfigurasi; transaksi tidak dibuat",
      );
    const auth = Buffer.from(`${this.serverKey}:`).toString("base64");
    const res = await fetch(this.snapBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: charge.orderId,
          gross_amount: charge.grossAmount,
        },
        customer_details: { first_name: charge.customerName },
        item_details: charge.items,
      }),
    });
    if (!res.ok)
      throw new ServiceUnavailableException(`Midtrans gagal (${res.status})`);
    const data = (await res.json()) as { token: string; redirect_url: string };
    return {
      orderId: charge.orderId,
      snapToken: data.token,
      redirectUrl: data.redirect_url,
    };
  }
  verifySignature(p: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  }): boolean {
    if (!this.serverKey || !p.signature_key) return false;
    const expected = crypto
      .createHash("sha512")
      .update(p.order_id + p.status_code + p.gross_amount + this.serverKey)
      .digest("hex");
    const actual = Buffer.from(p.signature_key);
    const expectedBuffer = Buffer.from(expected);
    return (
      actual.length === expectedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, actual)
    );
  }
  mapStatus(
    transactionStatus: string,
    fraudStatus?: string,
  ): "PAID" | "PENDING" | "FAILED" {
    if (transactionStatus === "capture")
      return fraudStatus === "challenge" ? "PENDING" : "PAID";
    if (transactionStatus === "settlement") return "PAID";
    if (transactionStatus === "pending") return "PENDING";
    return "FAILED";
  }
}
