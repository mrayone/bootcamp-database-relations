import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer)
      throw new AppError(`You can't create order with inexisting customer.`);

    const productsIds = products.map(product => {
      return { id: product.id };
    });

    const productsFinded = await this.productsRepository.findAllById(
      productsIds,
    );

    if (productsFinded.length === 0)
      throw new AppError('Products ids not found');

    const quantityNotAvailable = products.filter(product => {
      return productsFinded.find(
        productFinded =>
          productFinded.id === product.id &&
          productFinded.quantity < product.quantity,
      );
    });

    if (quantityNotAvailable.length > 0)
      throw new AppError(
        'The order has products with not available quantities.',
      );

    const productsToAddInOrder = products.map(product => {
      const productFinded = productsFinded.find(
        productOriginal => productOriginal.id === product.id,
      );
      return {
        product_id: product.id,
        price: productFinded?.price ?? 0,
        quantity: product.quantity,
      };
    });

    const updateProductsQuantity = productsToAddInOrder.map(product => {
      return {
        id: product.product_id,
        quantity: product.quantity,
      };
    });

    await this.productsRepository.updateQuantity(updateProductsQuantity);

    const order = await this.ordersRepository.create({
      customer,
      products: productsToAddInOrder,
    });

    return order;
  }
}

export default CreateOrderService;
