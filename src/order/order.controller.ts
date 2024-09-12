import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { OrderService } from './order.service';
import { lastValueFrom } from 'rxjs';

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    @Inject(HttpService) private readonly httpService: HttpService
  ) {}
  @Get()
  getExample(): string {
    return this.orderService.getHello();
  };
  @Get(':orderId')
  async getOrderId(@Param('orderId') orderId: string): Promise<any> {
    return this.orderService.getOrderById(orderId);
  }
  @Get(':orderID/status')
  async getOrderStatusAndSendToMake(
    @Param('orderID') orderID: string,
    @Query('status') status: string,
    @Query('teamId') teamId: string,
    @Query('teamUUID') teamUUID: string
  ) {
    const makeWebhookUrl = 'https://hook.us1.make.com/guukybx41137y39coqcly1tl4fo46yyl';

    const queryParams = {
      order: orderID,
      status: status,
      teamId: teamId,
      teamUUID: teamUUID,
    };

    console.log("This is Query Params",queryParams);

    // Send data to Make.com
    try {
      const response = await lastValueFrom(this.httpService.get(makeWebhookUrl, { params: queryParams }));
      return {
        message: 'Data sent successfully to Make.com',
        response: response.data,
      };
    } catch (error) {
      return {
        message: 'Failed to send data to Make.com',
        error: error.message,
      };
    }
  }
}