import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {
  getHello(): string {
    return 'Hello This is new Example Service';
  };
  async getOrderById(orderID: string) {
    // Example logic to fetch order details
    return {
      id: orderID,
      // Add any other relevant order details here
    };
  }
}