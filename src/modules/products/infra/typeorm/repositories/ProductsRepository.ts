import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const products = await this.ormRepository.findOne({
      where: { name },
    });

    return products;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsToUpdate = await this.ormRepository.find({
      where: { products },
    });

    return productsToUpdate;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    // TODO
    const productsToUpdate = await this.ormRepository.find({
      where: { products },
    });

    const productsToUpdateEntities = productsToUpdate.map(product => {
      const newProductQuantity = products.find(
        productToUpdate => productToUpdate.id === product.id,
      );

      product.quantity -= newProductQuantity?.quantity ?? 0;

      return this.ormRepository.create(product);
    });

    await this.ormRepository.save(productsToUpdateEntities);

    return productsToUpdate;
  }
}
export default ProductsRepository;
