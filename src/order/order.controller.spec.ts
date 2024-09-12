import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: OrderService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            getOrderById: jest.fn().mockResolvedValue({ id: 'test-order-id' }), // Mock getOrderById
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn().mockReturnValue(of({ data: 'response data' })), // Mock HttpService's GET method
          },
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    orderService = module.get<OrderService>(OrderService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call orderService and httpService and return success', async () => {
    // Call the method under test
    const result = await controller.getOrderStatusAndSendToMake(
      'test-order-id',
      'assigned',
      'team-nyc',
      'team-uuid'
    );

    // Assert that orderService.getOrderById was called with the correct argument
    expect(orderService.getOrderById).toHaveBeenCalledWith('test-order-id');

    // Assert that httpService.get was called with the correct URL and parameters
    expect(httpService.get).toHaveBeenCalledWith('https://hook.us1.make.com/guukybx41137y39coqcly1tl4fo46yyl', {
      params: {
        order: 'test-order-id',
        status: 'assigned',
        teamId: 'team-nyc',
        teamUUID: 'team-uuid',
      },
    });

    // Assert the controller returned the expected response
    expect(result).toEqual({
      message: 'Data sent successfully to Make.com',
      response: 'response data',
    });
  });
});